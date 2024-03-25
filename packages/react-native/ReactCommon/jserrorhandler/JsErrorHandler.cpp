/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JsErrorHandler.h"
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#include <regex>
#include <sstream>
#include <string>
#include <vector>

namespace facebook::react {

using facebook::react::JSErrorHandlerKey;

static MapBuffer
parseErrorStack(const jsi::JSError& error, bool isFatal, bool isHermes) {
  /**
   * This parses the different stack traces and puts them into one format
   * This borrows heavily from TraceKit (https://github.com/occ/TraceKit)
   * This is the same regex from stacktrace-parser.js.
   */
  const std::regex REGEX_CHROME(
      R"(^\s*at (?:(?:(?:Anonymous function)?|((?:\[object object\])?\S+(?: \[as \S+\])?)) )?\(?((?:file|http|https):.*?):(\d+)(?::(\d+))?\)?\s*$)");
  const std::regex REGEX_GECKO(
      R"(^(?:\s*([^@]*)(?:\((.*?)\))?@)?(\S.*?):(\d+)(?::(\d+))?\s*$)");
  const std::regex REGEX_NODE(
      R"(^\s*at (?:((?:\[object object\])?\S+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$)");

  // Capture groups for Hermes (from parseHermesStack.js):
  // 1. function name
  // 2. is this a native stack frame?
  // 3. is this a bytecode address or a source location?
  // 4. source URL (filename)
  // 5. line number (1 based)
  // 6. column number (1 based) or virtual offset (0 based)
  const std::regex REGEX_HERMES(
      R"(^ {4}at (.+?)(?: \((native)\)?| \((address at )?(.*?):(\d+):(\d+)\))$)");

  std::string line;
  std::stringstream strStream(error.getStack());

  auto errorObj = MapBufferBuilder();
  std::vector<MapBuffer> frames;

  while (std::getline(strStream, line, '\n')) {
    auto frame = MapBufferBuilder();
    auto searchResults = std::smatch{};

    if (isHermes) {
      if (std::regex_search(line, searchResults, REGEX_HERMES)) {
        std::string str2 = std::string(searchResults[2]);
        if (str2.compare("native")) {
          frame.putString(kFrameFileName, std::string(searchResults[4]));
          frame.putString(kFrameMethodName, std::string(searchResults[1]));
          frame.putInt(kFrameLineNumber, std::stoi(searchResults[5]));
          frame.putInt(kFrameColumnNumber, std::stoi(searchResults[6]));
          frames.push_back(frame.build());
        }
      }
    } else {
      if (std::regex_search(line, searchResults, REGEX_GECKO)) {
        frame.putString(kFrameFileName, std::string(searchResults[3]));
        frame.putString(kFrameMethodName, std::string(searchResults[1]));
        frame.putInt(kFrameLineNumber, std::stoi(searchResults[4]));
        frame.putInt(kFrameColumnNumber, std::stoi(searchResults[5]));
      } else if (
          std::regex_search(line, searchResults, REGEX_CHROME) ||
          std::regex_search(line, searchResults, REGEX_NODE)) {
        frame.putString(kFrameFileName, std::string(searchResults[2]));
        frame.putString(kFrameMethodName, std::string(searchResults[1]));
        frame.putInt(kFrameLineNumber, std::stoi(searchResults[3]));
        frame.putInt(kFrameColumnNumber, std::stoi(searchResults[4]));
      } else {
        continue;
      }
      frames.push_back(frame.build());
    }
  }
  errorObj.putMapBufferList(kAllStackFrames, std::move(frames));
  errorObj.putString(kErrorMessage, "EarlyJsError: " + error.getMessage());
  // TODO: If needed, can increment exceptionId by 1 each time
  errorObj.putInt(kExceptionId, 0);
  errorObj.putBool(kIsFatal, isFatal);
  return errorObj.build();
}

JsErrorHandler::JsErrorHandler(
    JsErrorHandler::JsErrorHandlingFunc jsErrorHandlingFunc) {
  this->_jsErrorHandlingFunc = jsErrorHandlingFunc;
};

JsErrorHandler::~JsErrorHandler() {}

void JsErrorHandler::handleJsError(const jsi::JSError& error, bool isFatal) {
  // TODO: Current error parsing works and is stable. Can investigate using
  // REGEX_HERMES to get additional Hermes data, though it requires JS setup.
  MapBuffer errorMap = parseErrorStack(error, isFatal, false);
  _jsErrorHandlingFunc(std::move(errorMap));
}

} // namespace facebook::react
