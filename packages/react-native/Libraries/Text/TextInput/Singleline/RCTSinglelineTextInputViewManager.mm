/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTSinglelineTextInputViewManager.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

#import <React/RCTBaseTextInputShadowView.h>
#import <React/RCTSinglelineTextInputView.h>

@implementation RCTSinglelineTextInputViewManager

RCT_EXPORT_MODULE()

- (RCTShadowView *)shadowView
{
  RCTBaseTextInputShadowView *shadowView = (RCTBaseTextInputShadowView *)[super shadowView];

  shadowView.maximumNumberOfLines = 1;

  return shadowView;
}

- (UIView *)view
{
  return [[RCTSinglelineTextInputView alloc] initWithBridge:self.bridge];
}

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
