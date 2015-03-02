// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTShadowRawText.h"

@implementation RCTShadowRawText

- (void)setText:(NSString *)text
{
  if (_text != text) {
    _text = [text copy];
    [self dirtyLayout];
    [self dirtyText];
  }
}

@end
