const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const mock = require('mock-require');
const log = require('npmlog');
const path = require('path');

const link = require('../src/link');

log.level = 'silent';

describe('link', () => {

  beforeEach(() => {
    delete require.cache[require.resolve('../src/link')];
  });

  it('should reject when run in a folder without package.json', (done) => {
    const config = {
      getProjectConfig: () => {
        throw new Error('No package.json found');
      },
    };

    link(config).catch(() => done());
  });

  it('should accept a name of a dependency to link', (done) => {
    const config = {
      getProjectConfig: () => ({ assets: [] }),
      getDependencyConfig: sinon.stub().returns({ assets: [], commands: {} }),
    };

    link(config, ['react-native-gradient']).then(() => {
      expect(
        config.getDependencyConfig.calledWith('react-native-gradient')
      ).to.be.true;
      done();
    });
  });

  it('should read dependencies from package.json when name not provided', (done) => {
    const config = {
      getProjectConfig: () => ({ assets: [] }),
      getDependencyConfig: sinon.stub().returns({ assets: [], commands: {} }),
    };

    mock(
      path.join(process.cwd(), 'package.json'),
      {
        dependencies: {
          'react-native-test': '*',
        },
      }
    );

    link(config, []).then(() => {
      expect(
        config.getDependencyConfig.calledWith('react-native-test')
      ).to.be.true;
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

    mock(
      '../src/android/isInstalled.js',
      sinon.stub().returns(false)
    );

    mock(
      '../src/android/registerNativeModule.js',
      registerNativeModule
    );

    mock(
      '../src/ios/isInstalled.js',
      sinon.stub().returns(false)
    );

    mock(
      '../src/ios/registerNativeModule.js',
      registerNativeModule
    );

    const link = require('../src/link');

    link(config, ['react-native-blur']).then(() => {
      expect(registerNativeModule.calledTwice).to.be.true;
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

    mock(
      '../src/ios/isInstalled.js',
      sinon.stub().returns(true)
    );

    mock(
      '../src/android/isInstalled.js',
      sinon.stub().returns(true)
    );

    mock(
      '../src/ios/registerNativeModule.js',
      registerNativeModule
    );

    mock(
      '../src/android/registerNativeModule.js',
      registerNativeModule
    );

    const link = require('../src/link');

    link(config, ['react-native-blur']).then(() => {
      expect(registerNativeModule.callCount).to.equal(0);
      done();
    });
  });

  it('should run prelink and postlink commands at the appropriate times', (done) => {
    const registerNativeModule = sinon.stub();
    const prelink = sinon.stub().yieldsAsync();
    const postlink = sinon.stub().yieldsAsync();

    mock(
      '../src/ios/registerNativeModule.js',
      registerNativeModule
    );

    mock(
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

    link(config, ['react-native-blur']).then(() => {
      expect(prelink.calledBefore(registerNativeModule)).to.be.true;
      expect(postlink.calledAfter(registerNativeModule)).to.be.true;
      done();
    });
  });

  it('should copy assets from both project and dependencies projects', (done) => {
    const dependencyAssets = ['Fonts/Font.ttf'];
    const dependencyConfig = {assets: dependencyAssets, commands: {}};
    const projectAssets = ['Fonts/FontC.ttf'];
    const copyAssets = sinon.stub();

    mock(
      '../src/ios/copyAssets.js',
      copyAssets
    );

    const config = {
      getProjectConfig: () => ({ ios: {}, assets: projectAssets }),
      getDependencyConfig: sinon.stub().returns(dependencyConfig),
    };

    const link = require('../src/link');

    link(config, ['react-native-blur']).then(() => {
      expect(copyAssets.calledOnce).to.be.true;
      expect(copyAssets.getCall(0).args[0]).to.deep.equals(
        projectAssets.concat(dependencyAssets)
      );
      done();
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

});
