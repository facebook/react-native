'use strict';

jest.autoMockOff();

var path = require('path');

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
    }, "generation", 750);
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
