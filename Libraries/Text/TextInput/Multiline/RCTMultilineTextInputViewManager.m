/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTMultilineTextInputView.h>
#import <React/RCTMultilineTextInputViewManager.h>
#import <React/RCTUITextView.h> // [macOS]

@implementation RCTMultilineTextInputViewManager

RCT_EXPORT_MODULE()

- (RCTUIView *)view // [macOS]
{
  return [[RCTMultilineTextInputView alloc] initWithBridge:self.bridge];
}

#pragma mark - Multiline <TextInput> (aka TextView) specific properties

RCT_REMAP_NOT_OSX_VIEW_PROPERTY(dataDetectorTypes, backedTextInputView.dataDetectorTypes, UIDataDetectorTypes) // [macOS]
RCT_REMAP_OSX_VIEW_PROPERTY(dataDetectorTypes, backedTextInputView.enabledTextCheckingTypes, NSTextCheckingTypes) // [macOS]

#if TARGET_OS_OSX // [macOS
RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hideVerticalScrollIndicator, BOOL)
RCT_CUSTOM_VIEW_PROPERTY(pastedTypes, NSArray<NSPasteboardType>*, RCTUITextView)
{
  NSArray<NSPasteboardType> *types = json ? [RCTConvert NSPasteboardTypeArray:json] : nil;
  if ([view respondsToSelector:@selector(setReadablePasteBoardTypes:)]) {
    [view setReadablePasteBoardTypes: types];
  }
}
#endif // macOS]

@end
