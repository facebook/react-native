/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cstdlib>

#include <react/components/image/ImageLocalData.h>
#include <react/components/image/ImageShadowNode.h>
#include <react/core/LayoutContext.h>

namespace facebook {
namespace react {

const char ImageComponentName[] = "Image";

void ImageShadowNode::setImageManager(const SharedImageManager &imageManager) {
  ensureUnsealed();
  imageManager_ = imageManager;
}

void ImageShadowNode::updateLocalData() {
  const auto &imageSource = getImageSource();
  const auto &currentLocalData = getLocalData();
  if (currentLocalData) {
    assert(std::dynamic_pointer_cast<const ImageLocalData>(currentLocalData));
    auto currentImageLocalData =
        std::static_pointer_cast<const ImageLocalData>(currentLocalData);
    if (currentImageLocalData->getImageSource() == imageSource) {
      // Same `imageSource` is already in `localData`,
      // no need to (re)request an image resource.
      return;
    }
  }

  // Now we are about to mutate the Shadow Node.
  ensureUnsealed();

  auto imageRequest = imageManager_->requestImage(imageSource);
  auto imageLocalData =
      std::make_shared<ImageLocalData>(imageSource, std::move(imageRequest));
  setLocalData(imageLocalData);
}

ImageSource ImageShadowNode::getImageSource() const {
  auto sources = getProps()->sources;

  if (sources.size() == 0) {
    return {.type = ImageSource::Type::Invalid};
  }

  if (sources.size() == 1) {
    return sources[0];
  }

  auto layoutMetrics = getLayoutMetrics();
  auto size = layoutMetrics.getContentFrame().size;
  auto scale = layoutMetrics.pointScaleFactor;
  auto targetImageArea = size.width * size.height * scale * scale;
  auto bestFit = kFloatMax;

  auto bestSource = ImageSource{};

  for (const auto &source : sources) {
    auto sourceSize = source.size;
    auto sourceScale = source.scale == 0 ? scale : source.scale;
    auto sourceArea =
        sourceSize.width * sourceSize.height * sourceScale * sourceScale;

    auto fit = std::abs(1 - (sourceArea / targetImageArea));

    if (fit < bestFit) {
      bestFit = fit;
      bestSource = source;
    }
  }

  return bestSource;
}

#pragma mark - LayoutableShadowNode

void ImageShadowNode::layout(LayoutContext layoutContext) {
  updateLocalData();
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace react
} // namespace facebook
