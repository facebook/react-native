/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTextInputComponentView.h"

#import <react/renderer/components/iostextinput/TextInputComponentDescriptor.h>
#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>
#import <react/renderer/textlayoutmanager/TextLayoutManager.h>

#import <React/RCTBackedTextInputViewProtocol.h>
#import <React/RCTScrollViewComponentView.h>
#import <React/RCTUITextField.h>
#import <React/RCTUITextView.h>
#import <React/RCTUtils.h>

#import "RCTConversions.h"
#import "RCTTextInputNativeCommands.h"
#import "RCTTextInputUtils.h"

#import "RCTFabricComponentsPlugins.h"

#if !TARGET_OS_OSX // [macOS]
/** Native iOS text field bottom keyboard offset amount */
static const CGFloat kSingleLineKeyboardBottomOffset = 15.0;
#endif // [macOS]

using namespace facebook::react;

@interface RCTTextInputComponentView () <RCTBackedTextInputDelegate, RCTTextInputViewProtocol>
@end

static NSSet<NSNumber *> *returnKeyTypesSet;

@implementation RCTTextInputComponentView {
  TextInputShadowNode::ConcreteState::Shared _state;
#if !TARGET_OS_OSX // [macOS]
  RCTUIView<RCTBackedTextInputViewProtocol> *_backedTextInputView;
#else // [macOS
  RCTUITextView<RCTBackedTextInputViewProtocol> *_backedTextInputView;
#endif // macOS]
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

  /*
   * A flag that when set to true, `_mostRecentEventCount` won't be incremented when `[self _updateState]`
   * and delegate methods `textInputDidChange` and `textInputDidChangeSelection` will exit early.
   *
   * Setting `_backedTextInputView.attributedText` triggers delegate methods `textInputDidChange` and
   * `textInputDidChangeSelection` for multiline text input only.
   * In multiline text input this is undesirable as we don't want to be sending events for changes that JS triggered.
   */
  BOOL _comingFromJS;
  BOOL _didMoveToWindow;

  /*
   * Newly initialized default typing attributes contain a no-op NSParagraphStyle and NSShadow. These cause inequality
   * between the AttributedString backing the input and those generated from state. We store these attributes to make
   * later comparison insensitive to them.
   */
  NSDictionary<NSAttributedStringKey, id> *_originalTypingAttributes;
}

#pragma mark - UIView overrides

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    const auto &defaultProps = TextInputShadowNode::defaultSharedProps();
    _props = defaultProps;

    _backedTextInputView = defaultProps->traits.multiline ? [RCTUITextView new] : [RCTUITextField new];
    _backedTextInputView.textInputDelegate = self;
    _ignoreNextTextInputCall = NO;
    _comingFromJS = NO;
    _didMoveToWindow = NO;
    _originalTypingAttributes = [_backedTextInputView.typingAttributes copy];

    [self addSubview:_backedTextInputView];
#if TARGET_OS_IOS // [macOS] [visionOS]
    [self initializeReturnKeyType];
#endif // [macOS] [visionOS]
  }

  return self;
}

- (void)updateEventEmitter:(const EventEmitter::Shared &)eventEmitter
{
  [super updateEventEmitter:eventEmitter];

  NSMutableDictionary<NSAttributedStringKey, id> *defaultAttributes =
      [_backedTextInputView.defaultTextAttributes mutableCopy];

  defaultAttributes[RCTAttributedStringEventEmitterKey] = RCTWrapEventEmitter(_eventEmitter);

  _backedTextInputView.defaultTextAttributes = defaultAttributes;
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (self.window && !_didMoveToWindow) {
    const auto &props = static_cast<const TextInputProps &>(*_props);
    if (props.autoFocus) {
#if !TARGET_OS_OSX // [macOS]
      [_backedTextInputView becomeFirstResponder];
#endif // [macOS]
    }
    _didMoveToWindow = YES;
#if TARGET_OS_IOS // [macOS] [visionOS]
    [self initializeReturnKeyType];
#endif // [macOS] [visionOS]
  }

  [self _restoreTextSelection];
}

