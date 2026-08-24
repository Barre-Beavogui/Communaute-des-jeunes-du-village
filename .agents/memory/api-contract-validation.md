---
name: API contract validation compatibility
description: A compatibility constraint discovered while generating OpenAPI validation schemas.
---

The installed Zod generation path may emit `zod.int()` for OpenAPI integer fields while the resolved Zod runtime only exposes the older number API. Prefer numeric OpenAPI fields with explicit minimum/maximum constraints when this workspace uses that generator/runtime combination.

**Why:** Code generation can succeed while the chained TypeScript build fails, so this mismatch is easy to miss until after the spec is regenerated.

**How to apply:** If a future API field needs integer semantics, verify the generated Zod output first and use numeric bounds unless the runtime version has been upgraded deliberately.