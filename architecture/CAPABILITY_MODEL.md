# ESTA Logic Capability Model

## Overview

ESTA Logic uses a capability-based security model where all resource access is controlled by unforgeable tokens.

## Core Concepts

### Capability

A capability is an unforgeable token that grants specific rights to a specific resource:

```
Capability {
  id: CapabilityId,
  resource: ResourceId,
  rights: CapabilityRights,
  owner: ProcessId,
  validity: CapabilityValidity,
  revoked: bool,
}
```

### Rights

Rights define what operations are permitted:

| Right | Description |
|-------|-------------|
| read | Read resource data |
| write | Modify resource data |
| delete | Delete resource |
| execute | Execute resource (for code) |
| create | Create child resources |
| list | List resource contents |
| delegate | Pass capability to others |
| revoke | Revoke delegated capabilities |

### Resources

Resource types in the system:

| Type | Description |
|------|-------------|
| ResourceMemory | Memory region |
| ResourceChannel | Message channel |
| ResourceFile | File or blob storage |
| ResourceDatabase | Database connection |
| ResourceProcess | Process handle |
| ResourceAuditLog | Audit log access |
| ResourceConfig | Configuration |
| ResourceTimer | Timer/clock |
| ResourceNetwork | Network endpoint |

## Security Properties

### Unforgeable

Capabilities cannot be created outside the kernel. They are cryptographically signed and verified on every use.

### Monotonic Attenuation

When a capability is delegated, the recipient can only have equal or fewer rights than the delegator. Rights cannot be added through delegation.

### Revocable

All capabilities can be revoked by their issuer. Revocation cascades to all delegated capabilities.

### Auditable

All capability operations are logged for security audit purposes.

## Lifecycle

1. **Creation**: Kernel creates capability for resource owner
2. **Delegation**: Owner may delegate (attenuated) to others
3. **Validation**: Capability checked on every resource access
4. **Revocation**: Capability marked invalid, cascades to children

## Usage Pattern

```gleam
// Request capability
let cap = kernel.request_capability(ResourceDatabase, [RightRead, RightWrite])

// Use capability
let result = db.query(cap, "SELECT * FROM employees")

// Delegate read-only to another process
let read_cap = kernel.delegate(cap, target_process, [RightRead])

// Revoke when done
kernel.revoke(cap)
```
