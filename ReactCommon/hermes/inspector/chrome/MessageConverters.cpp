/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "MessageConverters.h"

#include <cmath>
#include <limits>

#include <folly/Conv.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

namespace h = ::facebook::hermes;
namespace m = ::facebook::hermes::inspector::chrome::message;

m::ErrorResponse
m::makeErrorResponse(int id, m::ErrorCode code, const std::string &message) {
  m::ErrorResponse resp;
  resp.id = id;
  resp.code = static_cast<int>(code);
  resp.message = message;
  return resp;
}

m::OkResponse m::makeOkResponse(int id) {
  m::OkResponse resp;
  resp.id = id;
  return resp;
}

std::string m::stripCachePrevention(const std::string &url) {
  std::regex regex("&?cachePrevention=[0-9]*");
  return std::regex_replace(url, regex, "");
}

/*
 * debugger message conversion helpers
 */

m::debugger::Location m::debugger::makeLocation(
    const h::debugger::SourceLocation &loc) {
  m::debugger::Location result;

  result.scriptId = folly::to<std::string>(loc.fileId);
  m::setChromeLocation(result, loc);

  return result;
}

m::debugger::CallFrame m::debugger::makeCallFrame(
    uint32_t callFrameIndex,
    const h::debugger::CallFrameInfo &callFrameInfo,
    const h::debugger::LexicalInfo &lexicalInfo,
    RemoteObjectsTable &objTable,
    jsi::Runtime &runtime,
    const facebook::hermes::debugger::ProgramState &state) {
  m::debugger::CallFrame result;

  result.callFrameId = folly::to<std::string>(callFrameIndex);
  result.functionName = callFrameInfo.functionName;
  result.location = makeLocation(callFrameInfo.location);

  uint32_t scopeCount = lexicalInfo.getScopesCount();

  // First we have our local scope (unless we're in the global function)
  if (scopeCount > 1) {
    m::debugger::Scope scope;
    scope.type = "local";
    scope.object.objectId = objTable.addScope(
        std::make_pair(callFrameIndex, 0), BacktraceObjectGroup);
    scope.object.type = "object";
    scope.object.className = "Object";
    result.scopeChain.emplace_back(std::move(scope));
  }

  // Then we have zero or more parent closure scopes
  for (uint32_t scopeIndex = 1; scopeIndex < scopeCount - 1; scopeIndex++) {
    m::debugger::Scope scope;

    scope.type = "closure";
    // TODO: Get the parent closure's name
    scope.name = folly::to<std::string>(scopeIndex);
    scope.object.objectId = objTable.addScope(
        std::make_pair(callFrameIndex, scopeIndex), BacktraceObjectGroup);
    scope.object.type = "object";
    scope.object.className = "Object";
    result.scopeChain.emplace_back(std::move(scope));
  }

  // Finally, we always have the global scope
  {
    m::debugger::Scope scope;
    scope.type = "global";
    scope.object.objectId =
        objTable.addValue(runtime.global(), BacktraceObjectGroup);
    scope.object.type = "object";
    scope.object.className = "Object";
    result.scopeChain.emplace_back(std::move(scope));
  }

  result.thisObj.type = "object";
  result.thisObj.objectId = objTable.addValue(
      state.getVariableInfoForThis(callFrameIndex).value, BacktraceObjectGroup);

  return result;
}

std::vector<m::debugger::CallFrame> m::debugger::makeCallFrames(
    const h::debugger::ProgramState &state,
    RemoteObjectsTable &objTable,
    jsi::Runtime &runtime) {
  const h::debugger::StackTrace &stackTrace = state.getStackTrace();
  uint32_t count = stackTrace.callFrameCount();

  std::vector<m::debugger::CallFrame> result;
  result.reserve(count);

  for (uint32_t i = 0; i < count; i++) {
    h::debugger::CallFrameInfo callFrameInfo = stackTrace.callFrameForIndex(i);
    h::debugger::LexicalInfo lexicalInfo = state.getLexicalInfo(i);

    result.emplace_back(
        makeCallFrame(i, callFrameInfo, lexicalInfo, objTable, runtime, state));
  }

  return result;
}

