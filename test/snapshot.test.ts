// Closely inspired by https://github.com/nurpax/c64jasm/blob/master/test/test.ts

var glob = require('glob').glob;

import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

import { assemble } from '../src/asm';
import { DisasmOptions, disassemble } from '../src/disasm';

function readLines(fname: string) {
  const lines = fs.readFileSync(fname).toString().split('\n');
  return lines.map(line => line.trimEnd());
}

suite('rcasm - Snapshots', () => {

  test('Output', function () {

    glob("test/cases/*.input.asm", {}, (err: Error, files: string[]) => {

      files.forEach(fname => {
        const src = fs.readFileSync(fname).toString();
        const lines = src.split('\n');
        const disasmOptions: DisasmOptions = {
        };

        const { prg, errors, debugInfo } = assemble(src)!;

        if (lines.length > 0) {
          const match = /;\s+disasm:\s+(.*)/.exec(lines[0]);
          if (match !== null) {
            const opts = match[1].split(' ');
            if (opts.includes('debuginfo')) {
              disasmOptions.isInstruction = debugInfo!.info().isInstruction;
            }
          }
        }

        if (errors.length > 0) {
          console.error(errors);
          assert.fail();
        }

        const disasmLines = disassemble(prg /*, undefined*/, disasmOptions).concat('');
        const expectedFname = path.join(path.dirname(fname), path.basename(fname, 'input.asm') + 'expected.asm');
        const actualFname = path.join(path.dirname(fname), path.basename(fname, 'input.asm') + 'actual.asm');

        // If the expected file doesn't exist, create it.  This is for new test authoring.
        if (!fs.existsSync(expectedFname)) {
          fs.writeFileSync(expectedFname, disasmLines.join('\n'));
        }

        const expectedLines = readLines(expectedFname);
        for (let lineIdx = 0; lineIdx < expectedLines.length; lineIdx++) {
          if (expectedLines[lineIdx].trim() !== disasmLines[lineIdx].trim()) {
            fs.writeFileSync(actualFname, disasmLines.join('\n'));
            console.error(`Test failed.
Input .asm:

cat ${fname}

First delta on line ${lineIdx + 1}.

Expected disassembly (from ${expectedFname}):

${expectedLines.join('\n')}

Actual disassembly (also written into ${actualFname}):

${disasmLines.join('\n')}

To gild to actual output:

cp ${actualFname} ${expectedFname}

`);
            assert.fail(`Test ${fname} failed`);
          }
        }
      });

    });

  });
});
