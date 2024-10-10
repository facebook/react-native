/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JsErrorHandler.h"
#include <cxxreact/ErrorUtils.h>
#include <glog/logging.h>
#include <regex>
#include <sstream>
#include <string>
#include <vector>

namespace {
std::string quote(const std::string& view) {
  return "\"" + view + "\"";
}
} // namespace

namespace facebook::react {

std::ostream& operator<<(
    std::ostream& os,
    const JsErrorHandler::ParsedError::StackFrame& frame) {
  auto file = frame.file ? quote(*frame.file) : "nil";
  auto methodName = quote(frame.methodName);
  auto lineNumber =
      frame.lineNumber ? std::to_string(*frame.lineNumber) : "nil";
  auto column = frame.column ? std::to_string(*frame.column) : "nil";

  os << "StackFrame { .file = " << file << ", .methodName = " << methodName
     << ", .lineNumber = " << lineNumber << ", .column = " << column << " }";
  return os;
}
std::ostream& operator<<(
    std::ostream& os,
    const JsErrorHandler::ParsedError& error) {
  auto message = quote(error.message);
  auto originalMessage =
      error.originalMessage ? quote(*error.originalMessage) : "nil";
  auto name = error.name ? quote(*error.name) : "nil";
  auto componentStack =
      error.componentStack ? quote(*error.componentStack) : "nil";
  auto id = std::to_string(error.id);
  auto isFatal = std::to_string(static_cast<int>(error.isFatal));
  auto extraData = "jsi::Object{ <omitted> } ";

  os << "ParsedError {\n"
     << "  .message = " << message << "\n"
     << "  .originalMessage = " << originalMessage << "\n"
     << "  .name = " << name << "\n"
     << "  .componentStack = " << componentStack << "\n"
     << "  .stack = [\n";

  for (const auto& frame : error.stack) {
    os << "    " << frame << ", \n";
  }
  os << "  ]\n"
     << "  .id = " << id << "\n"
     << "  .isFatal " << isFatal << "\n"
     << "  .extraData = " << extraData << "\n"
     << "}";
  return os;
}

// TODO(T198763073): Migrate away from std::regex in this function
static JsErrorHandler::ParsedError parseErrorStack(
    jsi::Runtime& runtime,
    const jsi::JSError& error,
    bool isFatal,
    bool isHermes) {
  /**
   * This parses the different stack traces and puts them into one format
   * This borrows heavily from TraceKit (https://github.com/occ/TraceKit)
   * This is the same regex from stacktrace-parser.js.
   */
  // @lint-ignore CLANGTIDY facebook-hte-StdRegexIsAwful
  const std::regex REGEX_CHROME(
      R"(^\s*at (?:(?:(?:Anonymous function)?|((?:\[object object\])?\S+(?: \[as \S+\])?)) )?\(?((?:file|http|https):.*?):(\d+)(?::(\d+))?\)?\s*$)");
  // @lint-ignore CLANGTIDY facebook-hte-StdRegexIsAwful
  const std::regex REGEX_GECKO(
      R"(^(?:\s*([^@]*)(?:\((.*?)\))?@)?(\S.*?):(\d+)(?::(\d+))?\s*$)");
  // @lint-ignore CLANGTIDY facebook-hte-StdRegexIsAwful
  const std::regex REGEX_NODE(
      R"(^\s*at (?:((?:\[object object\])?\S+(?: \[as \S+\])?) )?\(?(.*?):(\d+)(?::(\d+))?\)?\s*$)");

  // Capture groups for Hermes (from parseHermesStack.js):
  // 1. function name
  // 2. is this a native stack frame?
  // 3. is this a bytecode address or a source location?
  // 4. source URL (filename)
  // 5. line number (1 based)
  // 6. column number (1 based) or virtual offset (0 based)
  // @lint-ignore CLANGTIDY facebook-hte-StdRegexIsAwful
  const std::regex REGEX_HERMES(
      R"(^ {4}at (.+?)(?: \((native)\)?| \((address at )?(.*?):(\d+):(\d+)\))$)");

  std::string line;
  std::stringstream strStream(error.getStack());

  std::vector<JsErrorHandler::ParsedError::StackFrame> frames;

  while (std::getline(strStream, line, '\n')) {
    auto searchResults = std::smatch{};

    if (isHermes) {
      // @lint-ignore CLANGTIDY facebook-hte-StdRegexIsAwful
      if (std::regex_search(line, searchResults, REGEX_HERMES)) {
        std::string str2 = std::string(searchResults[2]);
        if (str2.compare("native")) {
          frames.push_back({
              .file = std::string(searchResults[4]),
              .methodName = std::string(searchResults[1]),
              .lineNumber = std::stoi(searchResults[5]),
              .column = std::stoi(searchResults[6]),
          });
        }
      }
    } else {
      // @lint-ignore CLANGTIDY facebook-hte-StdRegexIsAwful
      if (std::regex_search(line, searchResults, REGEX_GECKO)) {
        frames.push_back({
            .file = std::string(searchResults[3]),
            .methodName = std::string(searchResults[1]),
            .lineNumber = std::stoi(searchResults[4]),
            .column = std::stoi(searchResults[5]),
        });
      } else if (
          // @lint-ignore CLANGTIDY facebook-hte-StdRegexIsAwful
          std::regex_search(line, searchResults, REGEX_CHROME) ||
          // @lint-ignore CLANGTIDY facebook-hte-StdRegexIsAwful
          std::regex_search(line, searchResults, REGEX_NODE)) {
        frames.push_back({
            .file = std::string(searchResults[2]),
            .methodName = std::string(searchResults[1]),
            .lineNumber = std::stoi(searchResults[3]),
            .column = std::stoi(searchResults[4]),
        });
      } else {
        continue;
      }
    }
  }

  return {
      .message = "EarlyJsError: " + error.getMessage(),
      .originalMessage = std::nullopt,
      .name = std::nullopt,
      .componentStack = std::nullopt,
      .stack = std::move(frames),
      .id = 0,
      .isFatal = isFatal,
      .extraData = jsi::Object(runtime),
  };
}

JsErrorHandler::JsErrorHandler(JsErrorHandler::OnJsError onJsError)
    : _onJsError(std::move(onJsError)),
      _hasHandledFatalError(false){

      };

JsErrorHandler::~JsErrorHandler() {}

void JsErrorHandler::handleFatalError(
    jsi::Runtime& runtime,
    jsi::JSError& error) {
  // TODO: Current error parsing works and is stable. Can investigate using
  // REGEX_HERMES to get additional Hermes data, though it requires JS setup.
  _hasHandledFatalError = true;

  if (_isRuntimeReady) {
    try {
      handleJSError(runtime, error, true);
      return;
    } catch (jsi::JSError& e) {
      LOG(ERROR)
          << "JsErrorHandler: Failed to report js error using js pipeline. Using C++ pipeline instead."
          << std::endl
          << "Reporting failure: " << e.getMessage() << std::endl
          << "Original js error: " << error.getMessage() << std::endl;
    }
  }
  // This is a hacky way to get Hermes stack trace.
  ParsedError parsedError = parseErrorStack(runtime, error, true, false);
  _onJsError(runtime, parsedError);
}

bool JsErrorHandler::hasHandledFatalError() {
  return _hasHandledFatalError;
}

void JsErrorHandler::setRuntimeReady() {
  _isRuntimeReady = true;
}

bool JsErrorHandler::isRuntimeReady() {
  return _isRuntimeReady;
}

void JsErrorHandler::notifyOfFatalError() {
  _hasHandledFatalError = true;
}

} // namespace facebook::react
