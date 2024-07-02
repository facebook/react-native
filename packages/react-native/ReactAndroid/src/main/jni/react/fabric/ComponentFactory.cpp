/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentFactory.h"

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/components/rncore/ComponentDescriptors.h>

#include "CoreComponentsRegistry.h"
#include "DefaultComponentsRegistry.h"

using namespace facebook::jsi;

namespace facebook::react {

jni::local_ref<ComponentFactory::jhybriddata> ComponentFactory::initHybrid(
    jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

SharedComponentDescriptorRegistry ComponentFactory::defaultBuildRegistry(
    const EventDispatcher::Weak& eventDispatcher,
    const ContextContainer::Shared& contextContainer) {
  ComponentDescriptorParameters params{
      .eventDispatcher = eventDispatcher,
      .contextContainer = contextContainer,
      .flavor = nullptr};

  auto providerRegistry = CoreComponentsRegistry::sharedProviderRegistry();
  if (DefaultComponentsRegistry::registerComponentDescriptorsFromEntryPoint) {
    DefaultComponentsRegistry::registerComponentDescriptorsFromEntryPoint(
        providerRegistry);
  } else {
    LOG(WARNING)
        << "Custom component descriptors were not configured from JNI_OnLoad";
  }

  auto registry = providerRegistry->createComponentDescriptorRegistry(params);
  auto& mutableRegistry = const_cast<ComponentDescriptorRegistry&>(*registry);
  mutableRegistry.setFallbackComponentDescriptor(
      std::make_shared<UnimplementedNativeViewComponentDescriptor>(params));

  return registry;
}

void ComponentFactory::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", ComponentFactory::initHybrid),
  });
}

} // namespace facebook::react
