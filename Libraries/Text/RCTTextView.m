/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextView.h"

#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>
#import <React/UIView+React.h>

#import "RCTShadowText.h"
#import "RCTText.h"
#import "RCTTextSelection.h"
#import "RCTUITextView.h"

@implementation RCTTextView
{
  RCTBridge *_bridge;
  RCTEventDispatcher *_eventDispatcher;

  RCTUITextView *_textView;
  RCTText *_richTextView;
  NSAttributedString *_pendingAttributedText;

  UITextRange *_previousSelectionRange;
  NSUInteger _previousTextLength;
  CGFloat _previousContentHeight;
  NSString *_predictedText;

  BOOL _blockTextShouldChange;
  BOOL _nativeUpdatesInFlight;
  NSInteger _nativeEventCount;

  CGSize _previousContentSize;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  RCTAssertParam(bridge);

  if (self = [super initWithFrame:CGRectZero]) {
    _contentInset = UIEdgeInsetsZero;
    _bridge = bridge;
    _eventDispatcher = bridge.eventDispatcher;
    _blurOnSubmit = NO;

    _textView = [[RCTUITextView alloc] initWithFrame:self.bounds];
    _textView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _textView.backgroundColor = [UIColor clearColor];
    _textView.textColor = [UIColor blackColor];
    // This line actually removes 5pt (default value) left and right padding in UITextView.
    _textView.textContainer.lineFragmentPadding = 0;
#if !TARGET_OS_TV
    _textView.scrollsToTop = NO;
#endif
    _textView.scrollEnabled = YES;
    _textView.delegate = self;

    [self addSubview:_textView];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

#pragma mark - RCTComponent

- (void)insertReactSubview:(UIView *)subview atIndex:(NSInteger)index
{
  [super insertReactSubview:subview atIndex:index];

  if ([subview isKindOfClass:[RCTText class]]) {
    if (_richTextView) {
      RCTLogError(@"Tried to insert a second <Text> into <TextInput> - there can only be one.");
    }
    _richTextView = (RCTText *)subview;

    // If this <TextInput> is in rich text editing mode, and the child <Text> node providing rich text
    // styling has a backgroundColor, then the attributedText produced by the child <Text> node will have an
    // NSBackgroundColor attribute. We need to forward this attribute to the text view manually because the text view
    // always has a clear background color in `initWithBridge:`.
    //
    // TODO: This should be removed when the related hack in -performPendingTextUpdate is removed.
    if (subview.backgroundColor) {
      NSMutableDictionary<NSString *, id> *attrs = [_textView.typingAttributes mutableCopy];
      attrs[NSBackgroundColorAttributeName] = subview.backgroundColor;
      _textView.typingAttributes = attrs;
    }

    [self performTextUpdate];
  }
}

- (void)removeReactSubview:(UIView *)subview
{
  [super removeReactSubview:subview];
  if (_richTextView == subview) {
    _richTextView = nil;
    [self performTextUpdate];
  }
}

- (void)didUpdateReactSubviews
{
  // Do nothing, as we don't allow non-text subviews.
}

#pragma mark - Routine

- (void)setMostRecentEventCount:(NSInteger)mostRecentEventCount
{
  _mostRecentEventCount = mostRecentEventCount;

  // Props are set after uiBlockToAmendWithShadowViewRegistry, which means that
  // at the time performTextUpdate is called, _mostRecentEventCount will be
  // behind _eventCount, with the result that performPendingTextUpdate will do
  // nothing. For that reason we call it again here after mostRecentEventCount
  // has been set.
  [self performPendingTextUpdate];
}

- (void)performTextUpdate
{
  if (_richTextView) {
    _pendingAttributedText = _richTextView.textStorage;
    [self performPendingTextUpdate];
  } else if (!self.text) {
    _textView.attributedText = nil;
  }
}

static NSAttributedString *removeReactTagFromString(NSAttributedString *string)
{
  if (string.length == 0) {
    return string;
  } else {
    NSMutableAttributedString *mutableString = [[NSMutableAttributedString alloc] initWithAttributedString:string];
    [mutableString removeAttribute:RCTReactTagAttributeName range:NSMakeRange(0, mutableString.length)];
    return mutableString;
  }
}

- (void)performPendingTextUpdate
{
  if (!_pendingAttributedText || _mostRecentEventCount < _nativeEventCount || _nativeUpdatesInFlight) {
    return;
  }

  // The underlying <Text> node that produces _pendingAttributedText has a react tag attribute on it that causes the
  // -isEqualToAttributedString: comparison below to spuriously fail. We don't want that comparison to fail unless it
  // needs to because when the comparison fails, we end up setting attributedText on the text view, which clears
  // autocomplete state for CKJ text input.
  //
  // TODO: Kill this after we finish passing all style/attribute info into JS.
  _pendingAttributedText = removeReactTagFromString(_pendingAttributedText);

  if ([_textView.attributedText isEqualToAttributedString:_pendingAttributedText]) {
    _pendingAttributedText = nil; // Don't try again.
    return;
  }

  // When we update the attributed text, there might be pending autocorrections
  // that will get accepted by default. In order for this to not garble our text,
  // we temporarily block all textShouldChange events so they are not applied.
  _blockTextShouldChange = YES;

  UITextRange *selection = _textView.selectedTextRange;
  NSInteger oldTextLength = _textView.attributedText.length;

  _textView.attributedText = _pendingAttributedText;
  _predictedText = _pendingAttributedText.string;
  _pendingAttributedText = nil;

  if (selection.empty) {
    // maintain cursor position relative to the end of the old text
    NSInteger start = [_textView offsetFromPosition:_textView.beginningOfDocument toPosition:selection.start];
    NSInteger offsetFromEnd = oldTextLength - start;
    NSInteger newOffset = _textView.attributedText.length - offsetFromEnd;
    UITextPosition *position = [_textView positionFromPosition:_textView.beginningOfDocument offset:newOffset];
    _textView.selectedTextRange = [_textView textRangeFromPosition:position toPosition:position];
  }

  [_textView layoutIfNeeded];

  [self invalidateContentSize];

  _blockTextShouldChange = NO;
}

#pragma mark - Properties

- (UIFont *)font
{
  return _textView.font;
}

- (void)setFont:(UIFont *)font
{
  _textView.font = font;
}

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  _contentInset = contentInset;
  _textView.textContainerInset = contentInset;
  [self setNeedsLayout];
}

- (void)setSelection:(RCTTextSelection *)selection
{
  if (!selection) {
    return;
  }

  UITextRange *currentSelection = _textView.selectedTextRange;
  UITextPosition *start = [_textView positionFromPosition:_textView.beginningOfDocument offset:selection.start];
  UITextPosition *end = [_textView positionFromPosition:_textView.beginningOfDocument offset:selection.end];
  UITextRange *selectedTextRange = [_textView textRangeFromPosition:start toPosition:end];

  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![currentSelection isEqual:selectedTextRange]) {
    _previousSelectionRange = selectedTextRange;
    _textView.selectedTextRange = selectedTextRange;
  } else if (eventLag > RCTTextUpdateLagWarningThreshold) {
    RCTLogWarn(@"Native TextInput(%@) is %zd events ahead of JS - try to make your JS faster.", self.text, eventLag);
  }
}

