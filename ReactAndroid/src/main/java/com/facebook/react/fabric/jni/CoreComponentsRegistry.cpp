/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CoreComponentsRegistry.h"

#include <android/log.h>

#include <fbjni/fbjni.h>

#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>

namespace facebook {
namespace react {

CoreComponentsRegistry::CoreComponentsRegistry(ComponentFactory *delegate)
    : delegate_(delegate) {}

std::shared_ptr<ComponentDescriptorProviderRegistry const>
CoreComponentsRegistry::sharedProviderRegistry() {
  static auto providerRegistry =
      []() -> std::shared_ptr<ComponentDescriptorProviderRegistry> {
    auto providerRegistry =
        std::make_shared<ComponentDescriptorProviderRegistry>();

    providerRegistry->add(
        concreteComponentDescriptorProvider<ViewComponentDescriptor>());
    return providerRegistry;
  }();

  return providerRegistry;
}

jni::local_ref<CoreComponentsRegistry::jhybriddata>
CoreComponentsRegistry::initHybrid(
    jni::alias_ref<jclass>,
    ComponentFactory *delegate) {
  auto instance = makeCxxInstance(delegate);

  auto buildRegistryFunction =
      [](EventDispatcher::Weak const &eventDispatcher,
         ContextContainer::Shared const &contextContainer)
      -> ComponentDescriptorRegistry::Shared {
    auto registry = CoreComponentsRegistry::sharedProviderRegistry()
                        ->createComponentDescriptorRegistry(
                            {eventDispatcher, contextContainer});
    return registry;
  };

  delegate->buildRegistryFunction = buildRegistryFunction;
  return instance;
}

void CoreComponentsRegistry::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", CoreComponentsRegistry::initHybrid),
  });
}

} // namespace react
} // namespace facebook
