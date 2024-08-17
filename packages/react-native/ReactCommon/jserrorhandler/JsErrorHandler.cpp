/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JsErrorHandler.h"
#include <regex>
#include <sstream>
#include <string>
#include <vector>

namespace facebook::react {

static JsErrorHandler::ParsedError
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

  std::vector<JsErrorHandler::ParsedError::StackFrame> frames;

  while (std::getline(strStream, line, '\n')) {
    auto searchResults = std::smatch{};

    if (isHermes) {
      if (std::regex_search(line, searchResults, REGEX_HERMES)) {
        std::string str2 = std::string(searchResults[2]);
        if (str2.compare("native")) {
          frames.push_back({
              .fileName = std::string(searchResults[4]),
              .methodName = std::string(searchResults[1]),
              .lineNumber = std::stoi(searchResults[5]),
              .columnNumber = std::stoi(searchResults[6]),
          });
        }
      }
    } else {
      if (std::regex_search(line, searchResults, REGEX_GECKO)) {
        frames.push_back({
            .fileName = std::string(searchResults[3]),
            .methodName = std::string(searchResults[1]),
            .lineNumber = std::stoi(searchResults[4]),
            .columnNumber = std::stoi(searchResults[5]),
        });
      } else if (
          std::regex_search(line, searchResults, REGEX_CHROME) ||
          std::regex_search(line, searchResults, REGEX_NODE)) {
        frames.push_back({
            .fileName = std::string(searchResults[2]),
            .methodName = std::string(searchResults[1]),
            .lineNumber = std::stoi(searchResults[3]),
            .columnNumber = std::stoi(searchResults[4]),
        });
      } else {
        continue;
      }
    }
  }

  return {
      .frames = std::move(frames),
      .message = "EarlyJsError: " + error.getMessage(),
      .exceptionId = 0,
      .isFatal = isFatal,
  };
}

JsErrorHandler::JsErrorHandler(JsErrorHandler::OnJsError onJsError)
    : _onJsError(std::move(onJsError)),
      _hasHandledFatalError(false){

      };

JsErrorHandler::~JsErrorHandler() {}

void JsErrorHandler::handleFatalError(const jsi::JSError& error) {
  // TODO: Current error parsing works and is stable. Can investigate using
  // REGEX_HERMES to get additional Hermes data, though it requires JS setup.
  _hasHandledFatalError = true;
  ParsedError parsedError = parseErrorStack(error, true, false);
  _onJsError(parsedError);
}

bool JsErrorHandler::hasHandledFatalError() {
  return _hasHandledFatalError;
}

} // namespace facebook::react