- (void)reactUpdateResponderOffsetForScrollView:(RCTScrollViewComponentView *)scrollView
{
#if !TARGET_OS_OSX // [macOS]
  if (![self isDescendantOfView:scrollView.scrollView] || !_backedTextInputView.isFirstResponder) {
    // View is outside scroll view or it's not a first responder.
    scrollView.firstResponderViewOutsideScrollView = _backedTextInputView;
    return;
  }

  UITextRange *selectedTextRange = _backedTextInputView.selectedTextRange;
  UITextSelectionRect *selection = [_backedTextInputView selectionRectsForRange:selectedTextRange].firstObject;
  CGRect focusRect;
  if (selection == nil) {
    // No active selection or caret - fallback to entire input frame
    focusRect = self.bounds;
  } else {
    // Focus on text selection frame
    focusRect = selection.rect;
    BOOL isMultiline = [_backedTextInputView isKindOfClass:[UITextView class]];
    if (!isMultiline) {
      focusRect.size.height += kSingleLineKeyboardBottomOffset;
    }
  }
  scrollView.firstResponderFocus = [self convertRect:focusRect toView:nil];
#endif // [macOS]
}

#pragma mark - RCTViewComponentView overrides

- (NSObject *)accessibilityElement
{
  return _backedTextInputView;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<TextInputComponentDescriptor>();
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &oldTextInputProps = static_cast<const TextInputProps &>(*_props);
  const auto &newTextInputProps = static_cast<const TextInputProps &>(*props);

  // Traits:
  if (newTextInputProps.traits.multiline != oldTextInputProps.traits.multiline) {
    [self _setMultiline:newTextInputProps.traits.multiline];
  }


#if !TARGET_OS_OSX // [macOS]
  if (newTextInputProps.traits.autocapitalizationType != oldTextInputProps.traits.autocapitalizationType) {
    _backedTextInputView.autocapitalizationType =
        RCTUITextAutocapitalizationTypeFromAutocapitalizationType(newTextInputProps.traits.autocapitalizationType);
  }

  if (newTextInputProps.traits.autoCorrect != oldTextInputProps.traits.autoCorrect) {
    _backedTextInputView.autocorrectionType =
        RCTUITextAutocorrectionTypeFromOptionalBool(newTextInputProps.traits.autoCorrect);
  }
#endif // [macOS]

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

#if !TARGET_OS_OSX // [macOS]
  if (newTextInputProps.traits.keyboardAppearance != oldTextInputProps.traits.keyboardAppearance) {
    _backedTextInputView.keyboardAppearance =
        RCTUIKeyboardAppearanceFromKeyboardAppearance(newTextInputProps.traits.keyboardAppearance);
  }

  if (newTextInputProps.traits.spellCheck != oldTextInputProps.traits.spellCheck) {
    _backedTextInputView.spellCheckingType =
        RCTUITextSpellCheckingTypeFromOptionalBool(newTextInputProps.traits.spellCheck);
  }
#endif // [macOS]

  if (newTextInputProps.traits.caretHidden != oldTextInputProps.traits.caretHidden) {
    _backedTextInputView.caretHidden = newTextInputProps.traits.caretHidden;
  }

#if !TARGET_OS_OSX // [macOS]
  if (newTextInputProps.traits.clearButtonMode != oldTextInputProps.traits.clearButtonMode) {
    _backedTextInputView.clearButtonMode =
        RCTUITextFieldViewModeFromTextInputAccessoryVisibilityMode(newTextInputProps.traits.clearButtonMode);
  }
#endif // [macOS]

  if (newTextInputProps.traits.scrollEnabled != oldTextInputProps.traits.scrollEnabled) {
    _backedTextInputView.scrollEnabled = newTextInputProps.traits.scrollEnabled;
  }

#if !TARGET_OS_OSX // [macOS]
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
    _backedTextInputView.textContentType = RCTUITextContentTypeFromString(newTextInputProps.traits.textContentType);
  }

  if (newTextInputProps.traits.passwordRules != oldTextInputProps.traits.passwordRules) {
    _backedTextInputView.passwordRules = RCTUITextInputPasswordRulesFromString(newTextInputProps.traits.passwordRules);
  }

  if (newTextInputProps.traits.smartInsertDelete != oldTextInputProps.traits.smartInsertDelete) {
    _backedTextInputView.smartInsertDeleteType =
        RCTUITextSmartInsertDeleteTypeFromOptionalBool(newTextInputProps.traits.smartInsertDelete);
  }

  if (newTextInputProps.traits.showSoftInputOnFocus != oldTextInputProps.traits.showSoftInputOnFocus) {
    [self _setShowSoftInputOnFocus:newTextInputProps.traits.showSoftInputOnFocus];
  }
