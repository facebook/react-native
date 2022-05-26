/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Type} from '../src/Type.js';

test('parses primitive type', () => {
  let obj = {
    'id': 'Timestamp',
    'type': 'number',
    'description': 'Number of milliseconds since epoch.',
  };
  let type = Type.create('Runtime', obj, false);

  expect(type.domain).toBe('Runtime');
  expect(type.id).toBe('Timestamp');
  expect(type.type).toBe('number');
  expect(type.description).toBe('Number of milliseconds since epoch.');

  expect(type.getCppNamespace()).toBe('runtime');
  expect(type.getCppType()).toBe('Timestamp');
  expect(type.getForwardDecls()).toEqual(['using Timestamp = double;']);
});

test('parses object type', () => {
  let obj = {
    'id': 'Location',
    'type': 'object',
    'properties': [
        { 'name': 'scriptId', '$ref': 'Runtime.ScriptId', 'description': 'Script identifier as reported in the <code>Debugger.scriptParsed</code>.' },
        { 'name': 'lineNumber', 'type': 'integer', 'description': 'Line number in the script (0-based).' },
        { 'name': 'columnNumber', 'type': 'integer', 'optional': true, 'description': 'Column number in the script (0-based).' },
    ],
    'description': 'Location in the source code.',
  };
  let type = Type.create('Debugger', obj, false);

  expect(type.domain).toBe('Debugger');
  expect(type.id).toBe('Location');
  expect(type.type).toBe('object');
  expect(type.properties.map(p => p.name)).toEqual(['scriptId', 'lineNumber', 'columnNumber']);
  expect(type.description).toBe('Location in the source code.');

  expect(type.getCppNamespace()).toBe('debugger');
  expect(type.getCppType()).toBe('Location');
  expect(type.getForwardDecls()).toEqual(['struct Location;']);
});
