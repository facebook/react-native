/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FormData
 * @flow
 */
'use strict';

type FormDataValue = any;
type FormDataPart = [string, FormDataValue];

/**
 * Polyfill for XMLHttpRequest2 FormData API, allowing multipart POST requests
 * with mixed data (string, native files) to be submitted via XMLHttpRequest.
 */
class FormData {
  _parts: Array<FormDataPart>;
  _partsByKey: {[key: string]: FormDataPart};

  constructor() {
    this._parts = [];
    this._partsByKey = {};
  }

  append(key: string, value: FormDataValue) {
    var parts = this._partsByKey[key];
    if (parts) {
      // It's a bit unclear what the behaviour should be in this case.
      // The XMLHttpRequest spec doesn't specify it, while MDN says that
      // the any new values should appended to existing values. We're not
      // doing that for now -- it's tedious and doesn't seem worth the effort.
      parts[1] = value;
      return;
    }
    parts = [key, value];
    this._parts.push(parts);
    this._partsByKey[key] = parts;
  }

  getParts(): Array<FormDataValue> {
    return this._parts.map(([name, value]) => {
      if (typeof value === 'string') {
        return {
          string: value,
          headers: {
            'content-disposition': 'form-data; name="' + name + '"',
          },
        };
      }
      var contentDisposition = 'form-data; name="' + name + '"';
      if (typeof value.name === 'string') {
        contentDisposition += '; filename="' + value.name + '"';
      }
      return {
        ...value,
        headers: {'content-disposition': contentDisposition},
      };
    });
  }
}

module.exports = FormData;
