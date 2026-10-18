/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTextInputComponentView.h"

#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/renderer/components/iostextinput/TextInputComponentDescriptor.h>
#import <react/renderer/textlayoutmanager/RCTAttributedTextUtils.h>
#import <react/renderer/textlayoutmanager/TextLayoutManager.h>

#import <React/RCTBackedTextInputViewProtocol.h>
#import <React/RCTLocalizedString.h>
#import <React/RCTScrollViewComponentView.h>
#import <React/RCTUITextField.h>
#import <React/RCTUITextView.h>
#import <React/RCTUtils.h>

#import "RCTConversions.h"
#import "RCTTextInputNativeCommands.h"
#import "RCTTextInputUtils.h"

#import <limits>
#import "RCTFabricComponentsPlugins.h"

/** Native iOS text field bottom keyboard offset amount */
static const CGFloat kSingleLineKeyboardBottomOffset = 15.0;

using namespace facebook::react;

@interface RCTTextInputComponentView () <
    RCTBackedTextInputDelegate,
    RCTTextInputViewProtocol
#if !TARGET_OS_TV
    ,
    UIDropInteractionDelegate
#endif
    >
@end

static NSSet<NSNumber *> *returnKeyTypesSet;

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

  /*
   * While JS's text is written into the field, UIKit can deliver the keys queued behind `-setAttributedText:` inside
   * the write, and the write then replaces them. `_textBeforeUpdateFromJS` is the field's text before the write (nil
   * outside one). A key that goes through -textInputShouldChangeText:inRange: during the write sets
   * `_keyTypedDuringUpdateFromJS`, and the change UIKit reports next is recorded in `_textTypedDuringUpdateFromJS`
   * (and the selection it left in `_selectionTypedDuringUpdateFromJS`).
   * Other changes reported during the write are the write's own (a text view reports it). A key that leaves marked
   * text (IME composition) sets `_markedTextDuringUpdateFromJS`: composition is not put back as plain text.
   * See -_setAttributedStringFromJS: and -_restoreTextTypedDuringUpdateFromJS:writtenText:.
   */
  NSString *_textBeforeUpdateFromJS;
  NSString *_textTypedDuringUpdateFromJS;
  AttributedString::Range _selectionTypedDuringUpdateFromJS;
  BOOL _keyTypedDuringUpdateFromJS;
  BOOL _markedTextDuringUpdateFromJS;
  /*
   * While -_restoreTextTypedDuringUpdateFromJS:writtenText: puts keys back, the range its edit replaces and the length
   * it adds (both 0 outside it). UIKit can deliver more queued keys inside that edit, before it applies: their
   * `maxLength` check counts that length, and a key that edits text before the end of that range is dropped (see
   * -textInputShouldChangeText:inRange:).
   */
  NSRange _rangeBeingRestored;
  NSInteger _lengthBeingRestored;

  BOOL _hasInputAccessoryView;
  CGSize _previousContentSize;
}

#pragma mark - UIView overrides

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    const auto &defaultProps = TextInputShadowNode::defaultSharedProps();
    _props = defaultProps;

    _backedTextInputView = defaultProps->multiline ? [RCTUITextView new] : [RCTUITextField new];
    _backedTextInputView.textInputDelegate = self;
    _ignoreNextTextInputCall = NO;
    _comingFromJS = NO;
    _didMoveToWindow = NO;
    _originalTypingAttributes = [_backedTextInputView.typingAttributes copy];
    _previousContentSize = CGSizeZero;

    [self addSubview:_backedTextInputView];
    [self initializeReturnKeyType];
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
      [_backedTextInputView becomeFirstResponder];
      [self scrollCursorIntoView];
    }
    _didMoveToWindow = YES;
    [self initializeReturnKeyType];
  }

  [self _restoreTextSelection];
}

// TODO: replace with registerForTraitChanges once iOS 17.0 is the lowest supported version
- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];

  if (facebook::react::ReactNativeFeatureFlags::enableFontScaleChangesUpdatingLayout() &&
      UITraitCollection.currentTraitCollection.preferredContentSizeCategory !=
          previousTraitCollection.preferredContentSizeCategory) {
    const auto &newTextInputProps = static_cast<const TextInputProps &>(*_props);
    _backedTextInputView.defaultTextAttributes =
        RCTNSTextAttributesFromTextAttributes(newTextInputProps.getEffectiveTextAttributes(RCTFontSizeMultiplier()));
  }
}

