const chai = require('chai');
const expect = chai.expect;
const xcode = require('xcode');
const mapHeaderSearchPaths = require('../../src/ios/mapHeaderSearchPaths');

const project = xcode.project('test/fixtures/project.pbxproj');
const reactPath = '"$(SRCROOT)/../node_modules/react-native/React/**"';

describe('ios::mapHeaderSearchPaths', () => {

  beforeEach(() => {
    project.parseSync();
  });

  it('should iterate over headers with `react` added only', () => {
    const path = '../../node_modules/path-to-module/**';

    mapHeaderSearchPaths(project, paths => {
      expect(paths.find(path => path.indexOf(reactPath))).to.be.not.empty;
    });
  });

});
