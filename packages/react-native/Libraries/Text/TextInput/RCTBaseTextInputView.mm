/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBaseTextInputView.h>

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTScrollView.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>

#import <React/RCTViewKeyboardEvent.h> // [macOS]
#import <React/RCTInputAccessoryView.h>
#import <React/RCTInputAccessoryViewContent.h>
#import <React/RCTTextAttributes.h>
#import <React/RCTTextSelection.h>
#import <React/RCTUITextView.h> // [macOS]
#import "../RCTTextUIKit.h" // [macOS]
#import <React/RCTHandledKey.h> // [macOS]

/** Native iOS text field bottom keyboard offset amount */
static const CGFloat kSingleLineKeyboardBottomOffset = 15.0;

@implementation RCTBaseTextInputView {
  __weak RCTBridge *_bridge;
  __weak id<RCTEventDispatcherProtocol> _eventDispatcher;

  NSInteger _ghostTextPosition; // [macOS] only valid if _ghostText != nil

  BOOL _hasInputAccessoryView;
  // [macOS] remove explicit _predictedText ivar declaration
  BOOL _didMoveToWindow;
}

#if !TARGET_OS_OSX // [macOS]
- (void)reactUpdateResponderOffsetForScrollView:(RCTScrollView *)scrollView
{
  if (![self isDescendantOfView:scrollView]) {
    // View is outside scroll view
    return;
  }

  UITextRange *selectedTextRange = self.backedTextInputView.selectedTextRange;
  UITextSelectionRect *selection = [self.backedTextInputView selectionRectsForRange:selectedTextRange].firstObject;
  CGRect focusRect;
  if (selection == nil) {
    // No active selection or caret - fallback to entire input frame
    focusRect = self.bounds;
  } else {
    // Focus on text selection frame
    focusRect = selection.rect;
    BOOL isMultiline = [self.backedTextInputView isKindOfClass:[UITextView class]];
    if (!isMultiline) {
      focusRect.size.height += kSingleLineKeyboardBottomOffset;
    }
  }
  scrollView.firstResponderFocus = [self convertRect:focusRect toView:nil];
}
#endif // [macOS]

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  RCTAssertParam(bridge);

  if (self = [super initWithEventDispatcher:bridge.eventDispatcher]) { // [macOS]
    _bridge = bridge;
    _eventDispatcher = bridge.eventDispatcher;
  }

  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)init)
RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)decoder)


- (RCTUIView<RCTBackedTextInputViewProtocol> *)backedTextInputView // [macOS]
{
  RCTAssert(NO, @"-[RCTBaseTextInputView backedTextInputView] must be implemented in subclass.");
  return nil;
}

#pragma mark - RCTComponent

- (void)didUpdateReactSubviews
{
  // Do nothing.
}

#pragma mark - Properties

- (void)setTextAttributes:(RCTTextAttributes *)textAttributes
{
  _textAttributes = textAttributes;
  [self enforceTextAttributesIfNeeded];
}

- (void)enforceTextAttributesIfNeeded
{
  if (![self ignoresTextAttributes]) { // [macOS]
    id<RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;

  NSDictionary<NSAttributedStringKey, id> *textAttributes = [[_textAttributes effectiveTextAttributes] mutableCopy];
  if ([textAttributes valueForKey:NSForegroundColorAttributeName] == nil) {
    [textAttributes setValue:[RCTUIColor blackColor] forKey:NSForegroundColorAttributeName]; // [macOS]
  }

    backedTextInputView.defaultTextAttributes = textAttributes;
  } // [macOS]
}

- (void)setReactPaddingInsets:(UIEdgeInsets)reactPaddingInsets
{
  _reactPaddingInsets = reactPaddingInsets;
#if !TARGET_OS_OSX // [macOS]
  // We apply `paddingInsets` as `backedTextInputView`'s `textContainerInset`.
  self.backedTextInputView.textContainerInset = reactPaddingInsets;
  [self setNeedsLayout];
#endif // [macOS]
}

- (void)setReactBorderInsets:(UIEdgeInsets)reactBorderInsets
{
  _reactBorderInsets = reactBorderInsets;
#if !TARGET_OS_OSX // [macOS]
  // We apply `borderInsets` as `backedTextInputView` layout offset.
  self.backedTextInputView.frame = UIEdgeInsetsInsetRect(self.bounds, reactBorderInsets);
  [self setNeedsLayout];
#endif // [macOS]
}

- (NSAttributedString *)attributedText
{
  return self.backedTextInputView.attributedText;
}

- (BOOL)textOf:(NSAttributedString *)newText equals:(NSAttributedString *)oldText
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

#if !TARGET_OS_OSX // [macOS]
  BOOL shouldFallbackDictation = [self.backedTextInputView.textInputMode.primaryLanguage isEqualToString:@"dictation"];
  if (@available(iOS 16.0, *)) {
    shouldFallbackDictation = self.backedTextInputView.dictationRecognizing;
  }

  BOOL shouldFallbackToBareTextComparison = shouldFallbackDictation ||
      [self.backedTextInputView.textInputMode.primaryLanguage isEqualToString:@"ko-KR"] ||
      self.backedTextInputView.markedTextRange || self.backedTextInputView.isSecureTextEntry ||
