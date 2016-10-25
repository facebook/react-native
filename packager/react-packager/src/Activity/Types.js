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

export type Options = {
  telemetric?: boolean,
  silent?: boolean,
  displayFields?: Array<string> | true,
};

type EventFieldDescriptor = {
  type: 'int' | 'normal',
  value: number | string | boolean,
};

export type NormalisedEventData = {[key: string]: EventFieldDescriptor};

export type EventData = {[key: string]: number | string | boolean};

export type Event = {
  data: NormalisedEventData,
  durationMs?: number,
  id: number,
  name: string,
  options: Options,
  session: string,
  startTimeStamp: [number, number],
};
