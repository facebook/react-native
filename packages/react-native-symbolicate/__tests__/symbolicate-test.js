/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 */

'use strict';

const fs = require('fs');
const path = require('path');
const {spawn} = require('child_process');

const resolve = fileName => path.resolve(__dirname, '__fixtures__', fileName);
const read = fileName => fs.readFileSync(resolve(fileName), 'utf8');

const execute = (args: Array<string>, stdin: string): Promise<string> =>
  new Promise((resolvePromise, reject) => {
    const stdout = [];
    const output = ['Process failed with the following output:\n======\n'];
    const child = spawn(process.execPath, [
      ...process.execArgv,
      path.join(__dirname, '..', 'symbolicate.js'),
      ...args,
    ]);
    child.stdout.on('data', data => {
      output.push(data);
      stdout.push(data);
    });
    child.stderr.on('data', data => {
      output.push(data);
    });
    child.on('close', (code, signal) => {
      if (code !== 0 || signal != null) {
        output.push('======\n');
        reject(new Error(output.join('')));
        return;
      }
      resolvePromise(stdout.join(''));
    });
    if (stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }
  });

afterAll(() => {
  try {
    fs.unlinkSync(resolve('testfile.temp.cpuprofile'));
  } catch (e) {}
});

const TESTFILE_MAP = resolve('testfile.js.map');

test('symbolicating a stack trace', async () =>
  await expect(
    execute([TESTFILE_MAP], read('testfile.stack')),
  ).resolves.toMatchSnapshot());

test('symbolicating a single entry', async () =>
  await expect(execute([TESTFILE_MAP, '1', '161'])).resolves.toEqual(
    'thrower.js:18:null\n',
  ));

test('symbolicating a sectioned source map', async () =>
  await expect(
    execute([resolve('testfile.sectioned.js.map'), '353.js', '1', '72']),
  ).resolves.toEqual('nested-thrower.js:6:start\n'));

test('symbolicating a profiler map', async () =>
  await expect(
    execute([TESTFILE_MAP, resolve('testfile.profmap')]),
  ).resolves.toMatchSnapshot());

test('symbolicating an attribution file', async () =>
  await expect(
    execute(
      [TESTFILE_MAP, '--attribution'],
      read('testfile.attribution.input'),
    ),
  ).resolves.toMatchSnapshot());

test('symbolicating with a cpuprofile', async () => {
  fs.copyFileSync(
    resolve('testfile.cpuprofile'),
    resolve('testfile.temp.cpuprofile'),
  );

  await execute([
    resolve('testfile.cpuprofile.map'),
    resolve('testfile.temp.cpuprofile'),
  ]);

  expect(read('testfile.temp.cpuprofile')).toMatchSnapshot();
});
