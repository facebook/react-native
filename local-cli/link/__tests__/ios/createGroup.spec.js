'use strict';

const xcode = require('xcode');
const path = require('path');
const createGroup = require('../../ios/createGroup');
const getGroup = require('../../ios/getGroup');
const last = require('lodash').last;

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

describe('ios::createGroup', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should create a group with given name', () => {
    const createdGroup = createGroup(project, 'Resources');
    expect(createdGroup.name).toBe('Resources');
  });

  it('should attach group to main project group', () => {
    const createdGroup = createGroup(project, 'Resources');
    const mainGroup = getGroup(project);

    expect(
      last(mainGroup.children).comment
    ).toBe(createdGroup.name);
  });

  it('should create a nested group with given path', () => {
    const createdGroup = createGroup(project, 'NewGroup/NewNestedGroup');
    const outerGroup = getGroup(project, 'NewGroup');

    expect(
      last(outerGroup.children).comment
    ).toBe(createdGroup.name);
  });

  it('should-not create already created groups', () => {
    const createdGroup = createGroup(project, 'Libraries/NewNestedGroup');
    const outerGroup = getGroup(project, 'Libraries');
    const mainGroup = getGroup(project);

    expect(
      mainGroup
        .children
        .filter(group => group.comment === 'Libraries')
        .length
    ).toBe(1);
    expect(last(outerGroup.children).comment).toBe(createdGroup.name);
  });
});
