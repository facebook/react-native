/**
 * Copyright (c) 2013-present, Facebook, Inc.
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

const groupFilesByType = require('../groupFilesByType');

describe('groupFilesByType', () => {

  it('should group files by its type', () => {
    const fonts = [
      'fonts/a.ttf',
      'fonts/b.ttf',
    ];
    const images = [
      'images/a.jpg',
      'images/c.jpeg',
    ];

    const groupedFiles = groupFilesByType(fonts.concat(images));

    expect(groupedFiles.font).toEqual(fonts);
    expect(groupedFiles.image).toEqual(images);
  });

});
