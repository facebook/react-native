/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import "RCTImageResponseDelegate.h"

#include <react/renderer/imagemanager/ImageResponseObserver.h>

NS_ASSUME_NONNULL_BEGIN

namespace facebook {
namespace react {

class RCTImageResponseObserverProxy final : public ImageResponseObserver {
 public:
  RCTImageResponseObserverProxy(id<RCTImageResponseDelegate> delegate = nil);

  void didReceiveImage(ImageResponse const &imageResponse) const override;
  void didReceiveProgress(float progress) const override;
  void didReceiveFailure() const override;

 private:
  __weak id<RCTImageResponseDelegate> delegate_;
};

} // namespace react
} // namespace facebook

NS_ASSUME_NONNULL_END
