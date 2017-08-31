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
const path = require('path');

const jsDocs = require('../jsdocs');
const libs = path.join(__dirname, '/../../../Libraries/');

function checkWeCanParse(library) {
  const pathToCode = path.join(libs, library);
  const code = fs.readFileSync(pathToCode).toString();
  const json = jsDocs(code);
  expect(json).toBeTruthy();
}

describe('parseSource', () => {
  it('should parse Vibration.js', () => {
    checkWeCanParse('Vibration/Vibration.js');
  });

  it('should parse AsyncStorage.js', () => {
    checkWeCanParse('Storage/AsyncStorage.js');
  });

  it('should not parse invalid code', () => {
    const code = `
    for x in range(10):
      print 'oops this isnt python'
    `;
    expect(jsDocs('fakepath', code)).toBeFalsy();
  });
});
