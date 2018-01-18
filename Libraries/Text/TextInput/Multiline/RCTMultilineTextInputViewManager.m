/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTMultilineTextInputViewManager.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTFont.h>
#import <React/RCTShadowView+Layout.h>
#import <React/RCTShadowView.h>

#import "RCTConvert+Text.h"
#import "RCTMultilineTextInputShadowView.h"
#import "RCTMultilineTextInputView.h"

@implementation RCTMultilineTextInputViewManager

RCT_EXPORT_MODULE()

- (RCTShadowView *)shadowView
{
  return [RCTMultilineTextInputShadowView new];
}

- (UIView *)view
{
  return [[RCTMultilineTextInputView alloc] initWithBridge:self.bridge];
}

#pragma mark - Multiline <TextInput> (aka TextView) specific properties

RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onContentSizeChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onScroll, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onTextInput, RCTDirectEventBlock)

#if !TARGET_OS_TV
RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, backedTextInputView.dataDetectorTypes, UIDataDetectorTypes)
#endif

@end
