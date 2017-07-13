'use strict';

const path = require('path');
const isInstalled = require('../../android/isInstalled');

const projectConfig = {
  buildGradlePath: path.join(__dirname, '../../__fixtures__/android/patchedBuild.gradle'),
};

describe('android::isInstalled', () => {
  it('should return true when project is already in build.gradle', () => {
    expect(isInstalled(projectConfig, 'test')).toBeTruthy()
    expect(isInstalled(projectConfig, 'test2')).toBeTruthy()
  });

  it('should return false when project is not in build.gradle', () =>
    expect(isInstalled(projectConfig, 'test3')).toBeFalsy()
  );
});
