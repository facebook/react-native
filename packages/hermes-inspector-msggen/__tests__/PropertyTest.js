/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Property} from '../src/Property.js';

test('parses required primitive prop', () => {
  let obj = {
    'name': 'lineNumber',
    'type': 'integer',
    'description': 'Line number in the script (0-based).',
  };
  let prop = Property.create('Debugger', obj);

  expect(prop.domain).toBe('Debugger');
  expect(prop.name).toBe('lineNumber');
  expect(prop.type).toBe('integer');
  expect(prop.optional).toBeUndefined();
  expect(prop.description).toBe('Line number in the script (0-based).');

  expect(prop.getFullCppType()).toBe('int');
  expect(prop.getCppIdentifier()).toBe('lineNumber');
  expect(prop.getInitializer()).toBe('{}');
});

test('parses optional primitive prop', () => {
  let obj = {
    'name': 'samplingInterval',
    'type': 'number',
    'optional': true,
    'description': 'Average sample interval in bytes.',
  };
  let prop = Property.create('HeapProfiler', obj);

  expect(prop.domain).toBe('HeapProfiler');
  expect(prop.name).toBe('samplingInterval');
  expect(prop.type).toBe('number');
  expect(prop.optional).toBe(true);
  expect(prop.description).toBe('Average sample interval in bytes.');

  expect(prop.getFullCppType()).toBe('std::optional<double>');
  expect(prop.getCppIdentifier()).toBe('samplingInterval');
  expect(prop.getInitializer()).toBe('');
});

test('parses optional ref prop', () => {
  let obj = {
    'name': 'exceptionDetails',
    'optional': true,
    '$ref': 'Runtime.ExceptionDetails',
    'description': 'Exception details if any.',
  };
  let prop = Property.create('Debugger', obj);

  expect(prop.domain).toBe('Debugger');
  expect(prop.name).toBe('exceptionDetails');
  expect(prop.optional).toBe(true);
  expect(prop.$ref).toBe('Runtime.ExceptionDetails');
  expect(prop.description).toBe('Exception details if any.');

  expect(prop.getFullCppType()).toBe('std::optional<runtime::ExceptionDetails>');
  expect(prop.getCppIdentifier()).toBe('exceptionDetails');
  expect(prop.getInitializer()).toBe('');
});

test('parses recursive ref prop', () => {
  let obj = {
    'name': 'parent',
    '$ref': 'StackTrace',
    'optional': true,
    'recursive': true,
    'description': 'Asynchronous JavaScript stack trace...',
  };
  let prop = Property.create('Runtime', obj);

  expect(prop.domain).toBe('Runtime');
  expect(prop.name).toBe('parent');
  expect(prop.optional).toBe(true);
  expect(prop.recursive).toBe(true);
  expect(prop.$ref).toBe('StackTrace');
  expect(prop.description).toBe('Asynchronous JavaScript stack trace...');

  expect(prop.getFullCppType()).toBe('std::unique_ptr<runtime::StackTrace>');
  expect(prop.getCppIdentifier()).toBe('parent');
  expect(prop.getInitializer()).toBe('');
});

test('parses optional array items prop', () => {
  let obj = {
    'name': 'hitBreakpoints',
    'type': 'array',
    'optional': true,
    'items': { 'type': 'string' },
    'description': 'Hit breakpoints IDs',
  };
  let prop = Property.create('Debugger', obj);

  expect(prop.domain).toBe('Debugger');
  expect(prop.name).toBe('hitBreakpoints');
  expect(prop.type).toBe('array');
  expect(prop.optional).toBe(true);
  expect(prop.items).toEqual({ 'type': 'string' });
  expect(prop.description).toBe('Hit breakpoints IDs');

  expect(prop.getFullCppType()).toBe('std::optional<std::vector<std::string>>');
  expect(prop.getCppIdentifier()).toBe('hitBreakpoints');
  expect(prop.getInitializer()).toBe('');
});

test('parses array ref prop', () => {
  let obj = {
    'name': 'domains',
    'type': 'array',
    'items': { '$ref': 'Domain' },
    'description': 'List of supported domains.',
  };
  let prop = Property.create('Schema', obj);

  expect(prop.domain).toBe('Schema');
  expect(prop.name).toBe('domains');
  expect(prop.type).toBe('array');
  expect(prop.items).toEqual({ $ref: 'Domain' });
  expect(prop.description).toBe('List of supported domains.');

  expect(prop.getFullCppType()).toBe('std::vector<schema::Domain>');
  expect(prop.getCppIdentifier()).toBe('domains');
  expect(prop.getInitializer()).toBe('');
});
