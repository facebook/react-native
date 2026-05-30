/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

describe('Settings', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('lazy Platform initialization', () => {
    it('does not access Platform when the module is first loaded', () => {
      let platformAccessCount = 0;
      jest.doMock('../../Utilities/Platform', () => ({
        __esModule: true,
        get default() {
          platformAccessCount++;
          return {OS: 'android'};
        },
      }));

      require('../Settings.js');

      expect(platformAccessCount).toBe(0);

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const Settings = require('../Settings.js').default;
      Settings.get('any');
      expect(platformAccessCount).toBeGreaterThan(0);
      warnSpy.mockRestore();
    });

    it('can be required when Platform is undefined during module load', () => {
      jest.doMock('../../Utilities/Platform', () => ({
        __esModule: true,
        default: undefined,
      }));

      expect(() => {
        require('../Settings.js');
      }).not.toThrow();
    });
  });

  describe('platform-specific implementation', () => {
    it('uses fallback implementation on Android', () => {
      jest.doMock('../../Utilities/Platform', () => ({
        __esModule: true,
        default: {OS: 'android'},
      }));

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const Settings = require('../Settings.js').default;

      expect(Settings.get('foo')).toBeNull();
      expect(Settings.watchKeys('foo', () => {})).toBe(-1);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('delegates get and set to the iOS implementation', () => {
      const setValues = jest.fn();
      jest.doMock('../../Utilities/Platform', () => ({
        __esModule: true,
        default: {OS: 'ios'},
      }));
      jest.doMock('../NativeSettingsManager', () => ({
        __esModule: true,
        default: {
          getConstants: () => ({settings: {myKey: 'initial'}}),
          setValues,
        },
      }));

      const Settings = require('../Settings.js').default;

      expect(Settings.get('myKey')).toBe('initial');
      Settings.set({myKey: 'updated'});
      expect(Settings.get('myKey')).toBe('updated');
      expect(setValues).toHaveBeenCalledWith({myKey: 'updated'});
    });

    it('caches the platform implementation across calls', () => {
      let platformAccessCount = 0;
      jest.doMock('../../Utilities/Platform', () => ({
        __esModule: true,
        get default() {
          platformAccessCount++;
          return {OS: 'android'};
        },
      }));

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const Settings = require('../Settings.js').default;

      Settings.get('a');
      Settings.get('b');
      expect(platformAccessCount).toBe(1);
      warnSpy.mockRestore();
    });
  });
});
