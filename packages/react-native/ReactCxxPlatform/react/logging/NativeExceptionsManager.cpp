/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeExceptionsManager.h"

#include <utility>

namespace facebook::react {

void NativeExceptionsManager::reportFatalException(
    jsi::Runtime& rt,
    std::string message,
    std::vector<StackFrame> stack,
    int32_t exceptionId) {
  reportException(
      rt,
      ExceptionData{
          .message = std::move(message),
          .stack = std::move(stack),
          .id = exceptionId,
          .isFatal = true});
}

void NativeExceptionsManager::reportSoftException(
    jsi::Runtime& rt,
    std::string message,
    std::vector<StackFrame> stack,
    int32_t exceptionId) {
  reportException(
      rt,
      ExceptionData{
          .message = std::move(message),
          .stack = std::move(stack),
          .id = exceptionId,
          .isFatal = false});
}

void NativeExceptionsManager::reportException(
    jsi::Runtime& runtime,
    const ExceptionData& data) {
  if (onJsError_) {
    std::vector<JsErrorHandler::ProcessedError::StackFrame> frames;
    frames.reserve(data.stack.size());
    for (const auto& frame : data.stack) {
      frames.push_back(JsErrorHandler::ProcessedError::StackFrame{
          .file = frame.file,
          .methodName = frame.methodName,
          .lineNumber = frame.lineNumber,
          .column = frame.column});
    }
    JsErrorHandler::ProcessedError processedError{
        .message = data.message,
        .originalMessage = std::nullopt,
        .name = std::nullopt,
        .componentStack = std::nullopt,
        .stack = frames,
        .id = data.id,
        .isFatal = data.isFatal,
        .extraData = jsi::Object(runtime),
    };
    onJsError_(runtime, processedError);
  }
}

} // namespace facebook::react
