/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>

namespace facebook {
namespace react {

class JRuntimeScheduler : public jni::HybridClass<JRuntimeScheduler> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/bridge/RuntimeScheduler;";

  std::shared_ptr<RuntimeScheduler> get();

 private:
  friend HybridBase;
  JRuntimeScheduler(std::shared_ptr<RuntimeScheduler> const &runtimeScheduler);
  std::shared_ptr<RuntimeScheduler> runtimeScheduler_;
};

} // namespace react
} // namespace facebook
