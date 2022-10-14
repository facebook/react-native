/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jsi/jsi.h>
#include <react/renderer/mapbuffer/MapBuffer.h>

namespace facebook {
namespace react {

const int FILE_KEY_OF_JS_ERROR = 0;
const int METHOD_NAME_KEY_OF_JS_ERROR = 1;
const int LINE_NUMBER_KEY_OF_JS_ERROR = 2;
const int COLUMN_KEY_OF_JS_ERROR = 3;
const int FRAMES_KEY_OF_JS_ERROR = 4;
const int MESSAGE_KEY_OF_JS_ERROR = 5;
const int ID_KEY_OF_JS_ERROR = 6;
const int IS_FATAL_KEY_OF_JS_ERROR = 7;

class JsErrorHandler {
 public:
  using JsErrorHandlingFunc = std::function<void(MapBuffer errorMap)>;

  JsErrorHandler(JsErrorHandlingFunc jsErrorHandlingFunc);
  ~JsErrorHandler();

  void handleJsError(const jsi::JSError &error, bool isFatal);

 private:
  JsErrorHandlingFunc _jsErrorHandlingFunc;
};

} // namespace react
} // namespace facebook
