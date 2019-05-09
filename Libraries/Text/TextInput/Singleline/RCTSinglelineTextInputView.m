/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSinglelineTextInputView.h"

#import <React/RCTBridge.h>

#import "RCTUITextField.h"
#import "NSString+RCTUtility.h"

@implementation RCTSinglelineTextInputView
{
  RCTUITextField *_backedTextInputView;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    // `blurOnSubmit` defaults to `true` for <TextInput multiline={false}> by design.
    self.blurOnSubmit = YES;

    _backedTextInputView = [[RCTUITextField alloc] initWithFrame:self.bounds];
    _backedTextInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _backedTextInputView.textInputDelegate = self;

    [self addSubview:_backedTextInputView];
  }

  return self;
}

- (id<RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInputView;
}

- (BOOL)handleTextInputLengthLimitInRange:(NSRange)range
                          replacementText:(NSString *)text
{
  id<RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;
  if (self.maxLength) {
    NSString *backedTextInputViewText = backedTextInputView.attributedText.string;
    // Get allowedLength based on glyphs
    NSInteger allowedLength = MAX(self.maxLength.integerValue - (NSInteger)backedTextInputViewText.reactLengthOfGlyphs + (NSInteger)[backedTextInputViewText substringWithRange:range].reactLengthOfGlyphs, 0);
    NSUInteger textGlyphsLength = text.reactLengthOfGlyphs;
    if (textGlyphsLength > allowedLength) {
      // If we typed/pasted more than one character, limit the text inputted.
      if (textGlyphsLength > 1) {
        [self trimInputTextInRange:range replacementText:text allowedLength:allowedLength];
        [self textInputDidChange];
      }
      
      return YES;
    }
  }
  return NO;
}

- (void)trimInputTextInRange:(NSRange)range
             replacementText:(NSString *)text
               allowedLength:(NSInteger)length
{
  __block NSUInteger allowedIndex = 0;
  __block NSInteger allowedLength = length;
  
  id<RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;
  
  // We truncated the text based on glyphs.
  [text enumerateSubstringsInRange:NSMakeRange(0, text.length) options:NSStringEnumerationByComposedCharacterSequences usingBlock:^(NSString * _Nullable substring, NSRange substringRange, NSRange enclosingRange, BOOL * _Nonnull stop){
    if (allowedLength == 0) {
      *stop = YES;
      return;
    }
    allowedIndex = substringRange.location + substringRange.length;
    allowedLength--;
  }];
  // Truncate the input string so the result is exactly maxLength
  NSString *limitedString = [text substringToIndex:allowedIndex];
  NSMutableAttributedString *newAttributedText = [backedTextInputView.attributedText mutableCopy];
  [newAttributedText replaceCharactersInRange:range withString:limitedString];
  backedTextInputView.attributedText = newAttributedText;
  self.predictedText = newAttributedText.string;
  
  // Collapse selection at end of insert to match normal paste behavior.
  UITextPosition *insertEnd = [backedTextInputView positionFromPosition:backedTextInputView.beginningOfDocument
                                                                 offset:(range.location + limitedString.length)];
  [backedTextInputView setSelectedTextRange:[backedTextInputView textRangeFromPosition:insertEnd toPosition:insertEnd]
                             notifyDelegate:YES];
}

@end
