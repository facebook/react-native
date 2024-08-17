/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JReactExceptionManager.h"
#include <fbjni/fbjni.h>
#include <glog/logging.h>
#include <jni.h>

namespace facebook::react {

namespace {
class ParsedError : public facebook::jni::JavaClass<ParsedError> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/interfaces/exceptionmanager/ReactJsExceptionHandler$ParsedError;";
};

class ParsedStackFrameImpl
    : public facebook::jni::JavaClass<ParsedStackFrameImpl> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/interfaces/exceptionmanager/ReactJsExceptionHandler$ParsedStackFrameImpl;";

  static facebook::jni::local_ref<ParsedStackFrameImpl> create(
      const JsErrorHandler::ParsedError::StackFrame& frame) {
    return newInstance(
        frame.fileName, frame.methodName, frame.lineNumber, frame.columnNumber);
  }
};

class ParsedErrorImpl
    : public facebook::jni::JavaClass<ParsedErrorImpl, ParsedError> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/interfaces/exceptionmanager/ReactJsExceptionHandler$ParsedErrorImpl;";

  static facebook::jni::local_ref<ParsedErrorImpl> create(
      const JsErrorHandler::ParsedError& error) {
    auto stackFrames =
        facebook::jni::JArrayList<ParsedStackFrameImpl>::create();
    for (const auto& frame : error.frames) {
      stackFrames->add(ParsedStackFrameImpl::create(frame));
    }

    return newInstance(
        stackFrames, error.message, error.exceptionId, error.isFatal);
  }
};

} // namespace

void JReactExceptionManager::reportJsException(
    const JsErrorHandler::ParsedError& error) {
  static const auto method =
      javaClassStatic()->getMethod<void(jni::alias_ref<ParsedError>)>(
          "reportJsException");
  if (self() != nullptr) {
    method(self(), ParsedErrorImpl::create(error));
  }
}

} // namespace facebook::react
