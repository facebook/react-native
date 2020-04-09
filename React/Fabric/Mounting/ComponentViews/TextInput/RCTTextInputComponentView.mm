/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTextInputComponentView.h"

#import <react/components/iostextinput/TextInputComponentDescriptor.h>
#import <react/graphics/Geometry.h>
#import <react/textlayoutmanager/RCTAttributedTextUtils.h>
#import <react/textlayoutmanager/TextLayoutManager.h>

#import <React/RCTBackedTextInputViewProtocol.h>
#import <React/RCTUITextField.h>
#import <React/RCTUITextView.h>

#import "RCTConversions.h"
#import "RCTTextInputNativeCommands.h"
#import "RCTTextInputUtils.h"

using namespace facebook::react;

@interface RCTTextInputComponentView () <RCTBackedTextInputDelegate, RCTTextInputViewProtocol>
@end

@implementation RCTTextInputComponentView {
  TextInputShadowNode::ConcreteState::Shared _state;
  UIView<RCTBackedTextInputViewProtocol> *_backedTextInputView;
  NSUInteger _mostRecentEventCount;
  NSAttributedString *_lastStringStateWasUpdatedWith;

  /*
   * UIKit uses either UITextField or UITextView as its UIKit element for <TextInput>. UITextField is for single line
   * entry, UITextView is for multiline entry. There is a problem with order of events when user types a character. In
   * UITextField (single line text entry), typing a character first triggers `onChange` event and then
   * onSelectionChange. In UITextView (multi line text entry), typing a character first triggers `onSelectionChange` and
   * then onChange. JavaScript depends on `onChange` to be called before `onSelectionChange`. This flag keeps state so
   * if UITextView is backing text input view, inside `-[RCTTextInputComponentView textInputDidChangeSelection]` we make
   * sure to call `onChange` before `onSelectionChange` and ignore next `-[RCTTextInputComponentView
   * textInputDidChange]` call.
   */
  BOOL _ignoreNextTextInputCall;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<TextInputProps const>();
    _props = defaultProps;
    auto &props = *defaultProps;

    _backedTextInputView = props.traits.multiline ? [[RCTUITextView alloc] init] : [[RCTUITextField alloc] init];
    _backedTextInputView.frame = self.bounds;
    _backedTextInputView.textInputDelegate = self;
    _ignoreNextTextInputCall = NO;
    [self addSubview:_backedTextInputView];
  }

  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<TextInputComponentDescriptor>();
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  auto const &oldTextInputProps = *std::static_pointer_cast<TextInputProps const>(_props);
  auto const &newTextInputProps = *std::static_pointer_cast<TextInputProps const>(props);

  // Traits:
  if (newTextInputProps.traits.multiline != oldTextInputProps.traits.multiline) {
    [self _setMultiline:newTextInputProps.traits.multiline];
  }

  if (newTextInputProps.traits.autocapitalizationType != oldTextInputProps.traits.autocapitalizationType) {
    _backedTextInputView.autocapitalizationType =
        RCTUITextAutocapitalizationTypeFromAutocapitalizationType(newTextInputProps.traits.autocapitalizationType);
  }

  if (newTextInputProps.traits.autoCorrect != oldTextInputProps.traits.autoCorrect) {
    _backedTextInputView.autocorrectionType =
        RCTUITextAutocorrectionTypeFromOptionalBool(newTextInputProps.traits.autoCorrect);
  }

  if (newTextInputProps.traits.contextMenuHidden != oldTextInputProps.traits.contextMenuHidden) {
    _backedTextInputView.contextMenuHidden = newTextInputProps.traits.contextMenuHidden;
  }

  if (newTextInputProps.traits.editable != oldTextInputProps.traits.editable) {
    _backedTextInputView.editable = newTextInputProps.traits.editable;
  }

  if (newTextInputProps.traits.enablesReturnKeyAutomatically !=
      oldTextInputProps.traits.enablesReturnKeyAutomatically) {
    _backedTextInputView.enablesReturnKeyAutomatically = newTextInputProps.traits.enablesReturnKeyAutomatically;
  }

  if (newTextInputProps.traits.keyboardAppearance != oldTextInputProps.traits.keyboardAppearance) {
    _backedTextInputView.keyboardAppearance =
        RCTUIKeyboardAppearanceFromKeyboardAppearance(newTextInputProps.traits.keyboardAppearance);
  }

  if (newTextInputProps.traits.spellCheck != oldTextInputProps.traits.spellCheck) {
    _backedTextInputView.spellCheckingType =
        RCTUITextSpellCheckingTypeFromOptionalBool(newTextInputProps.traits.spellCheck);
  }

  if (newTextInputProps.traits.caretHidden != oldTextInputProps.traits.caretHidden) {
    _backedTextInputView.caretHidden = newTextInputProps.traits.caretHidden;
  }

  if (newTextInputProps.traits.clearButtonMode != oldTextInputProps.traits.clearButtonMode) {
    _backedTextInputView.clearButtonMode =
        RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(newTextInputProps.traits.clearButtonMode);
  }

  if (newTextInputProps.traits.scrollEnabled != oldTextInputProps.traits.scrollEnabled) {
    _backedTextInputView.scrollEnabled = newTextInputProps.traits.scrollEnabled;
  }

  if (newTextInputProps.traits.secureTextEntry != oldTextInputProps.traits.secureTextEntry) {
    _backedTextInputView.secureTextEntry = newTextInputProps.traits.secureTextEntry;
  }

  if (newTextInputProps.traits.keyboardType != oldTextInputProps.traits.keyboardType) {
    _backedTextInputView.keyboardType = RCTUIKeyboardTypeFromKeyboardType(newTextInputProps.traits.keyboardType);
  }

  if (newTextInputProps.traits.returnKeyType != oldTextInputProps.traits.returnKeyType) {
    _backedTextInputView.returnKeyType = RCTUIReturnKeyTypeFromReturnKeyType(newTextInputProps.traits.returnKeyType);
  }

  if (newTextInputProps.traits.textContentType != oldTextInputProps.traits.textContentType) {
    if (@available(iOS 10.0, *)) {
      _backedTextInputView.textContentType = RCTUITextContentTypeFromString(newTextInputProps.traits.textContentType);
    }
  }

  if (newTextInputProps.traits.passwordRules != oldTextInputProps.traits.passwordRules) {
    if (@available(iOS 12.0, *)) {
      _backedTextInputView.passwordRules =
          RCTUITextInputPasswordRulesFromString(newTextInputProps.traits.passwordRules);
    }
  }

  // Traits `blurOnSubmit`, `clearTextOnFocus`, and `selectTextOnFocus` were omitted intentially here
  // because they are being checked on-demand.

  // Other props:
  if (newTextInputProps.placeholder != oldTextInputProps.placeholder) {
    _backedTextInputView.placeholder = RCTNSStringFromString(newTextInputProps.placeholder);
  }

  if (newTextInputProps.textAttributes != oldTextInputProps.textAttributes) {
    _backedTextInputView.defaultTextAttributes =
        RCTNSTextAttributesFromTextAttributes(newTextInputProps.getEffectiveTextAttributes());
  }

  if (newTextInputProps.selectionColor != oldTextInputProps.selectionColor) {
    _backedTextInputView.tintColor = RCTUIColorFromSharedColor(newTextInputProps.selectionColor);
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  _state = std::static_pointer_cast<TextInputShadowNode::ConcreteState const>(state);

  if (!_state) {
    assert(false && "State is `null` for <TextInput> component.");
    _backedTextInputView.attributedText = nil;
    return;
  }

  if (_mostRecentEventCount == _state->getData().mostRecentEventCount) {
    auto data = _state->getData();
    [self _setAttributedString:RCTNSAttributedStringFromAttributedStringBox(data.attributedStringBox)];
  }
}

