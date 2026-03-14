const {
  DataType,
  Variant,
  VariantArrayType,
  StatusCodes,
  QualifiedName,
  LocalizedText,
  makeNodeId,
  makeExpandedNodeId,
  coerceNodeId,
} = require("node-opcua");

const crypto = require("crypto");

function buildDataTypes(namespace, rootFolder) {
  const dataTypesFolder = namespace.addFolder(rootFolder, { browseName: "DataTypes" });
  buildScalars(namespace, dataTypesFolder);
  buildReadOnlyScalars(namespace, dataTypesFolder);
  buildArrays(namespace, dataTypesFolder);
  buildMultiDimensionalArrays(namespace, dataTypesFolder);
  buildRangeVariables(namespace, dataTypesFolder);
}

function buildScalars(namespace, parentFolder) {
  const folder = namespace.addFolder(parentFolder, { browseName: "Scalar" });

  const scalars = [
    { browseName: "BooleanValue", dataType: DataType.Boolean, value: true },
    { browseName: "SByteValue", dataType: DataType.SByte, value: -42 },
    { browseName: "ByteValue", dataType: DataType.Byte, value: 42 },
    { browseName: "Int16Value", dataType: DataType.Int16, value: -1000 },
    { browseName: "UInt16Value", dataType: DataType.UInt16, value: 1000 },
    { browseName: "Int32Value", dataType: DataType.Int32, value: -100000 },
    { browseName: "UInt32Value", dataType: DataType.UInt32, value: 100000 },
    { browseName: "Int64Value", dataType: DataType.Int64, value: [0, 1000000], is64: true },
    { browseName: "UInt64Value", dataType: DataType.UInt64, value: [0, 1000000], is64: true },
    { browseName: "FloatValue", dataType: DataType.Float, value: 3.14 },
    { browseName: "DoubleValue", dataType: DataType.Double, value: 3.141592653589793 },
    { browseName: "StringValue", dataType: DataType.String, value: "Hello OPC UA" },
    { browseName: "DateTimeValue", dataType: DataType.DateTime, value: new Date() },
    { browseName: "GuidValue", dataType: DataType.Guid, value: "72962B91-FA75-4AE6-8D28-B404DC7DAF63" },
    { browseName: "ByteStringValue", dataType: DataType.ByteString, value: Buffer.from("OPC UA Test Data") },
    { browseName: "XmlElementValue", dataType: DataType.XmlElement, value: "<test><value>42</value></test>" },
    {
      browseName: "NodeIdValue",
      dataType: DataType.NodeId,
      value: coerceNodeId("ns=1;s=test-nodeid"),
    },
    {
      browseName: "ExpandedNodeIdValue",
      dataType: DataType.ExpandedNodeId,
      value: makeExpandedNodeId(1234, 1),
    },
    { browseName: "StatusCodeValue", dataType: DataType.StatusCode, value: StatusCodes.Good },
    {
      browseName: "QualifiedNameValue",
      dataType: DataType.QualifiedName,
      value: new QualifiedName({ namespaceIndex: 1, name: "TestQualifiedName" }),
    },
    {
      browseName: "LocalizedTextValue",
      dataType: DataType.LocalizedText,
      value: new LocalizedText({ locale: "en", text: "Test Localized Text" }),
    },
  ];

  for (const s of scalars) {
    let currentValue = s.value;
    namespace.addVariable({
      componentOf: folder,
      browseName: s.browseName,
      dataType: s.dataType,
      accessLevel: "CurrentRead | CurrentWrite",
      userAccessLevel: "CurrentRead | CurrentWrite",
      value: {
        get() {
          const opts = { dataType: s.dataType, value: currentValue };
          if (s.is64) opts.arrayType = VariantArrayType.Scalar;
          return new Variant(opts);
        },
        set(variant) {
          currentValue = variant.value;
          return StatusCodes.Good;
        },
      },
    });
  }
}

