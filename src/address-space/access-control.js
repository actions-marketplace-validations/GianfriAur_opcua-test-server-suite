const {
  DataType,
  Variant,
  StatusCodes,
  makeAccessLevelFlag,
  WellKnownRoles,
  PermissionType,
} = require("node-opcua");

function buildAccessControl(namespace, rootFolder) {
  const folder = namespace.addFolder(rootFolder, { browseName: "AccessControl" });

  const accessFolder = namespace.addFolder(folder, { browseName: "AccessLevels" });

  let roValue = 100;
  namespace.addVariable({
    componentOf: accessFolder,
    browseName: "CurrentRead_Only",
    dataType: DataType.Int32,
    accessLevel: "CurrentRead",
    userAccessLevel: "CurrentRead",
    value: {
      get: () => new Variant({ dataType: DataType.Int32, value: roValue }),
    },
  });

  let woValue = 0;
  namespace.addVariable({
    componentOf: accessFolder,
    browseName: "CurrentWrite_Only",
    dataType: DataType.Int32,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentWrite",
    value: {
      get: () => new Variant({ dataType: DataType.Int32, value: woValue }),
      set: (variant) => { woValue = variant.value; return StatusCodes.Good; },
    },
  });

  let rwValue = 42;
  namespace.addVariable({
    componentOf: accessFolder,
    browseName: "ReadWrite",
    dataType: DataType.Int32,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    value: {
      get: () => new Variant({ dataType: DataType.Int32, value: rwValue }),
      set: (variant) => { rwValue = variant.value; return StatusCodes.Good; },
    },
  });

  let hrValue = 55;
  namespace.addVariable({
    componentOf: accessFolder,
    browseName: "HistoryRead_Only",
    dataType: DataType.Int32,
    accessLevel: "CurrentRead | HistoryRead",
    userAccessLevel: "CurrentRead | HistoryRead",
    value: {
      get: () => new Variant({ dataType: DataType.Int32, value: hrValue }),
    },
  });

  let fullValue = 77;
  namespace.addVariable({
    componentOf: accessFolder,
    browseName: "FullAccess",
    dataType: DataType.Int32,
    accessLevel: "CurrentRead | CurrentWrite | HistoryRead",
    userAccessLevel: "CurrentRead | CurrentWrite | HistoryRead",
    value: {
      get: () => new Variant({ dataType: DataType.Int32, value: fullValue }),
      set: (variant) => { fullValue = variant.value; return StatusCodes.Good; },
    },
  });

  const adminFolder = namespace.addFolder(folder, { browseName: "AdminOnly" });

  let adminSecret = "admin-secret-value";
  namespace.addVariable({
    componentOf: adminFolder,
    browseName: "SecretConfig",
    dataType: DataType.String,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    value: {
      get: () => new Variant({ dataType: DataType.String, value: adminSecret }),
      set: (variant) => { adminSecret = variant.value; return StatusCodes.Good; },
    },
  });

  let adminInt = 999;
  namespace.addVariable({
    componentOf: adminFolder,
    browseName: "SystemParameter",
    dataType: DataType.Int32,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    value: {
      get: () => new Variant({ dataType: DataType.Int32, value: adminInt }),
      set: (variant) => { adminInt = variant.value; return StatusCodes.Good; },
    },
  });

  let adminDouble = 99.99;
  namespace.addVariable({
    componentOf: adminFolder,
    browseName: "CalibrationFactor",
    dataType: DataType.Double,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    value: {
      get: () => new Variant({ dataType: DataType.Double, value: adminDouble }),
      set: (variant) => { adminDouble = variant.value; return StatusCodes.Good; },
    },
  });

  let adminBool = false;
  namespace.addVariable({
    componentOf: adminFolder,
    browseName: "MaintenanceMode",
    dataType: DataType.Boolean,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    value: {
      get: () => new Variant({ dataType: DataType.Boolean, value: adminBool }),
      set: (variant) => { adminBool = variant.value; return StatusCodes.Good; },
    },
  });

  const operatorFolder = namespace.addFolder(folder, { browseName: "OperatorLevel" });

  const operatorRolePerms = [
    { roleId: WellKnownRoles.AuthenticatedUser, permissions: PermissionType.Read | PermissionType.Browse },
    { roleId: WellKnownRoles.Operator, permissions: PermissionType.Read | PermissionType.Browse | PermissionType.Write },
    { roleId: WellKnownRoles.ConfigureAdmin, permissions: PermissionType.Read | PermissionType.Browse | PermissionType.Write },
    { roleId: WellKnownRoles.SecurityAdmin, permissions: PermissionType.Read | PermissionType.Browse | PermissionType.Write },
    { roleId: WellKnownRoles.Engineer, permissions: PermissionType.Read | PermissionType.Browse | PermissionType.Write },
  ];

  let opSetpoint = 50.0;
  namespace.addVariable({
    componentOf: operatorFolder,
    browseName: "Setpoint",
    dataType: DataType.Double,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    rolePermissions: operatorRolePerms,
    value: {
      get: () => new Variant({ dataType: DataType.Double, value: opSetpoint }),
      set: (variant) => { opSetpoint = variant.value; return StatusCodes.Good; },
    },
  });

  let opSpeed = 1500;
  namespace.addVariable({
    componentOf: operatorFolder,
    browseName: "MotorSpeed",
    dataType: DataType.Int32,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    rolePermissions: operatorRolePerms,
    value: {
      get: () => new Variant({ dataType: DataType.Int32, value: opSpeed }),
      set: (variant) => { opSpeed = variant.value; return StatusCodes.Good; },
    },
  });

  let opEnabled = true;
  namespace.addVariable({
    componentOf: operatorFolder,
    browseName: "ProcessEnabled",
    dataType: DataType.Boolean,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    rolePermissions: operatorRolePerms,
    value: {
      get: () => new Variant({ dataType: DataType.Boolean, value: opEnabled }),
      set: (variant) => { opEnabled = variant.value; return StatusCodes.Good; },
    },
  });

  let opRecipe = "default";
  namespace.addVariable({
    componentOf: operatorFolder,
    browseName: "RecipeName",
    dataType: DataType.String,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    value: {
      get: () => new Variant({ dataType: DataType.String, value: opRecipe }),
      set: (variant) => { opRecipe = variant.value; return StatusCodes.Good; },
    },
  });

  const viewerFolder = namespace.addFolder(folder, { browseName: "ViewerLevel" });

  namespace.addVariable({
    componentOf: viewerFolder,
    browseName: "ProductionCount",
    dataType: DataType.UInt32,
    accessLevel: "CurrentRead",
    userAccessLevel: "CurrentRead",
    value: {
      get: () => new Variant({ dataType: DataType.UInt32, value: 12345 }),
    },
  });

  namespace.addVariable({
    componentOf: viewerFolder,
    browseName: "MachineName",
    dataType: DataType.String,
    accessLevel: "CurrentRead",
    userAccessLevel: "CurrentRead",
    value: {
      get: () => new Variant({ dataType: DataType.String, value: "Machine-001" }),
    },
  });

  namespace.addVariable({
    componentOf: viewerFolder,
    browseName: "IsRunning",
    dataType: DataType.Boolean,
    accessLevel: "CurrentRead",
    userAccessLevel: "CurrentRead",
    value: {
      get: () => new Variant({ dataType: DataType.Boolean, value: true }),
    },
  });

  namespace.addVariable({
    componentOf: viewerFolder,
    browseName: "CurrentTemperature",
    dataType: DataType.Double,
    accessLevel: "CurrentRead",
    userAccessLevel: "CurrentRead",
    value: {
      get: () => new Variant({ dataType: DataType.Double, value: 22.5 + (Math.random() - 0.5) }),
    },
  });

  namespace.addVariable({
    componentOf: viewerFolder,
    browseName: "UptimeSeconds",
    dataType: DataType.UInt32,
    accessLevel: "CurrentRead",
    userAccessLevel: "CurrentRead",
    value: {
      get: () => new Variant({ dataType: DataType.UInt32, value: Math.floor(process.uptime()) }),
    },
  });

  const comboFolder = namespace.addFolder(folder, { browseName: "AllCombinations" });

  const comboTypes = [
    { suffix: "Boolean", dataType: DataType.Boolean, roVal: true, rwVal: false },
    { suffix: "Int32", dataType: DataType.Int32, roVal: -42, rwVal: 0 },
    { suffix: "UInt32", dataType: DataType.UInt32, roVal: 42, rwVal: 0 },
    { suffix: "Double", dataType: DataType.Double, roVal: 3.14, rwVal: 0.0 },
    { suffix: "String", dataType: DataType.String, roVal: "immutable", rwVal: "" },
    { suffix: "DateTime", dataType: DataType.DateTime, roVal: new Date("2024-01-01"), rwVal: new Date() },
    { suffix: "Byte", dataType: DataType.Byte, roVal: 128, rwVal: 0 },
    { suffix: "Float", dataType: DataType.Float, roVal: 2.71, rwVal: 0.0 },
  ];

  for (const ct of comboTypes) {
    namespace.addVariable({
      componentOf: comboFolder,
      browseName: `${ct.suffix}_RO`,
      dataType: ct.dataType,
      accessLevel: "CurrentRead",
      userAccessLevel: "CurrentRead",
      value: {
        get: () => new Variant({ dataType: ct.dataType, value: ct.roVal }),
      },
    });

    let rwVal = ct.rwVal;
    namespace.addVariable({
      componentOf: comboFolder,
      browseName: `${ct.suffix}_RW`,
      dataType: ct.dataType,
      accessLevel: "CurrentRead | CurrentWrite",
      userAccessLevel: "CurrentRead | CurrentWrite",
      value: {
        get: () => new Variant({ dataType: ct.dataType, value: rwVal }),
        set: (variant) => { rwVal = variant.value; return StatusCodes.Good; },
      },
    });

    let woVal = ct.rwVal;
    namespace.addVariable({
      componentOf: comboFolder,
      browseName: `${ct.suffix}_WO`,
      dataType: ct.dataType,
      accessLevel: "CurrentRead | CurrentWrite",
      userAccessLevel: "CurrentWrite",
      value: {
        get: () => new Variant({ dataType: ct.dataType, value: woVal }),
        set: (variant) => { woVal = variant.value; return StatusCodes.Good; },
      },
    });

    namespace.addVariable({
      componentOf: comboFolder,
      browseName: `${ct.suffix}_HR`,
      dataType: ct.dataType,
      accessLevel: "CurrentRead | HistoryRead",
      userAccessLevel: "CurrentRead | HistoryRead",
      value: {
        get: () => new Variant({ dataType: ct.dataType, value: ct.roVal }),
      },
    });
  }
}

module.exports = { buildAccessControl };
