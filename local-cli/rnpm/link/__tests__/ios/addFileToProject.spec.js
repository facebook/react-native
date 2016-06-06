'use strict';

jest.autoMockOff();

const xcode = require('xcode');
const path = require('path');
const addFileToProject = require('../../src/ios/addFileToProject');
const include = require('../include');

const project = xcode.project(
  path.join(__dirname, '../fixtures/project.pbxproj')
);

describe('ios::addFileToProject', () => {
  beforeEach(() => {
    project.parseSync();
  });

  xit('should add file to a project', () => {
    expect(
      include(
        project.pbxFileReferenceSection(),
        addFileToProject(project, '../fixtures/linearGradient.pbxproj').fileRef
      )
    ).toBeTruthy();
  });
});
