const chai = require('chai');
const expect = chai.expect;
const mock = require('mock-fs');
const fs = require('fs');
const path = require('path');
const isInstalled = require('../../src/ios/isInstalled');

const baseProjectConfig = {
  pbxprojPath: 'project.pbxproj',
  libraryFolder: 'Libraries',
};

describe('ios::isInstalled', () => {

  before(() => {
    mock({
      'project.pbxproj': fs.readFileSync(path.join(__dirname, '../fixtures/project.pbxproj')),
    });
  });

  it('should return true when .xcodeproj in Libraries', () => {
    const dependencyConfig = { projectName: 'React.xcodeproj' };
    expect(isInstalled(baseProjectConfig, dependencyConfig)).to.be.true;
  });

  it('should return false when .xcodeproj not in Libraries', () => {
    const dependencyConfig = { projectName: 'Missing.xcodeproj' };
    expect(isInstalled(baseProjectConfig, dependencyConfig)).to.be.false;
  });

  it('should return false when `LibraryFolder` is missing', () => {
    const dependencyConfig = { projectName: 'React.xcodeproj' };
    const projectConfig = Object.assign({}, baseProjectConfig, { libraryFolder: 'Missing' });
    expect(isInstalled(projectConfig, dependencyConfig)).to.be.false;
  });

  after(mock.restore);

});