- (void)reactUpdateResponderOffsetForScrollView:(RCTScrollViewComponentView *)scrollView
{
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
  if (newTextInputProps.multiline != oldTextInputProps.multiline) {
    [self _setMultiline:newTextInputProps.multiline];
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

#if !TARGET_OS_TV
  if (newTextInputProps.multiline &&
      newTextInputProps.traits.dataDetectorTypes != oldTextInputProps.traits.dataDetectorTypes) {
    _backedTextInputView.dataDetectorTypes =
        RCTUITextViewDataDetectorTypesFromStringVector(newTextInputProps.traits.dataDetectorTypes);
  }
#endif

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
    // Without the call to reloadInputViews, the keyboard will not change until the textInput field (the first
    // responder) loses and regains focus.
    if (_backedTextInputView.isFirstResponder) {
      [_backedTextInputView reloadInputViews];
    }
  }

  if (newTextInputProps.traits.returnKeyType != oldTextInputProps.traits.returnKeyType) {
    _backedTextInputView.returnKeyType = RCTUIReturnKeyTypeFromReturnKeyType(newTextInputProps.traits.returnKeyType);
    if (_backedTextInputView.isFirstResponder) {
      [_backedTextInputView reloadInputViews];
    }
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

  // Traits `clearTextOnFocus` and `selectTextOnFocus` were omitted intentionally here
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
    defaultAttributes[RCTAttributedStringEventEmitterKey] =
        _backedTextInputView.defaultTextAttributes[RCTAttributedStringEventEmitterKey];
    _backedTextInputView.defaultTextAttributes = defaultAttributes;
  }

  if (newTextInputProps.selectionColor != oldTextInputProps.selectionColor) {
    _backedTextInputView.tintColor = RCTUIColorFromSharedColor(newTextInputProps.selectionColor);
  }

  if (newTextInputProps.inputAccessoryViewID != oldTextInputProps.inputAccessoryViewID) {
    _backedTextInputView.inputAccessoryViewID = RCTNSStringFromString(newTextInputProps.inputAccessoryViewID);
  }

  if (newTextInputProps.inputAccessoryViewButtonLabel != oldTextInputProps.inputAccessoryViewButtonLabel) {
    _backedTextInputView.inputAccessoryViewButtonLabel =
        RCTNSStringFromString(newTextInputProps.inputAccessoryViewButtonLabel);
  }

  if (newTextInputProps.disableKeyboardShortcuts != oldTextInputProps.disableKeyboardShortcuts) {
    _backedTextInputView.disableKeyboardShortcuts = newTextInputProps.disableKeyboardShortcuts;
  }

  if (newTextInputProps.acceptDragAndDropTypes != oldTextInputProps.acceptDragAndDropTypes) {
    if (!newTextInputProps.acceptDragAndDropTypes.has_value()) {
      _backedTextInputView.acceptDragAndDropTypes = nil;
    } else {
      auto &vector = newTextInputProps.acceptDragAndDropTypes.value();
      NSMutableArray<NSString *> *array = [NSMutableArray arrayWithCapacity:vector.size()];
      for (const std::string &str : vector) {
        [array addObject:[NSString stringWithUTF8String:str.c_str()]];
      }
      _backedTextInputView.acceptDragAndDropTypes = array;
    }
  }

  [super updateProps:props oldProps:oldProps];

  [self setDefaultInputAccessoryView];
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
    [self _setAttributedStringFromJS:RCTNSAttributedStringFromAttributedStringBox(data.attributedStringBox)];
  }
}

// Writes JS's text into the field and puts back the keys UIKit delivered during the write.
- (void)_setAttributedStringFromJS:(NSAttributedString *)attributedString
{
  NSString *textBeforeUpdate = [self _beginUpdateFromJS];
  [self _setAttributedString:attributedString];
  _comingFromJS = NO;
  [self _restoreTextTypedDuringUpdateFromJS:textBeforeUpdate writtenText:attributedString.string];
}

