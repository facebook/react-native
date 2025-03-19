/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cstdlib>
#include <limits>

#include <react/renderer/components/image/ImageShadowNode.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/imagemanager/ImageRequestParams.h>
#include "ImageState.h"

namespace facebook::react {

const char ImageComponentName[] = "Image";

void ImageShadowNode::setImageManager(const SharedImageManager& imageManager) {
  ensureUnsealed();
  imageManager_ = imageManager;
}

void ImageShadowNode::updateStateIfNeeded() {
  ensureUnsealed();

  const auto& savedState = getStateData();
  const auto& oldImageSource = savedState.getImageSource();
  auto newImageSource = getImageSource();
  const auto& oldImageRequestParams = savedState.getImageRequestParams();
  const auto& imageProps = getConcreteProps();
  const auto& newImageRequestParams = ImageRequestParams(
      imageProps.blurRadius
#ifdef ANDROID
      ,
      imageProps.defaultSource,
      imageProps.resizeMode,
      imageProps.resizeMethod,
      // TODO: should we resizeMultiplier * imageSource.scale ?
      imageProps.resizeMultiplier,
      imageProps.shouldNotifyLoadEvents,
      imageProps.overlayColor,
      imageProps.tintColor,
      imageProps.fadeDuration,
      imageProps.progressiveRenderingEnabled,
      imageProps.loadingIndicatorSource,
      imageProps.internal_analyticTag
#endif
  );

  if (oldImageSource == newImageSource &&
      oldImageRequestParams == newImageRequestParams) {
    return;
  }

  auto state = ImageState{
      newImageSource,
      imageManager_->requestImage(
          newImageSource,
          getSurfaceId()
#ifdef ANDROID
              ,
          newImageRequestParams,
          getTag()
#endif
              ),
      newImageRequestParams};
  setStateData(std::move(state));
}

ImageSource ImageShadowNode::getImageSource() const {
  auto sources = getConcreteProps().sources;

  if (sources.empty()) {
    return {
        /* .type = */ ImageSource::Type::Invalid,
    };
  }

  auto layoutMetrics = getLayoutMetrics();
  auto size = layoutMetrics.getContentFrame().size;
  auto scale = layoutMetrics.pointScaleFactor;

  if (sources.size() == 1) {
    auto source = sources[0];
    source.size = size;
    source.scale = scale;
    return source;
  }

  auto targetImageArea = size.width * size.height * scale * scale;
  auto bestFit = std::numeric_limits<Float>::infinity();

  auto bestSource = ImageSource{};

  for (const auto& source : sources) {
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

  bestSource.size = size;
  bestSource.scale = scale;

  return bestSource;
}

#pragma mark - LayoutableShadowNode

void ImageShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded();
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace facebook::react
