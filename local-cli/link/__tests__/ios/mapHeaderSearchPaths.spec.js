'use strict';

jest.autoMockOff();

const xcode = require('xcode');
const mapHeaderSearchPaths = require('../../ios/mapHeaderSearchPaths');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);
const reactPath = '"$(SRCROOT)/../node_modules/react-native/React/**"';

describe('ios::mapHeaderSearchPaths', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should iterate over headers with `react` added only', () => {
    mapHeaderSearchPaths(project, paths => {
      expect(paths.find(p => p.indexOf(reactPath))).toBeDefined();
    });
  });
});
