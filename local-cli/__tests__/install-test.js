'use strict';

jest.dontMock('../install');
jest.dontMock('fs');
jest.dontMock('path');

var install = require('../install.js');

var openingReactTag = '#<React-Native>';
var closingReactTag = '#</React-Native>';

var fs = require.requireActual('fs');
var path = require.requireActual('path');

process.chdir(__dirname);

describe('setup Podfile', function() {

  it('creates a Podfile if none exists', function() {
    try {
      fs.unlinkSync(path.resolve(__dirname, '../Podfile'));
    } catch(e) {}

    var setupPodfile = install.setupPodfile();

    expect(setupPodfile.created).toBe(true);
  });

  it('does not create Podfile if one exists', function() {
    var setupPodfile = install.setupPodfile();
    expect(setupPodfile.created).toBe(false);
  });

  it('includes React Native Tags', function() {
    var setupPodfile = install.setupPodfile();

    expect(setupPodfile.podfileText).toContain(openingReactTag);
    expect(setupPodfile.podfileText).toContain(closingReactTag);

    // cleanup
    try {
      fs.unlinkSync(path.resolve(__dirname, '../Podfile'));
    } catch(e) {
      throw new Error('failed to cleanup Podfile', e);
    }
  });
});
