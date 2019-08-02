/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import "RNImageResponseDelegate.h"

#include <react/imagemanager/ImageResponseObserver.h>

NS_ASSUME_NONNULL_BEGIN

namespace facebook {
namespace react {
class RNImageResponseObserverProxy : public ImageResponseObserver {
 public:
  RNImageResponseObserverProxy(void *delegate);
  void didReceiveImage(const ImageResponse &imageResponse) override;
  void didReceiveProgress(float p) override;
  void didReceiveFailure() override;

 private:
  __weak id<RNImageResponseDelegate> delegate_;
};
} // namespace react
} // namespace facebook

NS_ASSUME_NONNULL_END
