/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 *
 */
'use strict';

const chalk = require('chalk');
const os = require('os');
const pkgjson = require('../../../package.json');

const {EventEmitter} = require('events');

import type {
  ActionLogEntryData,
  ActionStartLogEntry,
  LogEntry,
} from './Types';

const DATE_LOCALE_OPTIONS = {
  day: '2-digit',
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
  second: '2-digit',
  year: 'numeric',
};

let PRINT_LOG_ENTRIES = true;
const log_session = `${os.hostname()}-${Date.now()}`;
const eventEmitter = new EventEmitter();

function on(event: string, handler: (logEntry: LogEntry) => void): void {
  eventEmitter.on(event, handler);
}

function createEntry(data: LogEntry | string): LogEntry {
  const logEntry = typeof data === 'string' ? {log_entry_label: data} : data;

  return {
    ...logEntry,
    log_session,
    packager_version: pkgjson.version,
  };
}

function createActionStartEntry(data: ActionLogEntryData | string): LogEntry {
  const logEntry = typeof data === 'string' ? {action_name: data} : data;
  const {action_name} = logEntry;

  return createEntry({
    ...logEntry,
    action_name,
    action_phase: 'start',
    log_entry_label: action_name,
    start_timestamp: process.hrtime(),
  });
}

function createActionEndEntry(logEntry: ActionStartLogEntry): LogEntry {
  const {
    action_name,
    action_phase,
    start_timestamp,
  } = logEntry;

  if (action_phase !== 'start' || !Array.isArray(start_timestamp)) {
    throw new Error('Action has not started or has already ended');
  }

  const timeDelta = process.hrtime(start_timestamp);
  const duration_ms = Math.round((timeDelta[0] * 1e9 + timeDelta[1]) / 1e6);

  return createEntry({
    ...logEntry,
    action_name,
    action_phase: 'end',
    duration_ms,
    log_entry_label: action_name,
  });
}

function log(logEntry: LogEntry): LogEntry {
  eventEmitter.emit('log', logEntry);
  return logEntry;
}

function print(
  logEntry: LogEntry,
  printFields?: Array<string> = [],
): LogEntry {
  if (!PRINT_LOG_ENTRIES) {
    return logEntry;
  }
  const {
    log_entry_label: logEntryLabel,
    action_phase: actionPhase,
    duration_ms: duration,
  } = logEntry;

  const timeStamp = new Date().toLocaleString(undefined, DATE_LOCALE_OPTIONS);
  let logEntryString;

  switch (actionPhase) {
    case 'start':
      logEntryString = chalk.dim(`[${timeStamp}] <START> ${logEntryLabel}`);
      break;
    case 'end':
      logEntryString = chalk.dim(`[${timeStamp}] <END>   ${logEntryLabel}`) +
        chalk.cyan(` (${+duration}ms)`);
      break;
    default:
      logEntryString = chalk.dim(`[${timeStamp}]         ${logEntryLabel}`);
      break;
  }

  if (printFields.length) {
    const indent = ' '.repeat(timeStamp.length + 11);

    for (const field of printFields) {
      const value = logEntry[field];
      if (value === undefined) {
        continue;
      }
      logEntryString += chalk.dim(`\n${indent}${field}: ${value.toString()}`);
    }
  }

  // eslint-disable-next-line no-console-disallow
  console.log(logEntryString);

  return logEntry;
}

function enablePrinting(): void {
  PRINT_LOG_ENTRIES = true;
}

function disablePrinting(): void {
  PRINT_LOG_ENTRIES = false;
}

module.exports = {
  on,
  createEntry,
  createActionStartEntry,
  createActionEndEntry,
  log,
  print,
  enablePrinting,
  disablePrinting,
};