#endif // [macOS]

  // Traits `blurOnSubmit`, `clearTextOnFocus`, and `selectTextOnFocus` were omitted intentionally here
  // because they are being checked on-demand.

  // Other props:
  if (newTextInputProps.placeholder != oldTextInputProps.placeholder) {
    _backedTextInputView.placeholder = RCTNSStringFromString(newTextInputProps.placeholder);
  }

  if (newTextInputProps.placeholderTextColor != oldTextInputProps.placeholderTextColor) {
    _backedTextInputView.placeholderColor = RCTUIColorFromSharedColor(newTextInputProps.placeholderTextColor);
  }

  if (newTextInputProps.textAttributes != oldTextInputProps.textAttributes) {
    NSMutableDictionary<NSAttributedStringKey, id> *defaultAttributes =
        RCTNSTextAttributesFromTextAttributes(newTextInputProps.getEffectiveTextAttributes(RCTFontSizeMultiplier()));
#if !TARGET_OS_MACCATALYST
    defaultAttributes[RCTAttributedStringEventEmitterKey] =
        _backedTextInputView.defaultTextAttributes[RCTAttributedStringEventEmitterKey];
#endif
    _backedTextInputView.defaultTextAttributes = defaultAttributes;
  }

#if !TARGET_OS_OSX // [macOS]
  if (newTextInputProps.selectionColor != oldTextInputProps.selectionColor) {
    _backedTextInputView.tintColor = RCTUIColorFromSharedColor(newTextInputProps.selectionColor);
  }
#endif // [macOS]

  if (newTextInputProps.inputAccessoryViewID != oldTextInputProps.inputAccessoryViewID) {
    _backedTextInputView.inputAccessoryViewID = RCTNSStringFromString(newTextInputProps.inputAccessoryViewID);
  }
  [super updateProps:props oldProps:oldProps];

#if TARGET_OS_IOS // [macOS] [visionOS]
  [self setDefaultInputAccessoryView];
#endif // [macOS] [visionOS]
}

- (void)updateState:(const State::Shared &)state oldState:(const State::Shared &)oldState
{
  _state = std::static_pointer_cast<const TextInputShadowNode::ConcreteState>(state);

  if (!_state) {
    assert(false && "State is `null` for <TextInput> component.");
    _backedTextInputView.attributedText = nil;
    return;
  }

  auto data = _state->getData();

  if (!oldState) {
    _mostRecentEventCount = _state->getData().mostRecentEventCount;
  }

  if (_mostRecentEventCount == _state->getData().mostRecentEventCount) {
    _comingFromJS = YES;
    [self _setAttributedString:RCTNSAttributedStringFromAttributedStringBox(data.attributedStringBox)];
    _comingFromJS = NO;
  }
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

#if TARGET_OS_OSX // [macOS
  _backedTextInputView.pointScaleFactor = layoutMetrics.pointScaleFactor;
#endif // macOS]
  _backedTextInputView.frame =
      UIEdgeInsetsInsetRect(self.bounds, RCTUIEdgeInsetsFromEdgeInsets(layoutMetrics.borderWidth));
  _backedTextInputView.textContainerInset =
      RCTUIEdgeInsetsFromEdgeInsets(layoutMetrics.contentInsets - layoutMetrics.borderWidth);

  if (_eventEmitter) {
    static_cast<const TextInputEventEmitter &>(*_eventEmitter).onContentSizeChange([self _textInputMetrics]);
  }
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  _state.reset();
  _backedTextInputView.attributedText = nil;
  _mostRecentEventCount = 0;
  _comingFromJS = NO;
  _lastStringStateWasUpdatedWith = nil;
  _ignoreNextTextInputCall = NO;
  _didMoveToWindow = NO;
  [_backedTextInputView resignFirstResponder];
}

