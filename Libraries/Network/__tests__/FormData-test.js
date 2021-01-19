/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+react_native
 */

'use strict';

const Blob = require('../../Blob/Blob');
const File = require('../../Blob/File');
const BlobManager = require('../../Blob/BlobManager');

const FormData = require('../FormData');

jest.mock('../../Blob/BlobManager', () => ({
  createFromParts: jest.fn(() => ({
    data: {
      size: 100,
      offset: 40,
      type: 'image/jpeg',
      blobId: '5CADECF8-F32A-4068-8209-5ED18B2648D9',
    },
  })),
  release() {},
}));

describe('FormData', function() {
  var formData;
  var originalURL = global.URL;

  beforeAll(() => {
    global.Blob = Blob;
    global.File = File;
    global.URL = {
      createObjectURL(blob) {
        return `blob:${blob.data.blobId}?offset=${blob.data.offset}&size=${blob.size}`;
      },
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    formData = new FormData();
  });

  afterEach(() => {
    formData = null;
  });

  afterAll(() => {
    delete global.Blob;
    delete global.File;
    global.URL = originalURL;
  });

  describe('append', function() {
    it('should return non blob null', function() {
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

    it('should return blob', function() {
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
            'form-data; name="photo"; filename="photo.jpg"',
          'content-type': 'image/jpeg',
        },
        fieldName: 'photo',
      };
      expect(formData.getParts()[0]).toMatchObject(expectedPart);
    });

    it('should append multiple values with the same key', function() {
      formData.append('photo', {
        uri: 'arbitrary/path',
        type: 'image/jpeg',
        name: 'photo.jpg',
      });
      formData.append('photo', {
        uri: 'arbitrary/path',
        type: 'image/jpeg',
        name: 'photo.jpg',
      });

      expect(formData.getParts()).toEqual([
        {
          uri: 'arbitrary/path',
          type: 'image/jpeg',
          name: 'photo.jpg',
          headers: {
            'content-disposition':
              'form-data; name="photo"; filename="photo.jpg"',
            'content-type': 'image/jpeg',
          },
          fieldName: 'photo',
        },
        {
          uri: 'arbitrary/path',
          type: 'image/jpeg',
          name: 'photo.jpg',
          headers: {
            'content-disposition':
              'form-data; name="photo"; filename="photo.jpg"',
            'content-type': 'image/jpeg',
          },
          fieldName: 'photo',
        },
      ]);
    });

    it('should ignore server file name when value is not File, Blob or blob-like object', function() {
      formData.append('foo', 'bar', 'file.ext');

      const expectedPart = {
        string: 'bar',
        headers: {
          'content-disposition': 'form-data; name="foo"',
        },
        fieldName: 'foo',
      };
      expect(formData.getParts()[0]).toMatchObject(expectedPart);
    });
  });

  describe('set', function() {
    it('should accept null and return a blob part', function() {
      formData.set('null', null);

      const expectedPart = {
        string: 'null',
        headers: {
          'content-disposition': 'form-data; name="null"',
        },
        fieldName: 'null',
      };
      expect(formData.getParts()[0]).toMatchObject(expectedPart);
    });

    it('should accept a blob-like object and return a blob part', function() {
      formData.set('photo', {
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
            'form-data; name="photo"; filename="photo.jpg"',
          'content-type': 'image/jpeg',
        },
        fieldName: 'photo',
      };
      expect(formData.getParts()[0]).toMatchObject(expectedPart);
    });

    it('should accept a Blob instance without server file name and return a blob part', function() {
      formData.set('photo', new Blob());

      const expectedPart = {
        uri: 'blob:5CADECF8-F32A-4068-8209-5ED18B2648D9?offset=40&size=100',
        type: 'image/jpeg',
        name: 'blob',
        headers: {
          'content-disposition': 'form-data; name="photo"; filename="blob"',
          'content-type': 'image/jpeg',
        },
        fieldName: 'photo',
      };
      expect(formData.getParts()[0]).toMatchObject(expectedPart);
    });

    it('should accept a Blob instance with server file name and return a blob part', function() {
      formData.set('photo', new Blob(), 'photo.jpg');

      const expectedPart = {
        uri: 'blob:5CADECF8-F32A-4068-8209-5ED18B2648D9?offset=40&size=100',
        type: 'image/jpeg',
        name: 'photo.jpg',
        headers: {
          'content-disposition':
            'form-data; name="photo"; filename="photo.jpg"',
          'content-type': 'image/jpeg',
        },
        fieldName: 'photo',
      };
      expect(formData.getParts()[0]).toMatchObject(expectedPart);
    });

    it('should accept a File instance without server file name and return a blob part', function() {
      formData.set('photo', new File([], 'photo.jpg'));

      const expectedPart = {
        uri: 'blob:5CADECF8-F32A-4068-8209-5ED18B2648D9?offset=40&size=100',
        type: 'image/jpeg',
        name: 'photo.jpg',
        headers: {
          'content-disposition':
            'form-data; name="photo"; filename="photo.jpg"',
          'content-type': 'image/jpeg',
        },
        fieldName: 'photo',
      };
      expect(formData.getParts()[0]).toMatchObject(expectedPart);
    });

    it('should accept a File instance with server file name and return a blob part', function() {
      formData.set('photo', new File([], 'photo1.jpg'), 'photo2.jpg');

      const expectedPart = {
        uri: 'blob:5CADECF8-F32A-4068-8209-5ED18B2648D9?offset=40&size=100',
        type: 'image/jpeg',
        name: 'photo2.jpg',
        headers: {
          'content-disposition':
            'form-data; name="photo"; filename="photo2.jpg"',
          'content-type': 'image/jpeg',
        },
        fieldName: 'photo',
      };
      expect(formData.getParts()[0]).toMatchObject(expectedPart);
    });

    it('should accept a string and return a blob part', function() {
      formData.set('foo', 'bar');

      const expectedPart = {
        string: 'bar',
        headers: {
          'content-disposition': 'form-data; name="foo"',
        },
        fieldName: 'foo',
      };
      expect(formData.getParts()[0]).toMatchObject(expectedPart);
    });

    it('should replace existing key', function() {
      BlobManager.createFromParts
        .mockReturnValueOnce({
          data: {
            size: 300,
            offset: 60,
            type: 'image/jpeg',
            blobId: '3761FC36-18B8-4D61-9077-61D436FF0075',
          },
        })
        .mockReturnValueOnce({
          data: {
            size: 100,
            offset: 40,
            type: 'image/jpeg',
            blobId: '5CADECF8-F32A-4068-8209-5ED18B2648D9',
          },
        });

      formData.set('photo', new File([], 'photo1.jpg'), 'photo2.jpg');
      formData.set('photo', new Blob(), 'photo3.jpg');

      const expectedPart = {
        uri: 'blob:5CADECF8-F32A-4068-8209-5ED18B2648D9?offset=40&size=100',
        type: 'image/jpeg',
        name: 'photo3.jpg',
        headers: {
          'content-disposition':
            'form-data; name="photo"; filename="photo3.jpg"',
          'content-type': 'image/jpeg',
        },
        fieldName: 'photo',
      };
      expect(formData.getParts()[0]).toMatchObject(expectedPart);
    });

    it('should ignore server file name when value is not File, Blob or blob-like object', function() {
      formData.set('foo', 'bar', 'file.ext');

      const expectedPart = {
        string: 'bar',
        headers: {
          'content-disposition': 'form-data; name="foo"',
        },
        fieldName: 'foo',
      };
      expect(formData.getParts()[0]).toMatchObject(expectedPart);
    });
  });

  describe('getParts', function() {
    it('should return multiple parts', function() {
      BlobManager.createFromParts
        .mockReturnValueOnce({
          data: {
            size: 300,
            offset: 60,
            type: 'image/jpeg',
            blobId: '3761FC36-18B8-4D61-9077-61D436FF0075',
          },
        })
        .mockReturnValueOnce({
          data: {
            size: 100,
            offset: 40,
            type: 'image/jpeg',
            blobId: '5CADECF8-F32A-4068-8209-5ED18B2648D9',
          },
        });

      formData.append('photo', new File([], 'photo1.jpg'), 'photo2.jpg');
      formData.append('photo', new Blob(), 'photo3.jpg');

      expect(formData.getParts()).toEqual([
        {
          uri: 'blob:3761FC36-18B8-4D61-9077-61D436FF0075?offset=60&size=300',
          type: 'image/jpeg',
          name: 'photo2.jpg',
          headers: {
            'content-disposition':
              'form-data; name="photo"; filename="photo2.jpg"',
            'content-type': 'image/jpeg',
          },
          fieldName: 'photo',
        },
        {
          uri: 'blob:5CADECF8-F32A-4068-8209-5ED18B2648D9?offset=40&size=100',
          type: 'image/jpeg',
          name: 'photo3.jpg',
          headers: {
            'content-disposition':
              'form-data; name="photo"; filename="photo3.jpg"',
            'content-type': 'image/jpeg',
          },
          fieldName: 'photo',
        },
      ]);
    });
  });
});
