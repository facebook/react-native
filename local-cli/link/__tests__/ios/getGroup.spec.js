'use strict';

jest.autoMockOff();

const xcode = require('xcode');
const getGroup = require('../../ios/getGroup');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

describe('ios::getGroup', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should return a top-level group', () => {
    const group = getGroup(project, 'Libraries');
    expect(group.children.length > 0).toBeTruthy();
    expect(group.name).toBe('Libraries');
  });

  it('should return nested group when specified', () => {
    const group = getGroup(project, 'NestedGroup/Libraries');
    expect(group.children.length).toBe(0); // our test nested Libraries is empty
    expect(group.name).toBe('Libraries');
  });

  it('should return null when no group found', () => {
    const group = getGroup(project, 'I-Dont-Exist');
    expect(group).toBeNull();
  });

  it('should return top-level group when name not specified', () => {
    const mainGroupId = project.getFirstProject().firstProject.mainGroup;
    const mainGroup = project.getPBXGroupByKey(mainGroupId);
    const group = getGroup(project);
    expect(group).toEqual(mainGroup);
  });
});
