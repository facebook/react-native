'use strict';

jest.dontMock('../install');

var install = require('../install.js');
var fs = require('fs');

describe('setup Podfile', function() {
  it('creates a Podfile', function() {
    fs.mkdirSync('./podfile-test');
    process.chdir('./podfile-test');
    var setupPodfile = install.setupPodfile();

    expect(setupPodfile.podfileExists()).toBe(true);
    process.chdir('../');
  });

  it('expects Podfile to containing opening & closing react native tag', function() {
    process.chdir('./podfile-test');
    var setupPodfile = install.setupPodfile();

    var openingReactTag = '#<React-Native>';
    var closingReactTag = '#</React-Native>';

    expect(setupPodfile.podfileText()).toContain(openingReactTag);
    expect(setupPodfile.podfileText()).toContain(closingReactTag);
    process.chdir('../');
  });

  it('expects Podfile to contain React Pod', function() {
    process.chdir('./podfile-test');
    var setupPodfile = install.setupPodfile();
    expect(setupPodfile.podfileText()).toContain('pod \'React\'');
    process.chdir('../');
    fs.unlink("./podfile-test/Podfile");
    fs.rmdirSync("./podfile-test");
  });
});
