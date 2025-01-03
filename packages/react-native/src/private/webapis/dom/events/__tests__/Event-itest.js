/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_flags enableAccessToHostTreeInFabric:true
 */

import '../../../../../../Libraries/Core/InitializeCore.js';

import Event from '../Event';
import {setInPassiveListenerFlag} from '../internals/EventInternals';

describe('Event', () => {
  it('should throw an error if type is not passed', () => {
    expect(() => {
      // $FlowExpectedError[incompatible-call]
      return new Event();
    }).toThrow(
      "Failed to construct 'Event': 1 argument required, but only 0 present.",
    );
  });

  it('should throw an error if the given options is not an object, null or undefined', () => {
    expect(() => {
      // $FlowExpectedError[incompatible-call]
      return new Event('custom', 1);
    }).toThrow(
      "Failed to construct 'Event': The provided value is not of type 'EventInit'.",
    );

    expect(() => {
      // $FlowExpectedError[incompatible-call]
      return new Event('custom', '1');
    }).toThrow(
      "Failed to construct 'Event': The provided value is not of type 'EventInit'.",
    );

    expect(() => {
      return new Event('custom', null);
    }).not.toThrow();

    expect(() => {
      return new Event('custom', undefined);
    }).not.toThrow();

    expect(() => {
      return new Event('custom', {});
    }).not.toThrow();
  });

  it('should have default values for as a non-dispatched event', () => {
    const event = new Event('custom');

    expect(event.currentTarget).toBe(null);
    expect(event.defaultPrevented).toBe(false);
    expect(event.eventPhase).toBe(Event.NONE);
    expect(event.isTrusted).toBe(false);
    expect(event.target).toBe(null);
    expect(event.composedPath()).toEqual([]);
  });

  it('should initialize the event with the given options', () => {
    const eventWithDefaults = new Event('custom');

    expect(eventWithDefaults.type).toBe('custom');
    expect(eventWithDefaults.bubbles).toBe(false);
    expect(eventWithDefaults.cancelable).toBe(false);
    expect(eventWithDefaults.composed).toBe(false);

    const eventWithAllOptionsSet = new Event('custom', {
      bubbles: true,
      cancelable: true,
      composed: true,
    });

    expect(eventWithAllOptionsSet.type).toBe('custom');
    expect(eventWithAllOptionsSet.bubbles).toBe(true);
    expect(eventWithAllOptionsSet.cancelable).toBe(true);
    expect(eventWithAllOptionsSet.composed).toBe(true);
  });

  it('should set the timestamp with the current high resolution time', () => {
    const lowerBoundTimestamp = performance.now();
    const event = new Event('type');
    const upperBoundTimestamp = performance.now();

    expect(event.timeStamp).toBeGreaterThanOrEqual(lowerBoundTimestamp);
    expect(event.timeStamp).toBeLessThanOrEqual(upperBoundTimestamp);
  });

  describe('preventDefault', () => {
    it('does nothing with non-cancelable events', () => {
      const event = new Event('custom', {
        cancelable: false,
      });

      expect(event.defaultPrevented).toBe(false);

      event.preventDefault();

      expect(event.defaultPrevented).toBe(false);
    });

    it('cancels cancelable events', () => {
      const event = new Event('custom', {
        cancelable: true,
      });

      expect(event.defaultPrevented).toBe(false);

      event.preventDefault();

      expect(event.defaultPrevented).toBe(true);
    });

    it('does not cancel events with the "in passive listener" flag set, and logs an error', () => {
      const event = new Event('custom', {
        cancelable: true,
      });

      expect(event.defaultPrevented).toBe(false);

      setInPassiveListenerFlag(event, true);

      const previousConsoleError = console.error;
      const mockConsoleError = jest.fn();
      try {
        // $FlowExpectedError[cannot-write]
        console.error = mockConsoleError;
        event.preventDefault();
      } finally {
        // $FlowExpectedError[cannot-write]
        console.error = previousConsoleError;
      }

      expect(event.defaultPrevented).toBe(false);

      expect(mockConsoleError).toHaveBeenCalledTimes(1);
      const reportedError = mockConsoleError.mock.lastCall[0];
      expect(reportedError).toBeInstanceOf(Error);
      expect(reportedError.message).toBe(
        'Unable to preventDefault inside passive event listener invocation.',
      );
    });
  });
});
