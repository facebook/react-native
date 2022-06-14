/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTSinglelineTextInputViewManager.h>

#import <React/RCTBaseTextInputShadowView.h>
#import <React/RCTSinglelineTextInputView.h>

@implementation RCTSinglelineTextInputViewManager

RCT_EXPORT_MODULE()

- (RCTShadowView *)shadowView
{
  RCTBaseTextInputShadowView *shadowView =
    (RCTBaseTextInputShadowView *)[super shadowView];

  shadowView.maximumNumberOfLines = 1;

  return shadowView;
}

- (RCTUIView *)view // TODO(macOS ISS#3536887)
{
  return [[RCTSinglelineTextInputView alloc] initWithBridge:self.bridge];
}

RCT_REMAP_OSX_VIEW_PROPERTY(secureTextEntry, useSecureTextField, BOOL) // TODO(macOS GH#774)

@end
