/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

jest.unmock('FormData');

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

    let parts = formData.getParts();
    expect(parts[0].string).toBe('null');
    expect(parts[0].headers['content-disposition']).toBe('form-data; name="null"');
    expect(parts[0].fieldName).toBe('null');
  });

  it('should return blob', function() {
    formData.append('photo', {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: 'photo.jpg'
    });

    let parts = formData.getParts();
    expect(parts[0].uri).toBe('arbitrary/path');
    expect(parts[0].type).toBe('image/jpeg');
    expect(parts[0].name).toBe('photo.jpg');
    expect(parts[0].headers['content-disposition']).toBe('form-data; name="photo"; filename="photo.jpg"');
    expect(parts[0].headers['content-type']).toBe('image/jpeg');
    expect(parts[0].fieldName).toBe('photo');
  });
});
