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

@implementation RCTShadowVirtualImage
{
  RCTBridge *_bridge;
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

- (void)setSource:(NSDictionary *)source
{
  if (![source isEqual:_source]) {
    _source = [source copy];
    NSString *imageTag = [RCTConvert NSString:_source[@"uri"]];
    CGFloat scale = [RCTConvert CGFloat:_source[@"scale"]] ?: 1;

    __weak RCTShadowVirtualImage *weakSelf = self;
    [_bridge.imageLoader loadImageWithTag:imageTag size:CGSizeZero scale:scale resizeMode:UIViewContentModeScaleToFill progressBlock:nil completionBlock:^(NSError *error, UIImage *image) {
      RCTShadowVirtualImage *strongSelf = weakSelf;
      strongSelf->_image = image;
      [strongSelf dirtyText];
    }];
  }
}

@end
