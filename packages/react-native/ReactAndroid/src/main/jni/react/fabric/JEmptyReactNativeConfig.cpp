/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JEmptyReactNativeConfig.h"
#include <fbjni/fbjni.h>
#include <react/config/ReactNativeConfig.h>

namespace facebook::react {

jni::local_ref<JEmptyReactNativeConfig::jhybriddata>
JEmptyReactNativeConfig::initHybrid(jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

void JEmptyReactNativeConfig::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JEmptyReactNativeConfig::initHybrid),
  });
}

} // namespace facebook::react
