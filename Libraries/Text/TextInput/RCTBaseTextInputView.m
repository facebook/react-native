/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBaseTextInputView.h>

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>

#import <React/RCTInputAccessoryView.h>
#import <React/RCTInputAccessoryViewContent.h>
#import <React/RCTTextAttributes.h>
#import <React/RCTTextSelection.h>
#import "../RCTTextUIKit.h" // TODO(macOS GH#774)

@implementation RCTBaseTextInputView {
  __weak RCTBridge *_bridge;
  __weak id<RCTEventDispatcherProtocol> _eventDispatcher;
  BOOL _hasInputAccesoryView;
  // TODO(OSS Candidate ISS#2710739): remove explicit _predictedText ivar declaration
  BOOL _didMoveToWindow;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  RCTAssertParam(bridge);

  if (self = [super initWithFrame:CGRectZero]) {
    _bridge = bridge;
    _eventDispatcher = bridge.eventDispatcher;
  }

  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)decoder)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)

- (RCTUIView<RCTBackedTextInputViewProtocol> *)backedTextInputView // TODO(macOS ISS#3536887)
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
  if (![self ignoresTextAttributes]) { // TODO(OSS Candidate ISS#2710739)
    id<RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;

    NSDictionary<NSAttributedStringKey,id> *textAttributes = [[_textAttributes effectiveTextAttributes] mutableCopy];
    if ([textAttributes valueForKey:NSForegroundColorAttributeName] == nil) {
        [textAttributes setValue:[RCTUIColor blackColor] forKey:NSForegroundColorAttributeName]; // TODO(macOS GH#774)
    }

    backedTextInputView.defaultTextAttributes = textAttributes;
  } // TODO(OSS Candidate ISS#2710739)
}

- (void)setReactPaddingInsets:(UIEdgeInsets)reactPaddingInsets
{
  _reactPaddingInsets = reactPaddingInsets;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  // We apply `paddingInsets` as `backedTextInputView`'s `textContainerInset`.
  self.backedTextInputView.textContainerInset = reactPaddingInsets;
  [self setNeedsLayout];
#endif // TODO(macOS GH#774)
}

- (void)setReactBorderInsets:(UIEdgeInsets)reactBorderInsets
{
  _reactBorderInsets = reactBorderInsets;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  // We apply `borderInsets` as `backedTextInputView` layout offset.
  self.backedTextInputView.frame = UIEdgeInsetsInsetRect(self.bounds, reactBorderInsets);
  [self setNeedsLayout];
#endif // TODO(macOS GH#774)
}

- (NSAttributedString *)attributedText
{
  return self.backedTextInputView.attributedText;
}

