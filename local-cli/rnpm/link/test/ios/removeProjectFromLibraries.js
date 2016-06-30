const chai = require('chai');
const expect = chai.expect;
const xcode = require('xcode');
const PbxFile = require('xcode/lib/pbxFile');
const addProjectToLibraries = require('../../src/ios/addProjectToLibraries');
const removeProjectFromLibraries = require('../../src/ios/removeProjectFromLibraries');
const last = require('lodash').last;

const project = xcode.project('test/fixtures/project.pbxproj');

describe('ios::removeProjectFromLibraries', () => {

  beforeEach(() => {
    project.parseSync();

    addProjectToLibraries(
      project.pbxGroupByName('Libraries'),
      new PbxFile('fakePath')
    );
  });

  it('should remove file from Libraries group', () => {
    const file = new PbxFile('fakePath');
    const libraries = project.pbxGroupByName('Libraries');

    removeProjectFromLibraries(libraries, file);

    const child = last(libraries.children);

    expect(child.comment).to.not.equals(file.basename);
  });

});
