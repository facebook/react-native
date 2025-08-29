/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <utility>

#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/imagemanager/primitives.h>

namespace facebook::react {

class ImageRequestParams {
 public:
  ImageRequestParams() = default;
  ImageRequestParams(
      Float blurRadius,
      ImageSource defaultSource,
      ImageResizeMode resizeMode,
      std::string resizeMethod,
      Float resizeMultiplier,
      bool shouldNotifyLoadEvents,
      SharedColor overlayColor,
      SharedColor tintColor,
      Float fadeDuration,
      bool progressiveRenderingEnabled,
      ImageSource loadingIndicatorSource,
      std::string analyticTag)
      : blurRadius(blurRadius),
        defaultSource(std::move(defaultSource)),
        resizeMode(resizeMode),
        resizeMethod(std::move(resizeMethod)),
        resizeMultiplier(resizeMultiplier),
        shouldNotifyLoadEvents(shouldNotifyLoadEvents),
        overlayColor(overlayColor),
        tintColor(tintColor),
        fadeDuration(fadeDuration),
        progressiveRenderingEnabled(progressiveRenderingEnabled),
        loadingIndicatorSource(std::move(loadingIndicatorSource)),
        analyticTag(std::move(analyticTag)) {}

  Float blurRadius{};
  ImageSource defaultSource{};
  ImageResizeMode resizeMode{ImageResizeMode::Stretch};
  std::string resizeMethod{};
  Float resizeMultiplier{};
  bool shouldNotifyLoadEvents{};
  SharedColor overlayColor{};
  SharedColor tintColor{};
  Float fadeDuration{};
  bool progressiveRenderingEnabled{};
  ImageSource loadingIndicatorSource{};
  std::string analyticTag{};

  bool operator==(const ImageRequestParams& rhs) const {
    return std::tie(
               this->blurRadius,
               this->defaultSource,
               this->resizeMode,
               this->resizeMethod,
               this->resizeMultiplier,
               this->shouldNotifyLoadEvents,
               this->overlayColor,
               this->tintColor,
               this->fadeDuration,
               this->progressiveRenderingEnabled,
               this->loadingIndicatorSource,
               this->analyticTag) ==
        std::tie(
               rhs.blurRadius,
               rhs.defaultSource,
               rhs.resizeMode,
               rhs.resizeMethod,
               rhs.resizeMultiplier,
               rhs.shouldNotifyLoadEvents,
               rhs.overlayColor,
               rhs.tintColor,
               rhs.fadeDuration,
               rhs.progressiveRenderingEnabled,
               rhs.loadingIndicatorSource,
               rhs.analyticTag);
  }

  bool operator!=(const ImageRequestParams& rhs) const {
    return !(*this == rhs);
  }
};

struct ImageRequestItem {
  ImageSource imageSource;
  SurfaceId surfaceId{};
  ImageRequestParams imageRequestParams;
  Tag tag{};
};

} // namespace facebook::react