#else // [macOS
  BOOL shouldFallbackToBareTextComparison =
    // There are multiple Korean input sources (2-Set, 3-Set, etc). Check substring instead instead
    [[[self.backedTextInputView inputContext] selectedKeyboardInputSource] containsString:@"com.apple.inputmethod.Korean"] ||
    [self.backedTextInputView hasMarkedText] || [self.backedTextInputView isKindOfClass:[NSSecureTextField class]] ||
#endif // macOS]
      fontHasBeenUpdatedBySystem;

  if (shouldFallbackToBareTextComparison) {
    return ([newText.string isEqualToString:oldText.string]);
  } else {
    return ([newText isEqualToAttributedString:oldText]);
  }
}

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  BOOL textNeedsUpdate = NO;
  // Remove tag attribute to ensure correct attributed string comparison.
  NSMutableAttributedString *const backedTextInputViewTextCopy = [self.backedTextInputView.attributedText mutableCopy];
  NSMutableAttributedString *const attributedTextCopy = [attributedText mutableCopy] ?: [NSMutableAttributedString new];

  [backedTextInputViewTextCopy removeAttribute:RCTTextAttributesTagAttributeName
                                         range:NSMakeRange(0, backedTextInputViewTextCopy.length)];

  [attributedTextCopy removeAttribute:RCTTextAttributesTagAttributeName
                                range:NSMakeRange(0, attributedTextCopy.length)];

  textNeedsUpdate = ([self textOf:attributedTextCopy equals:backedTextInputViewTextCopy] == NO);

  if ((eventLag == 0 || self.backedTextInputView.ghostTextChanging) && textNeedsUpdate) { // [macOS]
#if !TARGET_OS_OSX // [macOS]
    UITextRange *selection = self.backedTextInputView.selectedTextRange;
#else // [macOS
    NSRange selection = [self.backedTextInputView selectedTextRange];
#endif // macOS]
    NSAttributedString *oldAttributedText = [self.backedTextInputView.attributedText copy];
    NSInteger oldTextLength = oldAttributedText.string.length;

    // Ghost text changes should not be part of the undo stack
    if (!self.backedTextInputView.ghostTextChanging) {
      // If there was ghost text previously, we don't want it showing up if we undo.
      // If something goes wrong when trying to remove it, just stick with oldAttributedText.
      NSAttributedString *oldAttributedTextWithoutGhostText = [self removingGhostTextFromString:oldAttributedText strict:YES] ?: oldAttributedText;
      [self.backedTextInputView.undoManager registerUndoWithTarget:self handler:^(RCTBaseTextInputView *strongSelf) {
        strongSelf.attributedText = oldAttributedTextWithoutGhostText;
        [strongSelf textInputDidChange];
      }];
    }

    self.backedTextInputView.attributedText = attributedText;

#if !TARGET_OS_OSX // [macOS]
    if (selection.empty) {
      // Maintaining a cursor position relative to the end of the old text.
      NSInteger offsetStart = [self.backedTextInputView offsetFromPosition:self.backedTextInputView.beginningOfDocument
                                                                toPosition:selection.start];
      NSInteger offsetFromEnd = oldTextLength - offsetStart;
      NSInteger newOffset = attributedText.string.length - offsetFromEnd;
      UITextPosition *position =
          [self.backedTextInputView positionFromPosition:self.backedTextInputView.beginningOfDocument offset:newOffset];
      [self.backedTextInputView setSelectedTextRange:[self.backedTextInputView textRangeFromPosition:position
                                                                                          toPosition:position]
                                      notifyDelegate:!self.backedTextInputView.ghostTextChanging]; // [macOS]
    }
#else // [macOS
    if (selection.length == 0) {
      // Maintaining a cursor position relative to the end of the old text.
      NSInteger start = selection.location;
      NSInteger offsetFromEnd = oldTextLength - start;
      NSInteger newOffset = self.backedTextInputView.attributedText.length - offsetFromEnd;
      [self.backedTextInputView setSelectedTextRange:NSMakeRange(newOffset, 0)
                                      notifyDelegate:!self.backedTextInputView.ghostTextChanging];
    }
#endif // macOS]

    [self updateLocalData];
  } else if (eventLag > RCTTextUpdateLagWarningThreshold) {
    RCTLog(
        @"Native TextInput(%@) is %lld events ahead of JS - try to make your JS faster.",
        self.backedTextInputView.attributedText.string,
        (long long)eventLag);
  }
}

- (RCTTextSelection *)selection
{
  id<RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;
#if !TARGET_OS_OSX // [macOS]
  UITextRange *selectedTextRange = backedTextInputView.selectedTextRange;
  return [[RCTTextSelection new]
      initWithStart:[backedTextInputView offsetFromPosition:backedTextInputView.beginningOfDocument
                                                 toPosition:selectedTextRange.start]
                end:[backedTextInputView offsetFromPosition:backedTextInputView.beginningOfDocument
                                                 toPosition:selectedTextRange.end]];
#else // [macOS
  NSRange selectedTextRange = backedTextInputView.selectedTextRange;
  return [[RCTTextSelection new] initWithStart:selectedTextRange.location
                                           end:selectedTextRange.location + selectedTextRange.length];
#endif // macOS]
}

