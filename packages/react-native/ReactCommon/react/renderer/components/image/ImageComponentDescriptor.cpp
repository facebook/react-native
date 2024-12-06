/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageComponentDescriptor.h"
#include <react/renderer/imagemanager/ImageManager.h>

namespace {

std::shared_ptr<facebook::react::ImageManager> getImageManager(
    std::shared_ptr<const facebook::react::ContextContainer>&
        contextContainer) {
  if (auto imageManager =
          contextContainer
              ->find<std::shared_ptr<facebook::react::ImageManager>>(
                  facebook::react::ImageManagerKey);
      imageManager.has_value()) {
    return imageManager.value();
  }
  return std::make_shared<facebook::react::ImageManager>(contextContainer);
}

} // namespace

namespace facebook::react {

extern const char ImageManagerKey[] = "ImageManager";

ImageComponentDescriptor::ImageComponentDescriptor(
    const ComponentDescriptorParameters& parameters)
    : ConcreteComponentDescriptor(parameters),
      imageManager_(getImageManager(contextContainer_)){};

void ImageComponentDescriptor::adopt(ShadowNode& shadowNode) const {
  ConcreteComponentDescriptor::adopt(shadowNode);

  auto& imageShadowNode = static_cast<ImageShadowNode&>(shadowNode);

  // `ImageShadowNode` uses `ImageManager` to initiate image loading and
  // communicate the loading state and results to mounting layer.
  imageShadowNode.setImageManager(imageManager_);
}
} // namespace facebook::react