#pragma mark - RCTBackedTextInputDelegate

- (BOOL)textInputShouldBeginEditing
{
  return YES;
}

- (void)textInputDidBeginEditing
{
  if (_eventEmitter) {
    static_cast<const TextInputEventEmitter &>(*_eventEmitter).onFocus([self _textInputMetrics]);
  }
}

- (BOOL)textInputShouldEndEditing
{
  return YES;
}

- (void)textInputDidEndEditing
{
  if (_eventEmitter) {
    static_cast<const TextInputEventEmitter &>(*_eventEmitter).onEndEditing([self _textInputMetrics]);
    static_cast<const TextInputEventEmitter &>(*_eventEmitter).onBlur([self _textInputMetrics]);
  }
}

- (BOOL)textInputShouldSubmitOnReturn
{
  const SubmitBehavior submitBehavior = [self getSubmitBehavior];
  const BOOL shouldSubmit = submitBehavior == SubmitBehavior::Submit || submitBehavior == SubmitBehavior::BlurAndSubmit;
  // We send `submit` event here, in `textInputShouldSubmitOnReturn`
  // (not in `textInputDidReturn)`, because of semantic of the event:
  // `onSubmitEditing` is called when "Submit" button
  // (the blue key on onscreen keyboard) did pressed
  // (no connection to any specific "submitting" process).

  if (_eventEmitter && shouldSubmit) {
    static_cast<const TextInputEventEmitter &>(*_eventEmitter).onSubmitEditing([self _textInputMetrics]);
  }
  return shouldSubmit;
}

- (BOOL)textInputShouldReturn
{
  return [self getSubmitBehavior] == SubmitBehavior::BlurAndSubmit;
}

- (void)textInputDidReturn
{
  // Does nothing.
}

- (NSString *)textInputShouldChangeText:(NSString *)text inRange:(NSRange)range
{
  const auto &props = static_cast<const TextInputProps &>(*_props);

  if (!_backedTextInputView.textWasPasted) {
    if (_eventEmitter) {
      const auto &textInputEventEmitter = static_cast<const TextInputEventEmitter &>(*_eventEmitter);
      textInputEventEmitter.onKeyPress({
          .text = RCTStringFromNSString(text),
          .eventCount = static_cast<int>(_mostRecentEventCount),
      });
    }
  }

  if (props.maxLength) {
    NSInteger allowedLength = props.maxLength - _backedTextInputView.attributedText.string.length + range.length;

    if (allowedLength > 0 && text.length > allowedLength) {
      // make sure unicode characters that are longer than 16 bits (such as emojis) are not cut off
      NSRange cutOffCharacterRange = [text rangeOfComposedCharacterSequenceAtIndex:allowedLength - 1];
      if (cutOffCharacterRange.location + cutOffCharacterRange.length > allowedLength) {
        // the character at the length limit takes more than 16bits, truncation should end at the character before
        allowedLength = cutOffCharacterRange.location;
      }
    }

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
  if (_comingFromJS) {
    return;
  }

  if (_ignoreNextTextInputCall && [_lastStringStateWasUpdatedWith isEqual:_backedTextInputView.attributedText]) {
    _ignoreNextTextInputCall = NO;
    return;
  }

  [self _updateState];

  if (_eventEmitter) {
    const auto &textInputEventEmitter = static_cast<const TextInputEventEmitter &>(*_eventEmitter);
    textInputEventEmitter.onChange([self _textInputMetrics]);
  }
}

- (void)textInputDidChangeSelection
{
  if (_comingFromJS) {
    return;
  }

  // T207198334: Setting a new AttributedString (_comingFromJS) will trigger a selection change before the backing
  // string is updated, so indicies won't point to what we want yet. Only respond to user selection change, and let
  // `_setAttributedString` handle updating typing attributes if content changes.
  [self _updateTypingAttributes];

  const auto &props = static_cast<const TextInputProps &>(*_props);
  if (props.traits.multiline && ![_lastStringStateWasUpdatedWith isEqual:_backedTextInputView.attributedText]) {
    [self textInputDidChange];
    _ignoreNextTextInputCall = YES;
  }

  if (_eventEmitter) {
    static_cast<const TextInputEventEmitter &>(*_eventEmitter).onSelectionChange([self _textInputMetrics]);
  }
}

#if TARGET_OS_OSX // [macOS
- (void)automaticSpellingCorrectionDidChange:(BOOL)enabled {}


- (void)continuousSpellCheckingDidChange:(BOOL)enabled {}


- (void)grammarCheckingDidChange:(BOOL)enabled {}


- (BOOL)hasValidKeyDownOrValidKeyUp:(nonnull NSString *)key {
  return YES;
}

- (void)submitOnKeyDownIfNeeded:(nonnull NSEvent *)event {}

- (void)textInputDidCancel {}

- (NSDragOperation)textInputDraggingEntered:(nonnull id<NSDraggingInfo>)draggingInfo {
  return NSDragOperationNone;
}

- (void)textInputDraggingExited:(nonnull id<NSDraggingInfo>)draggingInfo {
  return;
}

- (BOOL)textInputShouldHandleDeleteBackward:(nonnull id<RCTBackedTextInputViewProtocol>)sender {
  return YES;
}

- (BOOL)textInputShouldHandleDeleteForward:(nonnull id<RCTBackedTextInputViewProtocol>)sender {
  return YES;
}

- (BOOL)textInputShouldHandleDragOperation:(nonnull id<NSDraggingInfo>)draggingInfo {
  return YES;
}

- (BOOL)textInputShouldHandleKeyEvent:(nonnull NSEvent *)event {
  return YES;
}

- (BOOL)textInputShouldHandlePaste:(nonnull id<RCTBackedTextInputViewProtocol>)sender {
  return YES;
}

#endif // macOS]

#pragma mark - RCTBackedTextInputDelegate (UIScrollViewDelegate)

- (void)scrollViewDidScroll:(RCTUIScrollView *)scrollView // [macOS]
{
  if (_eventEmitter) {
    static_cast<const TextInputEventEmitter &>(*_eventEmitter).onScroll([self _textInputMetrics]);
  }
}

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTTextInputHandleCommand(self, commandName, args);
}