- (void)setSelection:(RCTTextSelection *)selection
{
  if (!selection) {
    return;
  }

  id<RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;

#if !TARGET_OS_OSX // [macOS]
  UITextRange *previousSelectedTextRange = backedTextInputView.selectedTextRange;
  UITextPosition *start = [backedTextInputView positionFromPosition:backedTextInputView.beginningOfDocument
                                                             offset:selection.start];
  UITextPosition *end = [backedTextInputView positionFromPosition:backedTextInputView.beginningOfDocument
                                                           offset:selection.end];
  UITextRange *selectedTextRange = [backedTextInputView textRangeFromPosition:start toPosition:end];
#else // [macOS
  NSRange previousSelectedTextRange = backedTextInputView.selectedTextRange;
  NSInteger start = MIN(selection.start, selection.end);
  NSInteger end = MAX(selection.start, selection.end);
  NSInteger length = end - selection.start;
  NSRange selectedTextRange = NSMakeRange(start, length);
#endif // macOS]
  
  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && !RCTTextSelectionEqual(previousSelectedTextRange, selectedTextRange)) { // [macOS]
    [backedTextInputView setSelectedTextRange:selectedTextRange notifyDelegate:NO];
  } else if (eventLag > RCTTextUpdateLagWarningThreshold) {
    RCTLog(
        @"Native TextInput(%@) is %lld events ahead of JS - try to make your JS faster.",
        backedTextInputView.attributedText.string,
        (long long)eventLag);
  }
}

- (void)setSelectionStart:(NSInteger)start selectionEnd:(NSInteger)end
{
#if !TARGET_OS_OSX // [macOS]
  UITextPosition *startPosition =
      [self.backedTextInputView positionFromPosition:self.backedTextInputView.beginningOfDocument offset:start];
  UITextPosition *endPosition =
      [self.backedTextInputView positionFromPosition:self.backedTextInputView.beginningOfDocument offset:end];
  if (startPosition && endPosition) {
    UITextRange *range = [self.backedTextInputView textRangeFromPosition:startPosition toPosition:endPosition];
    [self.backedTextInputView setSelectedTextRange:range notifyDelegate:NO];
  }
#else // [macOS
  NSInteger startPosition = MIN(start, end);
  NSInteger endPosition = MAX(start, end);
  [self.backedTextInputView setSelectedTextRange:NSMakeRange(startPosition, endPosition - startPosition) notifyDelegate:NO];
#endif // macOS]
}

- (void)setTextContentType:(NSString *)type
{
#if !TARGET_OS_OSX // [macOS]
  static dispatch_once_t onceToken;
  static NSDictionary<NSString *, NSString *> *contentTypeMap;

  dispatch_once(&onceToken, ^{
    NSMutableDictionary<NSString *, NSString *> *mutableContentTypeMap = [NSMutableDictionary new];
    [mutableContentTypeMap addEntriesFromDictionary:@{
      @"none" : @"",
      @"URL" : UITextContentTypeURL,
      @"addressCity" : UITextContentTypeAddressCity,
      @"addressCityAndState" : UITextContentTypeAddressCityAndState,
      @"addressState" : UITextContentTypeAddressState,
      @"countryName" : UITextContentTypeCountryName,
      @"creditCardNumber" : UITextContentTypeCreditCardNumber,
      @"emailAddress" : UITextContentTypeEmailAddress,
      @"familyName" : UITextContentTypeFamilyName,
      @"fullStreetAddress" : UITextContentTypeFullStreetAddress,
      @"givenName" : UITextContentTypeGivenName,
      @"jobTitle" : UITextContentTypeJobTitle,
      @"location" : UITextContentTypeLocation,
      @"middleName" : UITextContentTypeMiddleName,
      @"name" : UITextContentTypeName,
      @"namePrefix" : UITextContentTypeNamePrefix,
      @"nameSuffix" : UITextContentTypeNameSuffix,
      @"nickname" : UITextContentTypeNickname,
      @"organizationName" : UITextContentTypeOrganizationName,
      @"postalCode" : UITextContentTypePostalCode,
      @"streetAddressLine1" : UITextContentTypeStreetAddressLine1,
      @"streetAddressLine2" : UITextContentTypeStreetAddressLine2,
      @"sublocality" : UITextContentTypeSublocality,
      @"telephoneNumber" : UITextContentTypeTelephoneNumber,
      @"username" : UITextContentTypeUsername,
      @"password" : UITextContentTypePassword,
      @"newPassword" : UITextContentTypeNewPassword,
      @"oneTimeCode" : UITextContentTypeOneTimeCode,
    }];

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 170000 /* __IPHONE_17_0 */
    if (@available(iOS 17.0, *)) {
      [mutableContentTypeMap addEntriesFromDictionary:@{
        @"creditCardExpiration" : UITextContentTypeCreditCardExpiration,
        @"creditCardExpirationMonth" : UITextContentTypeCreditCardExpirationMonth,
        @"creditCardExpirationYear" : UITextContentTypeCreditCardExpirationYear,
        @"creditCardSecurityCode" : UITextContentTypeCreditCardSecurityCode,
        @"creditCardType" : UITextContentTypeCreditCardType,
        @"creditCardName" : UITextContentTypeCreditCardName,
        @"creditCardGivenName" : UITextContentTypeCreditCardGivenName,
        @"creditCardMiddleName" : UITextContentTypeCreditCardMiddleName,
        @"creditCardFamilyName" : UITextContentTypeCreditCardFamilyName,
        @"birthdate" : UITextContentTypeBirthdate,
        @"birthdateDay" : UITextContentTypeBirthdateDay,
        @"birthdateMonth" : UITextContentTypeBirthdateMonth,
        @"birthdateYear" : UITextContentTypeBirthdateYear,
      }];
    }
#endif

    contentTypeMap = mutableContentTypeMap;
  });

  // Setting textContentType to an empty string will disable any
  // default behaviour, like the autofill bar for password inputs
  self.backedTextInputView.textContentType = contentTypeMap[type] ?: type;
#endif // [macOS]
}

