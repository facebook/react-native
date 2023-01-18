/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ComponentFactory.h>
#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace react {

class DefaultComponentsRegistry
    : public facebook::jni::HybridClass<DefaultComponentsRegistry> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/defaults/DefaultComponentsRegistry;";

  static void registerNatives();

  static std::function<void(
      std::shared_ptr<ComponentDescriptorProviderRegistry const>)>
      registerComponentDescriptorsFromEntryPoint;

  DefaultComponentsRegistry(ComponentFactory *delegate);

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
