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
  options?: EventOptions = {},
): number {
  if (name == null) {
    throw new Error('No event name specified!');
  }

  const id = UUID++;
  EVENT_INDEX[id] = {
    id,
    startTimeStamp: process.hrtime(),
    name,
    data,
    options,
  };
  logEvent(id, 'startEvent');
  return id;
}

function endEvent(id: number): void {
  const event = getEvent(id);
  const delta = process.hrtime(event.startTimeStamp);
  event.durationMs = Math.round((delta[0] * 1e9 + delta[1]) / 1e6);
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
  const event = getEvent(id);
  EVENT_EMITTER.emit(phase, id);

  if (!ENABLED) {
    return;
  }

  const {
    name,
    durationMs,
    data,
    options,
  } = event;

  const logTimeStamp = new Date().toLocaleString();
  const dataString = data ? ': ' + JSON.stringify(data) : '';
  const {telemetric, silent} = options;

  switch (phase) {
    case 'startEvent':
      if (!silent) {
        // eslint-disable-next-line no-console-disallow
        console.log(chalk.dim(`[${logTimeStamp}] <START> ${name}${dataString}`));
      }
      break;

    case 'endEvent':
      if (!silent) {
        // eslint-disable-next-line no-console-disallow
        console.log(
          chalk.dim(`[${logTimeStamp}] <END>   ${name}${dataString} `) +
          (telemetric ? chalk.reset.cyan(`(${+durationMs}ms)`) : chalk.dim(`(${+durationMs}ms)`))
        );
      }
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
