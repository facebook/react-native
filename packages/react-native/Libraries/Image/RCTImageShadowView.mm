/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTImageShadowView.h>

#import <React/RCTLog.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

@implementation RCTImageShadowView

- (BOOL)isYogaLeafNode
{
  return YES;
}

- (BOOL)canHaveSubviews
{
  return NO;
}

@end

#endif
