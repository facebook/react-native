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
    makeNativeMethod("getJSIBindingsInstallerCxx", SampleTurboModuleJSIBindings::getJSIBindingsInstallerCxx),
  });
}

// static
jni::local_ref<JJSIBindingsInstaller::javaobject> SampleTurboModuleJSIBindings::getJSIBindingsInstallerCxx(jni::alias_ref<jni::JClass> clazz) {
  return jni::make_local(JJSIBindingsInstaller::newObjectCxxArgs([](jsi::Runtime &runtime) {
    runtime.global().setProperty(runtime, "__SampleTurboModuleJSIBindings", "Hello JSI!");
  }));
}

} // namespace facebook::react
