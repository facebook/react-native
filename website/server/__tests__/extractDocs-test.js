/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

const fs = require('fs');
const parseSource = require('../extractDocs').parseSource;
const libs = __dirname + '/../../../Libraries/';

describe('parseSource', () => {
  it('should parse vibration code', () => {
    let path = libs + 'Vibration/Vibration.js';
    let code = fs.readFileSync(path).toString();
    let json = parseSource(code);
    expect(json).toBeTruthy();
  });

  it('should not parse invalid code', () => {
    let code = `
    for x in range(10):
      print 'oops this isnt python'
    `;
    expect(parseSource('fakepath', code)).toBeFalsy();
  });
});
