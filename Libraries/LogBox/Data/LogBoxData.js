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
import {parseLogBoxException} from './parseLogBoxLog';
import type {LogLevel} from './LogBoxLog';
import type {Message, Category, ComponentStack} from './parseLogBoxLog';
import parseErrorStack from '../../Core/Devtools/parseErrorStack';
import type {ExceptionData} from '../../Core/NativeExceptionsManager';

export type LogBoxLogs = Set<LogBoxLog>;
export type LogData = $ReadOnly<{|
  level: LogLevel,
  message: Message,
  category: Category,
  componentStack: ComponentStack,
|}>;

export type Observer = (
  $ReadOnly<{|logs: LogBoxLogs, isDisabled: boolean|}>,
) => void;

export type IgnorePattern = string | RegExp;

export type Subscription = $ReadOnly<{|
  unsubscribe: () => void,
|}>;

const observers: Set<{observer: Observer}> = new Set();
const ignorePatterns: Set<IgnorePattern> = new Set();
let logs: LogBoxLogs = new Set();
let updateTimeout = null;
let _isDisabled = false;

export function isMessageIgnored(message: string): boolean {
  for (const pattern of ignorePatterns) {
    if (
      (pattern instanceof RegExp && pattern.test(message)) ||
      (typeof pattern === 'string' && message.includes(pattern))
    ) {
      return true;
    }
  }
  return false;
}

function handleUpdate(): void {
  if (updateTimeout == null) {
    updateTimeout = setImmediate(() => {
      updateTimeout = null;
      observers.forEach(({observer}) =>
        observer({logs, isDisabled: _isDisabled}),
      );
    });
  }
}

export function addLog(log: LogData): void {
  const errorForStackTrace = new Error();

  // Parsing logs are expensive so we schedule this
  // otherwise spammy logs would pause rendering.
  setImmediate(() => {
    // TODO: Use Error.captureStackTrace on Hermes
    const stack = parseErrorStack(errorForStackTrace);

    // If the next log has the same category as the previous one
    // then we want to roll it up into the last log in the list
    // by incrementing the count (simar to how Chrome does it).
    const lastLog = Array.from(logs).pop();
    if (lastLog && lastLog.category === log.category) {
      lastLog.incrementCount();
    } else {
      logs.add(
        new LogBoxLog(
          log.level,
          log.message,
          stack,
          log.category,
          log.componentStack,
        ),
      );
    }

    handleUpdate();
  });
}

export function symbolicateLogNow(log: LogBoxLog) {
  log.symbolicate(() => {
    handleUpdate();
  });
}
export function retrySymbolicateLogNow(log: LogBoxLog) {
  log.retrySymbolicate(() => {
    handleUpdate();
  });
}

export function symbolicateLogLazy(log: LogBoxLog) {
  log.symbolicate();
}

export function addException(error: ExceptionData): void {
  // Parsing logs are expensive so we schedule this
  // otherwise spammy logs would pause rendering.
  setImmediate(() => {
    const {
      category,
      message,
      codeFrame,
      componentStack,
      stack,
      level,
    } = parseLogBoxException(error);

    // We don't want to store these logs because they trigger a
    // state update whenever we add them to the store, which is
    // expensive to noisy logs. If we later want to display these
    // we will store them in a different state object.
    if (isMessageIgnored(message.content)) {
      return;
    }

    const lastLog = Array.from(logs).pop();
    if (lastLog && lastLog.category === category) {
      lastLog.incrementCount();
    } else {
      const newLog = new LogBoxLog(
        level,
        message,
        stack,
        category,
        componentStack != null ? componentStack : [],
        codeFrame,
      );

      // Start symbolicating now so it's warm when it renders.
      if (level === 'fatal') {
        symbolicateLogLazy(newLog);
      }
      logs.add(newLog);
    }

    handleUpdate();
  });
}

export function clear(): void {
  if (logs.size > 0) {
    logs.clear();
    handleUpdate();
  }
}

export function clearWarnings(): void {
  const newLogs = Array.from(logs).filter(log => log.level !== 'warn');
  if (newLogs.length !== logs.size) {
    logs = new Set(newLogs);
    handleUpdate();
  }
}

export function clearErrors(): void {
  const newLogs = Array.from(logs).filter(log => log.level !== 'error');
  if (newLogs.length !== logs.size) {
    logs = new Set(newLogs);
    handleUpdate();
  }
}

export function clearSyntaxErrors(): void {
  const newLogs = Array.from(logs).filter(log => log.level !== 'syntax');
  if (newLogs.length !== logs.size) {
    logs = new Set(newLogs);
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
    logs = new Set(
      Array.from(logs).filter(log => !isMessageIgnored(log.message.content)),
    );
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

  observer({logs, isDisabled: _isDisabled});

  return {
    unsubscribe(): void {
      observers.delete(subscription);
    },
  };
}
