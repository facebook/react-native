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
      "Lcom/facebook/react/turbomodule/core/interfaces/BindingsInstallerHolder;";

  void installBindings(jsi::Runtime& runtime);

 private:
  friend HybridBase;
  BindingsInstallerHolder(
      std::function<void(facebook::jsi::Runtime& runtime)> bindingsInstaller);
  std::function<void(facebook::jsi::Runtime& runtime)> bindingsInstaller_;
};

} // namespace facebook::react
