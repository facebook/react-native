/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var COLLECTION_PERIOD = 1000;

var _endedEvents = Object.create(null);
var _eventStarts = Object.create(null);
var _queuedActions = [];
var _scheduledCollectionTimer = null;
var _uuid = 1;
var _enabled = true;

function endEvent(eventId) {
  var eventEndTime = Date.now();

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
  var signalTime = Date.now();

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
  var eventStartTime = Date.now();

  if (eventName == null) {
    _throw('No event name specified');
  }

  if (data == null) {
    data = null;
  }

  var eventId = _uuid++;
  var action = {
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
  var action;
  while ((action = _queuedActions.shift())) {
    _writeAction(action);
  }

  _scheduledCollectionTimer = null;
}

function _scheduleAction(action) {
  _queuedActions.push(action);

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
  var err = new Error(msg);

  // Strip off the call to _throw()
  var stack = err.stack.split('\n');
  stack.splice(1, 1);
  err.stack = stack.join('\n');

  throw err;
}

function _writeAction(action) {
  if (!_enabled) {
    return;
  }

  var data = action.data ? ': ' + JSON.stringify(action.data) : '';
  var fmtTime = new Date(action.tstamp).toLocaleTimeString();

  switch (action.action) {
    case 'startEvent':
      console.log(
        '[' + fmtTime + '] ' +
        '<START> ' + action.eventName +
        data
      );
      break;

    case 'endEvent':
      var startAction = _eventStarts[action.eventId];
      var startData = startAction.data ? ': ' + JSON.stringify(startAction.data) : '';
      console.log(
        '[' + fmtTime + '] ' +
        '<END>   ' + startAction.eventName +
        '(' + (action.tstamp - startAction.tstamp) + 'ms)' +
        startData
      );
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
