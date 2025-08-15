/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <jserrorhandler/JsErrorHandler.h>
#include <react/bridging/Base.h>
#include <optional>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

namespace facebook::react {

// https://github.com/facebook/react-native/blob/v0.71.1/Libraries/Core/NativeExceptionsManager.js#L17-L35
using StackFrame = NativeExceptionsManagerStackFrame<
    std::optional<int32_t>,
    std::optional<std::string>,
    std::optional<int32_t>,
    std::string,
    std::optional<bool>>;

template <>
struct Bridging<StackFrame>
    : NativeExceptionsManagerStackFrameBridging<StackFrame> {};

using ExceptionData = NativeExceptionsManagerExceptionData<
    std::string,
    std::optional<std::string>,
    std::optional<std::string>,
    std::optional<std::string>,
    std::vector<StackFrame>,
    int32_t,
    bool,
    std::optional<std::unordered_map<std::string, std::string>>>;

template <>
struct Bridging<ExceptionData>
    : NativeExceptionsManagerExceptionDataBridging<ExceptionData> {};

class NativeExceptionsManager
    : public NativeExceptionsManagerCxxSpec<NativeExceptionsManager> {
 public:
  NativeExceptionsManager(
      JsErrorHandler::OnJsError onJsError,
      std::shared_ptr<CallInvoker> jsInvoker)
      : NativeExceptionsManagerCxxSpec(jsInvoker),
        onJsError_(std::move(onJsError)) {}

  void reportFatalException(
      jsi::Runtime& rt,
      std::string message,
      std::vector<StackFrame> stack,
      int32_t exceptionId);

  void reportSoftException(
      jsi::Runtime& rt,
      std::string message,
      std::vector<StackFrame> stack,
      int32_t exceptionId);

  void reportException(jsi::Runtime& runtime, const ExceptionData& data);

  void updateExceptionMessage(
      jsi::Runtime& rt,
      jsi::String message,
      jsi::Array stack,
      double exceptionId) {
    // This method is not in modern React Native:
    // https://github.com/search?q=repo%3Afacebook%2Freact-native+updateExceptionMessage&type=code
  }

  void dismissRedbox(jsi::Runtime& rt) {
    // Redbox is not supported at this time, LogBox is:
    // https://reactnative.dev/blog/2020/07/06/version-0.63
  }

 private:
  JsErrorHandler::OnJsError onJsError_;
};

} // namespace facebook::react
