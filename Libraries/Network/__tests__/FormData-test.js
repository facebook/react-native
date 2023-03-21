/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const FormData = require('../FormData');

describe('FormData', function () {
  var formData;

  beforeEach(() => {
    formData = new FormData();
  });

  afterEach(() => {
    formData = null;
  });

  it('should return non blob null', function () {
    formData.append('null', null);

    const expectedPart = {
      string: 'null',
      headers: {
        'content-disposition': 'form-data; name="null"',
      },
      fieldName: 'null',
    };
    expect(formData.getParts()[0]).toMatchObject(expectedPart);
  });

  it('should return blob', function () {
    formData.append('photo', {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    const expectedPart = {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: 'photo.jpg',
      headers: {
        'content-disposition': 'form-data; name="photo"; filename="photo.jpg"',
        'content-type': 'image/jpeg',
      },
      fieldName: 'photo',
    };
    expect(formData.getParts()[0]).toMatchObject(expectedPart);
  });

  it('should return non blob array', function () {
    formData.append('array', [
      true,
      false,
      undefined,
      null,
      {},
      [],
      'string',
      0,
    ]);

    const expectedPart = {
      string: 'true,false,,,[object Object],,string,0',
      headers: {
        'content-disposition': 'form-data; name="array"',
      },
      fieldName: 'array',
    };
    expect(formData.getParts()[0]).toMatchObject(expectedPart);
  });

  it('should return values based on the given key', function () {
    formData.append('username', 'Chris');
    formData.append('username', 'Bob');

    expect(formData.getAll('username').length).toBe(2);

    expect(formData.getAll('username')).toMatchObject(['Chris', 'Bob']);

    formData.append('photo', {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: 'photo3.jpg',
    });

    formData.append('photo', {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: 'photo2.jpg',
    });

    const expectedPart = {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: 'photo2.jpg',
    };

    expect(formData.getAll('photo')[1]).toMatchObject(expectedPart);

    expect(formData.getAll('file').length).toBe(0);
  });
});
