'use strict';

jest.autoMockOff();

const path = require('path');
const makeSettingsPatch = require('../../../src/android/patches/makeSettingsPatch');

const name = 'test';
const projectConfig = {
  sourceDir: '/home/project/android/app',
  settingsGradlePath: '/home/project/android/settings.gradle',
};
const dependencyConfig = {
  sourceDir: `/home/project/node_modules/${name}/android`,
};

describe('makeSettingsPatch', () => {
  it('should build a patch function', () => {
    expect(Object.prototype.toString(
      makeSettingsPatch(name, dependencyConfig, {}, projectConfig)
    )).toBe('[object Object]');
  });

  it('should make a correct patch', () => {
    const projectDir = path.relative(
      path.dirname(projectConfig.settingsGradlePath),
      dependencyConfig.sourceDir
    );

    expect(makeSettingsPatch(name, dependencyConfig, projectConfig).patch)
      .toBe(
        `include ':${name}'\n` +
        `project(':${name}').projectDir = ` +
        `new File(rootProject.projectDir, '${projectDir}')\n`
      );
  });
});
