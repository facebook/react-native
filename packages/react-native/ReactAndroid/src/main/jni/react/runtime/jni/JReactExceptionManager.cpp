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
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/jni/ReadableNativeMap.h>

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
        frame.file ? jni::make_jstring(*frame.file) : nullptr,
        frame.methodName,
        frame.lineNumber ? jni::JInteger::valueOf(*frame.lineNumber) : nullptr,
        frame.column ? jni::JInteger::valueOf(*frame.column) : nullptr);
  }
};

class ParsedErrorImpl
    : public facebook::jni::JavaClass<ParsedErrorImpl, ParsedError> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/interfaces/exceptionmanager/ReactJsExceptionHandler$ParsedErrorImpl;";

  static facebook::jni::local_ref<ParsedErrorImpl> create(
      jsi::Runtime& runtime,
      const JsErrorHandler::ParsedError& error) {
    auto stack = facebook::jni::JArrayList<ParsedStackFrameImpl>::create();
    for (const auto& frame : error.stack) {
      stack->add(ParsedStackFrameImpl::create(frame));
    }

    auto extraDataDynamic =
        jsi::dynamicFromValue(runtime, jsi::Value(runtime, error.extraData));

    auto extraData =
        ReadableNativeMap::createWithContents(std::move(extraDataDynamic));

    return newInstance(
        error.message,
        error.originalMessage ? jni::make_jstring(*error.originalMessage)
                              : nullptr,
        error.name ? jni::make_jstring(*error.name) : nullptr,
        error.componentStack ? jni::make_jstring(*error.componentStack)
                             : nullptr,
        stack,
        error.id,
        error.isFatal,
        extraData);
  }
};
} // namespace

void JReactExceptionManager::reportJsException(
    jsi::Runtime& runtime,
    const JsErrorHandler::ParsedError& error) {
  static const auto method =
      javaClassStatic()->getMethod<void(jni::alias_ref<ParsedError>)>(
          "reportJsException");
  if (self() != nullptr) {
    method(self(), ParsedErrorImpl::create(runtime, error));
  }
}

} // namespace facebook::react
