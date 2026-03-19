# Address Space Overview

## Namespace

- **Namespace Index:** `ns=1`
- **Namespace URI:** `urn:opcua:test-server:<ServerName>`
- **NodeId format:** Auto-generated numeric (`ns=1;i=XXXX`). Use **BrowsePaths** for stable navigation.

The server also loads the standard OPC UA namespace (`ns=0`) and the DI (Device Integration) namespace.

## Root Structure

All test nodes are organized under a single root folder:

```
Objects (ns=0)
└── TestServer (ns=1)
    ├── DataTypes        → 85 variables: scalars, arrays, matrices, analog items
    ├── Methods          → 12 callable methods
    ├── Dynamic          → 13 time-varying variables
    ├── Events           → Event emitter + custom event types
    ├── Alarms           → 3 alarms + 2 source variables
    ├── Historical       → 4 variables with history
    ├── Structures       → Nested objects, collections, deep nesting
    ├── ExtensionObjects → Custom structured types (TestPointXYZ, TestRangeStruct)
    └── AccessControl    → 50 variables with different access levels
```

Views are under the standard `Views` folder:

```
Views (ns=0)
├── OperatorView     → Dynamic, Methods, Alarms
├── EngineeringView  → Everything (TestServer root)
├── HistoricalView   → Historical
└── DataView         → DataTypes, Structures
```

## Browsing

Start from `Objects` (NodeId `ns=0;i=85`), then browse to `TestServer`. From there, each sub-folder groups related nodes.

**Example browse path from root:**
```
Objects → TestServer → DataTypes → Scalar → BooleanValue
```

## Access Level Legend

Throughout the documentation, these abbreviations are used:

| Abbreviation | Meaning | OPC UA Access Level Flags |
|---|---|---|
| `R` | Read only | CurrentRead |
| `W` | Write only | CurrentWrite |
| `RW` | Read and write | CurrentRead + CurrentWrite |
| `WO` | Write only (user level) | userAccessLevel = CurrentWrite only |
| `HR` | History read | HistoryRead |
| `R+HR` | Read + history | CurrentRead + HistoryRead |
| `RW+HR` | Read, write, history | CurrentRead + CurrentWrite + HistoryRead |

## Feature Toggles

Each address space section can be independently enabled/disabled via environment variables. When disabled, the corresponding folder and its nodes are not created.

| Section | Env Variable | Default |
|---|---|---|
| DataTypes | *(always enabled)* | — |
| Methods | `OPCUA_ENABLE_METHODS` | `true` |
| Dynamic | `OPCUA_ENABLE_DYNAMIC` | `true` |
| Events & Alarms | `OPCUA_ENABLE_EVENTS` | `true` |
| Historical | `OPCUA_ENABLE_HISTORICAL` | `true` |
| Structures | `OPCUA_ENABLE_STRUCTURES` | `true` |
| ExtensionObjects | *(always enabled)* | — |
| Views | `OPCUA_ENABLE_VIEWS` | `true` |
| AccessControl | *(always enabled)* | — |

For detailed node listings, see the individual documentation pages for each section.
