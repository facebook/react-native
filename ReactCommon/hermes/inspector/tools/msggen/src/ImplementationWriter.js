/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import {Writable} from 'stream';

import {GeneratedHeader} from './GeneratedHeader';
import {PropsType, Type} from './Type';
import {Command} from './Command';
import {Event} from './Event';

export class ImplementationWriter {
  stream: Writable;
  types: Array<Type>;
  commands: Array<Command>;
  events: Array<Event>;

  constructor(
    stream: Writable,
    types: Array<Type>,
    commands: Array<Command>,
    events: Array<Event>,
  ) {
    this.stream = stream;
    this.types = types;
    this.commands = commands;
    this.events = events;
  }

  write() {
    this.writePrologue();
    this.writeRequestParser();
    this.writeTypeDefs();
    this.writeRequestDefs();
    this.writeResponseDefs();
    this.writeNotificationDefs();
    this.writeEpilogue();
  }

  writePrologue() {
    this.stream.write(`${GeneratedHeader}

      #include "MessageTypes.h"

      #include "MessageTypesInlines.h"

      namespace facebook {
      namespace hermes {
      namespace inspector {
      namespace chrome {
      namespace message {

    `);
  }

  writeRequestParser() {
    emitRequestParser(this.stream, this.commands);
  }

  writeTypeDefs() {
    this.stream.write('\n/// Types\n');

    for (const type of this.types) {
      if (type instanceof PropsType) {
        emitTypeDef(this.stream, type);
      }
    }
  }

  writeRequestDefs() {
    this.stream.write('\n/// Requests\n');

    emitUnknownRequestDef(this.stream);

    for (const command of this.commands) {
      emitRequestDef(this.stream, command);
    }
  }

  writeResponseDefs() {
    this.stream.write('\n/// Responses\n');

    emitErrorResponseDef(this.stream);
    emitOkResponseDef(this.stream);

    for (const command of this.commands) {
      emitResponseDef(this.stream, command);
    }
  }

  writeNotificationDefs() {
    this.stream.write('\n/// Notifications\n');

    for (const event of this.events) {
      emitNotificationDef(this.stream, event);
    }
  }

  writeEpilogue() {
    this.stream.write(`
      } // namespace message
      } // namespace chrome
      } // namespace inspector
      } // namespace hermes
      } // namespace facebook
    `);
  }
}

function emitRequestParser(stream: Writable, commands: Array<Command>) {
  stream.write(`
    using RequestBuilder = std::unique_ptr<Request> (*)(const dynamic &);

    namespace {

    template <typename T>
    std::unique_ptr<Request> makeUnique(const dynamic &obj) {
      return std::make_unique<T>(obj);
    }

    } // namespace

    std::unique_ptr<Request> Request::fromJsonThrowOnError(const std::string &str) {
      static std::unordered_map<std::string, RequestBuilder> builders = {
  `);

  for (const command of commands) {
    const cppNs = command.getCppNamespace();
    const cppType = command.getRequestCppType();
    const dbgName = command.getDebuggerName();

    stream.write(`{"${dbgName}", makeUnique<${cppNs}::${cppType}>},\n`);
  }

  stream.write(`};

    dynamic obj = folly::parseJson(str);
    std::string method = obj.at("method").asString();

    auto it = builders.find(method);
    if (it == builders.end()) {
      return std::make_unique<UnknownRequest>(obj);
    }

    auto builder = it->second;
    return builder(obj);
  }

  folly::Try<std::unique_ptr<Request>> Request::fromJson(const std::string &str) {
  return folly::makeTryWith(
      [&str] { return Request::fromJsonThrowOnError(str); });
  }\n\n`);

  stream.write('\n');
}

export function emitTypeDef(stream: Writable, type: PropsType) {
  const cppNs = type.getCppNamespace();
  const cppType = type.getCppType();
  const props = type.properties || [];

  // From-dynamic constructor
  stream.write(`${cppNs}::${cppType}::${cppType}(const dynamic &obj) {\n`);

  for (const prop of props) {
    const id = prop.getCppIdentifier();
    const name = prop.name;
    stream.write(`assign(${id}, obj, "${name}");\n`);
  }

  stream.write('}\n\n');

  // toDynamic
  stream.write(`dynamic ${cppNs}::${cppType}::toDynamic() const {
    dynamic obj = dynamic::object;\n\n`);

  for (const prop of props) {
    const id = prop.getCppIdentifier();
    const name = prop.name;
    stream.write(`put(obj, "${name}", ${id});\n`);
  }

  stream.write('return obj;\n}\n\n');
}

function emitErrorResponseDef(stream: Writable) {
  stream.write(`ErrorResponse::ErrorResponse(const dynamic &obj) {
    assign(id, obj, "id");

    dynamic error = obj.at("error");
    assign(code, error, "code");
    assign(message, error, "message");
    assign(data, error, "data");
  }

  dynamic ErrorResponse::toDynamic() const {
    dynamic error = dynamic::object;
    put(error, "code", code);
    put(error, "message", message);
    put(error, "data", data);

    dynamic obj = dynamic::object;
    put(obj, "id", id);
    put(obj, "error", std::move(error));
    return obj;
  }\n\n`);
}

