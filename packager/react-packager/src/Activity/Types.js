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

export type EventOptions = {
  telemetric?: boolean,
  silent?: boolean,
};

export type Event = {
  id: number,
  startTimeStamp: [number, number],
  durationMs?: number,
  name: string,
  data?: any,
  options: EventOptions,
};
