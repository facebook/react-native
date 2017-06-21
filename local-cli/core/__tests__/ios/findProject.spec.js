/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @format
 */

'use strict';

const findProject = require('../../ios/findProject');
const mockFS = require('mock-fs');
const projects = require('../../__fixtures__/projects');
const ios = require('../../__fixtures__/ios');

describe('ios::findProject', () => {
  it('returns path to xcodeproj if found', () => {
    mockFS(projects.flat);
    expect(findProject('')).not.toBeNull();
  });

  it('returns null if there are no projects', () => {
    mockFS({testDir: projects});
    expect(findProject('')).toBeNull();
  });

  it('returns ios project regardless of its name', () => {
    mockFS({ios: ios.validTestName});
    expect(findProject('')).not.toBeNull();
  });

  it('ignores node_modules', () => {
    mockFS({node_modules: projects.flat});
    expect(findProject('')).toBeNull();
  });

  it('ignores Pods', () => {
    mockFS({Pods: projects.flat});
    expect(findProject('')).toBeNull();
  });

  it('ignores Pods inside `ios` folder', () => {
    mockFS({
      ios: {
        Pods: projects.flat,
        DemoApp: projects.flat.ios,
      },
    });
    expect(findProject('')).toBe('ios/DemoApp/demoProject.xcodeproj');
  });

  it('ignores xcodeproj from example folders', () => {
    mockFS({
      examples: projects.flat,
      Examples: projects.flat,
      example: projects.flat,
      KeychainExample: projects.flat,
      Zpp: projects.flat,
    });

    expect(findProject('').toLowerCase()).not.toContain('example');
  });

  it('ignores xcodeproj from sample folders', () => {
    mockFS({
      samples: projects.flat,
      Samples: projects.flat,
      sample: projects.flat,
      KeychainSample: projects.flat,
      Zpp: projects.flat,
    });

    expect(findProject('').toLowerCase()).not.toContain('sample');
  });

  it('ignores xcodeproj from test folders at any level', () => {
    mockFS({
      test: projects.flat,
      IntegrationTests: projects.flat,
      tests: projects.flat,
      Zpp: {
        tests: projects.flat,
        src: projects.flat,
      },
    });

    expect(findProject('').toLowerCase()).not.toContain('test');
  });

  afterEach(() => {
    mockFS.restore();
  });
});
