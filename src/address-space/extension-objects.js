const {
  DataType,
  Variant,
  StatusCodes,
} = require("node-opcua");

const CUSTOM_TYPES_NS_URI = "urn:opcua:test-server:custom-types";

function buildExtensionObjects(namespace, rootFolder, addressSpace) {
  const folder = namespace.addFolder(rootFolder, { browseName: "ExtensionObjects" });

  const customNsIdx = addressSpace.getNamespaceIndex(CUSTOM_TYPES_NS_URI);
  if (customNsIdx < 0) {
    console.warn("[AddressSpace]   ExtensionObjects: custom-types namespace not found, skipping");
    return;
  }

  try {
    const pointType = addressSpace.findDataType("TestPointXYZ", customNsIdx);
    if (!pointType) {
      console.warn("[AddressSpace]   ExtensionObjects: TestPointXYZ type not found");
      return;
    }

    const rangeType = addressSpace.findDataType("TestRangeStruct", customNsIdx);

    let pointX = 1.5, pointY = 2.5, pointZ = 3.5;

    namespace.addVariable({
      componentOf: folder,
      browseName: "PointValue",
      dataType: pointType,
      accessLevel: "CurrentRead | CurrentWrite",
      userAccessLevel: "CurrentRead | CurrentWrite",
      value: {
        get() {
          const obj = addressSpace.constructExtensionObject(pointType, {
            X: pointX, Y: pointY, Z: pointZ,
          });
          return new Variant({ dataType: DataType.ExtensionObject, value: obj });
        },
        set(variant) {
          if (variant.value) {
            pointX = variant.value.x !== undefined ? variant.value.x : pointX;
            pointY = variant.value.y !== undefined ? variant.value.y : pointY;
            pointZ = variant.value.z !== undefined ? variant.value.z : pointZ;
          }
          return StatusCodes.Good;
        },
      },
    });

    if (rangeType) {
      namespace.addVariable({
        componentOf: folder,
        browseName: "RangeValue",
        dataType: rangeType,
        accessLevel: "CurrentRead",
        userAccessLevel: "CurrentRead",
        value: {
          get() {
            const obj = addressSpace.constructExtensionObject(rangeType, {
              Min: 0.0, Max: 100.0, Value: 42.5,
            });
            return new Variant({ dataType: DataType.ExtensionObject, value: obj });
          },
        },
      });
    }

    console.log("[AddressSpace]   ExtensionObjects: PointValue (TestPointXYZ), RangeValue (TestRangeStruct)");
  } catch (err) {
    console.warn("[AddressSpace]   ExtensionObjects: Error:", err.message);
  }
}

module.exports = { buildExtensionObjects };
