
var glob = require('glob').glob;


import * as assert from 'assert';
// import { stdout } from 'process'
import * as path from 'path';
import * as fs from 'fs';
// import * as colors from 'colors'
// import { ArgumentParser } from 'argparse'

import { assemble /*, Diagnostic */ } from '../src/asm'
import { /*DisasmOptions,*/ disassemble } from '../src/disasm'

// import * as functional from './functional';
// let verbose = false;

// type Test = string;

// const blacklist: Test[] = [
// ];

// type TestStats = { numTests: number, failedTests: number };

// class TestReporter {
//     tests: string[];

//     constructor (tests: Test[], description: string) {
//         this.tests = tests;
//         stdout.write(`Running ${description} tests (# of tests: ${tests.length})\n`);
//     }

//     runTests(run: (t: Test) => 'pass' | 'fail'): TestStats {
//         const numTests = this.tests.length;
//         let failedTests = 0;
//         let skippedTests = 0;

//         for (let i = 0; i < numTests; i++) {
//             const test = this.tests[i];

//             const skipTest = blacklist.indexOf(test) >= 0;
//             if (verbose) {
//                 stdout.write(`Test ${i+1}/${numTests}: ${test}\n`);
//                 if (skipTest) {
//                     stdout.write(' [test skipped]\n');
//                 }
//             } else {
//                 stdout.write(`\rTest ${i+1}/${numTests}`);
//             }

//             if (skipTest) {
//                 skippedTests++;
//                 continue;
//             }

//             switch (run(test)) {
//                 case 'pass': {
//                     // nada
//                     break;
//                 }
//                 case 'fail': {
//                     failedTests++;
//                 }
//             }
//         }

//         if (skippedTests !== 0) {
//             stdout.write(colors.yellow(`\nSkipped tests: ${skippedTests} (out of ${numTests})\n`))
//         }
//         if (failedTests !== 0) {
//             stdout.write(colors.red(`\nFailing tests: ${failedTests} (out of ${numTests})\n`))
//         } else {
//             stdout.write(colors.green(`\nAll passed.\n`))
//         }
//         stdout.write(`\n`)
//         return { numTests, failedTests };
//     }
// }

function readLines(fname: string) {
  const lines = fs.readFileSync(fname).toString().split('\n');
  return lines.map(line => line.trimEnd());
}

