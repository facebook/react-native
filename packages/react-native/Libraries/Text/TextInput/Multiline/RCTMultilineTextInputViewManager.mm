/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTMultilineTextInputView.h>
#import <React/RCTMultilineTextInputViewManager.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

@implementation RCTMultilineTextInputViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTMultilineTextInputView alloc] initWithBridge:self.bridge];
}

#pragma mark - Multiline <TextInput> (aka TextView) specific properties

RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, backedTextInputView.dataDetectorTypes, UIDataDetectorTypes)

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
