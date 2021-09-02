/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/renderer/uimanager/primitives.h>

namespace facebook {
namespace react {

using namespace facebook::jni;

class JBackgroundExecutor : public JavaClass<JBackgroundExecutor> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/bridge/BackgroundExecutor;";

  constexpr static auto JBackgroundExecutorJavaDescriptor =
      "com/facebook/react/bridge/BackgroundExecutor";

  static global_ref<javaobject> create() {
    return make_global(newInstance());
  }

  BackgroundExecutor get();
};

} // namespace react
} // namespace facebook
