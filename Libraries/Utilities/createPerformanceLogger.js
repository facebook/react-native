/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const Systrace = require('../Performance/Systrace');

const infoLog = require('./infoLog');

export type Timespan = {
  startTime: number,
  endTime?: number,
  totalTime?: number,
  startExtras?: Extras,
  endExtras?: Extras,
};

// Extra values should be serializable primitives
export type ExtraValue = number | string | boolean;

export type Extras = {[key: string]: ExtraValue};

export interface IPerformanceLogger {
  addTimespan(
    key: string,
    startTime: number,
    endTime: number,
    startExtras?: Extras,
    endExtras?: Extras,
  ): void;
  append(logger: IPerformanceLogger): void;
  clear(): void;
  clearCompleted(): void;
  close(): void;
  currentTimestamp(): number;
  getExtras(): $ReadOnly<{[key: string]: ?ExtraValue, ...}>;
  getPoints(): $ReadOnly<{[key: string]: ?number, ...}>;
  getPointExtras(): $ReadOnly<{[key: string]: ?Extras, ...}>;
  getTimespans(): $ReadOnly<{[key: string]: ?Timespan, ...}>;
  hasTimespan(key: string): boolean;
  isClosed(): boolean;
  logEverything(): void;
  markPoint(key: string, timestamp?: number, extras?: Extras): void;
  removeExtra(key: string): ?ExtraValue;
  setExtra(key: string, value: ExtraValue): void;
  startTimespan(key: string, timestamp?: number, extras?: Extras): void;
  stopTimespan(key: string, timestamp?: number, extras?: Extras): void;
}

const _cookies: {[key: string]: number, ...} = {};

const PRINT_TO_CONSOLE: false = false; // Type as false to prevent accidentally committing `true`;

export const getCurrentTimestamp: () => number =
  global.nativeQPLTimestamp ?? global.performance.now.bind(global.performance);

class PerformanceLogger implements IPerformanceLogger {
  _timespans: {[key: string]: ?Timespan} = {};
  _extras: {[key: string]: ?ExtraValue} = {};
  _points: {[key: string]: ?number} = {};
  _pointExtras: {[key: string]: ?Extras, ...} = {};
  _closed: boolean = false;

  addTimespan(
    key: string,
    startTime: number,
    endTime: number,
    startExtras?: Extras,
    endExtras?: Extras,
  ) {
    if (this._closed) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog('PerformanceLogger: addTimespan - has closed ignoring: ', key);
      }
      return;
    }
    if (this._timespans[key]) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to add a timespan that already exists ',
          key,
        );
      }
      return;
    }

    this._timespans[key] = {
      startTime,
      endTime,
      totalTime: endTime - (startTime || 0),
      startExtras,
      endExtras,
    };
  }

  append(performanceLogger: IPerformanceLogger) {
    this._timespans = {
      ...performanceLogger.getTimespans(),
      ...this._timespans,
    };
    this._extras = {...performanceLogger.getExtras(), ...this._extras};
    this._points = {...performanceLogger.getPoints(), ...this._points};
    this._pointExtras = {
      ...performanceLogger.getPointExtras(),
      ...this._pointExtras,
    };
  }

  clear() {
    this._timespans = {};
    this._extras = {};
    this._points = {};
    if (PRINT_TO_CONSOLE) {
      infoLog('PerformanceLogger.js', 'clear');
    }
  }

  clearCompleted() {
    for (const key in this._timespans) {
      if (this._timespans[key]?.totalTime != null) {
        delete this._timespans[key];
      }
    }
    this._extras = {};
    this._points = {};
    if (PRINT_TO_CONSOLE) {
      infoLog('PerformanceLogger.js', 'clearCompleted');
    }
  }

  close() {
    this._closed = true;
  }

  currentTimestamp() {
    return getCurrentTimestamp();
  }

  getExtras() {
    return this._extras;
  }

  getPoints() {
    return this._points;
  }

  getPointExtras() {
    return this._pointExtras;
  }

  getTimespans() {
    return this._timespans;
  }

  hasTimespan(key: string) {
    return !!this._timespans[key];
  }

  isClosed() {
    return this._closed;
  }

  logEverything() {
    if (PRINT_TO_CONSOLE) {
      // log timespans
      for (const key in this._timespans) {
        if (this._timespans[key]?.totalTime != null) {
          infoLog(key + ': ' + this._timespans[key].totalTime + 'ms');
        }
      }

      // log extras
      infoLog(this._extras);

      // log points
      for (const key in this._points) {
        if (this._points[key] != null) {
          infoLog(key + ': ' + this._points[key] + 'ms');
        }
      }
    }
  }

  markPoint(
    key: string,
    timestamp?: number = getCurrentTimestamp(),
    extras?: Extras,
  ) {
    if (this._closed) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog('PerformanceLogger: markPoint - has closed ignoring: ', key);
      }
      return;
    }
    if (this._points[key] != null) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to mark a point that has been already logged ',
          key,
        );
      }
      return;
    }
    this._points[key] = timestamp;
    if (extras) {
      this._pointExtras[key] = extras;
    }
  }

  removeExtra(key: string): ?ExtraValue {
    const value = this._extras[key];
    delete this._extras[key];
    return value;
  }

  setExtra(key: string, value: ExtraValue) {
    if (this._closed) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog('PerformanceLogger: setExtra - has closed ignoring: ', key);
      }
      return;
    }

    if (this._extras.hasOwnProperty(key)) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to set an extra that already exists ',
          {key, currentValue: this._extras[key], attemptedValue: value},
        );
      }
      return;
    }
    this._extras[key] = value;
  }

  startTimespan(
    key: string,
    timestamp?: number = getCurrentTimestamp(),
    extras?: Extras,
  ) {
    if (this._closed) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog(
          'PerformanceLogger: startTimespan - has closed ignoring: ',
          key,
        );
      }
      return;
    }

    if (this._timespans[key]) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to start a timespan that already exists ',
          key,
        );
      }
      return;
    }

    this._timespans[key] = {
      startTime: timestamp,
      startExtras: extras,
    };
    _cookies[key] = Systrace.beginAsyncEvent(key);
    if (PRINT_TO_CONSOLE) {
      infoLog('PerformanceLogger.js', 'start: ' + key);
    }
  }

  stopTimespan(
    key: string,
    timestamp?: number = getCurrentTimestamp(),
    extras?: Extras,
  ) {
    if (this._closed) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog('PerformanceLogger: stopTimespan - has closed ignoring: ', key);
      }
      return;
    }

    const timespan = this._timespans[key];
    if (!timespan || timespan.startTime == null) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to end a timespan that has not started ',
          key,
        );
      }
      return;
    }
    if (timespan.endTime != null) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to end a timespan that has already ended ',
          key,
        );
      }
      return;
    }

    timespan.endExtras = extras;
    timespan.endTime = timestamp;
    timespan.totalTime = timespan.endTime - (timespan.startTime || 0);
    if (PRINT_TO_CONSOLE) {
      infoLog('PerformanceLogger.js', 'end: ' + key);
    }

    if (_cookies[key] != null) {
      Systrace.endAsyncEvent(key, _cookies[key]);
      delete _cookies[key];
    }
  }
}

/**
 * This function creates performance loggers that can be used to collect and log
 * various performance data such as timespans, points and extras.
 * The loggers need to have minimal overhead since they're used in production.
 */
export default function createPerformanceLogger(): IPerformanceLogger {
  return new PerformanceLogger();
}
