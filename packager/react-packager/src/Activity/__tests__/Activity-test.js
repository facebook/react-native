/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.disableAutomock();

var Activity = require('../');

describe('Activity', () => {
  const origConsoleLog = console.log;

  beforeEach(() => {
    console.log = jest.fn();
    jest.runOnlyPendingTimers();
  });

  afterEach(() => {
    console.log = origConsoleLog;
  });

  describe('startEvent', () => {
    it('writes a START event out to the console', () => {
      const EVENT_NAME = 'EVENT_NAME';
      const DATA = {someData: 42};

      Activity.startEvent(EVENT_NAME, DATA);
      jest.runOnlyPendingTimers();

      expect(console.log.mock.calls.length).toBe(1);
      const consoleMsg = console.log.mock.calls[0][0];
      expect(consoleMsg).toContain('START');
      expect(consoleMsg).toContain(EVENT_NAME);
      expect(consoleMsg).toContain(JSON.stringify(DATA));
    });
  });

  describe('endEvent', () => {
    it('writes an END event out to the console', () => {
      const EVENT_NAME = 'EVENT_NAME';
      const DATA = {someData: 42};

      const eventID = Activity.startEvent(EVENT_NAME, DATA);
      Activity.endEvent(eventID);
      jest.runOnlyPendingTimers();

      expect(console.log.mock.calls.length).toBe(2);
      const consoleMsg = console.log.mock.calls[1][0];
      expect(consoleMsg).toContain('END');
      expect(consoleMsg).toContain(EVENT_NAME);
      expect(consoleMsg).toContain(JSON.stringify(DATA));
    });

    it('throws when called with an invalid eventId', () => {
      expect(() => Activity.endEvent(42)).toThrow();
    });

    it('throws when called with an expired eventId', () => {
      const eid = Activity.startEvent('', '');
      Activity.endEvent(eid);
      expect(() => {
        Activity.endEvent(eid);
      }).toThrow();
    });
  });
});
