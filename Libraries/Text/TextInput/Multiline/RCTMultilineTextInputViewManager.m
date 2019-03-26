/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTMultilineTextInputViewManager.h"

#import "RCTMultilineTextInputView.h"

@implementation RCTMultilineTextInputViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTMultilineTextInputView alloc] initWithBridge:self.bridge];
}

#pragma mark - Multiline <TextInput> (aka TextView) specific properties

#if !TARGET_OS_TV
RCT_REMAP_NOT_OSX_VIEW_PROPERTY(dataDetectorTypes, backedTextInputView.dataDetectorTypes, UIDataDetectorTypes) // TODO(macOS ISS#2323203)
RCT_REMAP_OSX_VIEW_PROPERTY(dataDetectorTypes, backedTextInputView.enabledTextCheckingTypes, NSTextCheckingTypes) // TODO(macOS ISS#2323203)
#endif

@end