- (void)focus
{
  [_backedTextInputView becomeFirstResponder];

  const auto &props = static_cast<const TextInputProps &>(*_props);

  if (props.traits.clearTextOnFocus) {
    _backedTextInputView.attributedText = nil;
    [self textInputDidChange];
  }

  if (props.traits.selectTextOnFocus) {
    [_backedTextInputView selectAll:nil];
    [self textInputDidChangeSelection];
  }
}

- (void)blur
{
  [_backedTextInputView resignFirstResponder];
}

- (void)setTextAndSelection:(NSInteger)eventCount
                      value:(NSString *__nullable)value
                      start:(NSInteger)start
                        end:(NSInteger)end
{
  if (_mostRecentEventCount != eventCount) {
    return;
  }
  _comingFromJS = YES;
  if (value && ![value isEqualToString:_backedTextInputView.attributedText.string]) {
    NSAttributedString *attributedString =
        [[NSAttributedString alloc] initWithString:value attributes:_backedTextInputView.defaultTextAttributes];
    [self _setAttributedString:attributedString];
    [self _updateState];
  }

#if !TARGET_OS_OSX // [macOS]
  UITextPosition *startPosition = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                      offset:start];
  UITextPosition *endPosition = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                    offset:end];

  if (startPosition && endPosition) {
    UITextRange *range = [_backedTextInputView textRangeFromPosition:startPosition toPosition:endPosition];
    [_backedTextInputView setSelectedTextRange:range notifyDelegate:NO];
  }
#endif // [macOS]
  _comingFromJS = NO;
}

#pragma mark - Default input accessory view

#if TARGET_OS_IOS // [macOS] [visionOS] Input Accessory Views are only a concept on iOS
- (NSString *)returnKeyTypeToString:(UIReturnKeyType)returnKeyType
{
  switch (returnKeyType) {
    case UIReturnKeyGo:
      return @"Go";
    case UIReturnKeyNext:
      return @"Next";
    case UIReturnKeySearch:
      return @"Search";
    case UIReturnKeySend:
      return @"Send";
    case UIReturnKeyYahoo:
      return @"Yahoo";
    case UIReturnKeyGoogle:
      return @"Google";
    case UIReturnKeyRoute:
      return @"Route";
    case UIReturnKeyJoin:
      return @"Join";
    case UIReturnKeyEmergencyCall:
      return @"Emergency Call";
    default:
      return @"Done";
  }
}

