/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {
  Extras,
  ExtraValue,
  IPerformanceLogger,
  Timespan,
} from './IPerformanceLogger';

import infoLog from './infoLog';

const PRINT_TO_CONSOLE: false = false; // Type as false to prevent accidentally committing `true`;

export const getCurrentTimestamp: () => number =
  global.nativeQPLTimestamp ?? (() => global.performance.now());

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

  currentTimestamp(): number {
    return getCurrentTimestamp();
  }

  getExtras(): {[key: string]: ?ExtraValue} {
    return this._extras;
  }

  getPoints(): {[key: string]: ?number} {
    return this._points;
  }

  getPointExtras(): {[key: string]: ?Extras} {
    return this._pointExtras;
  }

  getTimespans(): {[key: string]: ?Timespan} {
    return this._timespans;
  }

  hasTimespan(key: string): boolean {
    return !!this._timespans[key];
  }

  isClosed(): boolean {
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
  }
}

// Re-exporting for backwards compatibility with all the clients that
// may still import it from this module.
export type {Extras, ExtraValue, IPerformanceLogger, Timespan};

/**
 * This function creates performance loggers that can be used to collect and log
 * various performance data such as timespans, points and extras.
 * The loggers need to have minimal overhead since they're used in production.
 */
export default function createPerformanceLogger(): IPerformanceLogger {
  return new PerformanceLogger();
}
