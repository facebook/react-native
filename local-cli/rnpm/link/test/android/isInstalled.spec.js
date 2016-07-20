const chai = require('chai');
const expect = chai.expect;
const mock = require('mock-fs');
const fs = require('fs');
const path = require('path');
const isInstalled = require('../../src/android/isInstalled');

const projectConfig = {
  buildGradlePath: 'build.gradle',
};

describe('android::isInstalled', () => {
  before(() => mock({
    'build.gradle': fs.readFileSync(
      path.join(__dirname, '../fixtures/android/patchedBuild.gradle')
    ),
  }));

  it('should return true when project is already in build.gradle', () =>
    expect(isInstalled(projectConfig, 'test')).to.be.true
  );

  it('should return false when project is not in build.gradle', () =>
    expect(isInstalled(projectConfig, 'test2')).to.be.false
  );

  after(mock.restore);
});
