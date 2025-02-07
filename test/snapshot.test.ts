// Closely inspired by https://github.com/nurpax/c64jasm/blob/master/test/test.ts

import { glob } from 'glob'
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

import { assemble } from '../src/asm';
import { DisasmOptions, disassemble } from '../src/disasm';

suite('rcasm - Snapshots', () => {

  glob.sync("test/cases/*.rcasm").forEach(fname => {
    test(fname, function () {
      const src = fs.readFileSync(fname).toString();
      const lines = src.split('\n');
      const disasmOptions: DisasmOptions = {};

      const { prg, errors, debugInfo } = assemble(src);

      if (lines.length > 0) {
        const match = /;\s+disasm:\s+(.*)/.exec(lines[0]);
        if (match !== null) {
          const opts = match[1].split(' ');
          if (opts.includes('debuginfo')) {
            disasmOptions.isInstruction = debugInfo?.info().isInstruction;
          }
        }
      }

      if (errors.length > 0) {
        console.error(errors);
        assert.fail();
      }

      const disasmLines = disassemble(prg /*, undefined*/, disasmOptions).concat('');
      const expectedFname = path.join(path.dirname(fname), path.basename(fname, '.rcasm') + '.snap.rcdsm');
      const actualFname = path.join(path.dirname(fname), path.basename(fname, '.rcasm') + '.actual.rcdsm');

      compareFiles(fname, expectedFname, actualFname, disasmLines);
    });
  });
});

suite('rcasm - Error Snapshots', () => {

  glob.sync("test/errors/*.rcasm").forEach(fname => {
    test(fname, function () {
      const src = fs.readFileSync(fname).toString();

      const { errors } = assemble(src);

      const errorMessages = errors.map(e => cleanSyntaxError(e.formatted));
      const errorsFname = path.join(path.dirname(fname), path.basename(fname, '.rcasm') + `.snap.txt`);
      const actualFname = path.join(path.dirname(fname), path.basename(fname, '.rcasm') + '.actual.txt');

      compareFiles(fname, errorsFname, actualFname, errorMessages);
    });
  });

});

function readLines(fname: string) {
  const lines = fs.readFileSync(fname).toString().split('\n');
  return lines.map(line => line.trimEnd());
}

function cleanSyntaxError(msg: string) {
  const fwdSlashesMsg = msg.replace(/\\/g, '/');
  const m = /(((.*): error:) (Syntax error: )).*$/.exec(fwdSlashesMsg);
  if (m) {
    return m[1];
  }
  return fwdSlashesMsg;
}

function compareFiles(fname: string, expectedFname: string, actualFname: string, actual: string[]) {
  // If the expected file doesn't exist, create it.  This is for new test authoring.
  if (!fs.existsSync(expectedFname)) {
    fs.writeFileSync(expectedFname, actual.join('\n'));
  }

  const expectedLines = readLines(expectedFname);
  for (let lineIdx = 0; lineIdx < expectedLines.length; lineIdx++) {
    if (expectedLines[lineIdx].trim() !== actual[lineIdx].trim()) {
      fs.writeFileSync(actualFname, actual.join('\n'));
      console.error(`Test failed.
Input .asm:

cat ${fname}

First delta on line ${lineIdx + 1}.

Expected disassembly (from ${expectedFname}):

${expectedLines.join('\n')}

Actual disassembly (also written into ${actualFname}):

${actual.join('\n')}

To gild to actual output:

cp ${actualFname} ${expectedFname}

`);
      assert.fail(`Test ${fname} failed`);
    }
  }
}
