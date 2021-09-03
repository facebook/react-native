/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/image/ImageShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/imagemanager/ImageManager.h>
#include <react/utils/ContextContainer.h>

namespace facebook {
namespace react {

/*
 * Descriptor for <Image> component.
 */
class ImageComponentDescriptor final
    : public ConcreteComponentDescriptor<ImageShadowNode> {
 public:
  ImageComponentDescriptor(ComponentDescriptorParameters const &parameters)
      : ConcreteComponentDescriptor(parameters),
        imageManager_(std::make_shared<ImageManager>(contextContainer_)){};

  void adopt(UnsharedShadowNode shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    assert(std::dynamic_pointer_cast<ImageShadowNode>(shadowNode));
    auto imageShadowNode =
        std::static_pointer_cast<ImageShadowNode>(shadowNode);

    // `ImageShadowNode` uses `ImageManager` to initiate image loading and
    // communicate the loading state and results to mounting layer.
    imageShadowNode->setImageManager(imageManager_);
  }

 private:
  const SharedImageManager imageManager_;
};

} // namespace react
} // namespace facebook
