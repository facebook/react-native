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

  using JsErrorHandlingFunc = std::function<void(const ParsedError& error)>;

  explicit JsErrorHandler(JsErrorHandlingFunc jsErrorHandlingFunc);
  ~JsErrorHandler();

  void handleJsError(const jsi::JSError& error, bool isFatal);

 private:
  JsErrorHandlingFunc _jsErrorHandlingFunc;
};

} // namespace facebook::react