- (void)updateLayoutMetrics:(LayoutMetrics const &)layoutMetrics
           oldLayoutMetrics:(LayoutMetrics const &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  _backedTextInputView.frame =
      UIEdgeInsetsInsetRect(self.bounds, RCTUIEdgeInsetsFromEdgeInsets(layoutMetrics.borderWidth));
  _backedTextInputView.textContainerInset =
      RCTUIEdgeInsetsFromEdgeInsets(layoutMetrics.contentInsets - layoutMetrics.borderWidth);
}

- (void)_setAttributedString:(NSAttributedString *)attributedString
{
  UITextRange *selectedRange = [_backedTextInputView selectedTextRange];
  _backedTextInputView.attributedText = attributedString;
  // Calling `[_backedTextInputView setAttributedText]` results
  // in `textInputDidChangeSelection` being called but not `textInputDidChange`.
  // For `_ignoreNextTextInputCall` to have correct value, these calls
  // need to be balanced, that's why we manually set the flag here.
  _ignoreNextTextInputCall = NO;
  if (_lastStringStateWasUpdatedWith.length == attributedString.length) {
    // Calling `[_backedTextInputView setAttributedText]` moves caret
    // to the end of text input field. This cancels any selection as well
    // as position in the text input field. In case the length of string
    // doesn't change, selection and caret position is maintained.
    [_backedTextInputView setSelectedTextRange:selectedRange notifyDelegate:NO];
  }
  _lastStringStateWasUpdatedWith = attributedString;
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _backedTextInputView.attributedText = [[NSAttributedString alloc] init];
  _mostRecentEventCount = 0;
  _state.reset();
  _lastStringStateWasUpdatedWith = nil;
  _ignoreNextTextInputCall = NO;
}

