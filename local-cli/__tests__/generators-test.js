'use strict';

jest.autoMockOff();
jest.mock('child_process');

var path = require('path');
var fs = require('fs');

describe('React Yeoman Generators', function() {
  describe('react:react', function() {
    var assert;
    var helpers;
    var generated;

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
      helpers = require('yeoman-generator').test;
      console.log = log;
    });

    describe('with name argument', function() {
      beforeEach(function() {
        generated = false;

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
        }, 'generation', 750);

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

        assert.noFileContent('index.ios.js', '<%= name %>');
      });

      it('replaces vars in index.android.js', function() {
        assert.fileContent('index.android.js', 'var TestApp = React.createClass({');
        assert.fileContent(
          'index.android.js',
          'AppRegistry.registerComponent(\'TestApp\', () => TestApp);'
        );

        assert.noFileContent('index.ios.js', '<%= name %>');
      });

      it('composes with ios generator', function() {
        assert.file(['ios/TestApp/AppDelegate.m']);
      });

      it('composes with android generator', function() {
        var stat = fs.statSync('android');
        expect(stat.isDirectory()).toBe(true);
      });
    });

    describe('with name and swift arguments', function() {
      beforeEach(function() {
        generated = false;

        runs(function() {
          helpers.run(path.resolve(__dirname, '../generator'))
            .withArguments(['--swift','TestApp2'])
            .on('end', function() {
              generated = true;
            });
        });

        waitsFor(function() {
          jest.runAllTicks();
          jest.runOnlyPendingTimers();
          return generated;
        }, 'generation', 750);

      });

      it('composes with swift generator', function() {
        assert.file(['ios/TestApp2/AppDelegate.swift']);
      });
    });
  });

  describe('react:android', function () {
    var assert;

    beforeEach(function (done) {
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
        helpers.run(path.resolve(__dirname, '..', 'generator-android'))
          .withArguments(['TestAppAndroid'])
          .withOptions({
            'package': 'com.reactnative.test',
          })
          .on('end', function() {
            generated = true;
          });
      });

      waitsFor(function() {
        jest.runAllTicks();
        jest.runOnlyPendingTimers();
        return generated;
      }, 'generation', 750);
    });

    it('creates files', function () {
      assert.file([
        path.join('android', 'build.gradle'),
        path.join('android', 'gradle.properties'),
        path.join('android', 'gradlew.bat'),
        path.join('android', 'gradlew'),
        path.join('android', 'settings.gradle'),
        path.join('android', 'app', 'build.gradle'),
        path.join('android', 'app', 'proguard-rules.pro'),
        path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml'),
        path.join('android', 'app', 'src', 'main', 'java', 'com', 'reactnative', 'test', 'MainActivity.java'),
        path.join('android', 'app', 'src', 'main', 'res', 'mipmap-hdpi', 'ic_launcher.png'),
        path.join('android', 'app', 'src', 'main', 'res', 'mipmap-mdpi', 'ic_launcher.png'),
        path.join('android', 'app', 'src', 'main', 'res', 'mipmap-xhdpi', 'ic_launcher.png'),
        path.join('android', 'app', 'src', 'main', 'res', 'mipmap-xxhdpi', 'ic_launcher.png'),
        path.join('android', 'app', 'src', 'main', 'res', 'values', 'strings.xml'),
        path.join('android', 'app', 'src', 'main', 'res', 'values', 'styles.xml'),
        path.join('android', 'gradle', 'wrapper', 'gradle-wrapper.jar'),
        path.join('android', 'gradle', 'wrapper', 'gradle-wrapper.properties')
      ]);
    });

    it('replaces variables', function() {
      assert.fileContent(path.join('android', 'app', 'build.gradle'), 'applicationId "com.reactnative.test"');
      assert.fileContent(
        path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml'),
        'package="com.reactnative.test"'
      );
      assert.fileContent(
        path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml'),
        'name=".MainActivity"'
      );
      assert.fileContent(
        path.join('android', 'app', 'src', 'main', 'java', 'com', 'reactnative', 'test', 'MainActivity.java'),
        'package com.reactnative.test;'
      );
      assert.fileContent(
        path.join('android', 'app', 'src', 'main', 'java', 'com', 'reactnative', 'test', 'MainActivity.java'),
        'mReactRootView.startReactApplication(mReactInstanceManager, "TestAppAndroid", null);'
      );
      assert.fileContent(
        path.join('android', 'app', 'src', 'main', 'res', 'values', 'strings.xml'),
        '<string name="app_name">TestAppAndroid</string>'
      );
    });
  });

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
        helpers.run(path.resolve(__dirname, '../generator-ios-objc'))
          .withArguments(['TestAppIOS'])
          .on('end', function() {
            generated = true;
          });
      });

      waitsFor(function() {
        jest.runAllTicks();
        jest.runOnlyPendingTimers();
        return generated;
      }, 'generation', 750);
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
      assert.noFileContent(appDelegate, '<%= name %>');
    });

    it('replaces vars in LaunchScreen.xib', function() {
      var launchScreen = 'ios/TestAppIOS/Base.lproj/LaunchScreen.xib';

      assert.fileContent(launchScreen, 'text="TestAppIOS"');
      assert.noFileContent(launchScreen, '<%= name %>');
    });

    it('replaces vars in TestAppIOSTests.m', function() {
      var tests = 'ios/TestAppIOSTests/TestAppIOSTests.m';

      assert.fileContent(tests, '@interface TestAppIOSTests : XCTestCase');
      assert.fileContent(tests, '@implementation TestAppIOSTests');
      assert.noFileContent(tests, '<%= name %>');
    });

    it('replaces vars in project.pbxproj', function() {
      var pbxproj = 'ios/TestAppIOS.xcodeproj/project.pbxproj';
      assert.fileContent(pbxproj, '"TestAppIOS"');
      assert.fileContent(pbxproj, '"TestAppIOSTests"');
      assert.fileContent(pbxproj, 'TestAppIOS.app');
      assert.fileContent(pbxproj, 'TestAppIOSTests.xctest');

      assert.noFileContent(pbxproj, '<%= name %>');
    });

    it('replaces vars in xcscheme', function() {
      var xcscheme = 'ios/TestAppIOS.xcodeproj/xcshareddata/xcschemes/TestAppIOS.xcscheme';
      assert.fileContent(xcscheme, '"TestAppIOS"');
      assert.fileContent(xcscheme, '"TestAppIOS.app"');
      assert.fileContent(xcscheme, 'TestAppIOS.xcodeproj');
      assert.fileContent(xcscheme, '"TestAppIOSTests.xctest"');
      assert.fileContent(xcscheme, '"TestAppIOSTests"');

      assert.noFileContent(xcscheme, '<%= name %>');
    });
  });

  describe('react:swift', function() {
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
        helpers.run(path.resolve(__dirname, '../generator-ios-swift'))
          .withArguments(['TestAppSwift'])
          .on('end', function() {
            generated = true;
          });
      });

      waitsFor(function() {
        jest.runAllTicks();
        jest.runOnlyPendingTimers();
        return generated;
      }, 'generation', 750);
    });

    it('creates files', function() {
      assert.file([
        'ios/main.jsbundle',
        'ios/TestAppSwift/AppDelegate.swift',
        'ios/TestAppSwift/Base.lproj/LaunchScreen.xib',
        'ios/TestAppSwift/Images.xcassets/AppIcon.appiconset/Contents.json',
        'ios/TestAppSwift/Info.plist',
        'ios/TestAppSwift/ViewController.swift',
        'ios/TestAppSwift/TestAppSwift-Bridging-Header.h',
        'ios/TestAppSwift.xcodeproj/project.pbxproj',
        'ios/TestAppSwift.xcodeproj/xcshareddata/xcschemes/TestAppSwift.xcscheme',
        'ios/TestAppSwiftTests/TestAppSwiftTests.swift',
        'ios/TestAppSwiftTests/Info.plist'
      ]);
    });

    it('replaces vars in AppDelegate.swift', function() {
      var appDelegate = 'ios/TestAppSwift/AppDelegate.swift';
      assert.fileContent(appDelegate, 'moduleName: "TestAppSwift"');
    });

    it('replaces vars in LaunchScreen.xib', function() {
      var launchScreen = 'ios/TestAppSwift/Base.lproj/LaunchScreen.xib';
      assert.fileContent(launchScreen, 'text="TestAppSwift"');
    });

    it('replaces vars in TestAppSwiftTests.swift', function() {
      var tests = 'ios/TestAppSwiftTests/TestAppSwiftTests.swift';
      assert.fileContent(tests, 'class TestAppSwiftTests: XCTestCase');
    });

    it('replaces vars in project.pbxproj', function() {
      var pbxproj = 'ios/TestAppSwift.xcodeproj/project.pbxproj';
      assert.fileContent(pbxproj, '"TestAppSwift"');
      assert.fileContent(pbxproj, '"TestAppSwiftTests"');
      assert.fileContent(pbxproj, 'TestAppSwift.app');
      assert.fileContent(pbxproj, 'TestAppSwiftTests.xctest');
    });

    it('replaces vars in xcscheme', function() {
      var xcscheme = 'ios/TestAppSwift.xcodeproj/xcshareddata/xcschemes/TestAppSwift.xcscheme';
      assert.fileContent(xcscheme, '"TestAppSwift"');
      assert.fileContent(xcscheme, '"TestAppSwift.app"');
      assert.fileContent(xcscheme, 'TestAppSwift.xcodeproj');
      assert.fileContent(xcscheme, '"TestAppSwiftTests.xctest"');
      assert.fileContent(xcscheme, '"TestAppSwiftTests"');
    });
  });
});