- (NSString *)text
{
  return _textView.text;
}

- (void)setText:(NSString *)text
{
  NSInteger eventLag = _nativeEventCount - _mostRecentEventCount;
  if (eventLag == 0 && ![text isEqualToString:_textView.text]) {
    UITextRange *selection = _textView.selectedTextRange;
    NSInteger oldTextLength = _textView.text.length;

    _predictedText = text;
    _textView.text = text;

    if (selection.empty) {
      // maintain cursor position relative to the end of the old text
      NSInteger start = [_textView offsetFromPosition:_textView.beginningOfDocument toPosition:selection.start];
      NSInteger offsetFromEnd = oldTextLength - start;
      NSInteger newOffset = text.length - offsetFromEnd;
      UITextPosition *position = [_textView positionFromPosition:_textView.beginningOfDocument offset:newOffset];
      _textView.selectedTextRange = [_textView textRangeFromPosition:position toPosition:position];
    }

    [self invalidateContentSize];
  } else if (eventLag > RCTTextUpdateLagWarningThreshold) {
    RCTLogWarn(@"Native TextInput(%@) is %zd events ahead of JS - try to make your JS faster.", self.text, eventLag);
  }
}

- (NSString *)placeholder
{
  return _textView.placeholderText;
}

- (void)setPlaceholder:(NSString *)placeholder
{
  _textView.placeholderText = placeholder;
}

