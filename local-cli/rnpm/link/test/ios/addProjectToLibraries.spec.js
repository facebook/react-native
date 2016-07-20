const chai = require('chai');
const expect = chai.expect;
const xcode = require('xcode');
const PbxFile = require('xcode/lib/pbxFile');
const addProjectToLibraries = require('../../src/ios/addProjectToLibraries');
const last = require('lodash').last;

const project = xcode.project('test/fixtures/project.pbxproj');

describe('ios::addProjectToLibraries', () => {

  beforeEach(() => {
    project.parseSync();
  });

  it('should append file to Libraries group', () => {
    const file = new PbxFile('fakePath');
    const libraries = project.pbxGroupByName('Libraries');

    addProjectToLibraries(libraries, file);

    const child = last(libraries.children);

    expect(child).to.have.keys(['value', 'comment']);
    expect(child.comment).to.equals(file.basename);
  });

});