#pragma mark - RCTComponentViewProtocol

- (void)_setMultiline:(BOOL)multiline
{
  [_backedTextInputView removeFromSuperview];
  UIView<RCTBackedTextInputViewProtocol> *backedTextInputView =
      multiline ? [[RCTUITextView alloc] init] : [[RCTUITextField alloc] init];
  backedTextInputView.frame = _backedTextInputView.frame;
  RCTCopyBackedTextInput(_backedTextInputView, backedTextInputView);
  _backedTextInputView = backedTextInputView;
  [self addSubview:_backedTextInputView];
}

#pragma mark - RCTBackedTextInputDelegate

- (BOOL)textInputShouldBeginEditing
{
  return YES;
}

- (void)textInputDidBeginEditing
{
  auto const &props = *std::static_pointer_cast<TextInputProps const>(_props);

  if (props.traits.clearTextOnFocus) {
    _backedTextInputView.attributedText = [NSAttributedString new];
    [self textInputDidChange];
  }

  if (props.traits.selectTextOnFocus) {
    [_backedTextInputView selectAll:nil];
    [self textInputDidChangeSelection];
  }

  if (_eventEmitter) {
    std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter)->onFocus([self _textInputMetrics]);
  }
}

- (BOOL)textInputShouldEndEditing
{
  return YES;
}

- (void)textInputDidEndEditing
{
  if (_eventEmitter) {
    std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter)->onEndEditing([self _textInputMetrics]);
    std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter)->onBlur([self _textInputMetrics]);
  }
}

- (BOOL)textInputShouldReturn
{
  // We send `submit` event here, in `textInputShouldReturn`
  // (not in `textInputDidReturn)`, because of semantic of the event:
  // `onSubmitEditing` is called when "Submit" button
  // (the blue key on onscreen keyboard) did pressed
  // (no connection to any specific "submitting" process).

  if (_eventEmitter) {
    std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter)->onSubmitEditing([self _textInputMetrics]);
  }

  auto const &props = *std::static_pointer_cast<TextInputProps const>(_props);
  return props.traits.blurOnSubmit;
}

- (void)textInputDidReturn
{
  // Does nothing.
}

