/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+javascript_foundation
 * @flow
 * @format
 */

'use strict';

/* eslint-disable no-unclear-flowtypes */

declare var jest: any;
declare var describe: any;
declare var beforeEach: any;
declare var expect: any;
declare var it: any;

jest.mock('fs');

const fs = require('fs');

describe('fs mock', () => {
  beforeEach(() => {
    (fs: $FlowFixMe).mock.clear();
  });

  describe('writeFileSync()', () => {
    it('stores content correctly', () => {
      fs.writeFileSync('/test', 'foobar', 'utf8');
      const content = fs.readFileSync('/test', 'utf8');
      /* $FlowFixMe(>=0.56.0 site=react_native_oss) This comment suppresses an
       * error found when Flow v0.56 was deployed. To see the error delete this
       * comment and run Flow. */
      expect(content).toEqual('foobar');
    });

    it('fails on missing path', () => {
      /* $FlowFixMe(>=0.56.0 site=react_native_oss) This comment suppresses an
       * error found when Flow v0.56 was deployed. To see the error delete this
       * comment and run Flow. */
      expect(() =>
        fs.writeFileSync('/dir/test', 'foobar', 'utf8'),
      ).toThrowError('ENOENT: no such file or directory');
    });

    it('properly normalizes paths', () => {
      fs.writeFileSync('/test/foo/../bar/../../tadam', 'beep', 'utf8');
      const content = fs.readFileSync('/glo/../tadam', 'utf8');
      expect(content).toEqual('beep');
    });
  });

  describe('mkdirSync()', () => {
    it('creates folders that we can write files in', () => {
      fs.mkdirSync('/dir', 0o777);
      fs.writeFileSync('/dir/test', 'foobar', 'utf8');
      const content = fs.readFileSync('/dir/test', 'utf8');
      /* $FlowFixMe(>=0.56.0 site=react_native_oss) This comment suppresses an
       * error found when Flow v0.56 was deployed. To see the error delete this
       * comment and run Flow. */
      expect(content).toEqual('foobar');
    });

    it('does not erase directories', () => {
      fs.mkdirSync('/dir', 0o777);
      fs.writeFileSync('/dir/test', 'foobar', 'utf8');
      fs.mkdirSync('/dir', 0o777);
      const content = fs.readFileSync('/dir/test', 'utf8');
      /* $FlowFixMe(>=0.56.0 site=react_native_oss) This comment suppresses an
       * error found when Flow v0.56 was deployed. To see the error delete this
       * comment and run Flow. */
      expect(content).toEqual('foobar');
    });
  });

  describe('createWriteStream()', () => {
    it('writes content', done => {
      const stream = fs.createWriteStream('/test');
      stream.write('hello, ');
      stream.write('world');
      stream.end('!');
      process.nextTick(() => {
        const content = fs.readFileSync('/test', 'utf8');
        expect(content).toEqual('hello, world!');
        done();
      });
    });
  });

  describe('writeSync()', () => {
    it('writes content', () => {
      const fd = fs.openSync('/test', 'w');
      fs.writeSync(fd, 'hello, world!');
      fs.closeSync(fd);
      const content = fs.readFileSync('/test', 'utf8');
      expect(content).toEqual('hello, world!');
    });
  });
});
