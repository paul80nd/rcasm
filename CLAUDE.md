# rcasm — notes for Claude

Things that aren't obvious from reading the code. The README covers project layout, build commands, and the parser regeneration workflow — don't duplicate those here.

## Mnemonic synonyms

Some mnemonics in `src/opcodes.ts` are **intentional synonyms** — the language deliberately accepts either spelling and both encode to the same opcode. Do not treat shared opcodes between these pairs as a bug:

- `cmp` and `eor` → both encode to `0x80 | 0x05` (0x85)
- `bmi` and `blt` → both encode to `0xC0 | 0x30` (0xF0)

The disassembler's reverse map (`opcodes_reverse_map`) canonicalises to one spelling per opcode (`eor` at 0x85, `blt` at 0xF0). That asymmetry is by design: assembling `cmp a` then disassembling produces `eor a`, and that's correct behaviour.

When adding new mnemonics, check whether an opcode is already taken before assuming a clash is wrong — ask first.

## Generated parser

`src/g_parser.js` is generated from `src/parser.pegjs` by Peggy (`npm run gen`). It is **checked into the repo** and CI does not regenerate it (see commit `021c454` "no re-gen in ci"). After editing `parser.pegjs` you must run `npm run gen` and commit both files together, or the published package will use a stale parser. Do not hand-edit `g_parser.js`.
