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

class JJSIBindingsInstaller : public jni::HybridClass<JJSIBindingsInstaller> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/turbomodule/core/JSIBindingsInstaller;";

  TurboModule::JSIBindingsInstaller get();

 private:
  friend HybridBase;
  JJSIBindingsInstaller(TurboModule::JSIBindingsInstaller jsiBindingsInstaller);
  TurboModule::JSIBindingsInstaller jsiBindingsInstaller_;
};

} // namespace facebook::react
