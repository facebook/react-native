'use strict';

jest.autoMockOff();

const sinon = require('sinon');
const log = require('npmlog');
const path = require('path');

describe('link', () => {
  beforeEach(() => {
    delete require.cache[require.resolve('../src/link')];
    log.level = 'silent';
  });

  it('should reject when run in a folder without package.json', (done) => {
    const config = {
      getProjectConfig: () => {
        throw new Error('No package.json found');
      },
    };

    const link = require('../src/link');
    link([], config).catch(() => done());
  });

  it('should accept a name of a dependency to link', (done) => {
    const config = {
      getProjectConfig: () => ({ assets: [] }),
      getDependencyConfig: sinon.stub().returns({ assets: [], commands: {} }),
    };

    const link = require('../src/link');
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

    const link = require('../src/link');
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
      '../src/android/isInstalled.js',
      sinon.stub().returns(false)
    );

    jest.setMock(
      '../src/android/registerNativeModule.js',
      registerNativeModule
    );

    jest.setMock(
      '../src/ios/isInstalled.js',
      sinon.stub().returns(false)
    );

    jest.setMock(
      '../src/ios/registerNativeModule.js',
      registerNativeModule
    );

    const link = require('../src/link');

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
      '../src/ios/isInstalled.js',
      sinon.stub().returns(true)
    );

    jest.setMock(
      '../src/android/isInstalled.js',
      sinon.stub().returns(true)
    );

    jest.setMock(
      '../src/ios/registerNativeModule.js',
      registerNativeModule
    );

    jest.setMock(
      '../src/android/registerNativeModule.js',
      registerNativeModule
    );

    const link = require('../src/link');

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
      '../src/ios/registerNativeModule.js',
      registerNativeModule
    );

    jest.setMock(
      '../src/ios/isInstalled.js',
      sinon.stub().returns(false)
    );

    const config = {
      getProjectConfig: () => ({ ios: {}, assets: [] }),
      getDependencyConfig: sinon.stub().returns({
        ios: {}, assets: [], commands: { prelink, postlink },
      }),
    };

    const link = require('../src/link');

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
      '../src/ios/copyAssets.js',
      copyAssets
    );

    const config = {
      getProjectConfig: () => ({ ios: {}, assets: projectAssets }),
      getDependencyConfig: sinon.stub().returns(dependencyConfig),
    };

    const link = require('../src/link');

    link(['react-native-blur'], config).then(() => {
      expect(copyAssets.calledOnce).toBeTruthy();
      expect(copyAssets.getCall(0).args[0]).toEqual(
        projectAssets.concat(dependencyAssets)
      );
      done();
    });
  });
});