#if !TARGET_OS_OSX // [macOS]
- (void)setPasswordRules:(NSString *)descriptor
{
  self.backedTextInputView.passwordRules = [UITextInputPasswordRules passwordRulesWithDescriptor:descriptor];
}

- (UIKeyboardType)keyboardType
{
  return self.backedTextInputView.keyboardType;
}

- (void)setKeyboardType:(UIKeyboardType)keyboardType
{
  UIView<RCTBackedTextInputViewProtocol> *textInputView = self.backedTextInputView;
  if (textInputView.keyboardType != keyboardType) {
    textInputView.keyboardType = keyboardType;
    // Without the call to reloadInputViews, the keyboard will not change until the textview field (the first responder)
    // loses and regains focus.
    if (textInputView.isFirstResponder) {
      [textInputView reloadInputViews];
    }
  }
}

- (void)setShowSoftInputOnFocus:(BOOL)showSoftInputOnFocus
{
  (void)_showSoftInputOnFocus;
  if (showSoftInputOnFocus) {
    // Resets to default keyboard.
    self.backedTextInputView.inputView = nil;

    // Without the call to reloadInputViews, the keyboard will not change until the textInput field (the first
    // responder) loses and regains focus.
    if (self.backedTextInputView.isFirstResponder) {
      [self.backedTextInputView reloadInputViews];
    }
  } else {
    // Hides keyboard, but keeps blinking cursor.
    self.backedTextInputView.inputView = [UIView new];
  }
}
#endif // [macOS]

#pragma mark - RCTBackedTextInputDelegate

- (BOOL)textInputShouldBeginEditing
{
  return YES;
}

- (void)textInputDidBeginEditing
{
  if (_clearTextOnFocus) {
    self.backedTextInputView.attributedText = [NSAttributedString new];
  }

  if (_selectTextOnFocus) {
    if ([self.backedTextInputView respondsToSelector:@selector(selectAll:)]) {
      [self.backedTextInputView selectAll:nil];
    }
#if TARGET_OS_OSX // [macOS
  } else {
    [self.backedTextInputView setSelectedTextRange:NSMakeRange(NSNotFound, 0) notifyDelegate:NO];
#endif // macOS]
  }

  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeFocus
                                 reactTag:self.reactTag
                                     text:[self.backedTextInputView.attributedText.string copy]
                                      key:nil
                               eventCount:_nativeEventCount];
}

- (BOOL)textInputShouldEndEditing
{
  return YES;
}

- (void)textInputDidEndEditing
{
  self.ghostText = nil; // [macOS]

  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeEnd
                                 reactTag:self.reactTag
                                     text:[self.backedTextInputView.attributedText.string copy]
                                      key:nil
                               eventCount:_nativeEventCount];

  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeBlur
                                 reactTag:self.reactTag
                                     text:[self.backedTextInputView.attributedText.string copy]
                                      key:nil
                               eventCount:_nativeEventCount];
}

#if TARGET_OS_OSX // [macOS
- (void)automaticSpellingCorrectionDidChange:(BOOL)enabled
{
  if (_onAutoCorrectChange) {
    _onAutoCorrectChange(@{@"enabled": [NSNumber numberWithBool:enabled]});
  }
}

- (void)continuousSpellCheckingDidChange:(BOOL)enabled
{
  if (_onSpellCheckChange) {
    _onSpellCheckChange(@{@"enabled": [NSNumber numberWithBool:enabled]});
  }
}

- (void)grammarCheckingDidChange:(BOOL)enabled
{
  if (_onGrammarCheckChange) {
    _onGrammarCheckChange(@{@"enabled": [NSNumber numberWithBool:enabled]});
  }
}

