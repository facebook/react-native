'use strict';

jest.autoMockOff();

var path = require('path');

describe('react:android', function () {
  var assert = require('yeoman-generator').assert;

  beforeEach(function (done) {
    var helpers = require('yeoman-generator').test;
    var generated = false;

    runs(function() {
      helpers.run(path.resolve(__dirname, '..', 'generator-android'))
        .withArguments(['TestApp'])
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
      'mReactRootView.startReactApplication(mReactInstanceManager, "TestApp", null);'
    );
    assert.fileContent(
      path.join('android', 'app', 'src', 'main', 'res', 'values', 'strings.xml'),
      '<string name="app_name">TestApp</string>'
    );
  });
});