- (UIColor *)placeholderTextColor
{
  return _textView.placeholderTextColor;
}

- (void)setPlaceholderTextColor:(UIColor *)placeholderTextColor
{
  _textView.placeholderTextColor = placeholderTextColor;
}

- (void)setAutocorrectionType:(UITextAutocorrectionType)autocorrectionType
{
  _textView.autocorrectionType = autocorrectionType;
}

- (UITextAutocorrectionType)autocorrectionType
{
  return _textView.autocorrectionType;
}

- (void)setSpellCheckingType:(UITextSpellCheckingType)spellCheckingType
{
  _textView.spellCheckingType = spellCheckingType;
}

- (UITextSpellCheckingType)spellCheckingType
{
  return _textView.spellCheckingType;
}

#pragma mark - UITextViewDelegate

- (BOOL)textView:(RCTUITextView *)textView shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
  if (!textView.textWasPasted) {
    [_eventDispatcher sendTextEventWithType:RCTTextEventTypeKeyPress
                                   reactTag:self.reactTag
                                       text:nil
                                        key:text
                                 eventCount:_nativeEventCount];

    if (_blurOnSubmit && [text isEqualToString:@"\n"]) {
      // TODO: the purpose of blurOnSubmit on RCTextField is to decide if the
      // field should lose focus when return is pressed or not. We're cheating a
      // bit here by using it on RCTextView to decide if return character should
      // submit the form, or be entered into the field.
      //
      // The reason this is cheating is because there's no way to specify that
      // you want the return key to be swallowed *and* have the field retain
      // focus (which was what blurOnSubmit was originally for). For the case
      // where _blurOnSubmit = YES, this is still the correct and expected
      // behavior though, so we'll leave the don't-blur-or-add-newline problem
      // to be solved another day.
      [_eventDispatcher sendTextEventWithType:RCTTextEventTypeSubmit
                                     reactTag:self.reactTag
                                         text:self.text
                                          key:nil
                                   eventCount:_nativeEventCount];
      [self resignFirstResponder];
      return NO;
    }
  }

  // So we need to track that there is a native update in flight just in case JS manages to come back around and update
  // things /before/ UITextView can update itself asynchronously.  If there is a native update in flight, we defer the
  // JS update when it comes in and apply the deferred update once textViewDidChange fires with the native update applied.
  if (_blockTextShouldChange) {
    return NO;
  }

  if (_maxLength) {
    NSUInteger allowedLength = _maxLength.integerValue - textView.text.length + range.length;
    if (text.length > allowedLength) {
      // If we typed/pasted more than one character, limit the text inputted
      if (text.length > 1) {
        // Truncate the input string so the result is exactly maxLength
        NSString *limitedString = [text substringToIndex:allowedLength];
        NSMutableString *newString = textView.text.mutableCopy;
        [newString replaceCharactersInRange:range withString:limitedString];
        textView.text = newString;
        _predictedText = newString;

        // Collapse selection at end of insert to match normal paste behavior
        UITextPosition *insertEnd = [textView positionFromPosition:textView.beginningOfDocument
                                                            offset:(range.location + allowedLength)];
        textView.selectedTextRange = [textView textRangeFromPosition:insertEnd toPosition:insertEnd];

        [self textViewDidChange:textView];
      }
      return NO;
    }
  }

  _nativeUpdatesInFlight = YES;

  if (range.location + range.length > _predictedText.length) {
    // _predictedText got out of sync in a bad way, so let's just force sync it.  Haven't been able to repro this, but
    // it's causing a real crash here: #6523822
    _predictedText = textView.text;
  }

  NSString *previousText = [_predictedText substringWithRange:range];
  if (_predictedText) {
    _predictedText = [_predictedText stringByReplacingCharactersInRange:range withString:text];
  } else {
    _predictedText = text;
  }

  if (_onTextInput) {
    _onTextInput(@{
      @"text": text,
      @"previousText": previousText ?: @"",
      @"range": @{
        @"start": @(range.location),
        @"end": @(range.location + range.length)
      },
      @"eventCount": @(_nativeEventCount),
    });
  }

  return YES;
}

