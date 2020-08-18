/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentFactoryDelegate.h"
#include <android/log.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <react/uimanager/ComponentDescriptorRegistry.h>

using namespace facebook::jsi;

namespace facebook {
namespace react {

jni::local_ref<ComponentFactoryDelegate::jhybriddata>
ComponentFactoryDelegate::initHybrid(jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

void ComponentFactoryDelegate::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", ComponentFactoryDelegate::initHybrid),
  });
}

} // namespace react
} // namespace facebook
