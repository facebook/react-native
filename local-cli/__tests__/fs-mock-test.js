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
declare var it: any;

jest.mock('fs');

const fs = require('fs');

describe('fs mock', () => {
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
  });
});
