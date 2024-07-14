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
      makeNativeMethod(
          "getBindingsInstaller",
          SampleTurboModuleJSIBindings::getBindingsInstaller),
  });
}

// static
jni::local_ref<BindingsInstallerHolder::javaobject>
SampleTurboModuleJSIBindings::getBindingsInstaller(
    jni::alias_ref<SampleTurboModuleJSIBindings> /*jobj*/) {
  return BindingsInstallerHolder::newObjectCxxArgs([](jsi::Runtime& runtime) {
    runtime.global().setProperty(
        runtime, "__SampleTurboModuleJSIBindings", "Hello JSI!");
  });
}

} // namespace facebook::react
