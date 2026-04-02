/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageComponentDescriptor.h"
#include <react/renderer/imagemanager/ImageManager.h>

namespace facebook::react {

extern const char ImageManagerKey[] = "ImageManager";

ImageComponentDescriptor::ImageComponentDescriptor(
    const ComponentDescriptorParameters& parameters)
    : ConcreteComponentDescriptor(parameters),
      imageManager_(
          getManagerByName<ImageManager>(contextContainer_, ImageManagerKey)) {
      };

void ImageComponentDescriptor::adopt(ShadowNode& shadowNode) const {
  ConcreteComponentDescriptor::adopt(shadowNode);

  auto& imageShadowNode = static_cast<ImageShadowNode&>(shadowNode);

  // `ImageShadowNode` uses `ImageManager` to initiate image loading and
  // communicate the loading state and results to mounting layer.
  imageShadowNode.setImageManager(imageManager_);
}
} // namespace facebook::react