// Starts a write from JS (`_comingFromJS`): returns the field's text before it.
- (NSString *)_beginUpdateFromJS
{
  _comingFromJS = YES;
  _textBeforeUpdateFromJS = [_backedTextInputView.attributedText.string copy];
  _textTypedDuringUpdateFromJS = nil;
  _selectionTypedDuringUpdateFromJS = {};
  _keyTypedDuringUpdateFromJS = NO;
  _markedTextDuringUpdateFromJS = NO;
  return _textBeforeUpdateFromJS;
}

- (void)_setSelectedRange:(AttributedString::Range)range
{
  UITextPosition *start = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                              offset:range.location];
  UITextPosition *end = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                            offset:range.location + range.length];
  if (start != nil && end != nil) {
    [_backedTextInputView setSelectedTextRange:[_backedTextInputView textRangeFromPosition:start toPosition:end]
                                notifyDelegate:NO];
  }
}

- (void)_endUpdateFromJS
{
  _textBeforeUpdateFromJS = nil;
  _textTypedDuringUpdateFromJS = nil;
  _selectionTypedDuringUpdateFromJS = {};
  _keyTypedDuringUpdateFromJS = NO;
  _markedTextDuringUpdateFromJS = NO;
}

// Applies the edit the user made during the write from JS (`textBeforeUpdate` -> the text the keys left, see
// RCTTextInputTextToRestore) to the text JS wrote, within `maxLength`, and reports it as typing (-textInputDidChange,
// then -textInputDidChangeSelection), so JS receives those keys and can still change or reject them. The selection is
// mapped through the edit: JS's selection (setTextAndSelection) or the caret the write restored. Nothing is put back
// while the user composes text (IME marked text): composition is not committed as plain text.
- (void)_restoreTextTypedDuringUpdateFromJS:(NSString *)textBeforeUpdate writtenText:(NSString *)writtenText
{
  NSString *typedText = _textTypedDuringUpdateFromJS;
  AttributedString::Range typedSelection = _selectionTypedDuringUpdateFromJS;
  BOOL markedText = _markedTextDuringUpdateFromJS || _backedTextInputView.markedTextRange != nil;
  [self _endUpdateFromJS];
  if (typedText == nil || markedText) {
    return;
  }
  if (![_backedTextInputView.attributedText.string isEqualToString:writtenText]) {
    // The keys arrived after the write had replaced the text (a text view can deliver them there), so the field
    // still has them: only report them. The write then put the caret back where it was before the keys: put it
    // after them again.
    if ([_backedTextInputView.attributedText.string isEqualToString:typedText]) {
      [self _setSelectedRange:typedSelection];
    }
    [self textInputDidChange];
    [self textInputDidChangeSelection];
    return;
  }
  NSRange replaced;
  NSString *inserted;
  if (!RCTTextInputTextToRestore(textBeforeUpdate, typedText, writtenText, &replaced, &inserted)) {
    return;
  }
  const auto &props = static_cast<const TextInputProps &>(*_props);
  if (inserted.length > 0 && props.maxLength < std::numeric_limits<int>::max()) {
    // UIKit checked these keys against the text before the write.
    inserted = RCTTextInputTextWithinLength(
        inserted, (NSInteger)props.maxLength - (NSInteger)writtenText.length + (NSInteger)replaced.length);
    if (inserted == nil) {
      return;
    }
  }

  AttributedString::Range selection = [self _selectionRange];
  UITextPosition *replacedStart = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                      offset:replaced.location];
  UITextPosition *replacedEnd = [_backedTextInputView positionFromPosition:replacedStart offset:replaced.length];
  UITextRange *replacedRange = [_backedTextInputView textRangeFromPosition:replacedStart toPosition:replacedEnd];
  if (replacedRange == nil) {
    return;
  }
  // Put the keys back as UIKit inserts typed text: as an edit the user can undo, with the attributes of JS's text
  // before them (the typing attributes, set after the caret moved). UIKit can deliver more queued keys inside this
  // edit, before it applies: the caret is put after `replacedRange`, so they land after it, stay in the field (only
  // `replacedRange` is replaced) and are reported with it.
  [_backedTextInputView setSelectedTextRange:[_backedTextInputView textRangeFromPosition:replacedEnd
                                                                              toPosition:replacedEnd]
                              notifyDelegate:NO];
  NSAttributedString *textBeforeRestore = _backedTextInputView.attributedText;
  [self _updateTypingAttributesSampledAt:replaced.location];
  NSInteger lengthAdded = (NSInteger)inserted.length - (NSInteger)replaced.length;
  _comingFromJS = YES;
  _rangeBeingRestored = replaced;
  _lengthBeingRestored = lengthAdded;
  [_backedTextInputView replaceRange:replacedRange withText:inserted];
  _rangeBeingRestored = NSMakeRange(0, 0);
  _lengthBeingRestored = 0;
  // The keys UIKit delivered inside the edit follow the restored ones: the selection moves past them too.
  NSInteger delivered =
      (NSInteger)_backedTextInputView.attributedText.length - (NSInteger)textBeforeRestore.length - lengthAdded;
  NSUInteger insertedLength = inserted.length + (NSUInteger)MAX(delivered, (NSInteger)0);
  NSInteger start = RCTTextInputOffsetAfterEdit(selection.location, replaced, insertedLength);
  NSInteger end = RCTTextInputOffsetAfterEdit(selection.location + selection.length, replaced, insertedLength);
  [self _setSelectedRange:{.location = (int)start, .length = (int)(end - start)}];
  [self _updateTypingAttributes];
  _comingFromJS = NO;
  [self textInputDidChange];
  [self textInputDidChangeSelection];
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];

  _backedTextInputView.frame =
      UIEdgeInsetsInsetRect(self.bounds, RCTUIEdgeInsetsFromEdgeInsets(layoutMetrics.borderWidth));
  _backedTextInputView.textContainerInset =
      RCTUIEdgeInsetsFromEdgeInsets(layoutMetrics.contentInsets - layoutMetrics.borderWidth);

  if (!CGSizeEqualToSize(_previousContentSize, _backedTextInputView.contentSize) && _eventEmitter) {
    _previousContentSize = _backedTextInputView.contentSize;
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
  _backedTextInputView.inputAccessoryViewID = nil;
  _backedTextInputView.inputAccessoryView = nil;
  _hasInputAccessoryView = false;
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

  NSString *allowedText = text;
  if (props.maxLength < std::numeric_limits<int>::max()) {
    allowedText = RCTTextInputTextWithinLength(
        text,
        (NSInteger)props.maxLength - (NSInteger)_backedTextInputView.attributedText.string.length -
            _lengthBeingRestored + (NSInteger)range.length);
  }

  if (range.location < NSMaxRange(_rangeBeingRestored)) {
    // UIKit delivers this key inside the edit that puts keys back, before it applies, and it edits text before the
    // end of the range that edit replaces (a backspace): the edit would then replace other text. The key is dropped.
    return nil;
  }
  if (_textBeforeUpdateFromJS != nil) {
    // UIKit delivers this key during a write from JS: see -textInputDidChange.
    _keyTypedDuringUpdateFromJS = YES;
  }
  return allowedText;
}

