'use strict';

jest.autoMockOff();

var path = require('path');

describe('react:ios', function() {
  var assert = require('yeoman-generator').assert;

  beforeEach(function() {
    var helpers = require('yeoman-generator').test;
    var generated = false;

    runs(function() {
      helpers.run(path.resolve(__dirname, '../generator-ios'))
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
      'ios/main.jsbundle',
      'ios/TestApp/AppDelegate.h',
      'ios/TestApp/AppDelegate.m',
      'ios/TestApp/Base.lproj/LaunchScreen.xib',
      'ios/TestApp/Images.xcassets/AppIcon.appiconset/Contents.json',
      'ios/TestApp/Info.plist',
      'ios/TestApp/main.m',
      'ios/TestApp.xcodeproj/project.pbxproj',
      'ios/TestApp.xcodeproj/xcshareddata/xcschemes/TestApp.xcscheme',
      'ios/TestAppTests/TestAppTests.m',
      'ios/TestAppTests/Info.plist'
    ]);
  });

  it('replaces vars in AppDelegate.m', function() {
    var appDelegate = 'ios/TestApp/AppDelegate.m';

    assert.fileContent(appDelegate, 'moduleName:@"TestApp"');
    assert.noFileContent(appDelegate, 'SampleApp');
  });

  it('replaces vars in LaunchScreen.xib', function() {
    var launchScreen = 'ios/TestApp/Base.lproj/LaunchScreen.xib';

    assert.fileContent(launchScreen, 'text="TestApp"');
    assert.noFileContent(launchScreen, 'SampleApp');
  });

  it('replaces vars in TestAppTests.m', function() {
    var tests = 'ios/TestAppTests/TestAppTests.m';

    assert.fileContent(tests, '@interface TestAppTests : XCTestCase');
    assert.fileContent(tests, '@implementation TestAppTests');
    assert.noFileContent(tests, 'SampleApp');
  });

  it('replaces vars in project.pbxproj', function() {
    var pbxproj = 'ios/TestApp.xcodeproj/project.pbxproj';
    assert.fileContent(pbxproj, '"TestApp"');
    assert.fileContent(pbxproj, '"TestAppTests"');
    assert.fileContent(pbxproj, 'TestApp.app');
    assert.fileContent(pbxproj, 'TestAppTests.xctest');

    assert.noFileContent(pbxproj, 'SampleApp');
  });

  it('replaces vars in xcscheme', function() {
    var xcscheme = 'ios/TestApp.xcodeproj/xcshareddata/xcschemes/TestApp.xcscheme';
    assert.fileContent(xcscheme, '"TestApp"');
    assert.fileContent(xcscheme, '"TestApp.app"');
    assert.fileContent(xcscheme, 'TestApp.xcodeproj');
    assert.fileContent(xcscheme, '"TestAppTests.xctest"');
    assert.fileContent(xcscheme, '"TestAppTests"');

    assert.noFileContent(xcscheme, 'SampleApp');
  });
});