- (void)initializeReturnKeyType
{
  returnKeyTypesSet = [NSSet setWithObjects:@(UIReturnKeyDone),
                                            @(UIReturnKeyGo),
                                            @(UIReturnKeyNext),
                                            @(UIReturnKeySearch),
                                            @(UIReturnKeySend),
                                            @(UIReturnKeyYahoo),
                                            @(UIReturnKeyGoogle),
                                            @(UIReturnKeyRoute),
                                            @(UIReturnKeyJoin),
                                            @(UIReturnKeyRoute),
                                            @(UIReturnKeyEmergencyCall),
                                            nil];
}

- (void)setDefaultInputAccessoryView
{
  // InputAccessoryView component sets the inputAccessoryView when inputAccessoryViewID exists
  if (_backedTextInputView.inputAccessoryViewID) {
    if (_backedTextInputView.isFirstResponder) {
      [_backedTextInputView reloadInputViews];
    }
    return;
  }

  UIKeyboardType keyboardType = _backedTextInputView.keyboardType;
  UIReturnKeyType returnKeyType = _backedTextInputView.returnKeyType;

  BOOL containsKeyType = [returnKeyTypesSet containsObject:@(returnKeyType)];

  // These keyboard types (all are number pads) don't have a "returnKey" button by default,
  // so we create an `inputAccessoryView` with this button for them.
  BOOL shouldHaveInputAccessoryView =
      (keyboardType == UIKeyboardTypeNumberPad || keyboardType == UIKeyboardTypePhonePad ||
       keyboardType == UIKeyboardTypeDecimalPad || keyboardType == UIKeyboardTypeASCIICapableNumberPad) &&
      containsKeyType;

  if ((_backedTextInputView.inputAccessoryView != nil) == shouldHaveInputAccessoryView) {
    return;
  }

  if (shouldHaveInputAccessoryView) {
    NSString *buttonLabel = [self returnKeyTypeToString:returnKeyType];

    UIToolbar *toolbarView = [UIToolbar new];
    [toolbarView sizeToFit];
    UIBarButtonItem *flexibleSpace =
        [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace target:nil action:nil];
    UIBarButtonItem *doneButton = [[UIBarButtonItem alloc] initWithTitle:buttonLabel
                                                                   style:UIBarButtonItemStylePlain
                                                                  target:self
                                                                  action:@selector(handleInputAccessoryDoneButton)];
    toolbarView.items = @[ flexibleSpace, doneButton ];
    _backedTextInputView.inputAccessoryView = toolbarView;
  } else {
    _backedTextInputView.inputAccessoryView = nil;
  }

  if (_backedTextInputView.isFirstResponder) {
    [_backedTextInputView reloadInputViews];
  }
}

- (void)handleInputAccessoryDoneButton
{
  if ([self textInputShouldReturn]) {
    [_backedTextInputView endEditing:YES];
  }
}
#endif // [macOS] [visionOS]

#pragma mark - Other

- (TextInputEventEmitter::Metrics)_textInputMetrics
{
  return {
      .text = RCTStringFromNSString(_backedTextInputView.attributedText.string),
      .selectionRange = [self _selectionRange],
      .eventCount = static_cast<int>(_mostRecentEventCount),
#if !TARGET_OS_OSX // [macOS]
      .contentOffset = RCTPointFromCGPoint(_backedTextInputView.contentOffset),
      .contentInset = RCTEdgeInsetsFromUIEdgeInsets(_backedTextInputView.contentInset),
#endif // [macOS]
      .contentSize = RCTSizeFromCGSize(_backedTextInputView.contentSize),
      .layoutMeasurement = RCTSizeFromCGSize(_backedTextInputView.bounds.size),
#if !TARGET_OS_OSX // [macOS]
      .zoomScale = _backedTextInputView.zoomScale,
#endif // [macOS]
  };
}

