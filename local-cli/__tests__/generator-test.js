'use strict';

jest.autoMockOff();

var path = require('path');
var fs = require('fs');

describe('react:react', function() {
  var assert;

  beforeEach(function() {
    // A deep dependency of yeoman spams console.log with giant json objects.
    // yeoman-generator/node_modules/
    //   download/node_modules/
    //     caw/node_modules/
    //       get-proxy/node_modules/
    //         rc/index.js
    var log = console.log;
    console.log = function() {};
    assert = require('yeoman-generator').assert;
    var helpers = require('yeoman-generator').test;
    console.log = log;

    var generated = false;

    runs(function() {
      helpers.run(path.resolve(__dirname, '../generator'))
        .withArguments(['TestApp'])
        .on('end', function() {
          generated = true;
        });
    });

    waitsFor(function() {
      jest.runAllTicks();
      jest.runOnlyPendingTimers();
      return generated;
    }, "generation", 750);
  });

  it('creates files', function() {
    assert.file([
      '.flowconfig',
      '.gitignore',
      '.watchmanconfig',
      'index.ios.js',
      'index.android.js'
    ]);
  });

  it('replaces vars in index.ios.js', function() {
    assert.fileContent('index.ios.js', 'var TestApp = React.createClass({');
    assert.fileContent(
      'index.ios.js',
      'AppRegistry.registerComponent(\'TestApp\', () => TestApp);'
    );

    assert.noFileContent('index.ios.js', 'SampleApp');
  });

  it('replaces vars in index.android.js', function() {
    assert.fileContent('index.android.js', 'var TestApp = React.createClass({');
    assert.fileContent(
      'index.android.js',
      'AppRegistry.registerComponent(\'TestApp\', () => TestApp);'
    );

    assert.noFileContent('index.ios.js', 'SampleApp');
  });

  it('composes with ios generator', function() {
    var stat = fs.statSync('ios');

    expect(stat.isDirectory()).toBe(true);
  });

  it('composes with android generator', function() {
    var stat = fs.statSync('android');

    expect(stat.isDirectory()).toBe(true);
  })
});
