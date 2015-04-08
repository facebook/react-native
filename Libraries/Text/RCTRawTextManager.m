/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTRawTextManager.h"

#import "RCTShadowRawText.h"

@implementation RCTRawTextManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return nil;
}

- (RCTShadowView *)shadowView
{
  return [[RCTShadowRawText alloc] init];
}

RCT_EXPORT_SHADOW_PROPERTY(text, NSString)

@end
