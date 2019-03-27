/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "NSString+RCTUtility.h"

@implementation NSString (RCTUtility)

- (NSUInteger)reactLengthOfGlyphs
{
  __block NSUInteger lengthOfGlyphs = 0;
  [self enumerateSubstringsInRange:NSMakeRange(0, self.length) options:NSStringEnumerationByComposedCharacterSequences usingBlock:^(NSString * _Nullable substring, NSRange substringRange, NSRange enclosingRange, BOOL * _Nonnull stop){
    lengthOfGlyphs++;
  }];
  return lengthOfGlyphs;
}

@end
