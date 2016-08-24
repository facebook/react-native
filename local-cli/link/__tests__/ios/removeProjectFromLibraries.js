'use strict';

jest.autoMockOff();

const xcode = require('xcode');
const PbxFile = require('xcode/lib/pbxFile');
const addProjectToLibraries = require('../../ios/addProjectToLibraries');
const removeProjectFromLibraries = require('../../ios/removeProjectFromLibraries');
const last = require('lodash').last;
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

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

    expect(child.comment).not.toBe(file.basename);
  });
});
