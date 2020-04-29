/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import "RCTImageResponseDelegate.h"

#include <react/imagemanager/ImageResponseObserver.h>

NS_ASSUME_NONNULL_BEGIN

namespace facebook {
namespace react {
<<<<<<< HEAD
class RCTImageResponseObserverProxy : public ImageResponseObserver {
 public:
  RCTImageResponseObserverProxy(void *delegate);
  void didReceiveImage(const ImageResponse &imageResponse) override;
  void didReceiveProgress(float p) override;
  void didReceiveFailure() override;
=======

class RCTImageResponseObserverProxy final : public ImageResponseObserver {
 public:
  RCTImageResponseObserverProxy(id<RCTImageResponseDelegate> delegate = nil);

  void didReceiveImage(ImageResponse const &imageResponse) const override;
  void didReceiveProgress(float progress) const override;
  void didReceiveFailure() const override;
>>>>>>> fb/0.62-stable

 private:
  __weak id<RCTImageResponseDelegate> delegate_;
};
<<<<<<< HEAD
=======

>>>>>>> fb/0.62-stable
} // namespace react
} // namespace facebook

NS_ASSUME_NONNULL_END