- (void)submitOnKeyDownIfNeeded:(NSEvent *)event
{
  NSDictionary *currentKeyboardEvent = [RCTViewKeyboardEvent bodyFromEvent:event];
  // Enter is the default clearTextOnSubmit key
  BOOL shouldSubmit = NO;
  if (!_submitKeyEvents) {
    shouldSubmit = [currentKeyboardEvent[@"key"] isEqualToString:@"Enter"]
      && ![currentKeyboardEvent[@"altKey"] boolValue]
      && ![currentKeyboardEvent[@"shiftKey"] boolValue]
      && ![currentKeyboardEvent[@"ctrlKey"] boolValue]
      && ![currentKeyboardEvent[@"metaKey"] boolValue]
      && ![currentKeyboardEvent[@"functionKey"] boolValue]; // Default clearTextOnSubmit key
  } else {
    for (NSDictionary *submitKeyEvent in _submitKeyEvents) {
      if (
        [submitKeyEvent[@"key"] isEqualToString:currentKeyboardEvent[@"key"]] &&
        [submitKeyEvent[@"altKey"] boolValue] == [currentKeyboardEvent[@"altKey"] boolValue] &&
        [submitKeyEvent[@"shiftKey"] boolValue] == [currentKeyboardEvent[@"shiftKey"] boolValue] &&
        [submitKeyEvent[@"ctrlKey"] boolValue]== [currentKeyboardEvent[@"ctrlKey"] boolValue] &&
        [submitKeyEvent[@"metaKey"] boolValue]== [currentKeyboardEvent[@"metaKey"] boolValue] &&
        [submitKeyEvent[@"functionKey"] boolValue]== [currentKeyboardEvent[@"functionKey"] boolValue]
      ) {
        shouldSubmit = YES;
        break;
      }
    }
  }
  
  if (shouldSubmit) {
    if (_onSubmitEditing) {
      _onSubmitEditing(@{});
    }

    if (_clearTextOnSubmit) {
      self.backedTextInputView.attributedText = [NSAttributedString new];
      [self.backedTextInputView.textInputDelegate textInputDidChange];
    }
  }
}
#endif // macOS]

- (BOOL)textInputShouldSubmitOnReturn
{
  const BOOL shouldSubmit =
      [_submitBehavior isEqualToString:@"blurAndSubmit"] || [_submitBehavior isEqualToString:@"submit"];
  if (shouldSubmit) {
    // We send `submit` event here, in `textInputShouldSubmit`
    // (not in `textInputDidReturn)`, because of semantic of the event:
    // `onSubmitEditing` is called when "Submit" button
    // (the blue key on onscreen keyboard) did pressed
    // (no connection to any specific "submitting" process).
    [_eventDispatcher sendTextEventWithType:RCTTextEventTypeSubmit
                                   reactTag:self.reactTag
                                       text:[self.backedTextInputView.attributedText.string copy]
                                        key:nil
                                 eventCount:_nativeEventCount];
  }
  return shouldSubmit;
}

- (BOOL)textInputShouldReturn
{
  return [_submitBehavior isEqualToString:@"blurAndSubmit"];
}

- (void)textInputDidReturn
{
  // Does nothing.
}

- (NSString *)textInputShouldChangeText:(NSString *)text inRange:(NSRange)range
{
  id<RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;

  self.ghostText = nil; // [macOS]

  if (!backedTextInputView.textWasPasted) {
    [_eventDispatcher sendTextEventWithType:RCTTextEventTypeKeyPress
                                   reactTag:self.reactTag
                                       text:nil
                                        key:text
                                 eventCount:_nativeEventCount];
  }

  if (_maxLength) {
    NSInteger allowedLength = MAX(
        _maxLength.integerValue - (NSInteger)backedTextInputView.attributedText.string.length + (NSInteger)range.length,
        0);

    if (text.length > allowedLength) {
      // If we typed/pasted more than one character, limit the text inputted.
      if (text.length > 1) {
        if (allowedLength > 0) {
          // make sure unicode characters that are longer than 16 bits (such as emojis) are not cut off
          NSRange cutOffCharacterRange = [text rangeOfComposedCharacterSequenceAtIndex:allowedLength - 1];
          if (cutOffCharacterRange.location + cutOffCharacterRange.length > allowedLength) {
            // the character at the length limit takes more than 16bits, truncation should end at the character before
            allowedLength = cutOffCharacterRange.location;
          }
        }
        // Truncate the input string so the result is exactly maxLength
        NSString *limitedString = [text substringToIndex:allowedLength];
        NSMutableAttributedString *newAttributedText = [backedTextInputView.attributedText mutableCopy];
        // Apply text attributes if original input view doesn't have text.
        if (backedTextInputView.attributedText.length == 0) {
          newAttributedText = [[NSMutableAttributedString alloc]
              initWithString:[self.textAttributes applyTextAttributesToText:limitedString]
                  attributes:self.textAttributes.effectiveTextAttributes];
        } else {
          [newAttributedText replaceCharactersInRange:range withString:limitedString];
        }
        backedTextInputView.attributedText = newAttributedText;
        [self setPredictedText:newAttributedText.string]; // [macOS]

        // Collapse selection at end of insert to match normal paste behavior.
#if !TARGET_OS_OSX // [macOS]
        UITextPosition *insertEnd = [backedTextInputView positionFromPosition:backedTextInputView.beginningOfDocument
                                                                       offset:(range.location + allowedLength)];
        [backedTextInputView setSelectedTextRange:[backedTextInputView textRangeFromPosition:insertEnd
                                                                                  toPosition:insertEnd]
                                   notifyDelegate:YES];
#else // [macOS
        [backedTextInputView setSelectedTextRange:NSMakeRange(range.location + allowedLength, 0)
                                   notifyDelegate:YES];
#endif // macOS]
        
        [self textInputDidChange];
      }

      return nil; // Rejecting the change.
    }
  }

  NSString *previousText = [backedTextInputView.attributedText.string copy] ?: @"";

  if (range.location + range.length > backedTextInputView.attributedText.string.length) {
    _predictedText = backedTextInputView.attributedText.string;
  } else if (text != nil) {
    _predictedText = [backedTextInputView.attributedText.string stringByReplacingCharactersInRange:range
                                                                                        withString:text];
  }

  if (_onTextInput && !self.backedTextInputView.ghostTextChanging) { // [macOS]
    _onTextInput(@{
      // We copy the string here because if it's a mutable string it may get released before we stop using it on a
      // different thread, causing a crash.
      @"text" : [text copy] ?: @"", // [macOS] fall back to empty string if text is nil
      @"previousText" : previousText,
      @"range" : @{@"start" : @(range.location), @"end" : @(range.location + range.length)},
      @"eventCount" : @(_nativeEventCount),
    });
  }

  return text; // Accepting the change.
}

