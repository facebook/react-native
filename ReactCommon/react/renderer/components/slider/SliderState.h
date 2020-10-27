/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/imagemanager/ImageRequest.h>
#include <react/renderer/imagemanager/primitives.h>

namespace facebook {
namespace react {

/*
 * State for <Slider> component.
 */
class SliderState final {
 public:
  SliderState(
      ImageSource const &trackImageSource,
      ImageRequest trackImageRequest,
      ImageSource const &minimumTrackImageSource,
      ImageRequest minimumTrackImageRequest,
      ImageSource const &maximumTrackImageSource,
      ImageRequest maximumTrackImageRequest,
      ImageSource const &thumbImageSource,
      ImageRequest thumbImageRequest)
      : trackImageSource_(trackImageSource),
        trackImageRequest_(
            std::make_shared<ImageRequest>(std::move(trackImageRequest))),
        minimumTrackImageSource_(minimumTrackImageSource),
        minimumTrackImageRequest_(std::make_shared<ImageRequest>(
            std::move(minimumTrackImageRequest))),
        maximumTrackImageSource_(maximumTrackImageSource),
        maximumTrackImageRequest_(std::make_shared<ImageRequest>(
            std::move(maximumTrackImageRequest))),
        thumbImageSource_(thumbImageSource),
        thumbImageRequest_(
            std::make_shared<ImageRequest>(std::move(thumbImageRequest))){};

  SliderState() = default;

  ImageSource getTrackImageSource() const;
  ImageRequest const &getTrackImageRequest() const;

  ImageSource getMinimumTrackImageSource() const;
  ImageRequest const &getMinimumTrackImageRequest() const;

  ImageSource getMaximumTrackImageSource() const;
  ImageRequest const &getMaximumTrackImageRequest() const;

  ImageSource getThumbImageSource() const;
  ImageRequest const &getThumbImageRequest() const;

#ifdef ANDROID
  SliderState(SliderState const &previousState, folly::dynamic data){};

  /*
   * Empty implementation for Android because it doesn't use this class.
   */
  folly::dynamic getDynamic() const {
    return {};
  };
#endif

 private:
  ImageSource trackImageSource_;
  std::shared_ptr<ImageRequest> trackImageRequest_;
  ImageSource minimumTrackImageSource_;
  std::shared_ptr<ImageRequest> minimumTrackImageRequest_;
  ImageSource maximumTrackImageSource_;
  std::shared_ptr<ImageRequest> maximumTrackImageRequest_;
  ImageSource thumbImageSource_;
  std::shared_ptr<ImageRequest> thumbImageRequest_;
};

} // namespace react
} // namespace facebook
