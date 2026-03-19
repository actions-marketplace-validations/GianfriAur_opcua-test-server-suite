const {
  OPCUAServer,
  SecurityPolicy,
  MessageSecurityMode,
  OPCUACertificateManager,
  ServerState,
  nodesets,
} = require("node-opcua");
const path = require("path");
const fs = require("fs");

const config = require("./config");
const { createUserManager } = require("./user-manager");
const { constructAddressSpace } = require("./address-space");
const { stopDynamic } = require("./address-space/dynamic");
const { stopEvents } = require("./address-space/events-alarms");
const { stopHistorical } = require("./address-space/historical");

const securityPolicyMap = {
  None: SecurityPolicy.None,
  Basic128Rsa15: SecurityPolicy.Basic128Rsa15,
  Basic256: SecurityPolicy.Basic256,
  Basic256Sha256: SecurityPolicy.Basic256Sha256,
  Aes128_Sha256_RsaOaep: SecurityPolicy.Aes128_Sha256_RsaOaep,
  Aes256_Sha256_RsaPss: SecurityPolicy.Aes256_Sha256_RsaPss,
};

const securityModeMap = {
  None: MessageSecurityMode.None,
  Sign: MessageSecurityMode.Sign,
  SignAndEncrypt: MessageSecurityMode.SignAndEncrypt,
};

