/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+javascript_foundation
 */

'use strict';

const sinon = require('sinon');
const log = require('npmlog');
const path = require('path');
jest.setMock(
  'chalk',
  { grey: (str) => str, }
);

describe('link', () => {
  beforeEach(() => {
    jest.resetModules();
    delete require.cache[require.resolve('../link')];
    log.level = 'silent';
  });

  it('should reject when run in a folder without package.json', (done) => {
    const config = {
      getProjectConfig: () => {
        throw new Error('No package.json found');
      },
    };

    const link = require('../link').func;
    link([], config).catch(() => done());
  });

  it('should accept a name of a dependency to link', (done) => {
    const config = {
      getProjectConfig: () => ({ assets: [] }),
      getDependencyConfig: sinon.stub().returns({ assets: [], commands: {} }),
    };

    const link = require('../link').func;
    link(['react-native-gradient'], config).then(() => {
      expect(
        config.getDependencyConfig.calledWith('react-native-gradient')
      ).toBeTruthy();
      done();
    });
  });

  it('should read dependencies from package.json when name not provided', (done) => {
    const config = {
      getProjectConfig: () => ({ assets: [] }),
      getDependencyConfig: sinon.stub().returns({ assets: [], commands: {} }),
    };

    jest.setMock(
      path.join(process.cwd(), 'package.json'),
      {
        dependencies: {
          'react-native-test': '*',
        },
      }
    );

    const link = require('../link').func;
    link([], config).then(() => {
      expect(
        config.getDependencyConfig.calledWith('react-native-test')
      ).toBeTruthy();
      done();
    });
  });

  it('should register native module when android/ios projects are present', (done) => {
    const registerNativeModule = sinon.stub();
    const dependencyConfig = {android: {}, ios: {}, assets: [], commands: {}};
    const config = {
      getProjectConfig: () => ({android: {}, ios: {}, assets: []}),
      getDependencyConfig: sinon.stub().returns(dependencyConfig),
    };

    jest.setMock(
      '../android/isInstalled.js',
      sinon.stub().returns(false)
    );

    jest.setMock(
      '../android/registerNativeModule.js',
      registerNativeModule
    );

    jest.setMock(
      '../ios/isInstalled.js',
      sinon.stub().returns(false)
    );

    jest.setMock(
      '../ios/registerNativeModule.js',
      registerNativeModule
    );

    const link = require('../link').func;

    link(['react-native-blur'], config).then(() => {
      expect(registerNativeModule.calledTwice).toBeTruthy();
      done();
    });
  });

  it('should not register modules when they are already installed', (done) => {
    const registerNativeModule = sinon.stub();
    const dependencyConfig = {ios: {}, android: {}, assets: [], commands: {}};
    const config = {
      getProjectConfig: () => ({ ios: {}, android: {}, assets: [] }),
      getDependencyConfig: sinon.stub().returns(dependencyConfig),
    };

    jest.setMock(
      '../ios/isInstalled.js',
      sinon.stub().returns(true)
    );

    jest.setMock(
      '../android/isInstalled.js',
      sinon.stub().returns(true)
    );

    jest.setMock(
      '../ios/registerNativeModule.js',
      registerNativeModule
    );

    jest.setMock(
      '../android/registerNativeModule.js',
      registerNativeModule
    );

    const link = require('../link').func;

    link(['react-native-blur'], config).then(() => {
      expect(registerNativeModule.callCount).toEqual(0);
      done();
    });
  });

  it('should run prelink and postlink commands at the appropriate times', (done) => {
    const registerNativeModule = sinon.stub();
    const prelink = sinon.stub().yieldsAsync();
    const postlink = sinon.stub().yieldsAsync();

    jest.setMock(
      '../ios/registerNativeModule.js',
      registerNativeModule
    );

    jest.setMock(
      '../ios/isInstalled.js',
      sinon.stub().returns(false)
    );

    const config = {
      getProjectConfig: () => ({ ios: {}, assets: [] }),
      getDependencyConfig: sinon.stub().returns({
        ios: {}, assets: [], commands: { prelink, postlink },
      }),
    };

    const link = require('../link').func;

    link(['react-native-blur'], config).then(() => {
      expect(prelink.calledBefore(registerNativeModule)).toBeTruthy();
      expect(postlink.calledAfter(registerNativeModule)).toBeTruthy();
      done();
    });
  });

  it('should copy assets from both project and dependencies projects', (done) => {
    const dependencyAssets = ['Fonts/Font.ttf'];
    const dependencyConfig = {assets: dependencyAssets, commands: {}};
    const projectAssets = ['Fonts/FontC.ttf'];
    const copyAssets = sinon.stub();

    jest.setMock(
      '../ios/copyAssets.js',
      copyAssets
    );

    const config = {
      getProjectConfig: () => ({ ios: {}, assets: projectAssets }),
      getDependencyConfig: sinon.stub().returns(dependencyConfig),
    };

    const link = require('../link').func;

    link(['react-native-blur'], config).then(() => {
      expect(copyAssets.calledOnce).toBeTruthy();
      expect(copyAssets.getCall(0).args[0]).toEqual(
        projectAssets.concat(dependencyAssets)
      );
      done();
    });
  });
});