- (NSString *)textInputShouldChangeText:(NSString *)text inRange:(NSRange)range
{
  if (!_backedTextInputView.textWasPasted) {
    if (_eventEmitter) {
      std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter)->onKeyPress([self _textInputMetrics]);
    }
  }

  auto const &props = *std::static_pointer_cast<TextInputProps const>(_props);
  if (props.maxLength) {
    NSInteger allowedLength = props.maxLength - _backedTextInputView.attributedText.string.length + range.length;

    if (allowedLength <= 0) {
      return nil;
    }

    return allowedLength > text.length ? text : [text substringToIndex:allowedLength];
  }

  return text;
}

- (BOOL)textInputShouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
  return YES;
}

- (void)textInputDidChange
{
  if (_ignoreNextTextInputCall) {
    _ignoreNextTextInputCall = NO;
    return;
  }
  [self _updateState];

  if (_eventEmitter) {
    std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter)->onChange([self _textInputMetrics]);
  }
}

- (void)textInputDidChangeSelection
{
  auto const &props = *std::static_pointer_cast<TextInputProps const>(_props);
  if (props.traits.multiline && ![_lastStringStateWasUpdatedWith isEqual:_backedTextInputView.attributedText]) {
    [self textInputDidChange];
    _ignoreNextTextInputCall = YES;
  }

  if (_eventEmitter) {
    std::static_pointer_cast<TextInputEventEmitter const>(_eventEmitter)->onSelectionChange([self _textInputMetrics]);
  }
}

#pragma mark - Other

- (TextInputMetrics)_textInputMetrics
{
  TextInputMetrics metrics;
  metrics.text = RCTStringFromNSString(_backedTextInputView.attributedText.string);
  metrics.selectionRange = [self _selectionRange];
  metrics.eventCount = _mostRecentEventCount;
  return metrics;
}

- (void)_updateState
{
  NSAttributedString *attributedString = _backedTextInputView.attributedText;

  if (!_state) {
    return;
  }
  auto data = _state->getData();
  _lastStringStateWasUpdatedWith = attributedString;
  data.attributedStringBox = RCTAttributedStringBoxFromNSAttributedString(attributedString);
  _mostRecentEventCount += 1;
  data.mostRecentEventCount = _mostRecentEventCount;
  _state->updateState(std::move(data));
}

- (AttributedString::Range)_selectionRange
{
  UITextRange *selectedTextRange = _backedTextInputView.selectedTextRange;
  NSInteger start = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                  toPosition:selectedTextRange.start];
  NSInteger end = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                toPosition:selectedTextRange.end];
  return AttributedString::Range{(int)start, (int)(end - start)};
}

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTTextInputHandleCommand(self, commandName, args);
}

- (void)focus
{
  [_backedTextInputView becomeFirstResponder];
}

- (void)blur
{
  [_backedTextInputView resignFirstResponder];
}

- (void)setMostRecentEventCount:(NSInteger)eventCount
{
  _mostRecentEventCount = eventCount;
}

- (void)setTextAndSelection:(NSInteger)eventCount
                      value:(NSString *__nullable)value
                      start:(NSInteger)start
                        end:(NSInteger)end
{
  if (_mostRecentEventCount != eventCount) {
    return;
  }

  if (value) {
    NSMutableAttributedString *mutableString =
        [[NSMutableAttributedString alloc] initWithAttributedString:_backedTextInputView.attributedText];
    [mutableString replaceCharactersInRange:NSMakeRange(0, _backedTextInputView.attributedText.length)
                                 withString:value];
    [self _setAttributedString:mutableString];
    [self _updateState];
  }

  UITextPosition *startPosition = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                      offset:start];
  UITextPosition *endPosition = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                    offset:end];

  if (startPosition && endPosition) {
    UITextRange *range = [_backedTextInputView textRangeFromPosition:startPosition toPosition:endPosition];
    [_backedTextInputView setSelectedTextRange:range notifyDelegate:NO];
  }
}

@end
