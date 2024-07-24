/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/fbjni.h>

#include "DefaultComponentsRegistry.h"
#include "DefaultTurboModuleManagerDelegate.h"

namespace facebook::react {
JNIEXPORT void OnLoad_react_newarchdefaults() {
  facebook::react::DefaultTurboModuleManagerDelegate::registerNatives();
  facebook::react::DefaultComponentsRegistry::registerNatives();
}
} // namespace facebook::react

#ifndef REACT_NATIVE_OPEN_SOURCE
JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* /*unused*/) {
  return facebook::jni::initialize(
      vm, [] { facebook::react::OnLoad_react_newarchdefaults(); });
}
#endif