suite('rcasm - Snapshots', () => {

  test('Output', function () {

    // const g = glob();
    //     let inputs = g.readdirSync('test/cases/*.input.asm').filter((t: string) => testcase ? t == testcase : true);
    glob("test/cases/*.input.asm", {}, (err: Error, files: string[]) => {

      //     const runTest = (fname: string) => {
      files.forEach(fname => {
        const src = fs.readFileSync(fname).toString();
        const lines = src.split('\n');
        //         const disasmOptions: DisasmOptions = {
        //             showLabels: false,
        //             showCycles: false,
        //         };
        const { prg, errors /*, debugInfo*/ } = assemble(src)!;

        // if (lines.length > 0) {
        //             const match = /;\s+disasm:\s+(.*)/.exec(lines[0]);
        //             if (match !== null) {
        //                 const opts = match[1].split(' ');
        //                 disasmOptions.showCycles = opts.includes('cycles');
        //                 if (opts.includes('debuginfo')) {
        //                     disasmOptions.isInstruction = debugInfo!.info().isInstruction;
        //                 }
        //             }
        //         }

        if (errors.length > 0) {
          console.error(errors);
          assert.fail();
        }

        const disasmLines = disassemble(prg/*, undefined, disasmOptions*/).concat('');
        const expectedFname = path.join(path.dirname(fname), path.basename(fname, 'input.asm') + 'expected.asm');
        const actualFname = path.join(path.dirname(fname), path.basename(fname, 'input.asm') + 'actual.asm');

        // If the expected file doesn't exist, create it.  This is for new test authoring.
        if (!fs.existsSync(expectedFname)) {
          fs.writeFileSync(expectedFname, disasmLines.join('\n'))
        }

        const expectedLines = readLines(expectedFname);
        for (let lineIdx = 0; lineIdx < expectedLines.length; lineIdx++) {
          if (expectedLines[lineIdx].trim() != disasmLines[lineIdx].trim()) {
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




    // function cleanSyntaxError(msg: string) {
    //     const fwdSlashesMsg = msg.replace(/\\/g, '/');
    //     const m = /(((.*): error:) (Syntax error: )).*$/.exec(fwdSlashesMsg);
    //     if (m) {
    //         return m[1];
    //     }
    //     return fwdSlashesMsg;
    // }

    // function validateErrors(errors: Diagnostic[], fname: string, errType: 'error' | 'warning')  {
    //     const errorMessages = errors.map(e => cleanSyntaxError(e.formatted));
    //     const errorsFname = path.join(path.dirname(fname), path.basename(fname, 'input.asm') + `${errType}s.txt`);

    //     // If the expected file doesn't exist, create it.  This is for new test authoring.
    //     if (!fs.existsSync(errorsFname)) {
    //         const errLines = errorMessages.join('\n')
    //         fs.writeFileSync(errorsFname, errLines)
    //         console.log(`  DEBUG: wrote ${errorsFname}`);
    //         console.log(errLines + '\n')
    //         return 'pass';
    //     } else {
    //         const expectedErrors = readLines(errorsFname);
    //         for (let ei in expectedErrors) {
    //             const cleanedExpected = cleanSyntaxError(expectedErrors[ei])
    //             const emsg = /^(.*:.* - |.*: (?:error|warning): )(.*)$/.exec(cleanedExpected);
    //             const msgOnly = emsg![2];

    //             const found = errorMessages.some((msg) => {
    //                 const m = /^(.*:.* - |.*: (?:error|warning): )(.*)$/.exec(msg);
    //                 return m ? m[2] == msgOnly : false;
    //             });
    //             if (!found) {
    //                 const actualFname = path.join(path.dirname(fname), path.basename(fname, 'input.asm') + `actual_${errType}s.txt`);
    //                 fs.writeFileSync(actualFname, errorMessages.join('\n'))
    //                 console.error(`Assembler output does not contain errors listed in

    // ${errorsFname}

    // Actual errors written into

    // ${actualFname}

    // To gild actual:

    // cp ${actualFname} ${errorsFname}
    // `);
    //                 return 'fail';
    //             }
    //         }
    //         if (expectedErrors.length !== errors.length) {
    //             const actualFname = path.join(path.dirname(fname), path.basename(fname, 'input.asm') + `actual_${errType}s.txt`);
    //             fs.writeFileSync(actualFname, errorMessages.join('\n'))
    //             console.log(`Expected to see ${expectedErrors.length}, but compiler produced ${errors.length} errors.

    // Actual errors written to ${actualFname}

    // To gild actual:

    // cp ${actualFname} ${errorsFname}
    // `);
    //             return 'fail';
    //         }
    //         return 'pass';
    //     }
    // }


    // function testErrors(testcase: string): TestStats {
    //     const g = glob();
    //     let inputs = g.readdirSync('test/errors/*.input.asm').filter((t: string) => testcase ? t == testcase : true);

    //     const reporter = new TestReporter(inputs, 'error');
    //     return reporter.runTests((fname: string) => {
    //         const { errors } = assemble(fname)!;
    //         return validateErrors(errors, fname, 'error');
    //     });
    // }

    // function testWarnings(testcase: string): TestStats {
    //     const g = glob();
    //     let inputs: string[] = [];
    //     try {
    //         inputs = g.readdirSync('test/warnings/*.input.asm').filter((t: string) => testcase ? t == testcase : true);
    //     } catch(e) {
    //         // no warnings tests
    //     }

    //     const reporter = new TestReporter(inputs, 'warning');
    //     return reporter.runTests((fname: string) => {
    //         const { warnings } = assemble(fname)!;
    //         return validateErrors(warnings, fname, 'warning');
    //     });
    // }


    // function testFunctional(testcase: string): TestStats {
    //     const testByName: { [index: string] : () => 'pass'|'fail'}  = {};
    //     for (const t of functional.tests) {
    //         testByName[t.name] = t;
    //     }
    //     const tests  = functional.tests.filter(e => testcase ? e.name === testcase : true);
    //     const reporter = new TestReporter(tests.map(f => f.name), 'functional');
    //     return reporter.runTests((testname: string) => {
    //         return testByName[testname]();
    //     });
    // }

    // const parser = new ArgumentParser({
    //     addHelp: true,
    //     description: 'Run c64jasm tests'
    // });

    // parser.addArgument('--verbose', {
    //     action:'storeConst',
    //     constant:true,
    //     help: 'Output extra debug information'
    // });

    // parser.addArgument('--test', {
    //     help: 'Test case to run (default is to run all)'
    // });

    // const args = parser.parseArgs();
    // if (args.verbose) {
    //     verbose = true;
    // }

    // const hrstart = process.hrtime();

    // const testCategories = [outputTest, testErrors, testWarnings, testFunctional];
    // let anyFailures = false;
    // for (const category of testCategories) {
    //     const stats = category(args.test);
    //     if (stats.failedTests !== 0) {
    //         anyFailures = true;
    //     }
    // }

    // if (verbose) {
    //     const NS_PER_SEC = 1e9;
    //     const diff = process.hrtime(hrstart);
    //     const deltaNS = diff[0] * NS_PER_SEC + diff[1];
    //     console.info('Tests completed in %d ms', Math.floor((deltaNS/1000000.0)*100)/100);
    // }

    // if (anyFailures) {
    //     console.log('Tests failed.');
    //     process.exit(1);
    // }
  });
});
