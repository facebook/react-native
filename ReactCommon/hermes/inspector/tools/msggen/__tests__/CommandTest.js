/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

import { Command } from '../src/Command.js';

test('parses simple command', () => {
  let obj = {
    "name": "setBreakpointsActive",
    "parameters": [
      { "name": "active", "type": "boolean", "description": "New value for breakpoints active state." }
    ],
    "description": "Activates / deactivates all breakpoints on the page."
  };
  let command = Command.create('Debugger', obj, false);

  expect(command.domain).toBe('Debugger');
  expect(command.name).toBe('setBreakpointsActive');
  expect(command.description).toBe('Activates / deactivates all breakpoints on the page.');
  expect(command.parameters.map(p => p.name)).toEqual(['active']);
  expect(command.returns.length).toBe(0);

  expect(command.getDebuggerName()).toBe('Debugger.setBreakpointsActive');
  expect(command.getCppNamespace()).toBe('debugger');
  expect(command.getRequestCppType()).toBe('SetBreakpointsActiveRequest');
  expect(command.getResponseCppType()).toBeUndefined();
  expect(command.getForwardDecls()).toEqual(['struct SetBreakpointsActiveRequest;']);
});

test('parses command with return', () => {
  let obj = {
    "name": "setBreakpoint",
    "parameters": [
      { "name": "location", "$ref": "Location", "description": "Location to set breakpoint in." },
      { "name": "condition", "type": "string", "optional": true, "description": "Expression to use as a breakpoint condition. When specified, debugger will only stop on the breakpoint if this expression evaluates to true." }
    ],
    "returns": [
      { "name": "breakpointId", "$ref": "BreakpointId", "description": "Id of the created breakpoint for further reference." },
      { "name": "actualLocation", "$ref": "Location", "description": "Location this breakpoint resolved into." }
    ],
    "description": "Sets JavaScript breakpoint at a given location."
  };
  let command = Command.create('Debugger', obj, false);

  expect(command.domain).toBe('Debugger');
  expect(command.name).toBe('setBreakpoint');
  expect(command.description).toBe('Sets JavaScript breakpoint at a given location.');
  expect(command.parameters.map(p => p.name)).toEqual(['location', 'condition']);
  expect(command.returns.map(p => p.name)).toEqual(['breakpointId', 'actualLocation']);

  expect(command.getDebuggerName()).toBe('Debugger.setBreakpoint');
  expect(command.getCppNamespace()).toBe('debugger');
  expect(command.getRequestCppType()).toBe('SetBreakpointRequest');
  expect(command.getResponseCppType()).toBe('SetBreakpointResponse');
  expect(command.getForwardDecls()).toEqual([
    'struct SetBreakpointRequest;',
    'struct SetBreakpointResponse;',
  ]);
});
