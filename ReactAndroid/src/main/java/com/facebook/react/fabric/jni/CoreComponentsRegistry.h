/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include "ComponentFactory.h"

namespace facebook {
namespace react {

class CoreComponentsRegistry
    : public facebook::jni::HybridClass<CoreComponentsRegistry> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/fabric/CoreComponentsRegistry;";

  static void registerNatives();

  CoreComponentsRegistry(ComponentFactory *delegate);

 private:
  friend HybridBase;

  static std::shared_ptr<ComponentDescriptorProviderRegistry const>
  sharedProviderRegistry();

  const ComponentFactory *delegate_;

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass>,
      ComponentFactory *delegate);
};

} // namespace react
} // namespace facebook
