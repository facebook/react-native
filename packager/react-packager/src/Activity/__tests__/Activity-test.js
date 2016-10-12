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
  // eslint-disable-next-line no-console-disallow
  const origConsoleLog = console.log;

  beforeEach(() => {
    // eslint-disable-next-line no-console-disallow
    console.log = jest.fn();
    jest.runOnlyPendingTimers();
  });

  afterEach(() => {
    // eslint-disable-next-line no-console-disallow
    console.log = origConsoleLog;
  });

  describe('startEvent', () => {
    it('writes the "START" phase of non-silent events to the console', () => {
      const EVENT_NAME = 'EVENT_NAME';
      const DATA = {someData: 42};

      Activity.startEvent(EVENT_NAME, DATA, {displayFields: ['someData']});
      jest.runOnlyPendingTimers();

      // eslint-disable-next-line no-console-disallow
      expect(console.log.mock.calls.length).toBe(1);
      // eslint-disable-next-line no-console-disallow
      const consoleMsg = console.log.mock.calls[0][0];
      expect(consoleMsg).toContain('START');
      expect(consoleMsg).toContain(EVENT_NAME);
      expect(consoleMsg).toContain('someData: 42');
    });

    it('does not write the "START" phase of silent events to the console', () => {
      const EVENT_NAME = 'EVENT_NAME';
      const DATA = {someData: 42};

      Activity.startEvent(EVENT_NAME, DATA, {silent: true});
      jest.runOnlyPendingTimers();

      // eslint-disable-next-line no-console-disallow
      expect(console.log.mock.calls.length).toBe(0);
    });
  });

  describe('endEvent', () => {
    it('writes the "END" phase of non-silent events to the console', () => {
      const EVENT_NAME = 'EVENT_NAME';
      const DATA = {someData: 42};

      const eventID = Activity.startEvent(EVENT_NAME, DATA, {displayFields: ['someData']});
      Activity.endEvent(eventID);
      jest.runOnlyPendingTimers();

      // eslint-disable-next-line no-console-disallow
      expect(console.log.mock.calls.length).toBe(2);
      // eslint-disable-next-line no-console-disallow
      const consoleMsg = console.log.mock.calls[1][0];
      expect(consoleMsg).toContain('END');
      expect(consoleMsg).toContain(EVENT_NAME);
      expect(consoleMsg).toContain('someData: 42');
    });

    it('does not write the "END" phase of silent events to the console', () => {
      const EVENT_NAME = 'EVENT_NAME';
      const DATA = {someData: 42};

      const eventID = Activity.startEvent(EVENT_NAME, DATA, {silent: true});
      Activity.endEvent(eventID);
      jest.runOnlyPendingTimers();

      // eslint-disable-next-line no-console-disallow
      expect(console.log.mock.calls.length).toBe(0);
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
