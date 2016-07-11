const chai = require('chai');
const expect = chai.expect;
const xcode = require('xcode');
const getGroup = require('../../src/ios/getGroup');

const project = xcode.project('test/fixtures/project.pbxproj');

describe('ios::getGroup', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should return a top-level group', () => {
    const group = getGroup(project, 'Libraries');
    expect(group.children.length > 0).to.be.true; // our test top-level Libraries has children
    expect(group.name).to.equals('Libraries');
  });

  it('should return nested group when specified', () => {
    const group = getGroup(project, 'NestedGroup/Libraries');
    expect(group.children.length).to.equals(0); // our test nested Libraries is empty
    expect(group.name).to.equals('Libraries');
  });

  it('should return null when no group found', () => {
    const group = getGroup(project, 'I-Dont-Exist');
    expect(group).to.be.null;
  });

  it('should return top-level group when name not specified', () => {
    const mainGroupId = project.getFirstProject().firstProject.mainGroup;
    const mainGroup = project.getPBXGroupByKey(mainGroupId);
    const group = getGroup(project);
    expect(group).to.equals(mainGroup);
  });
});
