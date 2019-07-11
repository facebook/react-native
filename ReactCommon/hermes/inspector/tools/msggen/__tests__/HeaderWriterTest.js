/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

import { expectCodeIsEqual, FakeWritable } from '../src/TestHelpers';
import {
  emitNotificationDecl,
  emitRequestDecl,
  emitResponseDecl,
  emitTypeDecl,
} from '../src/HeaderWriter';
import { Event } from '../src/Event';
import { Command } from '../src/Command';
import { Type } from '../src/Type';

let stream = null;

beforeEach(() => {
  stream = new FakeWritable();
});

test('emits type decl', () => {
  let obj = {
    "id": "Location",
    "type": "object",
    "properties": [
        { "name": "scriptId", "$ref": "Runtime.ScriptId", "description": "Script identifier as reported in the <code>Debugger.scriptParsed</code>." },
        { "name": "lineNumber", "type": "integer", "description": "Line number in the script (0-based)." },
        { "name": "columnNumber", "type": "integer", "optional": true, "description": "Column number in the script (0-based)." }
    ],
    "description": "Location in the source code."
  };
  let type = Type.create('Debugger', obj);

  emitTypeDecl(stream, type);

  expectCodeIsEqual(stream.get(), `
    struct debugger::Location : public Serializable {
      Location() = default;
      explicit Location(const folly::dynamic &obj);
      folly::dynamic toDynamic() const override;

      runtime::ScriptId scriptId{};
      int lineNumber{};
      folly::Optional<int> columnNumber;
    };
  `);
});

test('emits request decl', () => {
  let obj = {
    "name": "getScriptSource",
    "parameters": [
      { "name": "scriptId", "$ref": "Runtime.ScriptId", "description": "Id of the script to get source for." }
    ],
    "returns": [
      { "name": "scriptSource", "type": "string", "description": "Script source." }
    ],
    "description": "Returns source for the script with given id."
  };
  let command = Command.create('Debugger', obj);

  emitRequestDecl(stream, command);

  expectCodeIsEqual(stream.get(), `
    struct debugger::GetScriptSourceRequest : public Request {
      GetScriptSourceRequest();
      explicit GetScriptSourceRequest(const folly::dynamic &obj);

      folly::dynamic toDynamic() const override;
      void accept(RequestHandler &handler) const override;

      runtime::ScriptId scriptId{};
    };
  `);
});

test('emits response decl', () => {
  let obj = {
    "name": "getScriptSource",
    "parameters": [
      { "name": "scriptId", "$ref": "Runtime.ScriptId", "description": "Id of the script to get source for." }
    ],
    "returns": [
      { "name": "scriptSource", "type": "string", "description": "Script source." }
    ],
    "description": "Returns source for the script with given id."
  };
  let command = Command.create('Debugger', obj);

  emitResponseDecl(stream, command);

  expectCodeIsEqual(stream.get(), `
    struct debugger::GetScriptSourceResponse : public Response {
      GetScriptSourceResponse() = default;
      explicit GetScriptSourceResponse(const folly::dynamic &obj);
      folly::dynamic toDynamic() const override;

      std::string scriptSource;
    };
  `);
});

test('emits notification decl', () => {
  let obj = {
    "name": "messageAdded",
    "parameters": [
      { "name": "message", "$ref": "ConsoleMessage", "description": "Console message that has been added." }
    ],
    "description": "Issued when new console message is added."
  };
  let event = Event.create('Console', obj);

  emitNotificationDecl(stream, event);

  expectCodeIsEqual(stream.get(), `
    struct console::MessageAddedNotification : public Notification {
      MessageAddedNotification();
      explicit MessageAddedNotification(const folly::dynamic &obj);
      folly::dynamic toDynamic() const override;

      console::ConsoleMessage message{};
    };
  `);
});
