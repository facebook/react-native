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

const getHeaderSearchPath = require('../../ios/getHeaderSearchPath');
const path = require('path');

const SRC_DIR = path.join('react-native-project', 'ios');

describe('ios::getHeaderSearchPath', () => {
  /**
   * See https://github.com/Microsoft/react-native-code-push
   */
  it('should return correct path when all headers are in root folder', () => {
    const files = [
      path.join(
        'react-native-project',
        'node_modules',
        'package',
        'Gradient.h',
      ),
      path.join('react-native-project', 'node_modules', 'package', 'Manager.h'),
    ];

    const searchPath = getHeaderSearchPath(SRC_DIR, files);

    expect(searchPath).toBe(
      `"${['$(SRCROOT)', '..', 'node_modules', 'package'].join(path.sep)}"`,
    );
  });

  /**
   * See https://github.com/facebook/react-native/tree/master/React
   */
  it('should return correct path when headers are in multiple folders', () => {
    const files = [
      path.join(
        'react-native-project',
        'node_modules',
        'package',
        'src',
        'folderA',
        'Gradient.h',
      ),
      path.join(
        'react-native-project',
        'node_modules',
        'package',
        'src',
        'folderB',
        'Manager.h',
      ),
    ];

    const searchPath = getHeaderSearchPath(SRC_DIR, files);

    expect(searchPath).toBe(
      `"${['$(SRCROOT)', '..', 'node_modules', 'package', 'src'].join(
        path.sep,
      )}/**"`,
    );
  });

  /**
   * This is just to make sure the above two does not collide with each other
   */
  it('should return correct path when headers are in root and nested folders', () => {
    const files = [
      path.join(
        'react-native-project',
        'node_modules',
        'package',
        'src',
        'folderA',
        'Gradient.h',
      ),
      path.join(
        'react-native-project',
        'node_modules',
        'package',
        'src',
        'folderB',
        'Manager.h',
      ),
      path.join(
        'react-native-project',
        'node_modules',
        'package',
        'src',
        'Manager.h',
      ),
    ];

    const searchPath = getHeaderSearchPath(SRC_DIR, files);

    expect(searchPath).toBe(
      `"${['$(SRCROOT)', '..', 'node_modules', 'package', 'src'].join(
        path.sep,
      )}/**"`,
    );
  });
});
