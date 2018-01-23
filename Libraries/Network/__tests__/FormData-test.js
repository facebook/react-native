/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+react_native
 */

'use strict';

const FormData = require('FormData');

describe('FormData', function() {
  var formData;

  beforeEach(() => {
    formData = new FormData();
  });

  afterEach(() => {
    formData = null;
  });

  it('should return non blob null', function() {
    formData.append('null', null);

    const expectedPart = {
      string: 'null',
      headers: {
        'content-disposition': 'form-data; name="null"'
      },
      fieldName: 'null'
    };
    expect(formData.getParts()[0]).toMatchObject(expectedPart);
  });

  it('should return blob', function() {
    formData.append('photo', {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: 'photo.jpg'
    });

    const expectedPart = {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: 'photo.jpg',
      headers: {
        'content-disposition': 'form-data; name="photo"; filename="photo.jpg"',
        'content-type': 'image/jpeg'
      },
      fieldName: 'photo'
    };
    expect(formData.getParts()[0]).toMatchObject(expectedPart);
  });
});
