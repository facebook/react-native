// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTTextField.h"

#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"
#import "UIView+ReactKit.h"

@implementation RCTTextField
{
  RCTEventDispatcher *_eventDispatcher;
  NSMutableArray *_reactSubviews;
  BOOL _jsRequestingFirstResponder;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  RCT_NOT_DESIGNATED_INITIALIZER();
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithFrame:CGRectZero])) {
    
    _eventDispatcher = eventDispatcher;
    [self addTarget:self action:@selector(_textFieldDidChange) forControlEvents:UIControlEventEditingChanged];
    [self addTarget:self action:@selector(_textFieldBeginEditing) forControlEvents:UIControlEventEditingDidBegin];
    [self addTarget:self action:@selector(_textFieldEndEditing) forControlEvents:UIControlEventEditingDidEnd];
    [self addTarget:self action:@selector(_textFieldSubmitEditing) forControlEvents:UIControlEventEditingDidEndOnExit];
    _reactSubviews = [[NSMutableArray alloc] init];
    self.returnKeyType = UIReturnKeyDone;
  }
  return self;
}

- (NSArray *)reactSubviews
{
  // TODO: do we support subviews of textfield in React?
  // In any case, we should have a better approach than manually
  // maintaining array in each view subclass like this
  return _reactSubviews;
}

- (void)removeReactSubview:(UIView *)subview
{
  // TODO: this is a bit broken - if the TextView inserts any of
  // it's own views below or between React's, the indices won't match
  [_reactSubviews removeObject:subview];
  [subview removeFromSuperview];
}

- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  // TODO: this is a bit broken - if the TextView inserts any of
  // it's own views below or between React's, the indices won't match
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

#define RCT_TEXT_EVENT_HANDLER(delegateMethod, eventName) \
- (void)delegateMethod                                    \
{                                                         \
  [_eventDispatcher sendTextEventWithType:eventName       \
                                 reactTag:self.reactTag   \
                                     text:self.text];     \
}

RCT_TEXT_EVENT_HANDLER(_textFieldDidChange, RCTTextEventTypeChange)
RCT_TEXT_EVENT_HANDLER(_textFieldBeginEditing, RCTTextEventTypeFocus)
RCT_TEXT_EVENT_HANDLER(_textFieldEndEditing, RCTTextEventTypeEnd)
RCT_TEXT_EVENT_HANDLER(_textFieldSubmitEditing, RCTTextEventTypeSubmit)

// TODO: we should support shouldChangeTextInRect (see UITextFieldDelegate)

- (BOOL)becomeFirstResponder
{
  _jsRequestingFirstResponder = YES; // TODO: is this still needed?
  BOOL result = [super becomeFirstResponder];
  _jsRequestingFirstResponder = NO;
  return result;
}

- (BOOL)resignFirstResponder
{
  BOOL result = [super resignFirstResponder];
  if (result)
  {
    [_eventDispatcher sendTextEventWithType:RCTTextEventTypeBlur
                                   reactTag:self.reactTag
                                       text:self.text];
  }
  return result;
}

// Prevent native from becoming first responder (TODO: why?)
- (BOOL)canBecomeFirstResponder
{
  return _jsRequestingFirstResponder;
}

@end
