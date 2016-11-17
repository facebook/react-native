/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * eslint-disable no-console-disallow
 *
 */
'use strict';

jest.disableAutomock();

const {
  createEntry,
  createActionStartEntry,
  createActionEndEntry,
  enablePrinting,
} = require('../');

describe('Logger', () => {
  const originalConsoleLog = console.log;

  beforeEach(() => {
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    enablePrinting();
  });

  it('creates simple log entries', () => {
    const logEntry = createEntry('Test');
    expect(logEntry).toEqual({
      log_entry_label: 'Test',
      log_session: jasmine.any(String),
    });
  });

  it('creates action start log entries', () => {
    const actionStartLogEntry = createActionStartEntry('Test');
    expect(actionStartLogEntry).toEqual({
      action_name: 'Test',
      action_phase: 'start',
      log_entry_label: 'Test',
      log_session: jasmine.any(String),
      start_timestamp: jasmine.any(Object),
    });
  });

  it('creates action end log entries', () => {
    const actionEndLogEntry = createActionEndEntry(createActionStartEntry('Test'));
    expect(actionEndLogEntry).toEqual({
      action_name: 'Test',
      action_phase: 'end',
      duration_ms: jasmine.any(Number),
      log_entry_label: 'Test',
      log_session: jasmine.any(String),
      start_timestamp: jasmine.any(Object),
    });
  });
});
