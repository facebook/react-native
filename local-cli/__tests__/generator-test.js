'use strict';

jest.autoMockOff();

var path = require('path');
var fs = require('fs');

describe('react:react', function() {
  var assert = require('yeoman-generator').assert;

  beforeEach(function() {
    var helpers = require('yeoman-generator').test;
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
    assert.file(['.flowconfig', '.gitignore', '.watchmanconfig', 'index.ios.js']);
  });

  it('replaces vars in index.ios.js', function() {
    assert.fileContent('index.ios.js', 'var TestApp = React.createClass({');
    assert.fileContent(
      'index.ios.js',
      'AppRegistry.registerComponent(\'TestApp\', () => TestApp);'
    );

    assert.noFileContent('index.ios.js', 'SampleApp');
  });

  it('composes with ios generator', function() {
    var stat = fs.statSync('ios');

    expect(stat.isDirectory()).toBe(true);
  });
});