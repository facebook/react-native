/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTImageShadowView.h"

#import <React/RCTLog.h>

@implementation RCTImageShadowView

- (void)insertReactSubview:(RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  RCTLogWarn(@"Using <Image> with children is deprecated "
             "and will be an error in the near future. "
             "Please reconsider the layout or use <ImageBackground> instead.");

  [super insertReactSubview:subview atIndex:atIndex];
}

@end
