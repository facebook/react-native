/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JsErrorHandler.h"
#include <cxxreact/ErrorUtils.h>
#include <glog/logging.h>
#include <string>
#include "StackTraceParser.h"

using namespace facebook;

namespace {
std::string quote(const std::string& view) {
  return "\"" + view + "\"";
}

int nextExceptionId() {
  static int exceptionId = 0;
  return exceptionId++;
}

bool isLooselyNull(const jsi::Value& value) {
  return value.isNull() || value.isUndefined();
}

bool isEmptyString(jsi::Runtime& runtime, const jsi::Value& value) {
  return jsi::Value::strictEquals(
      runtime, value, jsi::String::createFromUtf8(runtime, ""));
}

std::string stringifyToCpp(jsi::Runtime& runtime, const jsi::Value& value) {
  return value.toString(runtime).utf8(runtime);
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

JsErrorHandler::JsErrorHandler(JsErrorHandler::OnJsError onJsError)
    : _onJsError(std::move(onJsError)),
      _hasHandledFatalError(false){

      };

JsErrorHandler::~JsErrorHandler() {}

void JsErrorHandler::handleError(
    jsi::Runtime& runtime,
    jsi::JSError& error,
    bool isFatal) {
  // TODO: Current error parsing works and is stable. Can investigate using
  // REGEX_HERMES to get additional Hermes data, though it requires JS setup.
  if (isFatal) {
    _hasHandledFatalError = true;
  }

  if (_isRuntimeReady) {
    try {
      handleJSError(runtime, error, isFatal);
      return;
    } catch (jsi::JSError& e) {
      LOG(ERROR)
          << "JsErrorHandler: Failed to report js error using js pipeline. Using C++ pipeline instead."
          << std::endl
          << "Reporting failure: " << e.getMessage() << std::endl
          << "Original js error: " << error.getMessage() << std::endl;
    }
  }

  auto message = error.getMessage();
  auto errorObj = error.value().getObject(runtime);
  auto componentStackValue = errorObj.getProperty(runtime, "componentStack");
  if (!isLooselyNull(componentStackValue)) {
    message += "\n" + stringifyToCpp(runtime, componentStackValue);
  }

  auto nameValue = errorObj.getProperty(runtime, "name");
  auto name = (isLooselyNull(nameValue) || isEmptyString(runtime, nameValue))
      ? std::nullopt
      : std::optional(stringifyToCpp(runtime, nameValue));

  if (name && !message.starts_with(*name + ": ")) {
    message = *name + ": " + message;
  }

  auto jsEngineValue = errorObj.getProperty(runtime, "jsEngine");

  if (!isLooselyNull(jsEngineValue)) {
    message += ", js engine: " + stringifyToCpp(runtime, jsEngineValue);
  }

  // TODO: What about spreading in decoratedExtraDataKey?
  auto extraData = jsi::Object(runtime);
  extraData.setProperty(runtime, "jsEngine", jsEngineValue);
  extraData.setProperty(runtime, "rawStack", error.getStack());

  auto cause = errorObj.getProperty(runtime, "cause");
  if (cause.isObject()) {
    auto causeObj = cause.asObject(runtime);
    // TODO: Consider just forwarding all properties. For now, just forward the
    // stack properties to maintain symmetry with js pipeline
    auto stackSymbols = causeObj.getProperty(runtime, "stackSymbols");
    extraData.setProperty(runtime, "stackSymbols", stackSymbols);

    auto stackReturnAddresses =
        causeObj.getProperty(runtime, "stackReturnAddresses");
    extraData.setProperty(
        runtime, "stackReturnAddresses", stackReturnAddresses);

    auto stackElements = causeObj.getProperty(runtime, "stackElements");
    extraData.setProperty(runtime, "stackElements", stackElements);
  }

  auto originalMessage = message == error.getMessage()
      ? std::nullopt
      : std::optional(error.getMessage());

  auto componentStack = !componentStackValue.isString()
      ? std::nullopt
      : std::optional(componentStackValue.asString(runtime).utf8(runtime));

  auto isHermes = runtime.global().hasProperty(runtime, "HermesInternal");
  auto stackFrames = StackTraceParser::parse(isHermes, error.getStack());

  auto id = nextExceptionId();

  ParsedError parsedError = {
      .message = "EarlyJsError: " + message,
      .originalMessage = originalMessage,
      .name = name,
      .componentStack = componentStack,
      .stack = stackFrames,
      .id = id,
      .isFatal = isFatal,
      .extraData = std::move(extraData),
  };

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