- (void)textInputDidChange
{
  [self updateLocalData];

  id<RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;

  // Detect when `backedTextInputView` updates happened that didn't invoke `shouldChangeTextInRange`
  // (e.g. typing simplified Chinese in pinyin will insert and remove spaces without
  // calling shouldChangeTextInRange).  This will cause JS to get out of sync so we
  // update the mismatched range.
  NSRange currentRange;
  NSRange predictionRange;
  if (findMismatch(backedTextInputView.attributedText.string, [self predictedText], &currentRange, &predictionRange)) { // [macOS]
    NSString *replacement = [backedTextInputView.attributedText.string substringWithRange:currentRange];
    [self textInputShouldChangeText:replacement inRange:predictionRange];
    // JS will assume the selection changed based on the location of our shouldChangeTextInRange, so reset it.
    [self textInputDidChangeSelection];
    [self setPredictedText:backedTextInputView.attributedText.string]; // [macOS]
  }

  if (!self.backedTextInputView.ghostTextChanging) { // [macOS]
    _nativeEventCount++;

    if (_onChange) {
      _onChange(@{
        @"text" : [self.attributedText.string copy],
        @"target" : self.reactTag,
        @"eventCount" : @(_nativeEventCount),
      });
    }
  } // [macOS]
}

- (void)textInputDidChangeSelection
{
  self.ghostText = nil; // [macOS]

  if (!_onSelectionChange || self.backedTextInputView.ghostTextChanging) { // [macOS]
    return;
  }

  RCTTextSelection *selection = self.selection;

  _onSelectionChange(@{
    @"selection" : @{
      @"start" : @(selection.start),
      @"end" : @(selection.end),
    },
  });
}

// [macOS
- (BOOL)textInputShouldHandleDeleteBackward:(__unused id)sender {
  return YES;
}
// macOS]

#if TARGET_OS_OSX // [macOS
- (BOOL)textInputShouldHandleDeleteForward:(__unused id)sender {
  return YES;
}

- (BOOL)hasValidKeyDownOrValidKeyUp:(NSString *)key {
  return [RCTHandledKey key:key matchesFilter:self.validKeysDown]
	||  [RCTHandledKey key:key matchesFilter:self.validKeysUp];
}

- (NSDragOperation)textInputDraggingEntered:(id<NSDraggingInfo>)draggingInfo
{
  if ([draggingInfo.draggingPasteboard availableTypeFromArray:self.registeredDraggedTypes]) {
    return [self draggingEntered:draggingInfo];
  }
  return NSDragOperationNone;
}

- (void)textInputDraggingExited:(id<NSDraggingInfo>)draggingInfo
{
  if ([draggingInfo.draggingPasteboard availableTypeFromArray:self.registeredDraggedTypes]) {
    [self draggingExited:draggingInfo];
  }
}

- (BOOL)textInputShouldHandleDragOperation:(id<NSDraggingInfo>)draggingInfo
{
  if ([draggingInfo.draggingPasteboard availableTypeFromArray:self.registeredDraggedTypes]) {
    [self performDragOperation:draggingInfo];
    return NO;
  }

  return YES;
}

- (void)textInputDidCancel {
  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeKeyPress
                                 reactTag:self.reactTag
                                     text:nil
                                      key:@"Escape"
                               eventCount:_nativeEventCount];
  [self textInputDidEndEditing];
}

- (BOOL)textInputShouldHandleKeyEvent:(NSEvent *)event {
  return ![self handleKeyboardEvent:event];
}

- (BOOL)textInputShouldHandlePaste:(__unused id)sender
{
  NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
  NSPasteboardType fileType = [pasteboard availableTypeFromArray:@[NSFilenamesPboardType, NSPasteboardTypePNG, NSPasteboardTypeTIFF]];
  NSArray<NSPasteboardType>* pastedTypes = ((RCTUITextView*) self.backedTextInputView).readablePasteboardTypes;
      
  // If there's a fileType that is of interest, notify JS. Also blocks notifying JS if it's a text paste
  if (_onPaste && fileType != nil && [pastedTypes containsObject:fileType]) {
    _onPaste([self dataTransferInfoFromPasteboard:pasteboard]);
  }

  // Only allow pasting text.
  return fileType == nil;
}
#endif // macOS]

- (void)updateLocalData
{
  [self enforceTextAttributesIfNeeded];

  [_bridge.uiManager setLocalData:[self.backedTextInputView.attributedText copy] forView:self];
}

#pragma mark - Layout (in UIKit terms, with all insets)