function buildArrays(namespace, parentFolder) {
  const folder = namespace.addFolder(parentFolder, { browseName: "Array" });

  const arrays = [
    { browseName: "BooleanArray", dataType: DataType.Boolean, value: [true, false, true, false] },
    { browseName: "SByteArray", dataType: DataType.SByte, value: [-128, -1, 0, 1, 127] },
    { browseName: "ByteArray", dataType: DataType.Byte, value: [0, 42, 128, 255] },
    { browseName: "Int16Array", dataType: DataType.Int16, value: [-32768, -1, 0, 1, 32767] },
    { browseName: "UInt16Array", dataType: DataType.UInt16, value: [0, 1000, 50000, 65535] },
    { browseName: "Int32Array", dataType: DataType.Int32, value: [-100000, -1, 0, 1, 100000] },
    { browseName: "UInt32Array", dataType: DataType.UInt32, value: [0, 100000, 1000000, 4294967295] },
    { browseName: "Int64Array", dataType: DataType.Int64, value: [0, -1000000, 1000000] },
    { browseName: "UInt64Array", dataType: DataType.UInt64, value: [0, 1000000, 999999999] },
    { browseName: "FloatArray", dataType: DataType.Float, value: [1.1, 2.2, 3.3, 4.4] },
    { browseName: "DoubleArray", dataType: DataType.Double, value: [1.11, 2.22, 3.33, 4.44, 5.55] },
    { browseName: "StringArray", dataType: DataType.String, value: ["Hello", "OPC", "UA", "World"] },
    {
      browseName: "DateTimeArray",
      dataType: DataType.DateTime,
      value: [new Date("2024-01-01"), new Date("2024-06-15"), new Date()],
    },
    {
      browseName: "GuidArray",
      dataType: DataType.Guid,
      value: [
        "72962B91-FA75-4AE6-8D28-B404DC7DAF63",
        "A1B2C3D4-E5F6-7890-ABCD-EF1234567890",
      ],
    },
    {
      browseName: "ByteStringArray",
      dataType: DataType.ByteString,
      value: [Buffer.from("First"), Buffer.from("Second"), Buffer.from("Third")],
    },
  ];

  for (const a of arrays) {
    let currentValue = a.value;
    namespace.addVariable({
      componentOf: folder,
      browseName: a.browseName,
      dataType: a.dataType,
      valueRank: 1,
      accessLevel: "CurrentRead | CurrentWrite",
      userAccessLevel: "CurrentRead | CurrentWrite",
      value: {
        get() {
          return new Variant({
            dataType: a.dataType,
            arrayType: VariantArrayType.Array,
            value: currentValue,
          });
        },
        set(variant) {
          currentValue = variant.value;
          return StatusCodes.Good;
        },
      },
    });
  }

  const additionalArrays = [
    { browseName: "XmlElementArray", dataType: DataType.XmlElement, value: ["<a/>", "<b/>", "<c/>"] },
    {
      browseName: "NodeIdArray",
      dataType: DataType.NodeId,
      value: [coerceNodeId("ns=1;s=arr-0"), coerceNodeId("ns=1;s=arr-1")],
    },
    {
      browseName: "StatusCodeArray",
      dataType: DataType.StatusCode,
      value: [StatusCodes.Good, StatusCodes.BadInternalError, StatusCodes.UncertainLastUsableValue],
    },
    {
      browseName: "QualifiedNameArray",
      dataType: DataType.QualifiedName,
      value: [
        new QualifiedName({ namespaceIndex: 1, name: "QN_A" }),
        new QualifiedName({ namespaceIndex: 1, name: "QN_B" }),
      ],
    },
    {
      browseName: "LocalizedTextArray",
      dataType: DataType.LocalizedText,
      value: [
        new LocalizedText({ locale: "en", text: "Hello" }),
        new LocalizedText({ locale: "it", text: "Ciao" }),
        new LocalizedText({ locale: "de", text: "Hallo" }),
      ],
    },
  ];

  for (const a of additionalArrays) {
    let currentValue = a.value;
    namespace.addVariable({
      componentOf: folder,
      browseName: a.browseName,
      dataType: a.dataType,
      valueRank: 1,
      accessLevel: "CurrentRead | CurrentWrite",
      userAccessLevel: "CurrentRead | CurrentWrite",
      value: {
        get() {
          return new Variant({
            dataType: a.dataType,
            arrayType: VariantArrayType.Array,
            value: currentValue,
          });
        },
        set(variant) {
          currentValue = variant.value;
          return StatusCodes.Good;
        },
      },
    });
  }

  const roFolder = namespace.addFolder(folder, { browseName: "ReadOnly" });
  const roArrays = [
    { browseName: "BooleanArray_RO", dataType: DataType.Boolean, value: [true, false] },
    { browseName: "Int32Array_RO", dataType: DataType.Int32, value: [1, 2, 3] },
    { browseName: "DoubleArray_RO", dataType: DataType.Double, value: [1.1, 2.2, 3.3] },
    { browseName: "StringArray_RO", dataType: DataType.String, value: ["A", "B", "C"] },
    { browseName: "ByteArray_RO", dataType: DataType.Byte, value: [0, 127, 255] },
    { browseName: "DateTimeArray_RO", dataType: DataType.DateTime, value: [new Date("2024-01-01"), new Date("2024-06-15")] },
  ];
  for (const a of roArrays) {
    namespace.addVariable({
      componentOf: roFolder,
      browseName: a.browseName,
      dataType: a.dataType,
      valueRank: 1,
      accessLevel: "CurrentRead",
      userAccessLevel: "CurrentRead",
      value: {
        get() {
          return new Variant({
            dataType: a.dataType,
            arrayType: VariantArrayType.Array,
            value: a.value,
          });
        },
      },
    });
  }

  const emptyFolder = namespace.addFolder(folder, { browseName: "Empty" });
  const emptyTypes = [
    { browseName: "EmptyBooleanArray", dataType: DataType.Boolean },
    { browseName: "EmptySByteArray", dataType: DataType.SByte },
    { browseName: "EmptyByteArray", dataType: DataType.Byte },
    { browseName: "EmptyInt16Array", dataType: DataType.Int16 },
    { browseName: "EmptyUInt16Array", dataType: DataType.UInt16 },
    { browseName: "EmptyInt32Array", dataType: DataType.Int32 },
    { browseName: "EmptyUInt32Array", dataType: DataType.UInt32 },
    { browseName: "EmptyInt64Array", dataType: DataType.Int64 },
    { browseName: "EmptyUInt64Array", dataType: DataType.UInt64 },
    { browseName: "EmptyFloatArray", dataType: DataType.Float },
    { browseName: "EmptyDoubleArray", dataType: DataType.Double },
    { browseName: "EmptyStringArray", dataType: DataType.String },
    { browseName: "EmptyDateTimeArray", dataType: DataType.DateTime },
    { browseName: "EmptyByteStringArray", dataType: DataType.ByteString },
  ];
  for (const e of emptyTypes) {
    let currentValue = [];
    namespace.addVariable({
      componentOf: emptyFolder,
      browseName: e.browseName,
      dataType: e.dataType,
      valueRank: 1,
      accessLevel: "CurrentRead | CurrentWrite",
      userAccessLevel: "CurrentRead | CurrentWrite",
      value: {
        get() {
          return new Variant({
            dataType: e.dataType,
            arrayType: VariantArrayType.Array,
            value: currentValue,
          });
        },
        set(variant) {
          currentValue = variant.value;
          return StatusCodes.Good;
        },
      },
    });
  }
}