async function main() {
  console.log("=".repeat(60));
  console.log("OPC UA Test Server Starting");
  console.log("=".repeat(60));
  console.log(`Port: ${config.port}`);
  console.log(`Server Name: ${config.serverName}`);
  console.log(`Security Policies: ${config.securityPolicies.join(", ")}`);
  console.log(`Security Modes: ${config.securityModes.join(", ")}`);
  console.log(`Allow Anonymous: ${config.allowAnonymous}`);
  console.log(`Auth Users: ${config.authUsers}`);
  console.log(`Auth Certificate: ${config.authCertificate}`);
  console.log(`Auto Accept Certs: ${config.autoAcceptCerts}`);
  console.log("=".repeat(60));

  const securityPolicies = config.securityPolicies.map((p) => {
    const policy = securityPolicyMap[p];
    if (!policy) {
      console.warn(`[Config] Unknown security policy: ${p}, using None`);
      return SecurityPolicy.None;
    }
    return policy;
  });

  const securityModes = config.securityModes.map((m) => {
    const mode = securityModeMap[m];
    if (!mode) {
      console.warn(`[Config] Unknown security mode: ${m}, using None`);
      return MessageSecurityMode.None;
    }
    return mode;
  });

  const needsCerts =
    securityPolicies.some((p) => p !== SecurityPolicy.None) ||
    securityModes.some((m) => m !== MessageSecurityMode.None);

  const serverOptions = {
    port: config.port,
    hostname: config.hostname,
    resourcePath: config.resourcePath,

    buildInfo: {
      productName: config.serverName,
      buildNumber: "1.0.0",
      buildDate: new Date(),
      manufacturerName: "OPC UA Test Server",
      productUri: "urn:opcua:test-server",
      softwareVersion: "1.0.0",
    },

    serverInfo: {
      applicationUri: `urn:opcua:test-server:${config.serverName}`,
      productUri: "urn:opcua:test-server",
      applicationName: { text: config.serverName, locale: "en" },
    },

    securityPolicies,
    securityModes,
    allowAnonymous: config.allowAnonymous,

    maxAllowedSessionNumber: config.maxSessions,
    maxConnectionsPerEndpoint: config.maxSessions,

    nodeset_filename: [
      nodesets.standard,
      nodesets.di,
      path.join(config.customTypesFile),
    ],
  };

  if (needsCerts && fs.existsSync(config.certificateFile) && fs.existsSync(config.privateKeyFile)) {
    console.log("[Certs] Loading server certificate...");
    serverOptions.certificateFile = config.certificateFile;
    serverOptions.privateKeyFile = config.privateKeyFile;

    // =========================================================================
    // PKI setup — Certificate and CRL management for node-opcua
    // =========================================================================
    //
    // node-opcua uses OPCUACertificateManager to manage the PKI trust chain.
    // The PKI directory structure follows the OPC UA GDS (Global Discovery
    // Service) convention:
    //
    //   pki/
    //     trusted/certs/   — client certificates explicitly trusted
    //     trusted/crl/     — (unused here, kept for convention)
    //     issuers/certs/   — CA certificates that signed the client certs
    //     issuers/crl/     — CRL (Certificate Revocation List) for those CAs
    //     rejected/certs/  — auto-populated by node-opcua for rejected certs
    //
    // PROBLEM 1: BadCertificateRevocationUnknown (0x801b0000)
    //   When a client connects with a certificate signed by a CA, node-opcua
    //   validates the certificate chain. Part of this validation checks whether
    //   the certificate has been revoked by consulting the CA's CRL. If no CRL
    //   is found in issuers/crl/, node-opcua rejects the connection with
    //   BadCertificateRevocationUnknown. This happens even if autoAcceptCerts
    //   is true, because revocation checking is a separate step from trust
    //   evaluation.
    //
    //   Solution: generate-certs.sh now creates an empty CRL signed by the CA
    //   (ca-crl.pem). We copy it into issuers/crl/ BEFORE calling
    //   certificateManager.initialize(), because node-opcua loads and indexes
    //   the CRL files during initialization. Copying after initialize() has no
    //   effect — the CRL won't be found when the first client connects.
    //
    // PROBLEM 2: BadIdentityTokenRejected (0x80210000) for X509 user auth
    //   node-opcua uses TWO separate certificate managers:
    //   - serverCertificateManager: validates the TLS-level client certificate
    //     presented during the OpenSecureChannel handshake (OPN message).
    //   - userCertificateManager: validates the X509 certificate presented as
    //     a UserIdentityToken during ActivateSession.
    //   If userCertificateManager is not configured, node-opcua has no way to
    //   verify the user certificate's trust chain and rejects it outright.
    //
    //   Solution: when authCertificate is enabled, we create a second
    //   OPCUACertificateManager with its own PKI directory (user-pki/),
    //   populated with the same CA cert, CRL, and trusted client certs.
    //   This allows node-opcua to validate user X509 tokens independently
    //   from transport-level certificates.
    //
    // IMPORTANT: populatePki() must run BEFORE certificateManager.initialize()
    // for both managers. The initialize() method scans the PKI directories
    // and builds an internal index; files added after initialization are not
    // picked up for revocation checking.
    // =========================================================================

    const pkiRoot = path.join(process.env.OPCUA_ROOT || path.resolve(__dirname, ".."), "pki");
    fs.mkdirSync(pkiRoot, { recursive: true });

    const caCrlFile = path.join(path.dirname(config.caCertFile), "ca-crl.pem");

    function populatePki(root) {
      const dirs = {
        trustedCerts: path.join(root, "trusted", "certs"),
        trustedCrl: path.join(root, "trusted", "crl"),
        issuersCerts: path.join(root, "issuers", "certs"),
        issuersCrl: path.join(root, "issuers", "crl"),
      };
      for (const d of Object.values(dirs)) fs.mkdirSync(d, { recursive: true });

      // Copy trusted client certs
      if (fs.existsSync(config.trustedCertsDir)) {
        for (const f of fs.readdirSync(config.trustedCertsDir)) {
          if (f.endsWith(".pem") || f.endsWith(".der")) {
            try { fs.copyFileSync(path.join(config.trustedCertsDir, f), path.join(dirs.trustedCerts, f)); } catch (e) { }
          }
        }
      }
      // Copy CA certificate to issuers
      if (fs.existsSync(config.caCertFile)) {
        try { fs.copyFileSync(config.caCertFile, path.join(dirs.issuersCerts, "ca-cert.pem")); } catch (e) { }
      }
      // Copy CA CRL to issuers
      if (fs.existsSync(caCrlFile)) {
        try { fs.copyFileSync(caCrlFile, path.join(dirs.issuersCrl, "ca-crl.pem")); } catch (e) { }
      }
    }

    populatePki(pkiRoot);

    const certificateManager = new OPCUACertificateManager({
      automaticallyAcceptUnknownCertificate: config.autoAcceptCerts,
      rootFolder: pkiRoot,
    });
    await certificateManager.initialize();

    serverOptions.serverCertificateManager = certificateManager;

    // Create a separate certificate manager for user X509 certificate authentication
    if (config.authCertificate) {
      const userPkiRoot = path.join(process.env.OPCUA_ROOT || path.resolve(__dirname, ".."), "user-pki");
      populatePki(userPkiRoot);
      const userCertificateManager = new OPCUACertificateManager({
        automaticallyAcceptUnknownCertificate: config.autoAcceptCerts,
        rootFolder: userPkiRoot,
      });
      await userCertificateManager.initialize();
      serverOptions.userCertificateManager = userCertificateManager;
    }
  } else if (needsCerts) {
    console.warn("[Certs] Certificate files not found, server will generate self-signed certs");
  }

  if (config.authUsers || config.authCertificate) {
    const userManager = createUserManager();
    serverOptions.userManager = {
      isValidUser: (userName, password) => {
        if (!config.authUsers) return false;
        return userManager.isValidUser(userName, password);
      },
      getUserRoles: (user) => {
        return userManager.getUserRoles(user);
      },
    };

    if (config.authCertificate) {
      serverOptions.isValidUserAsync = async (userIdentityToken, session) => {
        return true;
      };
    }
  }

  if (config.discoveryUrl) {
    serverOptions.registerServerMethod = 2;
    serverOptions.discoveryServerEndpointUrl = config.discoveryUrl;
  }

  if (config.isDiscovery) {
    console.log("[Server] Starting as Discovery Server...");
    const { OPCUADiscoveryServer } = require("node-opcua");
    const discoveryServer = new OPCUADiscoveryServer({
      port: config.port,
      serverCertificateManager: serverOptions.serverCertificateManager,
      certificateFile: serverOptions.certificateFile,
      privateKeyFile: serverOptions.privateKeyFile,
    });
    await discoveryServer.start();
    console.log("\n" + "=".repeat(60));
    console.log(`OPC UA Discovery Server RUNNING on port ${config.port}`);
    console.log("=".repeat(60));

    async function shutdownDiscovery() {
      console.log("\n[Discovery] Shutting down...");
      await discoveryServer.shutdown();
      console.log("[Discovery] Stopped");
      process.exit(0);
    }
    process.on("SIGINT", shutdownDiscovery);
    process.on("SIGTERM", shutdownDiscovery);
    return;
  }

  const server = new OPCUAServer(serverOptions);

  await server.initialize();
  console.log("[Server] Initialized");

  await constructAddressSpace(server);

  // Set server operation limits if configured
  const addressSpace = server.engine.addressSpace;
  const { DataType: DT, Variant: V } = require("node-opcua");
  const setLimit = (nodeId, value) => {
    if (value > 0) {
      try {
        const node = addressSpace.findNode(nodeId);
        if (node) {
          node.bindVariable({
            get() { return new V({ dataType: DT.UInt32, value: value }); },
          }, true);
          console.log(`[Server] Set operation limit ${nodeId} = ${value}`);
        }
      } catch (e) {}
    }
  };
  setLimit("i=11705", config.maxNodesPerRead);
  setLimit("i=11707", config.maxNodesPerWrite);
  setLimit("i=11710", config.maxNodesPerBrowse);

  await server.start();

  console.log("\n" + "=".repeat(60));
  console.log("OPC UA Test Server RUNNING");
  console.log("=".repeat(60));

  const endpoints = server.endpoints;
  for (const ep of endpoints) {
    const endpointDescriptions = ep.endpointDescriptions();
    for (const desc of endpointDescriptions) {
      console.log(`  Endpoint: ${desc.endpointUrl}`);
      console.log(`    Security: ${SecurityPolicy[desc.securityPolicyUri] || desc.securityPolicyUri}`);
      console.log(`    Mode: ${MessageSecurityMode[desc.securityMode]}`);
      const tokens = (desc.userIdentityTokens || []).map((t) => t.policyId).join(", ");
      console.log(`    Auth: ${tokens}`);
    }
  }
  console.log("=".repeat(60));

  async function shutdown() {
    console.log("\n[Server] Shutting down...");
    stopDynamic();
    stopEvents();
    stopHistorical();
    await server.shutdown(1000);
    console.log("[Server] Stopped");
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("uncaughtException", (err) => {
    console.error("[Server] Uncaught exception:", err);
  });
}

main().catch((err) => {
  console.error("[Server] Fatal error:", err);
  process.exit(1);
});