- (BOOL)textOf:(NSAttributedString*)newText equals:(NSAttributedString*)oldText{
  // When the dictation is running we can't update the attributed text on the backed up text view
  // because setting the attributed string will kill the dictation. This means that we can't impose
  // the settings on a dictation.
  // Similarly, when the user is in the middle of inputting some text in Japanese/Chinese, there will be styling on the
  // text that we should disregard. See https://developer.apple.com/documentation/uikit/uitextinput/1614489-markedtextrange?language=objc
  // for more info.
  // If the user added an emoji, the system adds a font attribute for the emoji and stores the original font in NSOriginalFont.
  // Lastly, when entering a password, etc., there will be additional styling on the field as the native text view
  // handles showing the last character for a split second.
  __block BOOL fontHasBeenUpdatedBySystem = false;
  [oldText enumerateAttribute:@"NSOriginalFont" inRange:NSMakeRange(0, oldText.length) options:0 usingBlock:^(id value, NSRange range, BOOL *stop) {
    if (value){
      fontHasBeenUpdatedBySystem = true;
    }
  }];

  BOOL shouldFallbackToBareTextComparison =
#if !TARGET_OS_OSX // TODO(macOS GH#774)
    [self.backedTextInputView.textInputMode.primaryLanguage isEqualToString:@"dictation"] ||
    self.backedTextInputView.markedTextRange ||
    self.backedTextInputView.isSecureTextEntry ||
    fontHasBeenUpdatedBySystem;
#else // [TODO(macOS GH#774)
    NO;
#endif // ]TODO(macOS GH#774)

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
  NSMutableAttributedString *const attributedTextCopy = [attributedText mutableCopy];

  [backedTextInputViewTextCopy removeAttribute:RCTTextAttributesTagAttributeName
                                         range:NSMakeRange(0, backedTextInputViewTextCopy.length)];

  [attributedTextCopy removeAttribute:RCTTextAttributesTagAttributeName
                                range:NSMakeRange(0, attributedTextCopy.length)];

  textNeedsUpdate = ([self textOf:attributedTextCopy equals:backedTextInputViewTextCopy] == NO);

  if (eventLag == 0 && textNeedsUpdate) {
#if !TARGET_OS_OSX // TODO(macOS GH#774)
    UITextRange *selection = self.backedTextInputView.selectedTextRange;
#else // [TODO(macOS GH#774)
    NSRange selection = [self.backedTextInputView selectedTextRange];
#endif // ]TODO(macOS GH#774)
    NSInteger oldTextLength = self.backedTextInputView.attributedText.string.length;

    self.backedTextInputView.attributedText = attributedText;

#if !TARGET_OS_OSX // TODO(macOS GH#774)
    if (selection.empty) {
      // Maintaining a cursor position relative to the end of the old text.
      NSInteger offsetStart =
      [self.backedTextInputView offsetFromPosition:self.backedTextInputView.beginningOfDocument
                                        toPosition:selection.start];
      NSInteger offsetFromEnd = oldTextLength - offsetStart;
      NSInteger newOffset = attributedText.string.length - offsetFromEnd;
      UITextPosition *position =
      [self.backedTextInputView positionFromPosition:self.backedTextInputView.beginningOfDocument
                                              offset:newOffset];
      [self.backedTextInputView setSelectedTextRange:[self.backedTextInputView textRangeFromPosition:position toPosition:position]
                                      notifyDelegate:YES];
    }
#else // [TODO(macOS GH#774)
    if (selection.length == 0) {
      // Maintaining a cursor position relative to the end of the old text.
      NSInteger start = selection.location;
      NSInteger offsetFromEnd = oldTextLength - start;
      NSInteger newOffset = self.backedTextInputView.attributedText.length - offsetFromEnd;
      [self.backedTextInputView setSelectedTextRange:NSMakeRange(newOffset, 0)
                                      notifyDelegate:YES];
    }
#endif // ]TODO(macOS GH#774)

    [self updateLocalData];
  } else if (eventLag > RCTTextUpdateLagWarningThreshold) {
    RCTLog(@"Native TextInput(%@) is %lld events ahead of JS - try to make your JS faster.", self.backedTextInputView.attributedText.string, (long long)eventLag);
  }
}

- (RCTTextSelection *)selection
{
  id<RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UITextRange *selectedTextRange = backedTextInputView.selectedTextRange;
  return [[RCTTextSelection new] initWithStart:[backedTextInputView offsetFromPosition:backedTextInputView.beginningOfDocument toPosition:selectedTextRange.start]
                                           end:[backedTextInputView offsetFromPosition:backedTextInputView.beginningOfDocument toPosition:selectedTextRange.end]];
#else // [TODO(macOS GH#774)
  NSRange selectedTextRange = backedTextInputView.selectedTextRange;
  return [[RCTTextSelection new] initWithStart:selectedTextRange.location
                                           end:selectedTextRange.location + selectedTextRange.length];
#endif // ]TODO(macOS GH#774)
}

- (void)setSelection:(RCTTextSelection *)selection
{
  if (!selection) {
    return;
  }

  id<RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UITextRange *previousSelectedTextRange = backedTextInputView.selectedTextRange;
  UITextPosition *start = [backedTextInputView positionFromPosition:backedTextInputView.beginningOfDocument offset:selection.start];
  UITextPosition *end = [backedTextInputView positionFromPosition:backedTextInputView.beginningOfDocument offset:selection.end];
  UITextRange *selectedTextRange = [backedTextInputView textRangeFromPosition:start toPosition:end];
#else // [TODO(macOS GH#774)
  NSRange previousSelectedTextRange = backedTextInputView.selectedTextRange;
  NSInteger start = MIN(selection.start, selection.end);
  NSInteger end = MAX(selection.start, selection.end);
  NSInteger length = end - selection.start;
  NSRange selectedTextRange = NSMakeRange(start, length);
#endif // ]TODO(macOS GH#774)
  
  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && !RCTTextSelectionEqual(previousSelectedTextRange, selectedTextRange)) { // TODO(macOS GH#774)
    [backedTextInputView setSelectedTextRange:selectedTextRange notifyDelegate:NO];
  } else if (eventLag > RCTTextUpdateLagWarningThreshold) {
    RCTLog(@"Native TextInput(%@) is %lld events ahead of JS - try to make your JS faster.", backedTextInputView.attributedText.string, (long long)eventLag);
  }
}

