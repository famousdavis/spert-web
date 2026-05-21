# SPERT Suite — Import Spec Deviations

This file tracks deliberate deviations from `IMPORT-SPEC-REFERENCE.md` in
SPERT Forecaster. Each entry documents the deviation, why it was made, and
how the deviation is mitigated.

## SD-1: Import copy-suffix changed from `' (2)'` to `' - Copy (N)'` (v0.34.0)

**Spec reference:** `IMPORT-SPEC-REFERENCE.md` line 408 —
`'copy' — new ID, ' (2)' suffix (unconditional)`.

**Change:** The import copy path now uses the same `' - Copy (N)'` naming
convention as the Projects-tab Clone button (which has always used this
convention — see `cloneProject` in `src/shared/state/project-store.ts`). The
old hardcoded `' (2)'` suffix is replaced by the iterating `nextCopyName()`
helper shared between the import copy path and `cloneProject`.

**Consequence:** Users who previously imported duplicate projects saw `"X (2)"`.
After v0.34.0, they see `"X - Copy (1)"`. User-visible on any import where a
copy decision was made.

**Mitigation:** Both import and clone paths now use the same shared
`nextCopyName()` helper, ensuring consistent naming across all duplication
paths. The CHANGELOG discloses the rename, and the helper handles trailing
whitespace and intra-batch collisions automatically.

**Source comment:** See the `nextCopyName` JSDoc in
`src/shared/state/import-utils.ts` for the `SD-1` reference, and the
matching usage in `cloneProject` (`src/shared/state/project-store.ts`).
