/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CoreComponentsRegistry.h"

#include <android/log.h>

#include <fbjni/fbjni.h>

#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/components/androidswitch/AndroidSwitchComponentDescriptor.h>
#include <react/renderer/components/androidtextinput/AndroidTextInputComponentDescriptor.h>
#include <react/renderer/components/image/ImageComponentDescriptor.h>
#include <react/renderer/components/modal/ModalHostViewComponentDescriptor.h>
#include <react/renderer/components/progressbar/AndroidProgressBarComponentDescriptor.h>
#include <react/renderer/components/rncore/ComponentDescriptors.h>
#include <react/renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <react/renderer/components/text/ParagraphComponentDescriptor.h>
#include <react/renderer/components/text/RawTextComponentDescriptor.h>
#include <react/renderer/components/text/TextComponentDescriptor.h>
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

    providerRegistry->add(concreteComponentDescriptorProvider<
                          AndroidProgressBarComponentDescriptor>());
    providerRegistry->add(concreteComponentDescriptorProvider<
                          AndroidSwipeRefreshLayoutComponentDescriptor>());
    providerRegistry->add(concreteComponentDescriptorProvider<
                          ActivityIndicatorViewComponentDescriptor>());
    providerRegistry->add(concreteComponentDescriptorProvider<
                          AndroidTextInputComponentDescriptor>());
    providerRegistry->add(
        concreteComponentDescriptorProvider<ViewComponentDescriptor>());
    providerRegistry->add(
        concreteComponentDescriptorProvider<ImageComponentDescriptor>());
    providerRegistry->add(concreteComponentDescriptorProvider<
                          ModalHostViewComponentDescriptor>());
    providerRegistry->add(concreteComponentDescriptorProvider<
                          AndroidSwitchComponentDescriptor>());
    providerRegistry->add(
        concreteComponentDescriptorProvider<TextComponentDescriptor>());
    providerRegistry->add(
        concreteComponentDescriptorProvider<RawTextComponentDescriptor>());
    providerRegistry->add(
        concreteComponentDescriptorProvider<ScrollViewComponentDescriptor>());
    providerRegistry->add(
        concreteComponentDescriptorProvider<
            AndroidHorizontalScrollContentViewComponentDescriptor>());
    providerRegistry->add(
        concreteComponentDescriptorProvider<ParagraphComponentDescriptor>());
    providerRegistry->add(concreteComponentDescriptorProvider<
                          AndroidDrawerLayoutComponentDescriptor>());
    providerRegistry->add(concreteComponentDescriptorProvider<
                          TraceUpdateOverlayComponentDescriptor>());

    return providerRegistry;
  }();

  return providerRegistry;
}

jni::local_ref<CoreComponentsRegistry::jhybriddata>
CoreComponentsRegistry::initHybrid(
    jni::alias_ref<jclass>,
    ComponentFactory *delegate) {
  auto instance = makeCxxInstance(delegate);

  // TODO T69453179: Codegen this file
  auto buildRegistryFunction =
      [](EventDispatcher::Weak const &eventDispatcher,
         ContextContainer::Shared const &contextContainer)
      -> ComponentDescriptorRegistry::Shared {
    auto registry = CoreComponentsRegistry::sharedProviderRegistry()
                        ->createComponentDescriptorRegistry(
                            {eventDispatcher, contextContainer});
    auto mutableRegistry =
        std::const_pointer_cast<ComponentDescriptorRegistry>(registry);
    mutableRegistry->setFallbackComponentDescriptor(
        std::make_shared<UnimplementedNativeViewComponentDescriptor>(
            ComponentDescriptorParameters{
                eventDispatcher, contextContainer, nullptr}));

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
