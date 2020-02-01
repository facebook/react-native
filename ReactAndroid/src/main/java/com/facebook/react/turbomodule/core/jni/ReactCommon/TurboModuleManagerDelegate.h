/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/JavaTurboModule.h>
#include <fbjni/fbjni.h>
#include <memory>
#include <string>

namespace facebook {
namespace react {

class TurboModuleManagerDelegate
    : public jni::HybridClass<TurboModuleManagerDelegate> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/turbomodule/core/TurboModuleManagerDelegate;";

  virtual std::shared_ptr<TurboModule> getTurboModule(
      std::string name,
      jni::alias_ref<JTurboModule> turboModule,
      std::shared_ptr<CallInvoker> jsInvoker,
      std::shared_ptr<CallInvoker> nativeInvoker) = 0;
  virtual std::shared_ptr<TurboModule> getTurboModule(
      std::string name,
      std::shared_ptr<CallInvoker> jsInvoker) = 0;

 private:
  friend HybridBase;
};

} // namespace react
} // namespace facebook
