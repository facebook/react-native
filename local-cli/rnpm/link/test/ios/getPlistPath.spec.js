const chai = require('chai');
const expect = chai.expect;
const xcode = require('xcode');
const getPlistPath = require('../../src/ios/getPlistPath');

const project = xcode.project('test/fixtures/project.pbxproj');

describe('ios::getPlistPath', () => {

  beforeEach(() => {
    project.parseSync();
  });

  it('should return path without Xcode $(SRCROOT)', () => {
    const plistPath = getPlistPath(project, '/');
    expect(plistPath).to.equals('/Basic/Info.plist');
  });

});
