// Copyright 2004-present Facebook. All Rights Reserved.
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <react/uimanager/ComponentDescriptorRegistry.h>
#include <react/uimanager/ContextContainer.h>
#include <react/uimanager/Scheduler.h>
#include <fb/fbjni.h>
#include <jsi/jsi.h>
#include <mutex>
#include <unordered_set>

using namespace facebook::jsi;

namespace facebook {
namespace react {

class Instance;

class ComponentFactoryDelegate : public jni::HybridClass<ComponentFactoryDelegate> {
public:
  constexpr static const char *const kJavaDescriptor =
    "Lcom/facebook/react/fabric/jsi/ComponentFactoryDelegate;";

  static void registerNatives();

  ComponentRegistryFactory buildRegistryFunction;

private:

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jclass>);

};

}
}
