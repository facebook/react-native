const chai = require('chai');
const expect = chai.expect;
const xcode = require('xcode');
const hasLibraryImported = require('../../src/ios/hasLibraryImported');

const project = xcode.project('test/fixtures/project.pbxproj');

describe('ios::hasLibraryImported', () => {

  beforeEach(() => {
    project.parseSync();
  });

  it('should return true if project has been already imported', () => {
    const libraries = project.pbxGroupByName('Libraries');
    expect(hasLibraryImported(libraries, 'React.xcodeproj')).to.be.true;
  });

  it('should return false if project is not imported', () => {
    const libraries = project.pbxGroupByName('Libraries');
    expect(hasLibraryImported(libraries, 'ACME.xcodeproj')).to.be.false;
  });

});
