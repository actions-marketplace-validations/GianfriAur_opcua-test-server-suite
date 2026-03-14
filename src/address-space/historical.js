const {
  DataType,
  Variant,
} = require("node-opcua");

const timers = [];

function buildHistorical(namespace, rootFolder, addressSpace) {
  const folder = namespace.addFolder(rootFolder, { browseName: "Historical" });

  let tempValue = 22.0;
  const histTemp = namespace.addVariable({
    componentOf: folder,
    browseName: "HistoricalTemperature",
    dataType: DataType.Double,
    accessLevel: "CurrentRead | HistoryRead",
    userAccessLevel: "CurrentRead | HistoryRead",
    value: {
      get: () => new Variant({ dataType: DataType.Double, value: tempValue }),
    },
  });

  let pressureValue = 101.325;
  const histPressure = namespace.addVariable({
    componentOf: folder,
    browseName: "HistoricalPressure",
    dataType: DataType.Double,
    accessLevel: "CurrentRead | HistoryRead",
    userAccessLevel: "CurrentRead | HistoryRead",
    value: {
      get: () => new Variant({ dataType: DataType.Double, value: pressureValue }),
    },
  });

  let histCounterValue = 0;
  const histCounter = namespace.addVariable({
    componentOf: folder,
    browseName: "HistoricalCounter",
    dataType: DataType.UInt32,
    accessLevel: "CurrentRead | HistoryRead",
    userAccessLevel: "CurrentRead | HistoryRead",
    value: {
      get: () => new Variant({ dataType: DataType.UInt32, value: histCounterValue }),
    },
  });

  let histBoolValue = false;
  const histBool = namespace.addVariable({
    componentOf: folder,
    browseName: "HistoricalBoolean",
    dataType: DataType.Boolean,
    accessLevel: "CurrentRead | HistoryRead",
    userAccessLevel: "CurrentRead | HistoryRead",
    value: {
      get: () => new Variant({ dataType: DataType.Boolean, value: histBoolValue }),
    },
  });

  const histOptions = { maxOnlineValues: 10000 };
  try {
    addressSpace.installHistoricalDataNode(histTemp, histOptions);
    addressSpace.installHistoricalDataNode(histPressure, histOptions);
    addressSpace.installHistoricalDataNode(histCounter, histOptions);
    addressSpace.installHistoricalDataNode(histBool, histOptions);
    console.log("[Historical] Historical data nodes installed");
  } catch (err) {
    console.warn("[Historical] Could not install historical data:", err.message);
  }

  timers.push(setInterval(() => {
    const t = Date.now() / 1000;
    tempValue = 22 + 8 * Math.sin(t / 60) + (Math.random() - 0.5) * 2;
    pressureValue = 101.325 + 5 * Math.cos(t / 120) + (Math.random() - 0.5);
    histCounterValue++;
    histBoolValue = Math.random() > 0.5;

    // Use setValueFromSource to trigger historical data recording
    histTemp.setValueFromSource(new Variant({ dataType: DataType.Double, value: tempValue }));
    histPressure.setValueFromSource(new Variant({ dataType: DataType.Double, value: pressureValue }));
    histCounter.setValueFromSource(new Variant({ dataType: DataType.UInt32, value: histCounterValue }));
    histBool.setValueFromSource(new Variant({ dataType: DataType.Boolean, value: histBoolValue }));
  }, 1000));
}

function stopHistorical() {
  for (const t of timers) clearInterval(t);
  timers.length = 0;
}

module.exports = { buildHistorical, stopHistorical };
