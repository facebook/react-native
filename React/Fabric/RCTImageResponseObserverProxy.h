/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import "RCTImageResponseDelegate.h"
#import "RCTImageResponseDelegate.h"

#include <react/imagemanager/ImageResponseObserver.h>

NS_ASSUME_NONNULL_BEGIN

namespace facebook {
  namespace react {
    class RCTImageResponseObserverProxy: public ImageResponseObserver {
    public:
      RCTImageResponseObserverProxy(void* delegate);
      void didReceiveImage(const ImageResponse &imageResponse) override;
      void didReceiveProgress (float p) override;
      void didReceiveFailure() override;
      
    private:
      __weak id<RCTImageResponseDelegate> delegate_;
    };
  }
}

NS_ASSUME_NONNULL_END
