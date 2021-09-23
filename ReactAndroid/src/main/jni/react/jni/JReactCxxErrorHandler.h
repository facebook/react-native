/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <string>

namespace facebook {
namespace react {

class JReactCxxErrorHandler : public jni::JavaClass<JReactCxxErrorHandler> {
 public:
  static constexpr const char *kJavaDescriptor =
      "Lcom/facebook/react/bridge/ReactCxxErrorHandler;";

  static void handleError(std::string message);
};

} // namespace react
} // namespace facebook