/*
 * runtime message conversion helpers
 */

m::runtime::CallFrame m::runtime::makeCallFrame(
    const h::debugger::CallFrameInfo &info) {
  m::runtime::CallFrame result;

  result.functionName = info.functionName;
  result.scriptId = folly::to<std::string>(info.location.fileId);
  result.url = info.location.fileName;
  m::setChromeLocation(result, info.location);

  return result;
}

std::vector<m::runtime::CallFrame> m::runtime::makeCallFrames(
    const facebook::hermes::debugger::StackTrace &stackTrace) {
  std::vector<m::runtime::CallFrame> result;
  result.reserve(stackTrace.callFrameCount());

  for (size_t i = 0; i < stackTrace.callFrameCount(); i++) {
    h::debugger::CallFrameInfo info = stackTrace.callFrameForIndex(i);
    result.emplace_back(makeCallFrame(info));
  }

  return result;
}

m::runtime::ExceptionDetails m::runtime::makeExceptionDetails(
    const h::debugger::ExceptionDetails &details) {
  m::runtime::ExceptionDetails result;

  result.text = details.text;
  result.scriptId = folly::to<std::string>(details.location.fileId);
  result.url = details.location.fileName;
  result.stackTrace = m::runtime::StackTrace();
  result.stackTrace->callFrames = makeCallFrames(details.getStackTrace());
  m::setChromeLocation(result, details.location);

  return result;
}

m::runtime::RemoteObject m::runtime::makeRemoteObject(
    facebook::jsi::Runtime &runtime,
    const facebook::jsi::Value &value,
    RemoteObjectsTable &objTable,
    const std::string &objectGroup,
    bool byValue) {
  m::runtime::RemoteObject result;

  if (value.isUndefined()) {
    result.type = "undefined";
  } else if (value.isNull()) {
    result.type = "object";
    result.subtype = "null";
    result.value = "null";
  } else if (value.isBool()) {
    result.type = "boolean";
    result.value = value.getBool();
  } else if (value.isNumber()) {
    double numberValue = value.getNumber();

    result.type = "number";
    if (std::isnan(numberValue)) {
      result.description = result.unserializableValue = "NaN";
    } else if (numberValue == -std::numeric_limits<double>::infinity()) {
      result.description = result.unserializableValue = "-Infinity";
    } else if (numberValue == std::numeric_limits<double>::infinity()) {
      result.description = result.unserializableValue = "Infinity";
    } else if (numberValue == 0.0 && std::signbit(numberValue)) {
      result.description = result.unserializableValue = "-0";
    } else {
      result.value = numberValue;
    }
  } else if (value.isString()) {
    result.type = "string";
    result.value = value.getString(runtime).utf8(runtime);
  } else if (value.isSymbol()) {
    result.type = "symbol";
    auto sym = value.getSymbol(runtime);
    result.description = sym.toString(runtime);
    result.objectId =
        objTable.addValue(jsi::Value(std::move(sym)), objectGroup);
  } else if (value.isBigInt()) {
    auto strRepresentation =
        value.getBigInt(runtime).toString(runtime).utf8(runtime) + 'n';
    result.description = result.unserializableValue = strRepresentation;
  } else if (value.isObject()) {
    jsi::Object obj = value.getObject(runtime);

    if (obj.isFunction(runtime)) {
      result.type = "function";
      result.value = "";
    } else if (obj.isArray(runtime)) {
      auto array = obj.getArray(runtime);
      size_t arrayCount = array.length(runtime);

      result.type = "object";
      result.subtype = "array";
      result.className = "Array";
      result.description = "Array(" + folly::to<std::string>(arrayCount) + ")";
    } else {
      result.type = "object";
      result.description = result.className = "Object";
    }

    if (byValue) {
      // FIXME: JSI currently does not handle cycles and functions well here
      result.value = jsi::dynamicFromValue(runtime, value);
    } else {
      result.objectId =
          objTable.addValue(jsi::Value(std::move(obj)), objectGroup);
    }
  }

  return result;
}

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
