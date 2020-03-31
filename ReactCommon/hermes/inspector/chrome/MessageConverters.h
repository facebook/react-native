/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <regex>
#include <string>
#include <vector>

#include <hermes/DebuggerAPI.h>
#include <hermes/hermes.h>
#include <hermes/inspector/chrome/MessageTypes.h>
#include <hermes/inspector/chrome/RemoteObjectsTable.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {
namespace message {

std::string stripCachePrevention(const std::string &url);

template <typename T>
void setHermesLocation(
    facebook::hermes::debugger::SourceLocation &hermesLoc,
    const T &chromeLoc,
    const std::vector<std::string> &parsedScripts) {
  hermesLoc.line = chromeLoc.lineNumber + 1;

  if (chromeLoc.columnNumber.hasValue()) {
    if (chromeLoc.columnNumber.value() == 0) {
      // TODO: When CDTP sends a column number of 0, we send Hermes a column
      // number of 1. For some reason, this causes Hermes to not be
      // able to resolve breakpoints.
      hermesLoc.column = ::facebook::hermes::debugger::kInvalidLocation;
    } else {
      hermesLoc.column = chromeLoc.columnNumber.value() + 1;
    }
  }

  if (chromeLoc.url.hasValue()) {
    hermesLoc.fileName = stripCachePrevention(chromeLoc.url.value());
  } else if (chromeLoc.urlRegex.hasValue()) {
    const std::regex regex(stripCachePrevention(chromeLoc.urlRegex.value()));
    auto it = parsedScripts.rbegin();

    // We currently only support one physical breakpoint per location, so
    // search backwards so that we find the latest matching file.
    while (it != parsedScripts.rend()) {
      if (std::regex_match(*it, regex)) {
        hermesLoc.fileName = *it;
        break;
      }
      it++;
    }
  }
}

template <typename T>
void setChromeLocation(
    T &chromeLoc,
    const facebook::hermes::debugger::SourceLocation &hermesLoc) {
  if (hermesLoc.line != facebook::hermes::debugger::kInvalidLocation) {
    chromeLoc.lineNumber = hermesLoc.line - 1;
  }

  if (hermesLoc.column != facebook::hermes::debugger::kInvalidLocation) {
    chromeLoc.columnNumber = hermesLoc.column - 1;
  }
}

/// ErrorCode magic numbers match JSC's (see InspectorBackendDispatcher.cpp)
enum class ErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ServerError = -32000
};

ErrorResponse
makeErrorResponse(int id, ErrorCode code, const std::string &message);

OkResponse makeOkResponse(int id);

namespace debugger {

Location makeLocation(const facebook::hermes::debugger::SourceLocation &loc);

CallFrame makeCallFrame(
    uint32_t callFrameIndex,
    const facebook::hermes::debugger::CallFrameInfo &callFrameInfo,
    const facebook::hermes::debugger::LexicalInfo &lexicalInfo,
    facebook::hermes::inspector::chrome::RemoteObjectsTable &objTable,
    jsi::Runtime &runtime,
    const facebook::hermes::debugger::ProgramState &state);

std::vector<CallFrame> makeCallFrames(
    const facebook::hermes::debugger::ProgramState &state,
    facebook::hermes::inspector::chrome::RemoteObjectsTable &objTable,
    jsi::Runtime &runtime);

} // namespace debugger

namespace runtime {

CallFrame makeCallFrame(const facebook::hermes::debugger::CallFrameInfo &info);

std::vector<CallFrame> makeCallFrames(
    const facebook::hermes::debugger::StackTrace &stackTrace);

ExceptionDetails makeExceptionDetails(
    const facebook::hermes::debugger::ExceptionDetails &details);

RemoteObject makeRemoteObject(
    facebook::jsi::Runtime &runtime,
    const facebook::jsi::Value &value,
    facebook::hermes::inspector::chrome::RemoteObjectsTable &objTable,
    const std::string &objectGroup,
    bool byValue = false);

} // namespace runtime

} // namespace message
} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