- (CGSize)intrinsicContentSize
{
  CGSize size = self.backedTextInputView.intrinsicContentSize;
  size.width += _reactBorderInsets.left + _reactBorderInsets.right;
  size.height += _reactBorderInsets.top + _reactBorderInsets.bottom;
  // Returning value DOES include border and padding insets.
  return size;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  CGFloat compoundHorizontalBorderInset = _reactBorderInsets.left + _reactBorderInsets.right;
  CGFloat compoundVerticalBorderInset = _reactBorderInsets.top + _reactBorderInsets.bottom;

  size.width -= compoundHorizontalBorderInset;
  size.height -= compoundVerticalBorderInset;

  // Note: `paddingInsets` was already included in `backedTextInputView` size
  // because it was applied as `textContainerInset`.
  CGSize fittingSize = [self.backedTextInputView sizeThatFits:size];

  fittingSize.width += compoundHorizontalBorderInset;
  fittingSize.height += compoundVerticalBorderInset;

  // Returning value DOES include border and padding insets.
  return fittingSize;
}

#pragma mark - Accessibility

- (RCTUIView *)reactAccessibilityElement // [macOS]
{
  return self.backedTextInputView;
}

#pragma mark - Focus Control

- (void)reactFocus
{
  [self.backedTextInputView reactFocus];
}

- (void)reactBlur
{
  [self.backedTextInputView reactBlur];
}

- (void)didMoveToWindow
{
  if (self.autoFocus && !_didMoveToWindow) {
    [self.backedTextInputView reactFocus];
  } else {
    [self.backedTextInputView reactFocusIfNeeded];
  }

  _didMoveToWindow = YES;
}

#pragma mark - Custom Input Accessory View

#if TARGET_OS_IOS // [macOS] [visionOS]
- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  if ([changedProps containsObject:@"inputAccessoryViewID"] && self.inputAccessoryViewID) {
    [self setCustomInputAccessoryViewWithNativeID:self.inputAccessoryViewID];
  } else if (!self.inputAccessoryViewID) {
    [self setDefaultInputAccessoryView];
  }
}

- (void)setCustomInputAccessoryViewWithNativeID:(NSString *)nativeID
{
  __weak RCTBaseTextInputView *weakSelf = self;
  [_bridge.uiManager rootViewForReactTag:self.reactTag
                          withCompletion:^(UIView *rootView) {
                            RCTBaseTextInputView *strongSelf = weakSelf;
                            if (rootView) {
                              UIView *accessoryView = [strongSelf->_bridge.uiManager viewForNativeID:nativeID
                                                                                         withRootTag:rootView.reactTag];
                              if (accessoryView && [accessoryView isKindOfClass:[RCTInputAccessoryView class]]) {
                                strongSelf.backedTextInputView.inputAccessoryView =
                                    ((RCTInputAccessoryView *)accessoryView).inputAccessoryView;
                                [strongSelf reloadInputViewsIfNecessary];
                              }
                            }
                          }];
}

- (void)setDefaultInputAccessoryView
{
  UIView<RCTBackedTextInputViewProtocol> *textInputView = self.backedTextInputView;
  UIKeyboardType keyboardType = textInputView.keyboardType;

  // These keyboard types (all are number pads) don't have a "Done" button by default,
  // so we create an `inputAccessoryView` with this button for them.
  BOOL shouldHaveInputAccessoryView =
      (keyboardType == UIKeyboardTypeNumberPad || keyboardType == UIKeyboardTypePhonePad ||
       keyboardType == UIKeyboardTypeDecimalPad || keyboardType == UIKeyboardTypeASCIICapableNumberPad) &&
      textInputView.returnKeyType == UIReturnKeyDone;

  if (_hasInputAccessoryView == shouldHaveInputAccessoryView) {
    return;
  }

  _hasInputAccessoryView = shouldHaveInputAccessoryView;

  if (shouldHaveInputAccessoryView) {
    UIToolbar *toolbarView = [UIToolbar new];
    [toolbarView sizeToFit];
    UIBarButtonItem *flexibleSpace =
        [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace target:nil action:nil];
    UIBarButtonItem *doneButton =
        [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemDone
                                                      target:self
                                                      action:@selector(handleInputAccessoryDoneButton)];
    toolbarView.items = @[ flexibleSpace, doneButton ];
    textInputView.inputAccessoryView = toolbarView;
  } else {
    textInputView.inputAccessoryView = nil;
  }
  [self reloadInputViewsIfNecessary];
}

- (void)reloadInputViewsIfNecessary
{
  // We have to call `reloadInputViews` for focused text inputs to update an accessory view.
  if (self.backedTextInputView.isFirstResponder) {
    [self.backedTextInputView reloadInputViews];
  }
}

- (void)handleInputAccessoryDoneButton
{
  // Ignore the value of whether we submitted; just make sure the submit event is called if necessary.
  [self textInputShouldSubmitOnReturn];
  if ([self textInputShouldReturn]) {
    [self.backedTextInputView endEditing:YES];
  }
}
#endif // [macOS] [visionOS]

// [macOS

