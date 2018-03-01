/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

jest.mock('fs');

const findProject = require('../../ios/findProject');
const fs = require('fs');
const projects = require('../../__fixtures__/projects');
const ios = require('../../__fixtures__/ios');

describe('ios::findProject', () => {
  it('returns path to xcodeproj if found', () => {
    fs.__setMockFilesystem(projects.flat);
    expect(findProject('/')).not.toBeNull();
  });

  it('returns null if there are no projects', () => {
    fs.__setMockFilesystem({testDir: projects});
    expect(findProject('/')).toBeNull();
  });

  it('returns ios project regardless of its name', () => {
    fs.__setMockFilesystem({ios: ios.validTestName});
    expect(findProject('/')).not.toBeNull();
  });

  it('ignores node_modules', () => {
    fs.__setMockFilesystem({node_modules: projects.flat});
    expect(findProject('/')).toBeNull();
  });

  it('ignores Pods', () => {
    fs.__setMockFilesystem({Pods: projects.flat});
    expect(findProject('/')).toBeNull();
  });

  it('ignores Pods inside `ios` folder', () => {
    fs.__setMockFilesystem({
      ios: {
        Pods: projects.flat,
        DemoApp: projects.flat.ios,
      },
    });
    expect(findProject('/')).toBe('ios/DemoApp/demoProject.xcodeproj');
  });

  it('ignores xcodeproj from example folders', () => {
    fs.__setMockFilesystem({
      examples: projects.flat,
      Examples: projects.flat,
      example: projects.flat,
      KeychainExample: projects.flat,
      Zpp: projects.flat,
    });

    expect(findProject('/').toLowerCase()).not.toContain('example');
  });

  it('ignores xcodeproj from sample folders', () => {
    fs.__setMockFilesystem({
      samples: projects.flat,
      Samples: projects.flat,
      sample: projects.flat,
      KeychainSample: projects.flat,
      Zpp: projects.flat,
    });

    expect(findProject('/').toLowerCase()).not.toContain('sample');
  });

  it('ignores xcodeproj from test folders at any level', () => {
    fs.__setMockFilesystem({
      test: projects.flat,
      IntegrationTests: projects.flat,
      tests: projects.flat,
      Zpp: {
        tests: projects.flat,
        src: projects.flat,
      },
    });

    expect(findProject('/').toLowerCase()).not.toContain('test');
  });
});