function emitOkResponseDef(stream: Writable) {
  stream.write(`OkResponse::OkResponse(const dynamic &obj) {
    assign(id, obj, "id");
  }

  dynamic OkResponse::toDynamic() const {
    dynamic result = dynamic::object;

    dynamic obj = dynamic::object;
    put(obj, "id", id);
    put(obj, "result", std::move(result));
    return obj;
  }\n\n`);
}

function emitUnknownRequestDef(stream: Writable) {
  stream.write(`UnknownRequest::UnknownRequest() {}

UnknownRequest::UnknownRequest(const dynamic &obj) {
  assign(id, obj, "id");
  assign(method, obj, "method");
  assign(params, obj, "params");
}

dynamic UnknownRequest::toDynamic() const {
  dynamic obj = dynamic::object;
  put(obj, "id", id);
  put(obj, "method", method);
  put(obj, "params", params);
  return obj;
}

void UnknownRequest::accept(RequestHandler &handler) const {
  handler.handle(*this);
}\n\n`);
}

export function emitRequestDef(stream: Writable, command: Command) {
  const cppNs = command.getCppNamespace();
  const cppType = command.getRequestCppType();
  const dbgName = command.getDebuggerName();
  const props = command.parameters || [];

  // Default constructor
  stream.write(`${cppNs}::${cppType}::${cppType}()
      : Request("${dbgName}") {}\n\n`);

  // From-dynamic constructor
  stream.write(`${cppNs}::${cppType}::${cppType}(const dynamic &obj)
      : Request("${dbgName}") {
    assign(id, obj, "id");
    assign(method, obj, "method");\n\n`);

  if (props.length > 0) {
    stream.write('dynamic params = obj.at("params");\n');

    for (const prop of props) {
      const id = prop.getCppIdentifier();
      const name = prop.name;
      stream.write(`assign(${id}, params, "${name}");\n`);
    }
  }

  stream.write('}\n\n');

  // toDynamic
  stream.write(`dynamic ${cppNs}::${cppType}::toDynamic() const {\n`);

  if (props.length > 0) {
    stream.write('dynamic params = dynamic::object;\n');

    for (const prop of props) {
      const id = prop.getCppIdentifier();
      const name = prop.name;
      stream.write(`put(params, "${name}", ${id});\n`);
    }
  }

  stream.write(`
    dynamic obj = dynamic::object;
    put(obj, "id", id);
    put(obj, "method", method);
  `);

  if (props.length > 0) {
    stream.write('put(obj, "params", std::move(params));\n');
  }

  stream.write(`return obj;
    }\n\n`);

  // visitor
  stream.write(`void ${cppNs}::${cppType}::accept(RequestHandler &handler) const {
    handler.handle(*this);
  }\n\n`);
}

export function emitResponseDef(stream: Writable, command: Command) {
  const cppNs = command.getCppNamespace();
  const cppType = command.getResponseCppType();
  if (!cppType) {
    return;
  }

  // From-dynamic constructor
  stream.write(`${cppNs}::${cppType}::${cppType}(const dynamic &obj) {
    assign(id, obj, "id");\n\n`);

  const props = command.returns || [];
  if (props.length > 0) {
    stream.write('dynamic res = obj.at("result");\n');

    for (const prop of props) {
      const id = prop.getCppIdentifier();
      const name = prop.name;
      stream.write(`assign(${id}, res, "${name}");\n`);
    }
  }

  stream.write('}\n\n');

  // toDynamic
  stream.write(`dynamic ${cppNs}::${cppType}::toDynamic() const {\n`);

  if (props.length > 0) {
    stream.write('dynamic res = dynamic::object;\n');

    for (const prop of props) {
      const id = prop.getCppIdentifier();
      const name = prop.name;
      stream.write(`put(res, "${name}", ${id});\n`);
    }
  }

  stream.write(`
    dynamic obj = dynamic::object;
    put(obj, "id", id);
    put(obj, "result", std::move(res));
    return obj;
  }\n\n`);
}

export function emitNotificationDef(stream: Writable, event: Event) {
  const cppNs = event.getCppNamespace();
  const cppType = event.getCppType();
  const dbgName = event.getDebuggerName();
  const props = event.parameters || [];

  // Default constructor
  stream.write(`${cppNs}::${cppType}::${cppType}()
      : Notification("${dbgName}") {}\n\n`);

  // From-dynamic constructor
  stream.write(`${cppNs}::${cppType}::${cppType}(const dynamic &obj)
      : Notification("${dbgName}") {
    assign(method, obj, "method");\n\n`);

  if (props.length > 0) {
    stream.write('dynamic params = obj.at("params");\n');

    for (const prop of props) {
      const id = prop.getCppIdentifier();
      const name = prop.name;
      stream.write(`assign(${id}, params, "${name}");\n`);
    }
  }

  stream.write('}\n\n');

  // toDynamic
  stream.write(`dynamic ${cppNs}::${cppType}::toDynamic() const {\n`);

  if (props.length > 0) {
    stream.write('dynamic params = dynamic::object;\n');

    for (const prop of props) {
      const id = prop.getCppIdentifier();
      const name = prop.name;
      stream.write(`put(params, "${name}", ${id});\n`);
    }
  }

  stream.write(`
    dynamic obj = dynamic::object;
    put(obj, "method", method);
  `);

  if (props.length > 0) {
    stream.write('put(obj, "params", std::move(params));\n');
  }

  stream.write(`return obj;
    }\n\n`);
}
