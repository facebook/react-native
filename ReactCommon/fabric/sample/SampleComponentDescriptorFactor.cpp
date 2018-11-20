/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fabric/uimanager/ComponentDescriptorFactory.h>
#include <fabric/uimanager/ComponentDescriptorRegistry.h>
#include <fabric/uimanager/ContextContainer.h>

#include <fabric/components/activityindicator/ActivityIndicatorViewComponentDescriptor.h>
#include <fabric/components/image/ImageComponentDescriptor.h>
#include <fabric/components/scrollview/ScrollViewComponentDescriptor.h>
#include <fabric/components/text/paragraph/ParagraphComponentDescriptor.h>
#include <fabric/components/text/rawtext/RawTextComponentDescriptor.h>
#include <fabric/components/text/text/TextComponentDescriptor.h>
#include <fabric/components/view/ViewComponentDescriptor.h>
#include <fabric/uimanager/ComponentDescriptorRegistry.h>

namespace facebook {
namespace react {

/**
 * This is a sample implementation. Each app should provide its own.
 */
SharedComponentDescriptorRegistry ComponentDescriptorFactory::buildRegistry(
    const SharedEventDispatcher &eventDispatcher,
    const SharedContextContainer &contextContainer) {
//  auto registry = std::make_shared<ComponentDescriptorRegistry>();
//  return registry;
  auto registry = std::make_shared<ComponentDescriptorRegistry>();
  registry->registerComponentDescriptor(
                                        std::make_shared<ViewComponentDescriptor>(eventDispatcher));
  registry->registerComponentDescriptor(
                                        std::make_shared<ImageComponentDescriptor>(
                                                                                   eventDispatcher, contextContainer));
  registry->registerComponentDescriptor(
                                        std::make_shared<ScrollViewComponentDescriptor>(eventDispatcher));
  registry->registerComponentDescriptor(
                                        std::make_shared<ParagraphComponentDescriptor>(
                                                                                       eventDispatcher, contextContainer));
  registry->registerComponentDescriptor(
                                        std::make_shared<TextComponentDescriptor>(eventDispatcher));
  registry->registerComponentDescriptor(
                                        std::make_shared<RawTextComponentDescriptor>(eventDispatcher));
  registry->registerComponentDescriptor(
                                        std::make_shared<ActivityIndicatorViewComponentDescriptor>(
                                                                                                   eventDispatcher));
  return registry;
}

} // namespace react
} // namespace facebook
