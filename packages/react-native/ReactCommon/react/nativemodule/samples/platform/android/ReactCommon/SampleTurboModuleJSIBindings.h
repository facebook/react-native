/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

namespace facebook::react {

class SampleTurboModuleJSIBindings : public jni::JavaClass<SampleTurboModuleJSIBindings> {
 public:
  static constexpr const char* kJavaDescriptor =
      "Lcom/facebook/fbreact/specs/SampleTurboModule;";

  SampleTurboModuleJSIBindings() = default;

  static void registerNatives();

 private:
  // Using static function as a simple demonstration
  static void installJSIBindingsCxx(jni::alias_ref<jni::JClass> clazz, jlong runtimePtr);
};

} // namespace facebook::react
