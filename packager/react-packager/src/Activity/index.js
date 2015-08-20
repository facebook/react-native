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

const COLLECTION_PERIOD = 1000;

const _endedEvents = Object.create(null);
const _eventStarts = Object.create(null);
const _queuedActions = [];
const _eventEmitter = new events.EventEmitter();

let _scheduledCollectionTimer = null;
let _uuid = 1;
let _enabled = true;

function endEvent(eventId) {
  const eventEndTime = Date.now();

  if (!_eventStarts[eventId]) {
    _throw('event(' + eventId + ') is not a valid event id!');
  }

  if (_endedEvents[eventId]) {
    _throw('event(' + eventId + ') has already ended!');
  }

  _scheduleAction({
    action: 'endEvent',
    eventId: eventId,
    tstamp: eventEndTime
  });
  _endedEvents[eventId] = true;
}

function signal(eventName, data) {
  const signalTime = Date.now();

  if (eventName == null) {
    _throw('No event name specified');
  }

  if (data == null) {
    data = null;
  }

  _scheduleAction({
    action: 'signal',
    data: data,
    eventName: eventName,
    tstamp: signalTime
  });
}

function startEvent(eventName, data) {
  const eventStartTime = Date.now();

  if (eventName == null) {
    _throw('No event name specified');
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
  _scheduleAction(action);
  _eventStarts[eventId] = action;

  return eventId;
}

function disable() {
  _enabled = false;
}

function _runCollection() {
  /* jshint -W084 */
  let action;
  while ((action = _queuedActions.shift())) {
    _writeAction(action);
  }

  _scheduledCollectionTimer = null;
}

function _scheduleAction(action) {
  _queuedActions.push(action);
  _eventEmitter.emit(action.action, action);

  if (_scheduledCollectionTimer === null) {
    _scheduledCollectionTimer = setTimeout(_runCollection, COLLECTION_PERIOD);
  }
}

/**
 * This a utility function that throws an error message.
 *
 * The only purpose of this utility is to make APIs like
 * startEvent/endEvent/signal inlineable in the JIT.
 *
 * (V8 can't inline functions that statically contain a `throw`, and probably
 *  won't be adding such a non-trivial optimization anytime soon)
 */
function _throw(msg) {
  const err = new Error(msg);

  // Strip off the call to _throw()
  const stack = err.stack.split('\n');
  stack.splice(1, 1);
  err.stack = stack.join('\n');

  throw err;
}

function _writeAction(action) {
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

    case 'signal':
      console.log(
        '[' + fmtTime + '] ' +
        '        ' + action.eventName + '' +
        data
      );
      break;

    default:
      _throw('Unexpected scheduled action type: ' + action.action);
  }
}


exports.endEvent = endEvent;
exports.signal = signal;
exports.startEvent = startEvent;
exports.disable = disable;
exports.eventEmitter = _eventEmitter;
