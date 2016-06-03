const chai = require('chai');
const expect = chai.expect;
const xcode = require('xcode');
const getPlist = require('../../src/ios/getPlist');

const project = xcode.project('test/fixtures/project.pbxproj');

describe('ios::getPlist', () => {

  beforeEach(() => {
    project.parseSync();
  });

  it('should return null when `.plist` file missing', () => {
    const plistPath = getPlist(project, process.cwd());
    expect(plistPath).to.equals(null);
  });

  it.skip('should return parsed `plist`', () => {
    // @todo mock fs here
  });

});