- (void)_updateState
{
  if (!_state) {
    return;
  }
  NSAttributedString *attributedString = _backedTextInputView.attributedText;
  auto data = _state->getData();
  _lastStringStateWasUpdatedWith = attributedString;
  data.attributedStringBox = RCTAttributedStringBoxFromNSAttributedString(attributedString);
  _mostRecentEventCount += _comingFromJS ? 0 : 1;
  data.mostRecentEventCount = _mostRecentEventCount;
  _state->updateState(std::move(data));
}

- (AttributedString::Range)_selectionRange
{
#if !TARGET_OS_OSX // [macOS]
  UITextRange *selectedTextRange = _backedTextInputView.selectedTextRange;
  NSInteger start = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                  toPosition:selectedTextRange.start];
  NSInteger end = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                toPosition:selectedTextRange.end];
  return AttributedString::Range{(int)start, (int)(end - start)};
#else // [macOS
  // [Fabric] Placeholder till we implement selection in Fabric
  return AttributedString::Range({0, 1});
#endif // macOS]
}

- (void)_restoreTextSelection
{
  const auto &selection = static_cast<const TextInputProps &>(*_props).selection;
  if (!selection.has_value()) {
    return;
  }
#if !TARGET_OS_OSX // [macOS]
  auto start = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                   offset:selection->start];
  auto end = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument offset:selection->end];
  auto range = [_backedTextInputView textRangeFromPosition:start toPosition:end];
  [_backedTextInputView setSelectedTextRange:range notifyDelegate:YES];
#endif // [macOS]
}

- (void)_setAttributedString:(NSAttributedString *)attributedString
{
  if ([self _textOf:attributedString equals:_backedTextInputView.attributedText]) {
    return;
  }
#if !TARGET_OS_OSX // [macOS]
  UITextRange *selectedRange = _backedTextInputView.selectedTextRange;
  NSInteger oldTextLength = _backedTextInputView.attributedText.string.length;
  _backedTextInputView.attributedText = attributedString;
  // Updating the UITextView attributedText, for example changing the lineHeight, the color or adding
  // a new paragraph with \n, causes the cursor to move to the end of the Text and scroll.
  // This is fixed by restoring the cursor position and scrolling to that position (iOS issue 652653).
  if (selectedRange.empty) {
    // Maintaining a cursor position relative to the end of the old text.
    NSInteger offsetStart = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                          toPosition:selectedRange.start];
    NSInteger offsetFromEnd = oldTextLength - offsetStart;
    NSInteger newOffset = attributedString.string.length - offsetFromEnd;
    UITextPosition *position = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                   offset:newOffset];
    [_backedTextInputView setSelectedTextRange:[_backedTextInputView textRangeFromPosition:position toPosition:position]
                                notifyDelegate:YES];
    [_backedTextInputView scrollRangeToVisible:NSMakeRange(offsetStart, 0)];
  }
  [self _restoreTextSelection];
  [self _updateTypingAttributes];
  _lastStringStateWasUpdatedWith = attributedString;
#endif // [macOS]
}

// Ensure that newly typed text will inherit any custom attributes. We follow the logic of RN Android, where attributes
// to the left of the cursor are copied into new text, unless we are at the start of the field, in which case we will
// copy the attributes from text to the right. This allows consistency between backed input and new AttributedText
// https://github.com/facebook/react-native/blob/3102a58df38d96f3dacef0530e4dbb399037fcd2/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/text/internal/span/SetSpanOperation.kt#L30
- (void)_updateTypingAttributes
{
#if !TARGET_OS_OSX // [macOS]
  if (_backedTextInputView.attributedText.length > 0 && _backedTextInputView.selectedTextRange != nil) {
    NSUInteger offsetStart = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                           toPosition:_backedTextInputView.selectedTextRange.start];

    
    NSUInteger samplePoint = offsetStart == 0 ? 0 : offsetStart - 1;
    _backedTextInputView.typingAttributes = [_backedTextInputView.attributedText attributesAtIndex:samplePoint
                                                                                    effectiveRange:NULL];
  }
#else // [macOS
  // TODO
#endif // macOS]
}

