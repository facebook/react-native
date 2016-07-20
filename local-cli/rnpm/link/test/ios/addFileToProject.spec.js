const chai = require('chai');
const expect = chai.expect;
const xcode = require('xcode');
const addFileToProject = require('../../src/ios/addFileToProject');

const project = xcode.project('test/fixtures/project.pbxproj');

describe('ios::addFileToProject', () => {

  beforeEach(() => {
    project.parseSync();
  });

  it('should add file to a project', () => {
    const file = addFileToProject(project, '../fixtures/linearGradient.pbxproj');

    expect(
      project.pbxFileReferenceSection()
    ).to.include.keys(file.fileRef);
  });

});
