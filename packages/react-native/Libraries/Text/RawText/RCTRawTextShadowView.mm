/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTRawTextShadowView.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

#import <React/RCTShadowView+Layout.h>

@implementation RCTRawTextShadowView

- (void)setText:(NSString *)text
{
  if (_text != text && ![_text isEqualToString:text]) {
    _text = [text copy];
    [self dirtyLayout];
  }
}

- (void)dirtyLayout
{
  [self.superview dirtyLayout];
}

- (NSString *)description
{
  NSString *superDescription = super.description;
  return [[superDescription substringToIndex:superDescription.length - 1]
      stringByAppendingFormat:@"; text: %@>", self.text];
}

@end

#endif // RCT_REMOVE_LEGACY_ARCH
