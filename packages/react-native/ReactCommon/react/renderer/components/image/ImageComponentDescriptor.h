/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/image/ImageShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/imagemanager/ImageManager.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

/*
 * Descriptor for <Image> component.
 */
class ImageComponentDescriptor final
    : public ConcreteComponentDescriptor<ImageShadowNode> {
 public:
  ImageComponentDescriptor(const ComponentDescriptorParameters& parameters)
      : ConcreteComponentDescriptor(parameters),
        imageManager_(std::make_shared<ImageManager>(contextContainer_)){};

  void adopt(ShadowNode& shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    auto& imageShadowNode = static_cast<ImageShadowNode&>(shadowNode);

    // `ImageShadowNode` uses `ImageManager` to initiate image loading and
    // communicate the loading state and results to mounting layer.
    imageShadowNode.setImageManager(imageManager_);
  }

 private:
  const SharedImageManager imageManager_;
};

} // namespace facebook::react
