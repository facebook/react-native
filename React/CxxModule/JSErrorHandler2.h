/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <jsi/jsi.h>
#import <optional>
#import <string>
#import <vector>

namespace facebook {
namespace react {

struct JSStackFrame {
  std::string fileName;
  std::string methodName;
  std::optional<int> lineNumber;
  std::optional<int> columnNumber;
};

struct ParsedJSError {
  std::vector<JSStackFrame> frames;
  std::string message;
  int exceptionId;
  bool isFatal;
};

ParsedJSError
parseJSErrorStack(const jsi::JSError &error, bool isFatal, bool isHermes);

} // namespace react
} // namespace facebook
