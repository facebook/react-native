/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

('use strict');

import LogBoxLog from './LogBoxLog';
import parseLogBoxLog from './parseLogBoxLog';
import type {LogLevel} from './LogBoxLog';

export type LogBoxLogs = Set<LogBoxLog>;

export type Observer = (logs: LogBoxLogs) => void;

export type IgnorePattern = string | RegExp;

export type Subscription = $ReadOnly<{|
  unsubscribe: () => void,
|}>;

const observers: Set<{observer: Observer}> = new Set();
const ignorePatterns: Set<IgnorePattern> = new Set();
const logs: LogBoxLogs = new Set();
let updateTimeout = null;
let _isDisabled = false;

function isMessageIgnored(message: string): boolean {
  for (const pattern of ignorePatterns) {
    if (pattern instanceof RegExp && pattern.test(message)) {
      return true;
    } else if (typeof pattern === 'string' && message.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function handleUpdate(): void {
  if (updateTimeout == null) {
    updateTimeout = setImmediate(() => {
      updateTimeout = null;
      const logsSet = _isDisabled ? new Set() : logs;
      for (const {observer} of observers) {
        observer(logsSet);
      }
    });
  }
}

export function add(level: LogLevel, args: $ReadOnlyArray<mixed>): void {
  // This is carried over from the old YellowBox, but it is not clear why.
  if (typeof args[0] === 'string' && args[0].startsWith('(ADVICE)')) {
    return;
  }

  const {category, message, stack, componentStack} = parseLogBoxLog(args);

  // We don't want to store these logs because they trigger a
  // state update whenever we add them to the store, which is
  // expensive to noisy logs. If we later want to display these
  // we will store them in a different state object.
  if (isMessageIgnored(message.content)) {
    return;
  }

  // If the next log has the same category as the previous one
  // then we want to roll it up into the last log in the list
  // by incrementing the count (simar to how Chrome does it).
  const lastLog = Array.from(logs).pop();
  if (lastLog && lastLog.category === category) {
    lastLog.incrementCount();
  } else {
    logs.add(new LogBoxLog(level, message, stack, category, componentStack));
  }

  handleUpdate();
}

export function clear(): void {
  if (logs.size > 0) {
    logs.clear();
    handleUpdate();
  }
}

export function dismiss(log: LogBoxLog): void {
  if (logs.has(log)) {
    logs.delete(log);
    handleUpdate();
  }
}

export function addIgnorePatterns(
  patterns: $ReadOnlyArray<IgnorePattern>,
): void {
  // The same pattern may be added multiple times, but adding a new pattern
  // can be expensive so let's find only the ones that are new.
  const newPatterns = patterns.filter((pattern: IgnorePattern) => {
    if (pattern instanceof RegExp) {
      for (const existingPattern of ignorePatterns.entries()) {
        if (
          existingPattern instanceof RegExp &&
          existingPattern.toString() === pattern.toString()
        ) {
          return false;
        }
      }
      return true;
    }
    return !ignorePatterns.has(pattern);
  });

  if (newPatterns.length === 0) {
    return;
  }
  for (const pattern of newPatterns) {
    ignorePatterns.add(pattern);

    // We need to recheck all of the existing logs.
    // This allows adding an ignore pattern anywhere in the codebase.
    // Without this, if you ignore a pattern after the a log is created,
    // then we would keep showing the log.
    for (let log of logs) {
      if (isMessageIgnored(log.message.content)) {
        logs.delete(log);
      }
    }
  }
  handleUpdate();
}

export function setDisabled(value: boolean): void {
  if (value === _isDisabled) {
    return;
  }
  _isDisabled = value;
  handleUpdate();
}

export function isDisabled(): boolean {
  return _isDisabled;
}

export function observe(observer: Observer): Subscription {
  const subscription = {observer};
  observers.add(subscription);

  const logsToObserve = _isDisabled ? new Set() : logs;
  observer(logsToObserve);

  return {
    unsubscribe(): void {
      observers.delete(subscription);
    },
  };
}
