/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTShadowVirtualImage.h"
#import "RCTImageLoader.h"
#import "RCTImageUtils.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"

@implementation RCTShadowVirtualImage
{
  RCTBridge *_bridge;
  RCTImageLoaderCancellationBlock _cancellationBlock;
}

@synthesize image = _image;

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if ((self = [super init])) {
    _bridge = bridge;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [super didSetProps:changedProps];

  if (changedProps.count == 0) {
    // No need to reload image
    return;
  }

  // Cancel previous request
  if (_cancellationBlock) {
    _cancellationBlock();
  }

  CGSize imageSize = {
    RCTZeroIfNaN(self.width),
    RCTZeroIfNaN(self.height),
  };

  if (!_image) {
    _image = RCTGetPlaceholderImage(imageSize, nil);
  }

  __weak RCTShadowVirtualImage *weakSelf = self;
  _cancellationBlock = [_bridge.imageLoader loadImageWithTag:_source.imageURL.absoluteString
                                                        size:imageSize
                                                       scale:RCTScreenScale()
                                                  resizeMode:_resizeMode
                                               progressBlock:nil
                                             completionBlock:^(NSError *error, UIImage *image) {

    dispatch_async(_bridge.uiManager.methodQueue, ^{
      RCTShadowVirtualImage *strongSelf = weakSelf;
      if (![_source isEqual:strongSelf.source]) {
        // Bail out if source has changed since we started loading
        return;
      }
      strongSelf->_image = image;
      [strongSelf dirtyText];
    });
  }];
}

- (void)dealloc
{
  if (_cancellationBlock) {
    _cancellationBlock();
  }
}

@end
