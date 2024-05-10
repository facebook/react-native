/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/TurboModule.h>
#include <fbjni/fbjni.h>

namespace facebook::react {

class BindingsInstallerHolder
    : public jni::HybridClass<BindingsInstallerHolder> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/turbomodule/core/BindingsInstallerHolder;";

  TurboModule::BindingsInstaller get();

 private:
  friend HybridBase;
  BindingsInstallerHolder(TurboModule::BindingsInstaller bindingsInstaller);
  TurboModule::BindingsInstaller bindingsInstaller_;
};

} // namespace facebook::react
