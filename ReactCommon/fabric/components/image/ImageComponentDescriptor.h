/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/components/image/ImageShadowNode.h>
#include <fabric/core/ConcreteComponentDescriptor.h>
#include <fabric/imagemanager/ImageManager.h>
#include <fabric/uimanager/ContextContainer.h>

namespace facebook {
namespace react {

/*
 * Descriptor for <Image> component.
 */
class ImageComponentDescriptor final:
  public ConcreteComponentDescriptor<ImageShadowNode> {

public:
  ImageComponentDescriptor(SharedEventDispatcher eventDispatcher, const SharedContextContainer &contextContainer):
    ConcreteComponentDescriptor(eventDispatcher),
    imageManager_(contextContainer->getInstance<SharedImageManager>()) {}

  void adopt(UnsharedShadowNode shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    assert(std::dynamic_pointer_cast<ImageShadowNode>(shadowNode));
    auto imageShadowNode = std::static_pointer_cast<ImageShadowNode>(shadowNode);

    // `ImageShadowNode` uses `ImageManager` to initiate image loading and
    // communicate the loading state and results to mounting layer.
    imageShadowNode->setImageManager(imageManager_);
  }

private:
  const SharedImageManager imageManager_;
};

} // namespace react
} // namespace facebook

