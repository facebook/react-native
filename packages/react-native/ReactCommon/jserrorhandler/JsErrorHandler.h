/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

namespace facebook::react {

class JsErrorHandler {
 public:
  struct ParsedError {
    struct StackFrame {
      std::string fileName;
      std::string methodName;
      int lineNumber;
      int columnNumber;
    };

    std::vector<StackFrame> frames;
    std::string message;
    int exceptionId;
    bool isFatal;
  };

  using OnJsError = std::function<void(const ParsedError& error)>;

  explicit JsErrorHandler(OnJsError onJsError);
  ~JsErrorHandler();

  void handleFatalError(jsi::Runtime& runtime, jsi::JSError& error);
  bool hasHandledFatalError();
  void setRuntimeReady();
  bool isRuntimeReady();
  void notifyOfFatalError();

 private:
  /**
   * This callback:
   * 1. Shouldn't retain the ReactInstance. So that we don't get retain cycles.
   * 2. Should be implemented by something that can outlive the react instance
   *    (both before init and after teardown). So that errors during init and
   *    teardown get reported properly.
   **/
  OnJsError _onJsError;
  bool _hasHandledFatalError;
  bool _isRuntimeReady{};
};

} // namespace facebook::react
