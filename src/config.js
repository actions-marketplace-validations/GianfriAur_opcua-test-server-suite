const path = require("path");

function parseList(envValue, defaultValue) {
  if (!envValue) return defaultValue;
  return envValue.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseBool(envValue, defaultValue) {
  if (envValue === undefined || envValue === "") return defaultValue;
  return envValue === "true" || envValue === "1";
}

function parseIntEnv(envValue, defaultValue) {
  if (envValue === undefined || envValue === "") return defaultValue;
  const n = parseInt(envValue, 10);
  return isNaN(n) ? defaultValue : n;
}

const ROOT = process.env.OPCUA_ROOT || path.resolve(__dirname, "..");

const config = {
  port: parseIntEnv(process.env.OPCUA_PORT, 4840),
  serverName: process.env.OPCUA_SERVER_NAME || "OPCUATestServer",
  hostname: process.env.OPCUA_HOSTNAME || "0.0.0.0",
  resourcePath: process.env.OPCUA_RESOURCE_PATH || "/UA/TestServer",

  securityPolicies: parseList(process.env.OPCUA_SECURITY_POLICIES, ["None"]),
  securityModes: parseList(process.env.OPCUA_SECURITY_MODES, ["None"]),

  allowAnonymous: parseBool(process.env.OPCUA_ALLOW_ANONYMOUS, true),
  authUsers: parseBool(process.env.OPCUA_AUTH_USERS, false),
  authCertificate: parseBool(process.env.OPCUA_AUTH_CERTIFICATE, false),
  usersFile: process.env.OPCUA_USERS_FILE || path.join(ROOT, "config/users.json"),

  certificateFile: process.env.OPCUA_CERTIFICATE_FILE || path.join(ROOT, "certs/server/cert.pem"),
  privateKeyFile: process.env.OPCUA_PRIVATE_KEY_FILE || path.join(ROOT, "certs/server/key.pem"),
  trustedCertsDir: process.env.OPCUA_TRUSTED_CERTS_DIR || path.join(ROOT, "certs/trusted"),
  rejectedCertsDir: process.env.OPCUA_REJECTED_CERTS_DIR || path.join(ROOT, "certs/rejected"),
  caCertFile: process.env.OPCUA_CA_CERT_FILE || path.join(ROOT, "certs/ca/ca-cert.pem"),
  autoAcceptCerts: parseBool(process.env.OPCUA_AUTO_ACCEPT_CERTS, false),

  maxSessions: parseIntEnv(process.env.OPCUA_MAX_SESSIONS, 100),
  maxSubscriptionsPerSession: parseIntEnv(process.env.OPCUA_MAX_SUBSCRIPTIONS, 100),
  minPublishingInterval: parseIntEnv(process.env.OPCUA_MIN_PUBLISHING_INTERVAL, 100),

  discoveryUrl: process.env.OPCUA_DISCOVERY_URL || "",
  isDiscovery: parseBool(process.env.OPCUA_IS_DISCOVERY, false),

  enableHistorical: parseBool(process.env.OPCUA_ENABLE_HISTORICAL, true),
  enableEvents: parseBool(process.env.OPCUA_ENABLE_EVENTS, true),
  enableMethods: parseBool(process.env.OPCUA_ENABLE_METHODS, true),
  enableDynamic: parseBool(process.env.OPCUA_ENABLE_DYNAMIC, true),
  enableStructures: parseBool(process.env.OPCUA_ENABLE_STRUCTURES, true),
  enableViews: parseBool(process.env.OPCUA_ENABLE_VIEWS, true),

  customTypesFile: process.env.OPCUA_CUSTOM_TYPES_FILE || path.join(ROOT, "config/custom-types.xml"),

  maxNodesPerRead: parseIntEnv(process.env.OPCUA_MAX_NODES_PER_READ, 0),
  maxNodesPerWrite: parseIntEnv(process.env.OPCUA_MAX_NODES_PER_WRITE, 0),
  maxNodesPerBrowse: parseIntEnv(process.env.OPCUA_MAX_NODES_PER_BROWSE, 0),
};

module.exports = config;
