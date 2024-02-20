/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ReactCommon/SampleTurboModuleJSIBindings.h>

namespace facebook::react {

// static
void SampleTurboModuleJSIBindings::registerNatives() {
  javaClassLocal()->registerNatives({
    makeNativeMethod("installJSIBindingsCxx", SampleTurboModuleJSIBindings::installJSIBindingsCxx),
  });
}

// static
void SampleTurboModuleJSIBindings::installJSIBindingsCxx(jni::alias_ref<jni::JClass> clazz, jlong runtimePtr) {
  jsi::Runtime &runtime = *reinterpret_cast<jsi::Runtime *>(runtimePtr);
  runtime.global().setProperty(runtime, "__SampleTurboModuleJSIBindings", "Hello JSI!");
}

} // namespace facebook::react
