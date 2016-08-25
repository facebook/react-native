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

import type {EventOptions} from './Types';
import type {Event} from './Types';

const chalk = require('chalk');
const events = require('events');

let ENABLED = true;
let UUID = 1;

const EVENT_INDEX: {[key: number]: Event} = Object.create(null);
const EVENT_EMITTER = new events.EventEmitter();

function startEvent(
  name: string,
  data: any = null,
  options?: EventOptions = {telemetric: false},
): number {
  if (name == null) {
    throw new Error('No event name specified!');
  }

  const id = UUID++;
  EVENT_INDEX[id] = {
    id,
    startTimeStamp: Date.now(),
    name,
    data,
    options,
  };
  logEvent(id, 'startEvent');
  return id;
}

function endEvent(id: number): void {
  getEvent(id).endTimeStamp = Date.now();
  logEvent(id, 'endEvent');
}

function getEvent(id: number): Event {
  if (!EVENT_INDEX[id]) {
    throw new Error(`Event(${id}) either ended or never started`);
  }

  return EVENT_INDEX[id];
}

function forgetEvent(id: number): void {
  delete EVENT_INDEX[id];
}

function logEvent(id: number, phase: 'startEvent' | 'endEvent'): void {
  const event = EVENT_INDEX[id];
  EVENT_EMITTER.emit(phase, id);

  if (!ENABLED) {
    return;
  }

  const {
    startTimeStamp,
    endTimeStamp,
    name,
    data,
    options,
  } = event;

  const duration = +endTimeStamp - startTimeStamp;
  const dataString = data ? ': ' + JSON.stringify(data) : '';
  const {telemetric} = options;

  switch (phase) {
    case 'startEvent':
      // eslint-disable-next-line no-console-disallow
      console.log(
        chalk.dim(
          '[' + new Date(startTimeStamp).toLocaleString() + '] ' +
          '<START> ' + name + dataString
        )
      );
      break;

    case 'endEvent':
      // eslint-disable-next-line no-console-disallow
      console.log(
        chalk.dim('[' + new Date(endTimeStamp).toLocaleString() + '] ' + '<END>   ' + name) +
        chalk.dim(dataString) +
        (telemetric ? chalk.reset.cyan(' (' + (duration) + 'ms)') : chalk.dim(' (' + (duration) + 'ms)'))
      );
      forgetEvent(id);
      break;

    default:
      throw new Error('Unexpected scheduled event type: ' + name);
  }
}

function enable(): void {
  ENABLED = true;
}

function disable(): void {
  ENABLED = false;
}

module.exports = {
  startEvent,
  endEvent,
  getEvent,
  forgetEvent,
  enable,
  disable,
  eventEmitter: EVENT_EMITTER,
};
