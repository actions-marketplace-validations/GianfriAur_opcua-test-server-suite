# Extension Objects

Path: `Objects > TestServer > ExtensionObjects`

Custom structured data types defined via a NodeSet XML file (`config/custom-types.xml`). Unlike the `Structures` module (which uses plain OPC UA Object nodes with child variables), extension objects use proper OPC UA `ExtensionObject` encoding — the structured value is serialized as a single typed blob in the OPC UA binary protocol.

## Custom Types Namespace

- **Namespace URI:** `urn:opcua:test-server:custom-types`
- **Source file:** `config/custom-types.xml`
- **Configurable via:** `OPCUA_CUSTOM_TYPES_FILE` environment variable

## TestPointXYZ

A 3D point with three Double fields.

| Field | DataType | Description |
|---|---|---|
| `X` | Double | X coordinate |
| `Y` | Double | Y coordinate |
| `Z` | Double | Z coordinate |

**NodeSet definition:** `ns=1;i=3000` (DataType), `ns=1;i=3010` (Default Binary Encoding)

## TestRangeStruct

A range with min, max, and current value.

| Field | DataType | Description |
|---|---|---|
| `Min` | Double | Minimum value |
| `Max` | Double | Maximum value |
| `Value` | Double | Current value |

**NodeSet definition:** `ns=1;i=3001` (DataType), `ns=1;i=3011` (Default Binary Encoding)

## Variables

| BrowseName | DataType | Access | Initial Value |
|---|---|---|---|
| `PointValue` | TestPointXYZ | RW | `{X: 1.5, Y: 2.5, Z: 3.5}` |
| `RangeValue` | TestRangeStruct | R | `{Min: 0.0, Max: 100.0, Value: 42.5}` |

## Testing Notes

- **Read `PointValue`:** Returns an `ExtensionObject` with `TypeId` pointing to `TestPointXYZ`. Your client must decode the binary encoding to extract the X, Y, Z fields.
- **Write `PointValue`:** Encode a `TestPointXYZ` as an `ExtensionObject` and write it. Read it back to verify round-trip correctness.
- **Read `RangeValue`:** Returns a read-only `TestRangeStruct`. Writing should return `BadNotWritable`.
- **Type discovery:** Browse the `TestPointXYZ` DataType node (`ns=1;i=3000`) to discover the `Definition` attribute and field structure.
- **Binary encoding:** Both types have `Default Binary` encoding nodes. Clients that support automatic type dictionaries should be able to decode them without manual configuration.

## Difference from Structures Module

| Feature | Structures | Extension Objects |
|---|---|---|
| Encoding | Object + child variables | Single ExtensionObject value |
| Read | One read per field | One read returns all fields |
| Write | One write per field | One write sets all fields |
| Browse | Browse children to find fields | Browse DataType for Definition |
| Use case | Hierarchical browsing tests | Structured type encoding tests |
