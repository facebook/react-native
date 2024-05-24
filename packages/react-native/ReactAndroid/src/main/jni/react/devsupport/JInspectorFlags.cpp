/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JInspectorFlags.h"

#include <jsinspector-modern/InspectorFlags.h>

namespace facebook::react::jsinspector_modern {

bool JInspectorFlags::getEnableModernCDPRegistry(jni::alias_ref<jclass>) {
  auto& inspectorFlags = InspectorFlags::getInstance();
  return inspectorFlags.getEnableModernCDPRegistry();
}

void JInspectorFlags::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "getEnableModernCDPRegistry",
          JInspectorFlags::getEnableModernCDPRegistry),
  });
}

} // namespace facebook::react::jsinspector_modern
