/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {expectCodeIsEqual, FakeWritable} from '../src/TestHelpers';
import {
  emitNotificationDef,
  emitRequestDef,
  emitResponseDef,
  emitTypeDef,
} from '../src/ImplementationWriter';
import { Event } from '../src/Event';
import { Command } from '../src/Command';
import { Type } from '../src/Type';

let stream = null;

beforeEach(() => {
  stream = new FakeWritable();
});

test('emits type def', () => {
  let obj = {
    'id': 'Location',
    'type': 'object',
    'properties': [
        { 'name': 'scriptId', '$ref': 'Runtime.ScriptId', 'description': 'Script identifier as reported in the <code>Debugger.scriptParsed</code>.' },
        { 'name': 'lineNumber', 'type': 'integer', 'description': 'Line number in the script (0-based).' },
        { 'name': 'columnNumber', 'type': 'integer', 'optional': true, 'description': 'Column number in the script (0-based).' },
    ],
    'description': 'Location in the source code.',
  };
  let type = Type.create('Debugger', obj);

  emitTypeDef(stream, type);

  expectCodeIsEqual(stream.get(), `
    debugger::Location::Location(const dynamic &obj) {
      assign(scriptId, obj, "scriptId");
      assign(lineNumber, obj, "lineNumber");
      assign(columnNumber, obj, "columnNumber");
    }

    dynamic debugger::Location::toDynamic() const {
      dynamic obj = dynamic::object;
      put(obj, "scriptId", scriptId);
      put(obj, "lineNumber", lineNumber);
      put(obj, "columnNumber", columnNumber);
      return obj;
    }
  `);
});

test('emits request def', () => {
  let obj = {
    'name': 'getScriptSource',
    'parameters': [
      { 'name': 'scriptId', '$ref': 'Runtime.ScriptId', 'description': 'Id of the script to get source for.' },
    ],
    'returns': [
      { 'name': 'scriptSource', 'type': 'string', 'description': 'Script source.' },
    ],
    'description': 'Returns source for the script with given id.',
  };
  let command = Command.create('Debugger', obj);

  emitRequestDef(stream, command);

  expectCodeIsEqual(stream.get(), `
    debugger::GetScriptSourceRequest::GetScriptSourceRequest()
      : Request("Debugger.getScriptSource") {}

    debugger::GetScriptSourceRequest::GetScriptSourceRequest(const dynamic &obj)
        : Request("Debugger.getScriptSource") {
      assign(id, obj, "id");
      assign(method, obj, "method");

      dynamic params = obj.at("params");
      assign(scriptId, params, "scriptId");
    }

    dynamic debugger::GetScriptSourceRequest::toDynamic() const {
      dynamic params = dynamic::object;
      put(params, "scriptId", scriptId);

      dynamic obj = dynamic::object;
      put(obj, "id", id);
      put(obj, "method", method);
      put(obj, "params", std::move(params));
      return obj;
    }

    void debugger::GetScriptSourceRequest::accept(RequestHandler &handler) const {
      handler.handle(*this);
    }
  `);
});

test('emits response def', () => {
  let obj = {
    'name': 'getScriptSource',
    'parameters': [
      { 'name': 'scriptId', '$ref': 'Runtime.ScriptId', 'description': 'Id of the script to get source for.' },
    ],
    'returns': [
      { 'name': 'scriptSource', 'type': 'string', 'description': 'Script source.' },
    ],
    'description': 'Returns source for the script with given id.',
  };
  let command = Command.create('Debugger', obj);

  emitResponseDef(stream, command);

  expectCodeIsEqual(stream.get(), `
    debugger::GetScriptSourceResponse::GetScriptSourceResponse(const dynamic &obj) {
      assign(id, obj, "id");

      dynamic res = obj.at("result");
      assign(scriptSource, res, "scriptSource");
    }

    dynamic debugger::GetScriptSourceResponse::toDynamic() const {
      dynamic res = dynamic::object;
      put(res, "scriptSource", scriptSource);

      dynamic obj = dynamic::object;
      put(obj, "id", id);
      put(obj, "result", std::move(res));
      return obj;
    }
  `);
});

test('emits notification def', () => {
  let obj = {
    'name': 'messageAdded',
    'parameters': [
      { 'name': 'message', '$ref': 'ConsoleMessage', 'description': 'Console message that has been added.' },
    ],
    'description': 'Issued when new console message is added.',
  };
  let event = Event.create('Console', obj);

  emitNotificationDef(stream, event);

  expectCodeIsEqual(stream.get(), `
    console::MessageAddedNotification::MessageAddedNotification()
        : Notification("Console.messageAdded") {}

    console::MessageAddedNotification::MessageAddedNotification(const dynamic &obj)
        : Notification("Console.messageAdded") {
      assign(method, obj, "method");

      dynamic params = obj.at("params");
      assign(message, params, "message");
    }

    dynamic console::MessageAddedNotification::toDynamic() const {
      dynamic params = dynamic::object;
      put(params, "message", message);

      dynamic obj = dynamic::object;
      put(obj, "method", method);
      put(obj, "params", std::move(params));
      return obj;
    }
  `);
});
