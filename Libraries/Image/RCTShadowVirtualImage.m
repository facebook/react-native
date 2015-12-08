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
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTUIManager.h"

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

- (void)setSource:(RCTImageSource *)source
{
  if (![source isEqual:_source]) {

    // Cancel previous request
    if (_cancellationBlock) {
      _cancellationBlock();
    }

    _source = source;

    __weak RCTShadowVirtualImage *weakSelf = self;
    _cancellationBlock = [_bridge.imageLoader loadImageWithTag:source.imageURL.absoluteString
                                                          size:source.size
                                                         scale:source.scale
                                                    resizeMode:UIViewContentModeScaleToFill
                                                 progressBlock:nil
                                               completionBlock:^(NSError *error, UIImage *image) {

      dispatch_async(_bridge.uiManager.methodQueue, ^{
        RCTShadowVirtualImage *strongSelf = weakSelf;
        if (![source isEqual:strongSelf.source]) {
          // Bail out if source has changed since we started loading
          return;
        }
        strongSelf->_image = image;
        [strongSelf dirtyText];
      });
    }];
  }
}

- (void)dealloc
{
  if (_cancellationBlock) {
    _cancellationBlock();
  }
}

@end
