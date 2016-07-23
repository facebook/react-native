/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTShadowRawText.h"

#import "RCTUIManager.h"

@implementation RCTShadowRawText

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(contentSizeMultiplierDidChange:)
                                                 name:RCTUIManagerWillUpdateViewsDueToContentSizeMultiplierChangeNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)contentSizeMultiplierDidChange:(NSNotification *)note
{
  [self dirtyLayout];
  [self dirtyText];
}

- (void)setText:(NSString *)text
{
  if (_text != text && ![_text isEqualToString:text]) {
    _text = [text copy];
    [self dirtyLayout];
    [self dirtyText];
  }
}

- (NSString *)description
{
  NSString *superDescription = super.description;
  return [[superDescription substringToIndex:superDescription.length - 1] stringByAppendingFormat:@"; text: %@>", self.text];
}

@end
