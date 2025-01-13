# RCASM - Relay Computer Assembler

Typescript based assembler for the Relay Computer specific assembly language

Heavily inspired by https://github.com/nurpax/c64jasm

## Developing rcasm

- Restore packages with `npm install`
- Perform full build with `npm run prepublishOnly`
- Whenever you edit the `parser.pegjs` file: `npm run gen`
- During development, start TypeScript watch compiler to trigger rebuilds on changes: `npm run watch`

## Building an installable npm package

- Perform full build with `npm run prepublishOnly` (`npm publish` runs this automatically)
