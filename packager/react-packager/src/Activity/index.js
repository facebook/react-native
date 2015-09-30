/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');
const events = require('events');

const _eventStarts = Object.create(null);
const _eventEmitter = new events.EventEmitter();

let _uuid = 1;
let _enabled = true;

function endEvent(eventId) {
  const eventEndTime = Date.now();
  if (!_eventStarts[eventId]) {
    throw new Error('event(' + eventId + ') either ended or never started');
  }

  _writeAction({
    action: 'endEvent',
    eventId: eventId,
    tstamp: eventEndTime
  });
}

function startEvent(eventName, data) {
  const eventStartTime = Date.now();

  if (eventName == null) {
    throw new Error('No event name specified');
  }

  if (data == null) {
    data = null;
  }

  const eventId = _uuid++;
  const action = {
    action: 'startEvent',
    data: data,
    eventId: eventId,
    eventName: eventName,
    tstamp: eventStartTime,
  };
  _eventStarts[eventId] = action;
  _writeAction(action);

  return eventId;
}

function disable() {
  _enabled = false;
}

function _writeAction(action) {
  _eventEmitter.emit(action.action, action);

  if (!_enabled) {
    return;
  }

  const data = action.data ? ': ' + JSON.stringify(action.data) : '';
  const fmtTime = new Date(action.tstamp).toLocaleTimeString();

  switch (action.action) {
    case 'startEvent':
      console.log(chalk.dim(
        '[' + fmtTime + '] ' +
        '<START> ' + action.eventName +
        data
      ));
      break;

    case 'endEvent':
      const startAction = _eventStarts[action.eventId];
      const startData = startAction.data ? ': ' + JSON.stringify(startAction.data) : '';
      console.log(chalk.dim(
        '[' + fmtTime + '] ' +
        '<END>   ' + startAction.eventName +
        ' (' + (action.tstamp - startAction.tstamp) + 'ms)' +
        startData
      ));
      delete _eventStarts[action.eventId];
      break;

    default:
      throw new Error('Unexpected scheduled action type: ' + action.action);
  }
}


exports.endEvent = endEvent;
exports.startEvent = startEvent;
exports.disable = disable;
exports.eventEmitter = _eventEmitter;