- (BOOL)textInputShouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
  return YES;
}

- (void)textInputDidChange
{
  if (_comingFromJS) {
    // The change a key made during a write from JS (see `_textBeforeUpdateFromJS`). Other changes reported during the
    // write are the write's own: a text view reports the text JS wrote.
    if (_keyTypedDuringUpdateFromJS) {
      _keyTypedDuringUpdateFromJS = NO;
      _textTypedDuringUpdateFromJS = [_backedTextInputView.attributedText.string copy];
      _selectionTypedDuringUpdateFromJS = [self _selectionRange];
      _markedTextDuringUpdateFromJS = _markedTextDuringUpdateFromJS || _backedTextInputView.markedTextRange != nil;
    }
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
  if (props.multiline && ![_lastStringStateWasUpdatedWith isEqual:_backedTextInputView.attributedText]) {
    [self textInputDidChange];
    _ignoreNextTextInputCall = YES;
  }

  if (_eventEmitter) {
    static_cast<const TextInputEventEmitter &>(*_eventEmitter).onSelectionChange([self _textInputMetrics]);
  }
}

#pragma mark - RCTBackedTextInputDelegate (UIScrollViewDelegate)

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  if (_eventEmitter) {
    auto metrics = [self _textInputMetrics];
    metrics.responderIgnoreScroll = !(scrollView.isDragging || scrollView.isDecelerating);
    static_cast<const TextInputEventEmitter &>(*_eventEmitter).onScroll(metrics);
  }
}

