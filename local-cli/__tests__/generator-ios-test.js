'use strict';

jest.autoMockOff();

var path = require('path');

describe('react:ios', function() {
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
      helpers.run(path.resolve(__dirname, '../generator-ios'))
        .withArguments(['TestAppIOS'])
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
      'ios/TestAppIOS/AppDelegate.h',
      'ios/TestAppIOS/AppDelegate.m',
      'ios/TestAppIOS/Base.lproj/LaunchScreen.xib',
      'ios/TestAppIOS/Images.xcassets/AppIcon.appiconset/Contents.json',
      'ios/TestAppIOS/Info.plist',
      'ios/TestAppIOS/main.m',
      'ios/TestAppIOS.xcodeproj/project.pbxproj',
      'ios/TestAppIOS.xcodeproj/xcshareddata/xcschemes/TestAppIOS.xcscheme',
      'ios/TestAppIOSTests/TestAppIOSTests.m',
      'ios/TestAppIOSTests/Info.plist'
    ]);
  });

  it('replaces vars in AppDelegate.m', function() {
    var appDelegate = 'ios/TestAppIOS/AppDelegate.m';

    assert.fileContent(appDelegate, 'moduleName:@"TestAppIOS"');
    assert.noFileContent(appDelegate, 'SampleApp');
  });

  it('replaces vars in LaunchScreen.xib', function() {
    var launchScreen = 'ios/TestAppIOS/Base.lproj/LaunchScreen.xib';

    assert.fileContent(launchScreen, 'text="TestAppIOS"');
    assert.noFileContent(launchScreen, 'SampleApp');
  });

  it('replaces vars in TestAppIOSTests.m', function() {
    var tests = 'ios/TestAppIOSTests/TestAppIOSTests.m';

    assert.fileContent(tests, '@interface TestAppIOSTests : XCTestCase');
    assert.fileContent(tests, '@implementation TestAppIOSTests');
    assert.noFileContent(tests, 'SampleApp');
  });

  it('replaces vars in project.pbxproj', function() {
    var pbxproj = 'ios/TestAppIOS.xcodeproj/project.pbxproj';
    assert.fileContent(pbxproj, '"TestAppIOS"');
    assert.fileContent(pbxproj, '"TestAppIOSTests"');
    assert.fileContent(pbxproj, 'TestAppIOS.app');
    assert.fileContent(pbxproj, 'TestAppIOSTests.xctest');

    assert.noFileContent(pbxproj, 'SampleApp');
  });

  it('replaces vars in xcscheme', function() {
    var xcscheme = 'ios/TestAppIOS.xcodeproj/xcshareddata/xcschemes/TestAppIOS.xcscheme';
    assert.fileContent(xcscheme, '"TestAppIOS"');
    assert.fileContent(xcscheme, '"TestAppIOS.app"');
    assert.fileContent(xcscheme, 'TestAppIOS.xcodeproj');
    assert.fileContent(xcscheme, '"TestAppIOSTests.xctest"');
    assert.fileContent(xcscheme, '"TestAppIOSTests"');

    assert.noFileContent(xcscheme, 'SampleApp');
  });
});
