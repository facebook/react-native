/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// TODO(T187224491): js1 jest doesn't install the correct commander, instead
// using the one in xplat/js/node_modules/commander which is much older.
// Either roll back to that version or upgrade.
import cli from '../cli.flow.js';
import fs from 'fs';

describe('cli.js', () => {
  let pkgJson = {
    name: 'helloworld-mock',
    dependencies: {
      'react-native': '0.0.0',
    },
    devDependencies: {
      listr: '^1.2.3',
      'some-dev-dep': '1.0.0',
    },
  };
  beforeEach(() => {
    jest.resetAllMocks();
  });
  describe('set-version', () => {
    it('without arguments this should not modify the package.json', () => {
      const snapshot = JSON.stringify(pkgJson, null, 2);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(snapshot);
      const spy = jest.spyOn(fs, 'writeFileSync');

      cli.parse(['set-version'], {from: 'user'});

      expect(spy.mock.lastCall[1]).toEqual(snapshot);
    });

    it('modified and adds dependencies', () => {
      const snapshot = JSON.stringify(pkgJson, null, 2);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(snapshot);
      const spy = jest.spyOn(fs, 'writeFileSync');

      cli.parse(
        [
          'set-version',
          'react-native@^0.1.1',
          'foobar@file:/woot/berry',
          'some-dev-dep@*',
        ],
        {from: 'user'},
      );
      const updated = JSON.parse(spy.mock.lastCall[1]);
      expect(updated).toMatchObject({
        dependencies: {
          'react-native': '^0.1.1',
          foobar: 'file:/woot/berry',
        },
        devDependencies: {
          'some-dev-dep': '*',
        },
      });
    });
  });
});