- (void)textViewDidChangeSelection:(RCTUITextView *)textView
{
  if (_onSelectionChange &&
      textView.selectedTextRange != _previousSelectionRange &&
      ![textView.selectedTextRange isEqual:_previousSelectionRange]) {

    _previousSelectionRange = textView.selectedTextRange;

    UITextRange *selection = textView.selectedTextRange;
    NSInteger start = [textView offsetFromPosition:textView.beginningOfDocument toPosition:selection.start];
    NSInteger end = [textView offsetFromPosition:textView.beginningOfDocument toPosition:selection.end];
    _onSelectionChange(@{
      @"selection": @{
        @"start": @(start),
        @"end": @(end),
      },
    });
  }
}

- (BOOL)textViewShouldBeginEditing:(UITextView *)textView
{
  if (_selectTextOnFocus) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [textView selectAll:nil];
    });
  }
  return YES;
}

- (void)textViewDidBeginEditing:(UITextView *)textView
{
  if (_clearTextOnFocus) {
    _textView.text = @"";
  }

  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeFocus
                                 reactTag:self.reactTag
                                     text:nil
                                      key:nil
                               eventCount:_nativeEventCount];
}

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

- (void)textViewDidChange:(UITextView *)textView
{
  [self invalidateContentSize];

  // Detect when textView updates happend that didn't invoke `shouldChangeTextInRange`
  // (e.g. typing simplified chinese in pinyin will insert and remove spaces without
  // calling shouldChangeTextInRange).  This will cause JS to get out of sync so we
  // update the mismatched range.
  NSRange currentRange;
  NSRange predictionRange;
  if (findMismatch(textView.text, _predictedText, &currentRange, &predictionRange)) {
    NSString *replacement = [textView.text substringWithRange:currentRange];
    [self textView:textView shouldChangeTextInRange:predictionRange replacementText:replacement];
    // JS will assume the selection changed based on the location of our shouldChangeTextInRange, so reset it.
    [self textViewDidChangeSelection:textView];
    _predictedText = textView.text;
  }

  _nativeUpdatesInFlight = NO;
  _nativeEventCount++;

  // TODO: t16435709 This part will be removed soon.
  if (!self.reactTag || !_onChange) {
    return;
  }

  // When the context size increases, iOS updates the contentSize twice; once
  // with a lower height, then again with the correct height. To prevent a
  // spurious event from being sent, we track the previous, and only send the
  // update event if it matches our expectation that greater text length
  // should result in increased height. This assumption is, of course, not
  // necessarily true because shorter text might include more linebreaks, but
  // in practice this works well enough.
  NSUInteger textLength = textView.text.length;
  CGFloat contentHeight = textView.contentSize.height;
  if (textLength >= _previousTextLength) {
    contentHeight = MAX(contentHeight, _previousContentHeight);
  }
  _previousTextLength = textLength;
  _previousContentHeight = contentHeight;
  _onChange(@{
    @"text": self.text,
    @"contentSize": @{
      @"height": @(contentHeight),
      @"width": @(textView.contentSize.width)
    },
    @"target": self.reactTag,
    @"eventCount": @(_nativeEventCount),
  });
}