#pragma mark - Native Commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTTextInputHandleCommand(self, commandName, args);
}

#if TARGET_OS_TV
- (UIView *)viewToFocus
{
  return _backedTextInputView;
}
#endif

- (void)focus
{
#if TARGET_OS_TV
  [super focus];
#else
  [_backedTextInputView becomeFirstResponder];
#endif

  const auto &props = static_cast<const TextInputProps &>(*_props);

  if (props.traits.clearTextOnFocus) {
    _backedTextInputView.attributedText = nil;
    [self textInputDidChange];
  }

  if (props.traits.selectTextOnFocus) {
    [_backedTextInputView selectAll:nil];
    [self textInputDidChangeSelection];
  }

  [self scrollCursorIntoView];
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
  NSString *textBeforeUpdate = [self _beginUpdateFromJS];
  NSString *writtenText = nil;
  if (value && ![value isEqualToString:_backedTextInputView.attributedText.string]) {
    NSAttributedString *attributedString =
        [[NSAttributedString alloc] initWithString:value attributes:_backedTextInputView.defaultTextAttributes];
    [self _setAttributedString:attributedString];
    [self _updateState];
    writtenText = attributedString.string;
  }

  UITextPosition *startPosition = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                      offset:start];
  UITextPosition *endPosition = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                                    offset:end];

  if (startPosition && endPosition) {
    UITextRange *range = [_backedTextInputView textRangeFromPosition:startPosition toPosition:endPosition];
    [_backedTextInputView setSelectedTextRange:range notifyDelegate:NO];
    // ensure we scroll to the selected position
    NSInteger offsetEnd = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                        toPosition:range.end];
    [_backedTextInputView scrollRangeToVisible:NSMakeRange(offsetEnd, 0)];
  }
  _comingFromJS = NO;
  // A controlled `value` that JS changed (e.g. a transform in onChangeText) is written here: put back the keys UIKit
  // delivered during the write, keeping JS's selection.
  if (writtenText != nil) {
    [self _restoreTextTypedDuringUpdateFromJS:textBeforeUpdate writtenText:writtenText];
  } else {
    [self _endUpdateFromJS];
  }
}

#pragma mark - Default input accessory view

