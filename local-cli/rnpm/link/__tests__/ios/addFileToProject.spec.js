'use strict';

jest.autoMockOff();

const xcode = require('xcode');
const path = require('path');
const addFileToProject = require('../../src/ios/addFileToProject');

const project = xcode.project(path.join(__dirname, '../fixtures/project.pbxproj'));

function include(partial, source) {
  let isIncluded = true;
  Object.keys(partial).forEach(key => {
    if (source.indexOf(key) === -1) {
      isIncluded = false;
    }
  });

  return isIncluded;
}

describe('ios::addFileToProject', () => {

  beforeEach(() => {
    project.parseSync();
  });

  it('should add file to a project', () => {
    expect(
      include(
        project.pbxFileReferenceSection(),
        addFileToProject(project, '../fixtures/linearGradient.pbxproj').fileRef
      )
    ).toBeTruthy();
  });

});