- (void)textViewDidEndEditing:(UITextView *)textView
{
  if (_nativeUpdatesInFlight) {
    // iOS does't call `textViewDidChange:` delegate method if the change was happened because of autocorrection
    // which was triggered by loosing focus. So, we call it manually.
    [self textViewDidChange:textView];
  }

  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeEnd
                                 reactTag:self.reactTag
                                     text:textView.text
                                      key:nil
                               eventCount:_nativeEventCount];

  [_eventDispatcher sendTextEventWithType:RCTTextEventTypeBlur
                                 reactTag:self.reactTag
                                     text:nil
                                      key:nil
                               eventCount:_nativeEventCount];
}

#pragma mark - UIResponder

- (BOOL)isFirstResponder
{
  return [_textView isFirstResponder];
}

- (BOOL)canBecomeFirstResponder
{
  return [_textView canBecomeFirstResponder];
}

- (void)reactWillMakeFirstResponder
{
  [_textView reactWillMakeFirstResponder];
}

- (BOOL)becomeFirstResponder
{
  return [_textView becomeFirstResponder];
}

- (void)reactDidMakeFirstResponder
{
  [_textView reactDidMakeFirstResponder];
}

- (BOOL)resignFirstResponder
{
  [super resignFirstResponder];
  return [_textView resignFirstResponder];
}

#pragma mark - Content Size

- (CGSize)contentSize
{
  // Returning value does NOT include insets.
  CGSize contentSize = self.intrinsicContentSize;
  contentSize.width -= _contentInset.left + _contentInset.right;
  contentSize.height -= _contentInset.top + _contentInset.bottom;
  return contentSize;
}

- (void)invalidateContentSize
{
  CGSize contentSize = self.contentSize;

  if (CGSizeEqualToSize(_previousContentSize, contentSize)) {
    return;
  }
  _previousContentSize = contentSize;

  [_bridge.uiManager setIntrinsicContentSize:contentSize forView:self];

  if (_onContentSizeChange) {
    _onContentSizeChange(@{
      @"contentSize": @{
        @"height": @(contentSize.height),
        @"width": @(contentSize.width),
      },
      @"target": self.reactTag,
    });
  }
}

#pragma mark - Layout

- (CGSize)intrinsicContentSize
{
  // Calling `sizeThatFits:` is probably more expensive method to compute
  // content size compare to direct access `_textView.contentSize` property,
  // but seems `sizeThatFits:` returns more reliable and consistent result.
  // Returning value DOES include insets.
  return [self sizeThatFits:CGSizeMake(self.bounds.size.width, INFINITY)];
}

- (CGSize)sizeThatFits:(CGSize)size
{
  return [_textView sizeThatFits:size];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self invalidateContentSize];
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  if (_onScroll) {
    CGPoint contentOffset = scrollView.contentOffset;
    CGSize contentSize = scrollView.contentSize;
    CGSize size = scrollView.bounds.size;
    UIEdgeInsets contentInset = scrollView.contentInset;

    _onScroll(@{
      @"contentOffset": @{
        @"x": @(contentOffset.x),
        @"y": @(contentOffset.y)
      },
      @"contentInset": @{
        @"top": @(contentInset.top),
        @"left": @(contentInset.left),
        @"bottom": @(contentInset.bottom),
        @"right": @(contentInset.right)
      },
      @"contentSize": @{
        @"width": @(contentSize.width),
        @"height": @(contentSize.height)
      },
      @"layoutMeasurement": @{
        @"width": @(size.width),
        @"height": @(size.height)
      },
      @"zoomScale": @(scrollView.zoomScale ?: 1),
    });
  }
}

@end
