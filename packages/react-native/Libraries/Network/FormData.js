/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

type FormDataValue =
  | string
  | {name?: string, type?: string, uri: string}
  | {type?: string, string: string};
type FormDataNameValuePair = [string, FormDataValue];

type Headers = {[name: string]: string, ...};
type FormDataPart =
  | {
      string: string,
      headers: Headers,
      ...
    }
  | {
      uri: string,
      headers: Headers,
      name?: string,
      type?: string,
      ...
    };

/**
 * Polyfill for XMLHttpRequest2 FormData API, allowing multipart POST requests
 * with mixed data (string, native files) to be submitted via XMLHttpRequest.
 *
 * Example:
 *
 *   var photo = {
 *     uri: uriFromCameraRoll,
 *     type: 'image/jpeg',
 *     name: 'photo.jpg',
 *   };
 *
 *   var body = new FormData();
 *   body.append('authToken', 'secret');
 *   body.append('photo', photo);
 *   body.append('title', 'A beautiful photo!');
 *   body.append('title', {type: 'application/json', string: JSON.stringify({text:'hello world'})});
 *   xhr.open('POST', serverURL);
 *   xhr.send(body);
 */
class FormData {
  _parts: Array<FormDataNameValuePair>;

  constructor() {
    this._parts = [];
  }

  append(key: string, value: FormDataValue) {
    // The XMLHttpRequest spec doesn't specify if duplicate keys are allowed.
    // MDN says that any new values should be appended to existing values.
    // In any case, major browsers allow duplicate keys, so that's what we'll do
    // too. They'll simply get appended as additional form data parts in the
    // request body, leaving the server to deal with them.
    this._parts.push([key, value]);
  }

  getAll(key: string): Array<FormDataValue> {
    return this._parts
      .filter(([name]) => name === key)
      .map(([, value]) => value);
  }

  getParts(): Array<FormDataPart> {
    return this._parts.map(([name, value]) => {
      const contentDisposition = 'form-data; name="' + name + '"';
      const headers: Headers = {'content-disposition': contentDisposition};

      if (typeof value === 'object' && !Array.isArray(value) && value) {
        if (typeof value.type === 'string') {
          headers['content-type'] = value.type;
        }

        // The body part is a "blob", which in React Native just means
        // an object with a `uri` attribute. Optionally, it can also
        // have a `name` and `type` attribute to specify filename and
        // content type (cf. web Blob interface.)
        if (typeof value.uri === 'string') {
          if (typeof value.name === 'string') {
            headers['content-disposition'] += `; filename="${
              value.name
            }"; filename*=utf-8''${encodeURI(value.name)}`;
          }
          return {...value, headers, fieldName: name};
        }

        // The body part is a "string object", which in React Native just means
        // an object with a `string` attribute. Optionally, it can also
        // `type` attribute to specify content type
        if (typeof value.string === 'string') {
          return {string: String(value.string), headers, fieldName: name};
        }
      }

      // Convert non-object values to strings as per FormData.append() spec
      return {string: String(value), headers, fieldName: name};
    });
  }
}

module.exports = FormData;
