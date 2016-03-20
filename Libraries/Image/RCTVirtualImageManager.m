/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTVirtualImageManager.h"
#import "RCTShadowVirtualImage.h"

@implementation RCTVirtualImageManager

RCT_EXPORT_MODULE()

- (RCTShadowView *)shadowView
{
  return [[RCTShadowVirtualImage alloc] initWithBridge:self.bridge];
}

RCT_EXPORT_SHADOW_PROPERTY(source, RCTImageSource)
RCT_EXPORT_SHADOW_PROPERTY(resizeMode, UIViewContentMode)

@end
