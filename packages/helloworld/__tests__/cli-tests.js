/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import {execSync} from 'child_process';

describe('helloworld/cli', () => {
  it('handles arguments piped as string', () => {
    expect(
      execSync('echo "pong=hello" | node ./cli.js ping', {
        cwd: '../',
        encoding: 'utf8',
      }),
    ).toEqual('Donkey Kong!');
  });
});
