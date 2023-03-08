/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTMultilineTextInputView.h>
#import <React/RCTMultilineTextInputViewManager.h>
#import <React/RCTUITextView.h>
#import <React/RCTBaseTextInputShadowView.h>

@implementation RCTMultilineTextInputViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTMultilineTextInputView alloc] initWithBridge:self.bridge];
}

- (RCTShadowView *)shadowView
{
  RCTBaseTextInputShadowView *shadowView = (RCTBaseTextInputShadowView *)[super shadowView];

  shadowView.maximumNumberOfLines = 0;
  shadowView.exactNumberOfLines = 0;

  return shadowView;
}

#pragma mark - Multiline <TextInput> (aka TextView) specific properties

RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, backedTextInputView.dataDetectorTypes, UIDataDetectorTypes)

RCT_EXPORT_SHADOW_PROPERTY(maximumNumberOfLines, NSInteger)
RCT_REMAP_SHADOW_PROPERTY(numberOfLines, exactNumberOfLines, NSInteger)

@end
