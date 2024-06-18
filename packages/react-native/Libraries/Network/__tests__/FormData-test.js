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
        'content-disposition':
          'form-data; name="photo"; filename="photo.jpg"; filename*=utf-8\'\'photo.jpg',
        'content-type': 'image/jpeg',
      },
      fieldName: 'photo',
    };
    expect(formData.getParts()[0]).toMatchObject(expectedPart);
  });

  it('should return blob with the correct utf-8 handling', function () {
    formData.append('photo', {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: '测试photo.jpg',
    });

    const expectedPart = {
      uri: 'arbitrary/path',
      type: 'image/jpeg',
      name: '测试photo.jpg',
      headers: {
        'content-disposition':
          'form-data; name="photo"; filename="测试photo.jpg"; filename*=utf-8\'\'%E6%B5%8B%E8%AF%95photo.jpg',
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

  it('should return string with custom content-type', function () {
    formData.append('withText', {string: 'Alice', type: 'text/plain'});
    formData.append('withJson', {
      string: JSON.stringify({name: 'Bob'}),
      type: 'application/json',
    });

    expect(formData.getParts().length).toBe(2);
    expect(formData.getParts()[0]).toMatchObject({
      string: 'Alice',
      headers: {
        'content-disposition': 'form-data; name="withText"',
        'content-type': 'text/plain',
      },
      fieldName: 'withText',
    });
    expect(formData.getParts()[1]).toMatchObject({
      // prettier-ignore
      // eslint-disable-next-line quotes
      string: "{\"name\":\"Bob\"}",
      headers: {
        'content-disposition': 'form-data; name="withJson"',
        'content-type': 'application/json',
      },
      fieldName: 'withJson',
    });
  });
});
