/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

jest.mock('@electron/packager', () => ({packager: jest.fn()}));

const {platformConfigs} = require('../build-binary');

describe('build-binary', () => {
  test('Linux app directory and executable names contain no whitespace', () => {
    const linuxConfigs = platformConfigs.filter(config =>
      config.platform.includes('linux'),
    );
    expect(linuxConfigs).toHaveLength(1);
    for (const config of linuxConfigs) {
      expect(config.name).toBe('react-native-devtools');
      for (const arch of config.arch) {
        // Matches @electron/packager's `${name}-${platform}-${arch}` output.
        expect(`${config.name ?? ''}-linux-${arch}`).not.toMatch(/\s/);
      }
    }
  });

  test('macOS and Windows keep the default app name', () => {
    for (const config of platformConfigs) {
      if (!config.platform.includes('linux')) {
        expect(config.name).toBeUndefined();
      }
    }
  });
});