- (void)setSelectionStart:(NSInteger)start
             selectionEnd:(NSInteger)end
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UITextPosition *startPosition = [self.backedTextInputView positionFromPosition:self.backedTextInputView.beginningOfDocument
                                                                          offset:start];
  UITextPosition *endPosition = [self.backedTextInputView positionFromPosition:self.backedTextInputView.beginningOfDocument
                                                                        offset:end];
  if (startPosition && endPosition) {
    UITextRange *range = [self.backedTextInputView textRangeFromPosition:startPosition toPosition:endPosition];
    [self.backedTextInputView setSelectedTextRange:range notifyDelegate:NO];
  }
#else // [TODO(macOS GH#774)
  NSInteger startPosition = MIN(start, end);
  NSInteger endPosition = MAX(start, end);
  [self.backedTextInputView setSelectedTextRange:NSMakeRange(startPosition, endPosition - startPosition) notifyDelegate:NO];
#endif // ]TODO(macOS GH#774)
}

- (void)setTextContentType:(NSString *)type
{
  #if defined(__IPHONE_OS_VERSION_MAX_ALLOWED)
    static dispatch_once_t onceToken;
    static NSDictionary<NSString *, NSString *> *contentTypeMap;

    dispatch_once(&onceToken, ^{
      contentTypeMap = @{@"none": @"",
                          @"URL": UITextContentTypeURL,
                          @"addressCity": UITextContentTypeAddressCity,
                          @"addressCityAndState":UITextContentTypeAddressCityAndState,
                          @"addressState": UITextContentTypeAddressState,
                          @"countryName": UITextContentTypeCountryName,
                          @"creditCardNumber": UITextContentTypeCreditCardNumber,
                          @"emailAddress": UITextContentTypeEmailAddress,
                          @"familyName": UITextContentTypeFamilyName,
                          @"fullStreetAddress": UITextContentTypeFullStreetAddress,
                          @"givenName": UITextContentTypeGivenName,
                          @"jobTitle": UITextContentTypeJobTitle,
                          @"location": UITextContentTypeLocation,
                          @"middleName": UITextContentTypeMiddleName,
                          @"name": UITextContentTypeName,
                          @"namePrefix": UITextContentTypeNamePrefix,
                          @"nameSuffix": UITextContentTypeNameSuffix,
                          @"nickname": UITextContentTypeNickname,
                          @"organizationName": UITextContentTypeOrganizationName,
                          @"postalCode": UITextContentTypePostalCode,
                          @"streetAddressLine1": UITextContentTypeStreetAddressLine1,
                          @"streetAddressLine2": UITextContentTypeStreetAddressLine2,
                          @"sublocality": UITextContentTypeSublocality,
                          @"telephoneNumber": UITextContentTypeTelephoneNumber,
                          @"username": UITextContentTypeUsername,
                          @"password": UITextContentTypePassword,
                          };

      #if __IPHONE_OS_VERSION_MAX_ALLOWED >= 120000 /* __IPHONE_12_0 */
        if (@available(iOS 12.0, *)) {
          NSDictionary<NSString *, NSString *> * iOS12extras = @{@"newPassword": UITextContentTypeNewPassword,
                                                                  @"oneTimeCode": UITextContentTypeOneTimeCode};

          NSMutableDictionary<NSString *, NSString *> * iOS12baseMap = [contentTypeMap mutableCopy];
          [iOS12baseMap addEntriesFromDictionary:iOS12extras];

          contentTypeMap = [iOS12baseMap copy];
        }
      #endif
    });

    // Setting textContentType to an empty string will disable any
    // default behaviour, like the autofill bar for password inputs
    self.backedTextInputView.textContentType = contentTypeMap[type] ?: type;
  #endif
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)

- (void)setPasswordRules:(NSString *)descriptor
{
  #if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_12_0
    if (@available(iOS 12.0, *)) {
      self.backedTextInputView.passwordRules = [UITextInputPasswordRules passwordRulesWithDescriptor:descriptor];
    }
  #endif
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
    // Without the call to reloadInputViews, the keyboard will not change until the textview field (the first responder) loses and regains focus.
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
  } else {
    // Hides keyboard, but keeps blinking cursor.
    self.backedTextInputView.inputView = [[UIView alloc] init];
  }
}
#endif // TODO(macOS GH#774)

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
    [self.backedTextInputView selectAll:nil];
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

- (BOOL)textInputShouldReturn
{
  // We send `submit` event here, in `textInputShouldReturn`
  // (not in `textInputDidReturn)`, because of semantic of the event:
  // `onSubmitEditing` is called when "Submit" button
  // (the blue key on onscreen keyboard) did pressed
  // (no connection to any specific "submitting" process).
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  if (_blurOnSubmit) {
#endif // ]TODO(macOS GH#774)
    [_eventDispatcher sendTextEventWithType:RCTTextEventTypeSubmit
                                  reactTag:self.reactTag
                                      text:[self.backedTextInputView.attributedText.string copy]
                                        key:nil
                                eventCount:_nativeEventCount];
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  }
#endif // ]TODO(macOS GH#774)

  return _blurOnSubmit;
}

