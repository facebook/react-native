const fs = require('fs');
const path = require('path');
const chai = require('chai');
const expect = chai.expect;
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
    expect(
      makeSettingsPatch(name, dependencyConfig, {}, projectConfig)
    ).to.be.an('object');
  });

  it('should make a correct patch', () => {
    const projectDir = path.relative(
      path.dirname(projectConfig.settingsGradlePath),
      dependencyConfig.sourceDir
    );

    expect(makeSettingsPatch(name, dependencyConfig, projectConfig).patch)
      .to.be.equal(
        `include ':${name}'\n` +
        `project(':${name}').projectDir = ` +
        `new File(rootProject.projectDir, '${projectDir}')\n`
      );
  });
});