- (NSDictionary<NSAttributedStringKey, id> *)ghostTextAttributes
{
  RCTUIView<RCTBackedTextInputViewProtocol> *backedTextInputView = self.backedTextInputView;
  NSMutableDictionary<NSAttributedStringKey, id> *textAttributes =
      [backedTextInputView.defaultTextAttributes mutableCopy] ?: [NSMutableDictionary new];

  if (@available(iOS 13.0, *)) {
    [textAttributes setValue:backedTextInputView.placeholderColor ?: [RCTUIColor placeholderTextColor]
                      forKey:NSForegroundColorAttributeName];
  } else {
    if (backedTextInputView.placeholderColor) {
      [textAttributes setValue:backedTextInputView.placeholderColor forKey:NSForegroundColorAttributeName];
    } else {
      [textAttributes removeObjectForKey:NSForegroundColorAttributeName];
    }
  }

  return textAttributes;
}

- (void)setGhostText:(NSString *)ghostText {
  RCTTextSelection *selection = self.selection;
  NSString *newGhostText = ghostText.length > 0 ? ghostText : nil;

  if (selection.start != selection.end) {
    newGhostText = nil;
  }

  if ((_ghostText == nil && newGhostText == nil) || [_ghostText isEqual:newGhostText]) {
    return;
  }

  if (self.backedTextInputView.ghostTextChanging) {
    // look out for nested callbacks -- this can happen for example when selection changes in response to
    // attributed text changing. Such callbacks are initiated by Apple, or we could suppress this other ways.
    return;
  }

  self.backedTextInputView.ghostTextChanging = YES;

  if (_ghostText != nil) {
    // When setGhostText: is called after making a standard edit, the ghost text may already be gone
    BOOL ghostTextMayAlreadyBeGone = newGhostText == nil;
    NSAttributedString *attributedStringWithoutGhostText = [self removingGhostTextFromString:self.attributedText strict:!ghostTextMayAlreadyBeGone];

    if (attributedStringWithoutGhostText != nil) {
      self.attributedText = attributedStringWithoutGhostText;
      [self setSelectionStart:selection.start selectionEnd:selection.end];
    }
  }

  _ghostText = [newGhostText copy];
  _ghostTextPosition = selection.start;

  if (_ghostText != nil) {
    NSMutableAttributedString *attributedString = [self.attributedText mutableCopy];
    NSAttributedString *ghostAttributedString = [[NSAttributedString alloc] initWithString:_ghostText
                                                                                attributes:self.ghostTextAttributes];

    [attributedString insertAttributedString:ghostAttributedString atIndex:_ghostTextPosition];
    self.attributedText = attributedString;
    [self setSelectionStart:_ghostTextPosition selectionEnd:_ghostTextPosition];
  }

  self.backedTextInputView.ghostTextChanging = NO;
}

/**
 * Attempts to remove the ghost text from a provided string given our current state.
 *
 * If `strict` mode is enabled, this method assumes the ghost text exists exactly
 * where we expect it to be. We assert and return `nil` if we don't find the expected ghost text.
 * It's the responsibility of the caller to make sure the result isn't `nil`.
 *
 * If disabled, we allow for the possibility that the ghost text has already been removed,
 * which can happen if a delegate callback is trying to remove ghost text after invoking `setAttributedText:`.
 */
- (NSAttributedString *)removingGhostTextFromString:(NSAttributedString *)string strict:(BOOL)strict {
  if (_ghostText == nil) {
    return string;
  }

  NSRange ghostTextRange = NSMakeRange(_ghostTextPosition, _ghostText.length);
  NSMutableAttributedString *attributedString = [string mutableCopy];

  if ([attributedString length] < NSMaxRange(ghostTextRange)) {
    if (strict) {
      RCTAssert(false, @"Ghost text not fully present in text view text");
      return nil;
    } else {
      return string;
    }
  }

  NSString *actualGhostText = [[attributedString attributedSubstringFromRange:ghostTextRange] string];

  if (![actualGhostText isEqual:_ghostText]) {
    if (strict) {
      RCTAssert(false, @"Ghost text does not match text view text");
      return nil;
    } else {
      return string;
    }
  }

  [attributedString deleteCharactersInRange:ghostTextRange];
  return attributedString;
}

// macOS]

#pragma mark - Helpers

static BOOL findMismatch(NSString *first, NSString *second, NSRange *firstRange, NSRange *secondRange)
{
  NSInteger firstMismatch = -1;
  for (NSUInteger ii = 0; ii < MAX(first.length, second.length); ii++) {
    if (ii >= first.length || ii >= second.length || [first characterAtIndex:ii] != [second characterAtIndex:ii]) {
      firstMismatch = ii;
      break;
    }
  }

  if (firstMismatch == -1) {
    return NO;
  }

  NSUInteger ii = second.length;
  NSUInteger lastMismatch = first.length;
  while (ii > firstMismatch && lastMismatch > firstMismatch) {
    if ([first characterAtIndex:(lastMismatch - 1)] != [second characterAtIndex:(ii - 1)]) {
      break;
    }
    ii--;
    lastMismatch--;
  }

  *firstRange = NSMakeRange(firstMismatch, lastMismatch - firstMismatch);
  *secondRange = NSMakeRange(firstMismatch, ii - firstMismatch);
  return YES;
}

#if TARGET_OS_OSX // [macOS

#pragma mark - NSResponder chain

- (BOOL)canBecomeKeyView
{
  return NO; // Enclosed backedTextInputView can become the key view
}

#endif // macOS]

@end