- (void)textInputDidReturn
{
  // Does nothing.
}

- (NSString *)textInputShouldChangeText:(NSString *)text inRange:(NSRange)range
{
  id<RCTBackedTextInputViewProtocol> backedTextInputView = self.backedTextInputView;

  if (!backedTextInputView.textWasPasted) {
    [_eventDispatcher sendTextEventWithType:RCTTextEventTypeKeyPress
                                   reactTag:self.reactTag
                                       text:nil
                                        key:text
                                 eventCount:_nativeEventCount];
  }

  if (_maxLength) {
    NSInteger allowedLength = MAX(_maxLength.integerValue - (NSInteger)backedTextInputView.attributedText.string.length + (NSInteger)range.length, 0);

    if (text.length > allowedLength) {
      // If we typed/pasted more than one character, limit the text inputted.
      if (text.length > 1) {
        if (allowedLength > 0) {
          //make sure unicode characters that are longer than 16 bits (such as emojis) are not cut off
          NSRange cutOffCharacterRange = [text rangeOfComposedCharacterSequenceAtIndex: allowedLength - 1];
          if (cutOffCharacterRange.location + cutOffCharacterRange.length > allowedLength) {
            //the character at the length limit takes more than 16bits, truncation should end at the character before
            allowedLength = cutOffCharacterRange.location;
          }
        }
        // Truncate the input string so the result is exactly maxLength
        NSString *limitedString = [text substringToIndex:allowedLength];
        NSMutableAttributedString *newAttributedText = [backedTextInputView.attributedText mutableCopy];
        // Apply text attributes if original input view doesn't have text.
        if (backedTextInputView.attributedText.length == 0) {
          newAttributedText = [[NSMutableAttributedString alloc] initWithString:[self.textAttributes applyTextAttributesToText:limitedString] attributes:self.textAttributes.effectiveTextAttributes];
        } else {
          [newAttributedText replaceCharactersInRange:range withString:limitedString];
        }
        backedTextInputView.attributedText = newAttributedText;
        [self setPredictedText:newAttributedText.string]; // TODO(OSS Candidate ISS#2710739)

        // Collapse selection at end of insert to match normal paste behavior.
#if !TARGET_OS_OSX // TODO(macOS GH#774)
        UITextPosition *insertEnd = [backedTextInputView positionFromPosition:backedTextInputView.beginningOfDocument
                                                                       offset:(range.location + allowedLength)];
        [backedTextInputView setSelectedTextRange:[backedTextInputView textRangeFromPosition:insertEnd toPosition:insertEnd]
                                   notifyDelegate:YES];
#else // [TODO(macOS GH#774)
        [backedTextInputView setSelectedTextRange:NSMakeRange(range.location + allowedLength, 0)
                                   notifyDelegate:YES];
#endif // ]TODO(macOS GH#774)
        
        [self textInputDidChange];
      }

      return nil; // Rejecting the change.
    }
  }

  NSString *previousText = [backedTextInputView.attributedText.string copy] ?: @"";

  if (range.location + range.length > backedTextInputView.attributedText.string.length) {
    _predictedText = backedTextInputView.attributedText.string;
  } else if (text != nil) { // TODO(macOS GH#774): -[NSString stringByReplacingCharactersInRange:withString:] doesn't like when the replacement string is nil
    _predictedText = [backedTextInputView.attributedText.string stringByReplacingCharactersInRange:range withString:text];
  }

  if (_onTextInput) {
    _onTextInput(@{
      @"text": text,
      @"previousText": previousText,
      @"range": @{
        @"start": @(range.location),
        @"end": @(range.location + range.length)
      },
      @"eventCount": @(_nativeEventCount),
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
  if (findMismatch(backedTextInputView.attributedText.string, [self predictedText], &currentRange, &predictionRange)) { // TODO(OSS Candidate ISS#2710739)
    NSString *replacement = [backedTextInputView.attributedText.string substringWithRange:currentRange];
    [self textInputShouldChangeText:replacement inRange:predictionRange];
    // JS will assume the selection changed based on the location of our shouldChangeTextInRange, so reset it.
    [self textInputDidChangeSelection];
    [self setPredictedText:backedTextInputView.attributedText.string]; // TODO(OSS Candidate ISS#2710739)
  }

  _nativeEventCount++;

  if (_onChange) {
    _onChange(@{
       @"text": [self.attributedText.string copy],
       @"target": self.reactTag,
       @"eventCount": @(_nativeEventCount),
    });
  }
}

- (void)textInputDidChangeSelection
{
  if (!_onSelectionChange) {
    return;
  }

  RCTTextSelection *selection = self.selection;

  _onSelectionChange(@{
    @"selection": @{
      @"start": @(selection.start),
      @"end": @(selection.end),
    },
  });
}

// [TODO(OSS Candidate ISS#2710739)
- (BOOL)textInputShouldHandleDeleteBackward:(__unused id)sender {
  return YES;
}
// ]TODO(OSS Candidate ISS#2710739)

#if TARGET_OS_OSX // [TODO(macOS GH#774)
- (BOOL)textInputShouldHandleDeleteForward:(__unused id)sender {
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
#endif // ]TODO(macOS GH#774)

- (void)updateLocalData
{
  [self enforceTextAttributesIfNeeded];

  [_bridge.uiManager setLocalData:[self.backedTextInputView.attributedText copy]
                          forView:self];
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

- (RCTUIView *)reactAccessibilityElement // TODO(macOS ISS#3536887)
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
  #if !TARGET_OS_OSX // TODO(macOS GH#774)
  __weak RCTBaseTextInputView *weakSelf = self;
  [_bridge.uiManager rootViewForReactTag:self.reactTag withCompletion:^(UIView *rootView) {
    RCTBaseTextInputView *strongSelf = weakSelf;
    if (rootView) {
      UIView *accessoryView = [strongSelf->_bridge.uiManager viewForNativeID:nativeID
                                                                 withRootTag:rootView.reactTag];
      if (accessoryView && [accessoryView isKindOfClass:[RCTInputAccessoryView class]]) {
        strongSelf.backedTextInputView.inputAccessoryView = ((RCTInputAccessoryView *)accessoryView).inputAccessoryView;
        [strongSelf reloadInputViewsIfNecessary];
      }
    }
  }];
  #endif /* !TARGET_OS_OSX TODO(macOS GH#774) */
}

- (void)setDefaultInputAccessoryView
{
  #if !TARGET_OS_OSX // TODO(macOS GH#774)
  UIView<RCTBackedTextInputViewProtocol> *textInputView = self.backedTextInputView;
  UIKeyboardType keyboardType = textInputView.keyboardType;

  // These keyboard types (all are number pads) don't have a "Done" button by default,
  // so we create an `inputAccessoryView` with this button for them.
  BOOL shouldHaveInputAccesoryView =
      (
       keyboardType == UIKeyboardTypeNumberPad ||
       keyboardType == UIKeyboardTypePhonePad ||
       keyboardType == UIKeyboardTypeDecimalPad ||
       keyboardType == UIKeyboardTypeASCIICapableNumberPad
      ) &&
      textInputView.returnKeyType == UIReturnKeyDone;

  if (_hasInputAccesoryView == shouldHaveInputAccesoryView) {
    return;
  }

  _hasInputAccesoryView = shouldHaveInputAccesoryView;

  if (shouldHaveInputAccesoryView) {
    UIToolbar *toolbarView = [[UIToolbar alloc] init];
    [toolbarView sizeToFit];
    UIBarButtonItem *flexibleSpace =
      [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace
                                                    target:nil
                                                    action:nil];
    UIBarButtonItem *doneButton =
      [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemDone
                                                    target:self
                                                    action:@selector(handleInputAccessoryDoneButton)];
    toolbarView.items = @[flexibleSpace, doneButton];
    textInputView.inputAccessoryView = toolbarView;
  }
  else {
    textInputView.inputAccessoryView = nil;
  }
  [self reloadInputViewsIfNecessary];
  #endif /* !TARGET_OS_OSX TODO(macOS GH#774) */
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)reloadInputViewsIfNecessary
{
  // We have to call `reloadInputViews` for focused text inputs to update an accessory view.
  if (self.backedTextInputView.isFirstResponder) {
    [self.backedTextInputView reloadInputViews];
  }
}

- (void)handleInputAccessoryDoneButton
{
  if ([self textInputShouldReturn]) {
    [self.backedTextInputView endEditing:YES];
  }
}
#endif // TODO(macOS GH#774)

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

#if TARGET_OS_OSX // [TODO(macOS GH#774)

#pragma mark - NSResponder chain

- (BOOL)canBecomeKeyView
{
  return NO; // Enclosed backedTextInputView can become the key view
}

#endif // ]TODO(macOS GH#774)

@end
