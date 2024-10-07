/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/TurboModule.h>
#include <ReactCommon/CallInvoker.h>
#include <fbjni/fbjni.h>

namespace facebook::react {

class BindingsInstallerHolder
    : public jni::HybridClass<BindingsInstallerHolder> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/turbomodule/core/interfaces/BindingsInstallerHolder;";
  using BindingsInstallFunc = std::function<void(jsi::Runtime& runtime,
                                                 std::shared_ptr<CallInvoker> callInvoker)>;

  void installBindings(jsi::Runtime& runtime, const std::shared_ptr<CallInvoker>& callInvoker);

 private:
  friend HybridBase;
  BindingsInstallerHolder(BindingsInstallFunc bindingsInstaller);
  BindingsInstallFunc bindingsInstaller_;
};

} // namespace facebook::react
