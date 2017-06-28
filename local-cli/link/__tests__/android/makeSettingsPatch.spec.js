'use strict';

const path = require('path');
const makeSettingsPatch = require('../../android/patches/makeSettingsPatch');

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
      makeSettingsPatch(name, dependencyConfig, projectConfig)
    )).toBe('[object Object]');
  });

  it('should make a correct patch', () => {
    const projectDir = path.relative(
      path.dirname(projectConfig.settingsGradlePath),
      dependencyConfig.sourceDir
    );

    const {patch} = makeSettingsPatch(name, dependencyConfig, projectConfig);

    expect(patch)
      .toBe(
        `include ':${name}'\n` +
        `project(':${name}').projectDir = ` +
        `new File(rootProject.projectDir, '${projectDir}')\n`
      );
  });
});
