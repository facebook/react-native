/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/TurboModuleManagerDelegate.h>
#include <fbjni/fbjni.h>
#include <memory>
#include <string>
#include <vector>

namespace facebook::react {

class CompositeTurboModuleManagerDelegate
    : public jni::HybridClass<
          CompositeTurboModuleManagerDelegate,
          TurboModuleManagerDelegate> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/CompositeReactPackageTurboModuleManagerDelegate;";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject>);

  static void registerNatives();

  std::shared_ptr<TurboModule> getTurboModule(
      const std::string& moduleName,
      const std::shared_ptr<CallInvoker>& jsInvoker) override;

  std::shared_ptr<TurboModule> getTurboModule(
      const std::string& moduleName,
      const JavaTurboModule::InitParams& params) override;

 private:
  friend HybridBase;
  using HybridBase::HybridBase;
  std::vector<jni::global_ref<TurboModuleManagerDelegate::javaobject>>
      mDelegates_;

  void addTurboModuleManagerDelegate(
      jni::alias_ref<TurboModuleManagerDelegate::javaobject> delegate);
};

} // namespace facebook::react
