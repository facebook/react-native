/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * All rights reserved.
 *
 * @emails oncall+javascript_foundation
 */

'use strict';

const getHeadersInFolder = require('../../ios/getHeadersInFolder');

describe('ios::getHeadersInFolder', () => {
  xit('should return an array of all headers in given folder', () => {
    jest.setMock({
      'FileA.h': '',
      'FileB.h': '',
    });

    const foundHeaders = getHeadersInFolder(process.cwd());

    expect(foundHeaders.length).toBe(2);

    getHeadersInFolder(process.cwd()).forEach(headerPath => {
      expect(headerPath).to.contain(process.cwd());
    });
  });

  xit('should ignore all headers in Pods, Examples & node_modules', () => {
    jest.setMock({
      'FileA.h': '',
      'FileB.h': '',
      Pods: {
        'FileC.h': '',
      },
      Examples: {
        'FileD.h': '',
      },
      node_modules: {
        'FileE.h': '',
      },
    });

    expect(getHeadersInFolder(process.cwd()).length).to.equals(2);
  });
});