- (NSString *)returnKeyTypeToString:(UIReturnKeyType)returnKeyType
{
  switch (returnKeyType) {
    case UIReturnKeyGo:
      return RCTLocalizedString("Go", "keyboard return key button label for go action");
    case UIReturnKeyNext:
      return RCTLocalizedString("Next", "keyboard return key button label for next action");
    case UIReturnKeySearch:
      return RCTLocalizedString("Search", "keyboard return key button label for search action");
    case UIReturnKeySend:
      return RCTLocalizedString("Send", "keyboard return key button label for send action");
    case UIReturnKeyYahoo:
      return RCTLocalizedString("Yahoo", "keyboard return key button label for Yahoo");
    case UIReturnKeyGoogle:
      return RCTLocalizedString("Google", "keyboard return key button label for Google");
    case UIReturnKeyRoute:
      return RCTLocalizedString("Route", "keyboard return key button label for route action");
    case UIReturnKeyJoin:
      return RCTLocalizedString("Join", "keyboard return key button label for join action");
    case UIReturnKeyEmergencyCall:
      return RCTLocalizedString("Emergency Call", "keyboard return key button label for emergency call action");
    default:
      return RCTLocalizedString("Done", "keyboard return key button label for done action");
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
  NSString *inputAccessoryViewButtonLabel = _backedTextInputView.inputAccessoryViewButtonLabel;

  BOOL containsKeyType = [returnKeyTypesSet containsObject:@(returnKeyType)];
  BOOL containsInputAccessoryViewButtonLabel = inputAccessoryViewButtonLabel != nil;

  // These keyboard types (all are number pads) don't have a "returnKey" button by default,
  // so we create an `inputAccessoryView` with this button for them.
  BOOL shouldHaveInputAccessoryView =
      (keyboardType == UIKeyboardTypeNumberPad || keyboardType == UIKeyboardTypePhonePad ||
       keyboardType == UIKeyboardTypeDecimalPad || keyboardType == UIKeyboardTypeASCIICapableNumberPad) &&
      (containsKeyType || containsInputAccessoryViewButtonLabel);

  if (_hasInputAccessoryView == shouldHaveInputAccessoryView) {
    return;
  }

  _hasInputAccessoryView = shouldHaveInputAccessoryView;

#if !TARGET_OS_TV
  if (shouldHaveInputAccessoryView) {
    NSString *buttonLabel = inputAccessoryViewButtonLabel != nil ? inputAccessoryViewButtonLabel
                                                                 : [self returnKeyTypeToString:returnKeyType];

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
#endif

  if (_backedTextInputView.isFirstResponder) {
    [_backedTextInputView reloadInputViews];
  }
}

- (void)handleInputAccessoryDoneButton
{
  // Ignore the value of whether we submitted; just make sure the submit event is called if necessary.
  [self textInputShouldSubmitOnReturn];
  if ([self textInputShouldReturn]) {
    [_backedTextInputView endEditing:YES];
  }
}

#pragma mark - Other

- (TextInputEventEmitter::Metrics)_textInputMetrics
{
  return {
      .text = RCTStringFromNSString(_backedTextInputView.attributedText.string),
      .selectionRange = [self _selectionRange],
      .contentSize = RCTSizeFromCGSize(_backedTextInputView.contentSize),
      .contentOffset = RCTPointFromCGPoint(_backedTextInputView.contentOffset),
      .contentInset = RCTEdgeInsetsFromUIEdgeInsets(_backedTextInputView.contentInset),
      .eventCount = static_cast<int>(_mostRecentEventCount),
      .layoutMeasurement = RCTSizeFromCGSize(_backedTextInputView.bounds.size),
      .zoomScale = _backedTextInputView.zoomScale,
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
  UITextRange *selectedTextRange = _backedTextInputView.selectedTextRange;
  NSInteger start = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                  toPosition:selectedTextRange.start];
  NSInteger end = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                toPosition:selectedTextRange.end];
  return AttributedString::Range{.location = (int)start, .length = (int)(end - start)};
}

- (void)_restoreTextSelection
{
  [self _restoreTextSelectionAndIgnoreCaretChange:NO];
}

- (void)_restoreTextSelectionAndIgnoreCaretChange:(BOOL)ignore
{
  const auto &selection = static_cast<const TextInputProps &>(*_props).selection;
  if (!selection.has_value()) {
    return;
  }
  auto start = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument
                                                   offset:selection->start];
  auto end = [_backedTextInputView positionFromPosition:_backedTextInputView.beginningOfDocument offset:selection->end];
  auto range = [_backedTextInputView textRangeFromPosition:start toPosition:end];
  if (ignore && range.empty) {
    return;
  }
  [_backedTextInputView setSelectedTextRange:range notifyDelegate:YES];
}

- (void)_setAttributedString:(NSAttributedString *)attributedString
{
  if ([self _textOf:attributedString equals:_backedTextInputView.attributedText]) {
    return;
  }
  UITextRange *selectedRange = _backedTextInputView.selectedTextRange;
  NSInteger oldTextLength = _backedTextInputView.attributedText.string.length;
  _backedTextInputView.attributedText = attributedString;
  // Updating the UITextView attributedText, for example changing the lineHeight, the color or adding
  // a new paragraph with \n, causes the cursor to move to the end of the Text and scroll.
  // This is fixed by restoring the cursor position and scrolling to that position (iOS issue 652653).
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

  // A zero-length selection range can cause the caret position to change on iOS,
  // and we have already updated the caret position, so we can safely ignore caret changing in this place.
  [self _restoreTextSelectionAndIgnoreCaretChange:YES];
  [self _updateTypingAttributes];
  _lastStringStateWasUpdatedWith = attributedString;
}

