/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTSinglelineTextInputViewManager.h"

#import <React/RCTBridge.h>
#import <React/RCTFont.h>
#import <React/RCTShadowView+Layout.h>
#import <React/RCTShadowView.h>

#import "RCTConvert+Text.h"
#import "RCTSinglelineTextInputShadowView.h"
#import "RCTSinglelineTextInputView.h"
#import "RCTUITextField.h"

@implementation RCTSinglelineTextInputViewManager

RCT_EXPORT_MODULE()

- (RCTShadowView *)shadowView
{
  return [RCTSinglelineTextInputShadowView new];
}

- (UIView *)view
{
  return [[RCTSinglelineTextInputView alloc] initWithBridge:self.bridge];
}

#pragma mark - Singleline <TextInput> (aka TextField) specific properties

RCT_REMAP_VIEW_PROPERTY(caretHidden, backedTextInputView.caretHidden, BOOL)
RCT_REMAP_VIEW_PROPERTY(clearButtonMode, backedTextInputView.clearButtonMode, UITextFieldViewMode)
RCT_EXPORT_VIEW_PROPERTY(onSelectionChange, RCTDirectEventBlock)

@end
