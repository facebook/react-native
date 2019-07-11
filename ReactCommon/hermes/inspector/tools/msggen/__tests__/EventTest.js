/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

import { Event } from '../src/Event.js';

test('parses simple event', () => {
  let obj = {
    "name": "resumed",
    "description": "Fired when the virtual machine resumed execution."
  };
  let event = Event.create('Debugger', obj, false);

  expect(event.domain).toBe('Debugger');
  expect(event.name).toBe('resumed');
  expect(event.description).toBe('Fired when the virtual machine resumed execution.');

  expect(event.getDebuggerName()).toBe('Debugger.resumed');
  expect(event.getCppNamespace()).toBe('debugger');
  expect(event.getCppType()).toBe('ResumedNotification');
  expect(event.getForwardDecls()).toEqual(['struct ResumedNotification;']);
});

test('parses event with params', () => {
  let obj = {
    "name": "breakpointResolved",
    "parameters": [
      { "name": "breakpointId", "$ref": "BreakpointId", "description": "Breakpoint unique identifier." },
      { "name": "location", "$ref": "Location", "description": "Actual breakpoint location." }
    ],
    "description": "Fired when breakpoint is resolved to an actual script and location."
  };
  let event = Event.create('Debugger', obj, false);

  expect(event.domain).toBe('Debugger');
  expect(event.name).toBe('breakpointResolved');
  expect(event.description).toBe('Fired when breakpoint is resolved to an actual script and location.');
  expect(event.parameters.map(p => p.name)).toEqual(['breakpointId', 'location']);

  expect(event.getDebuggerName()).toBe('Debugger.breakpointResolved');
  expect(event.getCppNamespace()).toBe('debugger');
  expect(event.getCppType()).toBe('BreakpointResolvedNotification');
  expect(event.getForwardDecls()).toEqual(['struct BreakpointResolvedNotification;']);
});