// Ensure that newly typed text will inherit any custom attributes. We follow the logic of RN Android, where attributes
// to the left of the cursor are copied into new text, unless we are at the start of the field, in which case we will
// copy the attributes from text to the right. This allows consistency between backed input and new AttributedText
// https://github.com/facebook/react-native/blob/3102a58df38d96f3dacef0530e4dbb399037fcd2/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/text/internal/span/SetSpanOperation.kt#L30
- (void)_updateTypingAttributes
{
  if (_backedTextInputView.attributedText.length > 0 && _backedTextInputView.selectedTextRange != nil) {
    NSUInteger offsetStart = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                           toPosition:_backedTextInputView.selectedTextRange.start];
    [self _updateTypingAttributesSampledAt:offsetStart];
  }
}

// The typing attributes for text inserted at `offset`: the attributes of the character before it, or after it at the
// start of the field. Used for the caret (-_updateTypingAttributes) and for keys put back after a write from JS.
- (void)_updateTypingAttributesSampledAt:(NSUInteger)offset
{
  if (_backedTextInputView.attributedText.length > 0) {
    NSUInteger samplePoint = offset == 0 ? 0 : offset - 1;
    _backedTextInputView.typingAttributes = [_backedTextInputView.attributedText attributesAtIndex:samplePoint
                                                                                    effectiveRange:NULL];
  }
}

- (void)scrollCursorIntoView
{
  UITextRange *selectedRange = _backedTextInputView.selectedTextRange;
  if (selectedRange.empty) {
    NSInteger offsetStart = [_backedTextInputView offsetFromPosition:_backedTextInputView.beginningOfDocument
                                                          toPosition:selectedRange.start];
    [_backedTextInputView scrollRangeToVisible:NSMakeRange(offsetStart, 0)];
  }
}

- (void)_setMultiline:(BOOL)multiline
{
  [_backedTextInputView removeFromSuperview];
  UIView<RCTBackedTextInputViewProtocol> *backedTextInputView = multiline ? [RCTUITextView new] : [RCTUITextField new];
  backedTextInputView.frame = _backedTextInputView.frame;
  RCTCopyBackedTextInput(_backedTextInputView, backedTextInputView);
  _backedTextInputView = backedTextInputView;
  [self addSubview:_backedTextInputView];
}

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
      [_backedTextInputView.textInputMode.primaryLanguage isEqualToString:@"dictation"] ||
      [_backedTextInputView.textInputMode.primaryLanguage isEqualToString:@"ko-KR"] ||
      _backedTextInputView.markedTextRange || _backedTextInputView.isSecureTextEntry || fontHasBeenUpdatedBySystem;

  if (shouldFallbackToBareTextComparison) {
    return [newText.string isEqualToString:oldText.string];
  } else {
    // Typed text carries attributes a state built from props (a controlled `value`) does not: the input's
    // `defaultTextAttributes` (the first character typed into an empty field also gets their background color and
    // event emitter) and a paragraph style, which is UIKit's default one or the one in its initial typing attributes
    // (another line break strategy). Both are accepted.
    const auto &props = static_cast<const TextInputProps &>(*_props);
    NSMutableDictionary<NSAttributedStringKey, id> *defaultAttributes =
        [_originalTypingAttributes mutableCopy] ?: [NSMutableDictionary new];
    [defaultAttributes addEntriesFromDictionary:_backedTextInputView.defaultTextAttributes];
    defaultAttributes[NSParagraphStyleAttributeName] =
        _backedTextInputView.defaultTextAttributes[NSParagraphStyleAttributeName]
        ?: NSParagraphStyle.defaultParagraphStyle;
    return RCTIsAttributedStringEffectivelySame(
               newText, oldText, defaultAttributes, props.textAttributes, !props.multiline) ||
        RCTIsAttributedStringEffectivelySame(
               newText, oldText, _originalTypingAttributes, props.textAttributes, !props.multiline);
  }
}

- (SubmitBehavior)getSubmitBehavior
{
  const auto &props = static_cast<const TextInputProps &>(*_props);
  return props.getNonDefaultSubmitBehavior();
}

@end

Class<RCTComponentViewProtocol> RCTTextInputCls(void)
{
  return RCTTextInputComponentView.class;
}