function buildMultiDimensionalArrays(namespace, parentFolder) {
  const folder = namespace.addFolder(parentFolder, { browseName: "MultiDimensional" });

  let matrix2dDouble = new Float64Array([
    1.0, 2.0, 3.0,
    4.0, 5.0, 6.0,
    7.0, 8.0, 9.0,
  ]);
  namespace.addVariable({
    componentOf: folder,
    browseName: "Matrix2D_Double",
    dataType: DataType.Double,
    valueRank: 2,
    arrayDimensions: [3, 3],
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    value: {
      get() {
        return new Variant({
          dataType: DataType.Double,
          arrayType: VariantArrayType.Matrix,
          dimensions: [3, 3],
          value: matrix2dDouble,
        });
      },
      set(variant) {
        matrix2dDouble = variant.value;
        return StatusCodes.Good;
      },
    },
  });

  let matrix2dInt = new Int32Array([
    1, 2, 3, 4,
    5, 6, 7, 8,
  ]);
  namespace.addVariable({
    componentOf: folder,
    browseName: "Matrix2D_Int32",
    dataType: DataType.Int32,
    valueRank: 2,
    arrayDimensions: [2, 4],
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    value: {
      get() {
        return new Variant({
          dataType: DataType.Int32,
          arrayType: VariantArrayType.Matrix,
          dimensions: [2, 4],
          value: matrix2dInt,
        });
      },
      set(variant) {
        matrix2dInt = variant.value;
        return StatusCodes.Good;
      },
    },
  });

  let cube3dByte = new Uint8Array(24);
  for (let i = 0; i < 24; i++) cube3dByte[i] = i;
  namespace.addVariable({
    componentOf: folder,
    browseName: "Cube3D_Byte",
    dataType: DataType.Byte,
    valueRank: 3,
    arrayDimensions: [2, 3, 4],
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    value: {
      get() {
        return new Variant({
          dataType: DataType.Byte,
          arrayType: VariantArrayType.Matrix,
          dimensions: [2, 3, 4],
          value: cube3dByte,
        });
      },
      set(variant) {
        cube3dByte = variant.value;
        return StatusCodes.Good;
      },
    },
  });
}

