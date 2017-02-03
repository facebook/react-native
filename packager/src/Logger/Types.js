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

export type ActionLogEntryData = {
  action_name: string,
};

export type ActionStartLogEntry = {
  action_name?: string,
  action_phase?: string,
  log_entry_label: string,
  log_session?: string,
  start_timestamp?: [number, number],
};

export type LogEntry = {
  action_name?: string,
  action_phase?: string,
  duration_ms?: number,
  log_entry_label: string,
  log_session?: string,
  start_timestamp?: [number, number],
};
