/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

const log = require('npmlog');
jest.setMock('chalk', {grey: str => str});

describe('link', () => {
  beforeEach(() => {
    jest.resetModules();
    delete require.cache[require.resolve('../link')];
    log.level = 'silent';
  });

  it('should reject when run in a folder without package.json', done => {
    const config = {
      getProjectConfig: () => {
        throw new Error('No package.json found');
      },
    };

    const link = require('../link').func;
    link([], config).catch(() => done());
  });

  it('should accept a name of a dependency to link', done => {
    const config = {
      getPlatformConfig: () => ({ios: {}, android: {}}),
      getProjectConfig: () => ({assets: []}),
      getDependencyConfig: jest
        .fn()
        .mockReturnValue({assets: [], commands: {}}),
    };

    const link = require('../link').func;
    link(['react-native-gradient'], config).then(() => {
      expect(config.getDependencyConfig.mock.calls[0]).toEqual([
        'react-native-gradient',
      ]);
      done();
    });
  });

  it('should accept the name of a dependency with a scope / tag', async () => {
    const config = {
      getPlatformConfig: () => ({ios: {}, android: {}}),
      getProjectConfig: () => ({assets: []}),
      getDependencyConfig: jest
        .fn()
        .mockReturnValue({assets: [], commands: {}}),
    };

    const link = require('../link').func;
    await link(['@scope/something@latest'], config);
    expect(config.getDependencyConfig.mock.calls[0]).toEqual([
      '@scope/something',
    ]);
  });

  it('should register native module when android/ios projects are present', done => {
    const registerNativeModule = jest.fn();
    const dependencyConfig = {android: {}, ios: {}, assets: [], commands: {}};
    const androidLinkConfig = require('../android');
    const iosLinkConfig = require('../ios');
    const config = {
      getPlatformConfig: () => ({
        ios: {linkConfig: iosLinkConfig},
        android: {linkConfig: androidLinkConfig},
      }),
      getProjectConfig: () => ({android: {}, ios: {}, assets: []}),
      getDependencyConfig: jest.fn().mockReturnValue(dependencyConfig),
    };

    jest.setMock('../android/isInstalled.js', jest.fn().mockReturnValue(false));

    jest.setMock('../android/registerNativeModule.js', registerNativeModule);

    jest.setMock('../ios/isInstalled.js', jest.fn().mockReturnValue(false));

    jest.setMock('../ios/registerNativeModule.js', registerNativeModule);

    const link = require('../link').func;

    link(['react-native-blur'], config).then(() => {
      expect(registerNativeModule.mock.calls.length).toBe(2);
      done();
    });
  });

  it('should not register modules when they are already installed', done => {
    const registerNativeModule = jest.fn();
    const dependencyConfig = {ios: {}, android: {}, assets: [], commands: {}};
    const config = {
      getPlatformConfig: () => ({ios: {}, android: {}}),
      getProjectConfig: () => ({ios: {}, android: {}, assets: []}),
      getDependencyConfig: jest.fn().mockReturnValue(dependencyConfig),
    };

    jest.setMock('../ios/isInstalled.js', jest.fn().mockReturnValue(true));

    jest.setMock('../android/isInstalled.js', jest.fn().mockReturnValue(true));

    jest.setMock('../ios/registerNativeModule.js', registerNativeModule);

    jest.setMock('../android/registerNativeModule.js', registerNativeModule);

    const link = require('../link').func;

    link(['react-native-blur'], config).then(() => {
      expect(registerNativeModule.mock.calls.length).toEqual(0);
      done();
    });
  });

  it('should register native modules for plugins', done => {
    const registerNativeModule = jest.fn();
    const dependencyConfig = {
      ios: {},
      android: {},
      test: {},
      assets: [],
      commands: {},
    };
    const linkPluginConfig = {
      isInstalled: () => false,
      register: registerNativeModule,
    };
    const config = {
      getPlatformConfig: () => ({
        ios: {},
        android: {},
        test: {linkConfig: () => linkPluginConfig},
      }),
      getProjectConfig: () => ({ios: {}, android: {}, test: {}, assets: []}),
      getDependencyConfig: jest.fn().mockReturnValue(dependencyConfig),
    };

    jest.setMock('../ios/isInstalled.js', jest.fn().mockReturnValue(true));

    jest.setMock('../android/isInstalled.js', jest.fn().mockReturnValue(true));

    const link = require('../link').func;

    link(['react-native-blur'], config).then(() => {
      expect(registerNativeModule.mock.calls.length).toBe(1);
      done();
    });
  });

  it('should not register native modules for plugins when already installed', done => {
    const registerNativeModule = jest.fn();
    const dependencyConfig = {
      ios: {},
      android: {},
      test: {},
      assets: [],
      commands: {},
    };
    const linkPluginConfig = {
      isInstalled: () => true,
      register: registerNativeModule,
    };
    const config = {
      getPlatformConfig: () => ({
        ios: {},
        android: {},
        test: {linkConfig: () => linkPluginConfig},
      }),
      getProjectConfig: () => ({ios: {}, android: {}, test: {}, assets: []}),
      getDependencyConfig: jest.fn().mockReturnValue(dependencyConfig),
    };

    jest.setMock('../ios/isInstalled.js', jest.fn().mockReturnValue(true));

    jest.setMock('../android/isInstalled.js', jest.fn().mockReturnValue(true));

    const link = require('../link').func;

    link(['react-native-blur'], config).then(() => {
      expect(registerNativeModule.mock.calls.length).toEqual(0);
      done();
    });
  });

  it('should run prelink and postlink commands at the appropriate times', async () => {
    const registerNativeModule = jest.fn();
    const prelink = jest.fn().mockImplementation(cb => cb());
    const postlink = jest.fn().mockImplementation(cb => cb());

    jest.setMock('../ios/registerNativeModule.js', registerNativeModule);

    jest.setMock('../ios/isInstalled.js', jest.fn().mockReturnValue(false));

    const linkConfig = require('../ios');
    const config = {
      getPlatformConfig: () => ({ios: {linkConfig: linkConfig}}),
      getProjectConfig: () => ({ios: {}, assets: []}),
      getDependencyConfig: jest.fn().mockReturnValue({
        ios: {},
        assets: [],
        commands: {prelink, postlink},
      }),
    };

    const link = require('../link').func;
    await link(['react-native-blur'], config);

    expect(prelink.mock.invocationCallOrder[0]).toBeLessThan(
      registerNativeModule.mock.invocationCallOrder[0],
    );
    expect(postlink.mock.invocationCallOrder[0]).toBeGreaterThan(
      registerNativeModule.mock.invocationCallOrder[0],
    );
  });

  it('should copy assets from both project and dependencies projects', done => {
    const dependencyAssets = ['Fonts/Font.ttf'];
    const dependencyConfig = {assets: dependencyAssets, ios: {}, commands: {}};
    const projectAssets = ['Fonts/FontC.ttf'];
    const copyAssets = jest.fn();

    jest.setMock('../ios/copyAssets.js', copyAssets);

    const linkConfig = require('../ios');
    const config = {
      getPlatformConfig: () => ({ios: {linkConfig: linkConfig}}),
      getProjectConfig: () => ({ios: {}, assets: projectAssets}),
      getDependencyConfig: jest.fn().mockReturnValue(dependencyConfig),
    };

    const link = require('../link').func;

    link(['react-native-blur'], config).then(() => {
      expect(copyAssets.mock.calls.length).toBe(1);
      expect(copyAssets.mock.calls[0][0]).toEqual(
        projectAssets.concat(dependencyAssets),
      );
      done();
    });
  });
});