function buildReadOnlyScalars(namespace, parentFolder) {
  const folder = namespace.addFolder(parentFolder, { browseName: "ReadOnly" });

  const readOnlyScalars = [
    { browseName: "Boolean_RO", dataType: DataType.Boolean, value: true },
    { browseName: "SByte_RO", dataType: DataType.SByte, value: -42 },
    { browseName: "Byte_RO", dataType: DataType.Byte, value: 42 },
    { browseName: "Int16_RO", dataType: DataType.Int16, value: -1000 },
    { browseName: "UInt16_RO", dataType: DataType.UInt16, value: 1000 },
    { browseName: "Int32_RO", dataType: DataType.Int32, value: -100000 },
    { browseName: "UInt32_RO", dataType: DataType.UInt32, value: 100000 },
    { browseName: "Int64_RO", dataType: DataType.Int64, value: [0, -1000000], is64: true },
    { browseName: "UInt64_RO", dataType: DataType.UInt64, value: [0, 1000000], is64: true },
    { browseName: "Float_RO", dataType: DataType.Float, value: 3.14 },
    { browseName: "Double_RO", dataType: DataType.Double, value: 3.141592653589793 },
    { browseName: "String_RO", dataType: DataType.String, value: "Read Only String" },
    { browseName: "DateTime_RO", dataType: DataType.DateTime, value: new Date("2024-01-01T00:00:00Z") },
    { browseName: "Guid_RO", dataType: DataType.Guid, value: "72962B91-FA75-4AE6-8D28-B404DC7DAF63" },
    { browseName: "ByteString_RO", dataType: DataType.ByteString, value: Buffer.from("ReadOnly") },
    { browseName: "XmlElement_RO", dataType: DataType.XmlElement, value: "<readonly/>" },
    { browseName: "NodeId_RO", dataType: DataType.NodeId, value: coerceNodeId("ns=1;s=readonly-nodeid") },
    { browseName: "ExpandedNodeId_RO", dataType: DataType.ExpandedNodeId, value: makeExpandedNodeId(9999, 1) },
    { browseName: "StatusCode_RO", dataType: DataType.StatusCode, value: StatusCodes.Good },
    { browseName: "QualifiedName_RO", dataType: DataType.QualifiedName, value: new QualifiedName({ namespaceIndex: 1, name: "ReadOnly" }) },
    { browseName: "LocalizedText_RO", dataType: DataType.LocalizedText, value: new LocalizedText({ locale: "en", text: "Read Only" }) },
  ];

  for (const s of readOnlyScalars) {
    namespace.addVariable({
      componentOf: folder,
      browseName: s.browseName,
      dataType: s.dataType,
      accessLevel: "CurrentRead",
      userAccessLevel: "CurrentRead",
      value: {
        get() {
          const opts = { dataType: s.dataType, value: s.value };
          if (s.is64) opts.arrayType = VariantArrayType.Scalar;
          return new Variant(opts);
        },
      },
    });
  }
}

function buildRangeVariables(namespace, parentFolder) {
  const folder = namespace.addFolder(parentFolder, { browseName: "WithRange" });

  const addressSpace = namespace.addressSpace;

  namespace.addAnalogDataItem({
    componentOf: folder,
    browseName: "Temperature",
    dataType: DataType.Double,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    engineeringUnitsRange: { low: -40.0, high: 120.0 },
    instrumentRange: { low: -50.0, high: 150.0 },
    value: {
      get() {
        return new Variant({ dataType: DataType.Double, value: 22.5 });
      },
    },
  });

  namespace.addAnalogDataItem({
    componentOf: folder,
    browseName: "Pressure",
    dataType: DataType.Double,
    accessLevel: "CurrentRead | CurrentWrite",
    userAccessLevel: "CurrentRead | CurrentWrite",
    engineeringUnitsRange: { low: 0.0, high: 500.0 },
    instrumentRange: { low: 0.0, high: 600.0 },
    value: {
      get() {
        return new Variant({ dataType: DataType.Double, value: 101.325 });
      },
    },
  });

  namespace.addVariable({
    componentOf: folder,
    browseName: "ReadOnlyValue",
    dataType: DataType.Double,
    accessLevel: "CurrentRead",
    userAccessLevel: "CurrentRead",
    value: {
      get() {
        return new Variant({ dataType: DataType.Double, value: 42.0 });
      },
    },
  });
}

module.exports = { buildDataTypes };
