const config = require("../config");
const { buildDataTypes } = require("./data-types");
const { buildMethods } = require("./methods");
const { buildDynamic } = require("./dynamic");
const { buildEventsAndAlarms } = require("./events-alarms");
const { buildHistorical } = require("./historical");
const { buildStructures } = require("./structures");
const { buildViews } = require("./views");
const { buildAccessControl } = require("./access-control");
const { buildExtensionObjects } = require("./extension-objects");

async function constructAddressSpace(server) {
  const addressSpace = server.engine.addressSpace;
  const namespace = addressSpace.getOwnNamespace();

  const rootFolder = namespace.addFolder(addressSpace.rootFolder.objects, {
    browseName: "TestServer",
  });

  console.log("[AddressSpace] Building data types...");
  buildDataTypes(namespace, rootFolder);

  if (config.enableMethods) {
    console.log("[AddressSpace] Building methods...");
    buildMethods(namespace, rootFolder);
  }

  if (config.enableDynamic) {
    console.log("[AddressSpace] Building dynamic variables...");
    buildDynamic(namespace, rootFolder);
  }

  if (config.enableEvents) {
    console.log("[AddressSpace] Building events and alarms...");
    buildEventsAndAlarms(namespace, rootFolder);
  }

  if (config.enableHistorical) {
    console.log("[AddressSpace] Building historical data...");
    buildHistorical(namespace, rootFolder, addressSpace);
  }

  if (config.enableStructures) {
    console.log("[AddressSpace] Building structures...");
    buildStructures(namespace, rootFolder);
  }

  console.log("[AddressSpace] Building extension objects...");
  buildExtensionObjects(namespace, rootFolder, addressSpace);

  console.log("[AddressSpace] Building access control...");
  buildAccessControl(namespace, rootFolder);

  if (config.enableViews) {
    console.log("[AddressSpace] Building views...");
    buildViews(namespace, rootFolder);
  }

  console.log("[AddressSpace] Construction complete");
  console.log(`[AddressSpace] Namespace URI: ${namespace.namespaceUri}`);
}

module.exports = { constructAddressSpace };
