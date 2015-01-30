// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTTextField.h"

#import "RCTConvert.h"
#import "RCTEventExtractor.h"
#import "RCTJavaScriptEventDispatcher.h"
#import "RCTUtils.h"
#import "UIView+ReactKit.h"

@implementation RCTTextField
{
  RCTJavaScriptEventDispatcher *_eventDispatcher;
  NSMutableArray *_reactSubviews;
  BOOL _jsRequestingFirstResponder;
}

- (instancetype)init
{
  RCT_NOT_DESIGNATED_INITIALIZER();
}

- (instancetype)initWithFrame:(CGRect)frame eventDispatcher:(RCTJavaScriptEventDispatcher *)eventDispatcher
{
  if (self = [super initWithFrame:frame]) {
    _eventDispatcher = eventDispatcher;
    [self addTarget:self action:@selector(_textFieldDidChange) forControlEvents:UIControlEventEditingChanged];
    [self addTarget:self action:@selector(_textFieldEndEditing) forControlEvents:UIControlEventEditingDidEnd];
    [self addTarget:self action:@selector(_textFieldSubmitEditing) forControlEvents:UIControlEventEditingDidEndOnExit];
    _reactSubviews = [[NSMutableArray alloc] init];
    self.returnKeyType = UIReturnKeyDone;
  }

  return self;
}

- (NSArray *)reactSubviews
{
  return _reactSubviews;
}

- (void)removeReactSubview:(UIView *)subview
{
  [_reactSubviews removeObject:subview];
  [subview removeFromSuperview];
}

- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  [_reactSubviews insertObject:view atIndex:atIndex];
  [super insertSubview:view atIndex:atIndex];
}

- (CGRect)caretRectForPosition:(UITextPosition *)position
{
  if (_caretHidden) {
    return CGRectZero;
  }

  return [super caretRectForPosition:position];
}

- (CGRect)textRectForBounds:(CGRect)bounds
{
  CGRect rect = [super textRectForBounds:bounds];
  return UIEdgeInsetsInsetRect(rect, _paddingEdgeInsets);
}

- (CGRect)editingRectForBounds:(CGRect)bounds
{
  return [self textRectForBounds:bounds];
}

- (void)setAutoCorrect:(BOOL)autoCorrect
{
  [super setAutocorrectionType:(autoCorrect ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo)];
}

- (BOOL)autoCorrect
{
  return self.autocorrectionType == UITextAutocorrectionTypeYes;
}

- (void)_textFieldDidChange
{
  [self handleTextChange];
}

- (void)_textFieldEndEditing
{
  NSDictionary *event = @{@"text": self.text, @"target": self.reactTag};
  [_eventDispatcher sendEventWithArgs:[RCTEventExtractor eventArgs:[self reactTag]
                                                             type:RCTEventTextFieldEndEditing
                                                   nativeEventObj:event]];
}

- (void)_textFieldSubmitEditing
{
  NSDictionary *event = @{@"text": self.text, @"target": self.reactTag};
  [_eventDispatcher sendEventWithArgs:[RCTEventExtractor eventArgs:[self reactTag]
                                                             type:RCTEventTextFieldSubmitEditing
                                                   nativeEventObj:event]];
}

- (BOOL)becomeFirstResponder
{
  _jsRequestingFirstResponder = YES;
  BOOL wasPreviouslyResponder = [self isFirstResponder];
  BOOL ret = [super becomeFirstResponder];
  BOOL isTransitioningResponder = !wasPreviouslyResponder && ret;
  if (isTransitioningResponder) {
    [self handleTextFieldDidFocus];
  }
  _jsRequestingFirstResponder = NO;
  return ret;
}

- (BOOL)resignFirstResponder
{
  [self handleTextFieldWillBlur];
  return [super resignFirstResponder];
}

// Prevent native from becoming first responder
- (BOOL)canBecomeFirstResponder
{
  return _jsRequestingFirstResponder;
}

- (void)handleTextChange
{
  NSDictionary *event = @{@"text": self.text, @"target": self.reactTag};
  [_eventDispatcher sendEventWithArgs:[RCTEventExtractor eventArgs:[self reactTag]
                                                             type:RCTEventChange
                                                   nativeEventObj:event]];
}

- (void)handleTextFieldDidFocus
{
  [_eventDispatcher sendEventWithArgs:[RCTEventExtractor eventArgs:[self reactTag]
                                                             type:RCTEventTextFieldDidFocus
                                                   nativeEventObj:@{@"target":self.reactTag}]];
}

- (void)handleTextFieldWillBlur
{
  [_eventDispatcher sendEventWithArgs:[RCTEventExtractor eventArgs:[self reactTag]
                                                             type:RCTEventTextFieldWillBlur
                                                   nativeEventObj:@{@"target":self.reactTag}]];
}

@end
