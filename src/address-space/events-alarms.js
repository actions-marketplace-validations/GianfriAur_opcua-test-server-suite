const {
  DataType,
  Variant,
  StatusCodes,
  coerceLocalizedText,
} = require("node-opcua");

const timers = [];

function buildEventsAndAlarms(namespace, rootFolder) {
  const addressSpace = namespace.addressSpace;
  const eventsFolder = namespace.addFolder(rootFolder, { browseName: "Events" });
  const alarmsFolder = namespace.addFolder(rootFolder, { browseName: "Alarms" });
  alarmsFolder.setEventNotifier(1);
  // Register alarmsFolder as event source so alarms can use it as conditionSource
  const serverObject = addressSpace.findNode("ns=0;i=2253");
  if (serverObject) {
    serverObject.addReference({
      referenceType: "HasEventSource",
      nodeId: alarmsFolder.nodeId,
    });
  }

  const simpleEventType = namespace.addEventType({
    browseName: "SimpleEventType",
    subtypeOf: "BaseEventType",
  });
  namespace.addVariable({
    propertyOf: simpleEventType,
    browseName: "EventPayload",
    dataType: DataType.String,
    modellingRule: "Mandatory",
  });

  const complexEventType = namespace.addEventType({
    browseName: "ComplexEventType",
    subtypeOf: "BaseEventType",
  });
  namespace.addVariable({
    propertyOf: complexEventType,
    browseName: "Source",
    dataType: DataType.String,
    modellingRule: "Mandatory",
  });
  namespace.addVariable({
    propertyOf: complexEventType,
    browseName: "Category",
    dataType: DataType.String,
    modellingRule: "Mandatory",
  });
  namespace.addVariable({
    propertyOf: complexEventType,
    browseName: "NumericValue",
    dataType: DataType.Double,
    modellingRule: "Mandatory",
  });

  const systemStatusEventType = namespace.addEventType({
    browseName: "SystemStatusEventType",
    subtypeOf: "BaseEventType",
  });
  namespace.addVariable({
    propertyOf: systemStatusEventType,
    browseName: "SystemState",
    dataType: DataType.String,
    modellingRule: "Mandatory",
  });
  namespace.addVariable({
    propertyOf: systemStatusEventType,
    browseName: "CpuUsage",
    dataType: DataType.Double,
    modellingRule: "Mandatory",
  });
  namespace.addVariable({
    propertyOf: systemStatusEventType,
    browseName: "MemoryUsage",
    dataType: DataType.Double,
    modellingRule: "Mandatory",
  });

  const eventEmitter = namespace.addObject({
    organizedBy: eventsFolder,
    browseName: "EventEmitter",
    eventSourceOf: addressSpace.rootFolder.objects.server,
    eventNotifier: 1,
  });

  let eventCounter = 0;
  timers.push(setInterval(() => {
    eventCounter++;
    eventEmitter.raiseEvent(simpleEventType, {
      message: {
        dataType: DataType.LocalizedText,
        value: coerceLocalizedText(`Periodic event #${eventCounter}`),
      },
      severity: { dataType: DataType.UInt16, value: 200 },
      sourceNode: { dataType: DataType.NodeId, value: eventEmitter.nodeId },
      sourceName: { dataType: DataType.String, value: "PeriodicEmitter" },
      eventPayload: { dataType: DataType.String, value: `payload-${eventCounter}` },
    });
  }, 5000));

  const systemStates = ["Running", "Idle", "Busy", "Maintenance"];
  let sysStateIdx = 0;
  timers.push(setInterval(() => {
    sysStateIdx = (sysStateIdx + 1) % systemStates.length;
    eventEmitter.raiseEvent(systemStatusEventType, {
      message: {
        dataType: DataType.LocalizedText,
        value: coerceLocalizedText(`System status: ${systemStates[sysStateIdx]}`),
      },
      severity: { dataType: DataType.UInt16, value: sysStateIdx === 3 ? 600 : 100 },
      sourceNode: { dataType: DataType.NodeId, value: eventEmitter.nodeId },
      sourceName: { dataType: DataType.String, value: "SystemMonitor" },
      systemState: { dataType: DataType.String, value: systemStates[sysStateIdx] },
      cpuUsage: { dataType: DataType.Double, value: Math.random() * 100 },
      memoryUsage: { dataType: DataType.Double, value: 40 + Math.random() * 50 },
    });
  }, 15000));

  let alarmSourceValue = 50.0;
  const alarmSource = namespace.addVariable({
    componentOf: alarmsFolder,
    browseName: "AlarmSourceValue",
    dataType: DataType.Double,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    value: {
      get: () => new Variant({ dataType: DataType.Double, value: alarmSourceValue }),
      set: (variant) => {
        alarmSourceValue = variant.value;
        return StatusCodes.Good;
      },
    },
  });

  timers.push(setInterval(() => {
    alarmSourceValue = 50 + 60 * Math.sin(Date.now() / 10000);
  }, 1000));

  try {
    const exclusiveLimitAlarm = addressSpace.getOwnNamespace() !== namespace
      ? null
      : namespace.instantiateExclusiveLimitAlarm("ExclusiveLimitAlarmType", {
          browseName: "HighTemperatureAlarm",
          componentOf: alarmsFolder,
          conditionSource: alarmsFolder,
          inputNode: alarmSource,
          highHighLimit: 90,
          highLimit: 70,
          lowLimit: 20,
          lowLowLimit: 5,
        });
  } catch (err) {
    console.warn("[Events] Could not create ExclusiveLimitAlarm:", err.message);
  }

  try {
    namespace.instantiateNonExclusiveLimitAlarm("NonExclusiveLimitAlarmType", {
      browseName: "LevelAlarm",
      componentOf: alarmsFolder,
      conditionSource: alarmsFolder,
      inputNode: alarmSource,
      highHighLimit: 95,
      highLimit: 75,
      lowLimit: 15,
      lowLowLimit: 0,
    });
  } catch (err) {
    console.warn("[Events] Could not create NonExclusiveLevelAlarm:", err.message);
  }

  let offNormalState = false;
  const offNormalSource = namespace.addVariable({
    componentOf: alarmsFolder,
    browseName: "OffNormalSource",
    dataType: DataType.Boolean,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    value: {
      get: () => new Variant({ dataType: DataType.Boolean, value: offNormalState }),
      set: (variant) => {
        offNormalState = variant.value;
        return StatusCodes.Good;
      },
    },
  });
  timers.push(setInterval(() => {
    offNormalState = !offNormalState;
  }, 20000));

  try {
    namespace.instantiateOffNormalAlarm({
      browseName: "OffNormalAlarm",
      componentOf: alarmsFolder,
      conditionSource: alarmsFolder,
      inputNode: offNormalSource.nodeId,
      normalState: offNormalSource.nodeId,
    });
  } catch (err) {
    console.warn("[Events] Could not create OffNormalAlarm:", err.message);
  }
}

function stopEvents() {
  for (const t of timers) clearInterval(t);
  timers.length = 0;
}

module.exports = { buildEventsAndAlarms, stopEvents };
