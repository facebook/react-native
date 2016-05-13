const chai = require('chai');
const expect = chai.expect;
const xcode = require('xcode');
const pbxFile = require('xcode/lib/pbxFile');
const addFileToProject = require('../../src/ios/addFileToProject');
const removeProjectFromProject = require('../../src/ios/removeProjectFromProject');

const project = xcode.project('test/fixtures/project.pbxproj');
const filePath = '../fixtures/linearGradient.pbxproj';

describe('ios::addFileToProject', () => {

  beforeEach(() => {
    project.parseSync();
    addFileToProject(project, filePath);
  });

  it('should return removed file', () => {
    expect(removeProjectFromProject(project, filePath)).to.be.instanceof(pbxFile);
  });

  it('should remove file from a project', () => {
    const file = removeProjectFromProject(project, filePath);
    expect(project.pbxFileReferenceSection()).to.not.include.keys(file.fileRef);
  });

  it.skip('should remove file from PBXContainerProxy', () => {
    // todo(mike): add in .xcodeproj after Xcode modifications so we can test extra
    // removals later.
  });

});
