/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTSoftInputViewManager.h>

#import <React/RCTSoftInputShadowView.h>
#import <React/RCTSoftInputView.h>

@implementation RCTSoftInputViewManager

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (UIView *)view
{
  return [[RCTSoftInputView alloc] initWithBridge:self.bridge];
}

- (RCTShadowView *)shadowView
{
  return [RCTSoftInputShadowView new];
}

@end
