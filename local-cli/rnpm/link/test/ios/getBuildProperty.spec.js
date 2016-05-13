const chai = require('chai');
const expect = chai.expect;
const xcode = require('xcode');
const getBuildProperty = require('../../src/ios/getBuildProperty');

const project = xcode.project('test/fixtures/project.pbxproj');

describe('ios::getBuildProperty', () => {

  beforeEach(() => {
    project.parseSync();
  });

  it('should return build property from main target', () => {
    const plistPath = getBuildProperty(project, 'INFOPLIST_FILE');
    expect(plistPath).to.equals('"Basic/Info.plist"');
  });

});
