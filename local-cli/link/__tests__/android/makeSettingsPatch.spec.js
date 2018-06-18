/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

const path = require('path');
const makeSettingsPatch = require('../../android/patches/makeSettingsPatch');
const normalizeProjectName = require('../../android/patches/normalizeProjectName');

const name = 'test';
const scopedName = '@scoped/test';
const normalizedScopedName = normalizeProjectName('@scoped/test');
const projectConfig = {
  sourceDir: '/home/project/android/app',
  settingsGradlePath: '/home/project/android/settings.gradle',
};
const dependencyConfig = {
  sourceDir: `/home/project/node_modules/${name}/android`,
};
const scopedDependencyConfig = {
  sourceDir: `/home/project/node_modules/${scopedName}/android`,
};

describe('makeSettingsPatch', () => {
  it('should build a patch function', () => {
    expect(
      Object.prototype.toString(
        makeSettingsPatch(name, dependencyConfig, projectConfig),
      ),
    ).toBe('[object Object]');
  });

  it('should make a correct patch', () => {
    const projectDir = path.relative(
      path.dirname(projectConfig.settingsGradlePath),
      dependencyConfig.sourceDir,
    );

    const {patch} = makeSettingsPatch(name, dependencyConfig, projectConfig);

    expect(patch).toBe(
      `include ':${name}'\n` +
        `project(':${name}').projectDir = ` +
        `new File(rootProject.projectDir, '${projectDir}')\n`,
    );
  });
});

describe('makeSettingsPatchWithScopedPackage', () => {
  it('should build a patch function', () => {
    expect(
      Object.prototype.toString(
        makeSettingsPatch(scopedName, scopedDependencyConfig, projectConfig),
      ),
    ).toBe('[object Object]');
  });

  it('should make a correct patch', () => {
    const projectDir = path.relative(
      path.dirname(projectConfig.settingsGradlePath),
      scopedDependencyConfig.sourceDir,
    );

    const {patch} = makeSettingsPatch(
      scopedName,
      scopedDependencyConfig,
      projectConfig,
    );

    expect(patch).toBe(
      `include ':${normalizedScopedName}'\n` +
        `project(':${normalizedScopedName}').projectDir = ` +
        `new File(rootProject.projectDir, '${projectDir}')\n`,
    );
  });
});
