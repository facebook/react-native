/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef RN_FABRIC_ENABLED

#include <react/components/image/ImageComponentDescriptor.h>
#include <react/components/rncore/ComponentDescriptors.h>
#include <react/components/scrollview/ScrollViewComponentDescriptor.h>
#include <react/components/slider/SliderComponentDescriptor.h>
#include <react/components/text/ParagraphComponentDescriptor.h>
#include <react/components/text/RawTextComponentDescriptor.h>
#include <react/components/text/TextComponentDescriptor.h>
#include <react/components/view/ViewComponentDescriptor.h>
#include <react/config/ReactNativeConfig.h>
#include <react/uimanager/ComponentDescriptorFactory.h>
#include <react/uimanager/ComponentDescriptorRegistry.h>
#include <react/utils/ContextContainer.h>

namespace facebook {
namespace react {

/**
 * This is a sample implementation. Each app should provide its own.
 */
ComponentRegistryFactory getDefaultComponentRegistryFactory() {
  return [](const EventDispatcher::Shared &eventDispatcher,
            const ContextContainer::Shared &contextContainer) {
    auto registry = std::make_shared<ComponentDescriptorRegistry>();
    registry->registerComponentDescriptor(std::make_shared<ViewComponentDescriptor>(eventDispatcher));
    registry->registerComponentDescriptor(std::make_shared<ImageComponentDescriptor>(eventDispatcher, contextContainer));
    registry->registerComponentDescriptor(std::make_shared<ScrollViewComponentDescriptor>(eventDispatcher));
    registry->registerComponentDescriptor(std::make_shared<ParagraphComponentDescriptor>(eventDispatcher, contextContainer));
    registry->registerComponentDescriptor(std::make_shared<TextComponentDescriptor>(eventDispatcher));
    registry->registerComponentDescriptor(std::make_shared<RawTextComponentDescriptor>(eventDispatcher));
    registry->registerComponentDescriptor(std::make_shared<ActivityIndicatorViewComponentDescriptor>(eventDispatcher));
    registry->registerComponentDescriptor(std::make_shared<SwitchComponentDescriptor>(eventDispatcher));
    registry->registerComponentDescriptor(std::make_shared<SliderComponentDescriptor>(eventDispatcher, contextContainer));
    return registry;
  };
}

} // namespace react
} // namespace facebook
#endif