- (void)_setMultiline:(BOOL)multiline
{
  [_backedTextInputView removeFromSuperview];
#if !TARGET_OS_OSX // [macOS]
  RCTUIView<RCTBackedTextInputViewProtocol> *backedTextInputView = multiline ? [RCTUITextView new] : [RCTUITextField new];
#else // [macOS
  RCTUITextView<RCTBackedTextInputViewProtocol> *backedTextInputView = [RCTUITextView new];
#endif // macOS]
  backedTextInputView.frame = _backedTextInputView.frame;
  RCTCopyBackedTextInput(_backedTextInputView, backedTextInputView);
  _backedTextInputView = backedTextInputView;
  [self addSubview:_backedTextInputView];
}

#if !TARGET_OS_OSX // [macOS]
- (void)_setShowSoftInputOnFocus:(BOOL)showSoftInputOnFocus
{
  if (showSoftInputOnFocus) {
    // Resets to default keyboard.
    _backedTextInputView.inputView = nil;

    // Without the call to reloadInputViews, the keyboard will not change until the textInput field (the first
    // responder) loses and regains focus.
    if (_backedTextInputView.isFirstResponder) {
      [_backedTextInputView reloadInputViews];
    }
  } else {
    // Hides keyboard, but keeps blinking cursor.
    _backedTextInputView.inputView = [UIView new];
  }
}
#endif // macOS]

- (BOOL)_textOf:(NSAttributedString *)newText equals:(NSAttributedString *)oldText
{
  // When the dictation is running we can't update the attributed text on the backed up text view
  // because setting the attributed string will kill the dictation. This means that we can't impose
  // the settings on a dictation.
  // Similarly, when the user is in the middle of inputting some text in Japanese/Chinese, there will be styling on the
  // text that we should disregard. See
  // https://developer.apple.com/documentation/uikit/uitextinput/1614489-markedtextrange?language=objc for more info.
  // Also, updating the attributed text while inputting Korean language will break input mechanism.
  // If the user added an emoji, the system adds a font attribute for the emoji and stores the original font in
  // NSOriginalFont. Lastly, when entering a password, etc., there will be additional styling on the field as the native
  // text view handles showing the last character for a split second.
  __block BOOL fontHasBeenUpdatedBySystem = false;
  [oldText enumerateAttribute:@"NSOriginalFont"
                      inRange:NSMakeRange(0, oldText.length)
                      options:0
                   usingBlock:^(id value, NSRange range, BOOL *stop) {
                     if (value) {
                       fontHasBeenUpdatedBySystem = true;
                     }
                   }];

  BOOL shouldFallbackToBareTextComparison =
#if !TARGET_OS_OSX // [macOS]
  [_backedTextInputView.textInputMode.primaryLanguage isEqualToString:@"dictation"] ||
  [_backedTextInputView.textInputMode.primaryLanguage isEqualToString:@"ko-KR"] ||
  _backedTextInputView.markedTextRange ||
  _backedTextInputView.isSecureTextEntry ||
#else // [macOS
  // There are multiple Korean input sources (2-Set, 3-Set, etc). Check substring instead instead
  [[[_backedTextInputView inputContext] selectedKeyboardInputSource] containsString:@"com.apple.inputmethod.Korean"] ||
  [_backedTextInputView hasMarkedText] ||
  [_backedTextInputView isKindOfClass:[NSSecureTextField class]] ||
#endif // macOS]
  fontHasBeenUpdatedBySystem;

  if (shouldFallbackToBareTextComparison) {
    return [newText.string isEqualToString:oldText.string];
  } else {
    return RCTIsAttributedStringEffectivelySame(
        newText, oldText, _originalTypingAttributes, static_cast<const TextInputProps &>(*_props).textAttributes);
  }
}

- (SubmitBehavior)getSubmitBehavior
{
  const auto &props = static_cast<const TextInputProps &>(*_props);
  const SubmitBehavior submitBehaviorDefaultable = props.traits.submitBehavior;

  // We should always have a non-default `submitBehavior`, but in case we don't, set it based on multiline.
  if (submitBehaviorDefaultable == SubmitBehavior::Default) {
    return props.traits.multiline ? SubmitBehavior::Newline : SubmitBehavior::BlurAndSubmit;
  }

  return submitBehaviorDefaultable;
}

@end

Class<RCTComponentViewProtocol> RCTTextInputCls(void)
{
  return RCTTextInputComponentView.class;
}
