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
import LogBoxLogParser from './LogBoxLogParser';

export type LogBoxLogs = Array<LogBoxLog>;
export type LogBoxLogsStore = Set<LogBoxLog>;

export type Observer = (logs: LogBoxLogs) => void;

export type IgnorePattern = string | RegExp;

export type Subscription = $ReadOnly<{|
  unsubscribe: () => void,
|}>;

const observers: Set<{observer: Observer}> = new Set();
const ignorePatterns: Set<IgnorePattern> = new Set();
const logs: LogBoxLogsStore = new Set();

let _isDisabled = false;
let updateTimeout = null;

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
      const logsArray = _isDisabled ? [] : Array.from(logs);
      for (const {observer} of observers) {
        observer(logsArray);
      }
    });
  }
}

export function add({
  args,
}: $ReadOnly<{|
  args: $ReadOnlyArray<mixed>,
|}>): void {
  // This is carried over from the old YellowBox, but it is not clear why.
  if (typeof args[0] === 'string' && args[0].startsWith('(ADVICE)')) {
    return;
  }

  const {category, message, stack, componentStack} = LogBoxLogParser({
    args,
  });

  // In most cases, the "last log" will be the "last log not ignored".
  // This will result in out of order logs when we display ignored logs,
  // but is a reasonable compromise.
  const lastLog = Array.from(logs)
    .filter(log => !log.ignored)
    .pop();

  // If the next log has the same category as the previous one
  // then we want to roll it up into the last log in the list
  // by incrementing the count (simar to how Chrome does it).
  if (lastLog && lastLog.category === category) {
    lastLog.incrementCount();
  } else {
    logs.add(
      new LogBoxLog(
        message,
        stack,
        category,
        componentStack,
        isMessageIgnored(message.content),
      ),
    );
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

    // We need to update all of the ignore flags in the existing logs.
    // This allows adding an ignore pattern anywhere in the codebase.
    // Without this, if you ignore a pattern after the a log is created,
    // then we would always show the log.
    for (let log of logs) {
      log.ignored = isMessageIgnored(log.message.content);
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

  const logsToObserve = _isDisabled ? [] : logs;
  observer(Array.from(logsToObserve));

  return {
    unsubscribe(): void {
      observers.delete(subscription);
    },
  };
}
