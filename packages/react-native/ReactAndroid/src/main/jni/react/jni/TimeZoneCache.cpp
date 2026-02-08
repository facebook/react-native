/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TimeZoneCache.h"
#include <jsi/hermes-interfaces.h>

namespace facebook::react {

void TimeZoneCache::resetNativeHermesTimeZoneCache(jni::alias_ref<jclass> /* unused */,jlong jsRuntimePtr) {
    if (!jsRuntimePtr) {
    return;
}
    jsi::Runtime &runtime = *reinterpret_cast<jsi::Runtime*>(jsRuntimePtr);
    auto* hermesAPI = jsi::castInterface<hermes::IHermes>(&runtime);
    if (!hermesAPI) {
        return;
    }
    hermesAPI->resetTimezoneCache();
}
void TimeZoneCache::registerNatives() {
    registerHybrid({
        makeNativeMethod("resetNativeHermesTimeZoneCache", TimeZoneCache::resetNativeHermesTimeZoneCache),
  });
}



} // namespace facebook::react
