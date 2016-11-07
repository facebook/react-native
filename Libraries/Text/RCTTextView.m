/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextView.h"

#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTShadowText.h"
#import "RCTText.h"
#import "RCTUtils.h"
#import "RCTTextSelection.h"
#import "UIView+React.h"

@interface RCTUITextView : UITextView

@property (nonatomic, assign) BOOL textWasPasted;

@end

@implementation RCTUITextView
{
  BOOL _jsRequestingFirstResponder;
}

- (void)paste:(id)sender
{
  _textWasPasted = YES;
  [super paste:sender];
}

- (void)reactWillMakeFirstResponder
{
  _jsRequestingFirstResponder = YES;
}

- (BOOL)canBecomeFirstResponder
{
  return _jsRequestingFirstResponder;
}

- (void)reactDidMakeFirstResponder
{
  _jsRequestingFirstResponder = NO;
}

- (void)didMoveToWindow
{
  if (_jsRequestingFirstResponder) {
    [self becomeFirstResponder];
    [self reactDidMakeFirstResponder];
  }
}

@end

@implementation RCTTextView
{
  RCTEventDispatcher *_eventDispatcher;

  NSString *_placeholder;
  UITextView *_placeholderView;
  UITextView *_textView;
  RCTText *_richTextView;
  NSAttributedString *_pendingAttributedText;
  UIScrollView *_scrollView;

  UITextRange *_previousSelectionRange;
  NSUInteger _previousTextLength;
  CGFloat _previousContentHeight;
  NSString *_predictedText;

  BOOL _blockTextShouldChange;
  BOOL _nativeUpdatesInFlight;
  NSInteger _nativeEventCount;

  CGSize _previousContentSize;
  BOOL _viewDidCompleteInitialLayout;
}

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  RCTAssertParam(eventDispatcher);

  if ((self = [super initWithFrame:CGRectZero])) {
    _contentInset = UIEdgeInsetsZero;
    _eventDispatcher = eventDispatcher;
    _placeholderTextColor = [self defaultPlaceholderTextColor];
    _blurOnSubmit = NO;

    _textView = [[RCTUITextView alloc] initWithFrame:CGRectZero];
    _textView.backgroundColor = [UIColor clearColor];
    _textView.textColor = [UIColor blackColor];
#if !TARGET_OS_TV
    _textView.scrollsToTop = NO;
#endif
    _textView.scrollEnabled = NO;
    _textView.delegate = self;

    _scrollView = [[UIScrollView alloc] initWithFrame:CGRectZero];
#if !TARGET_OS_TV
    _scrollView.scrollsToTop = NO;
#endif
    [_scrollView addSubview:_textView];

    [self addSubview:_scrollView];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithFrame:(CGRect)frame)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

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
    // always has a clear background color in -initWithEventDispatcher:.
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
  // Do nothing, as we don't allow non-text subviews
}

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

  [self updatePlaceholderVisibility];

  _blockTextShouldChange = NO;
}

- (void)updateFrames
{
  // Adjust the insets so that they are as close as possible to single-line
  // RCTTextField defaults, using the system defaults of font size 17 and a
  // height of 31 points.
  //
  // We apply the left inset to the frame since a negative left text-container
  // inset mysteriously causes the text to be hidden until the text view is
  // first focused.
  UIEdgeInsets adjustedFrameInset = UIEdgeInsetsZero;
  adjustedFrameInset.left = _contentInset.left - 5;

  UIEdgeInsets adjustedTextContainerInset = _contentInset;
  adjustedTextContainerInset.top += 5;
  adjustedTextContainerInset.left = 0;

  CGRect frame = UIEdgeInsetsInsetRect(self.bounds, adjustedFrameInset);
  _textView.frame = frame;
  _placeholderView.frame = frame;
  _scrollView.frame = frame;
  [self updateContentSize];

  _textView.textContainerInset = adjustedTextContainerInset;
  _placeholderView.textContainerInset = adjustedTextContainerInset;
}

- (void)updateContentSize
{
  CGSize size = (CGSize){_scrollView.frame.size.width, INFINITY};
  size.height = [_textView sizeThatFits:size].height;
  _scrollView.contentSize = size;
  _textView.frame = (CGRect){CGPointZero, size};

  if (_viewDidCompleteInitialLayout && _onContentSizeChange && !CGSizeEqualToSize(_previousContentSize, size)) {
    _previousContentSize = size;
    _onContentSizeChange(@{
      @"contentSize": @{
        @"height": @(size.height),
        @"width": @(size.width),
      },
      @"target": self.reactTag,
    });
  }
}

- (void)updatePlaceholder
{
  [_placeholderView removeFromSuperview];
  _placeholderView = nil;

  if (_placeholder) {
    _placeholderView = [[UITextView alloc] initWithFrame:self.bounds];
    _placeholderView.userInteractionEnabled = NO;
    _placeholderView.backgroundColor = [UIColor clearColor];
    _placeholderView.scrollEnabled = NO;
#if !TARGET_OS_TV
    _placeholderView.editable = NO;
    _placeholderView.scrollsToTop = NO;
#endif
    _placeholderView.attributedText =
    [[NSAttributedString alloc] initWithString:_placeholder attributes:@{
      NSFontAttributeName : (_textView.font ? _textView.font : [self defaultPlaceholderFont]),
      NSForegroundColorAttributeName : _placeholderTextColor
    }];
    _placeholderView.textAlignment = _textView.textAlignment;

    [self insertSubview:_placeholderView belowSubview:_textView];
    [self updatePlaceholderVisibility];
  }
}

- (UIFont *)font
{
  return _textView.font;
}

- (void)setFont:(UIFont *)font
{
  _textView.font = font;
  [self updatePlaceholder];
}

- (void)setPlaceholder:(NSString *)placeholder
{
  _placeholder = placeholder;
  [self updatePlaceholder];
}

- (void)setPlaceholderTextColor:(UIColor *)placeholderTextColor
{
  if (placeholderTextColor) {
    _placeholderTextColor = placeholderTextColor;
  } else {
    _placeholderTextColor = [self defaultPlaceholderTextColor];
  }
  [self updatePlaceholder];
}

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  _contentInset = contentInset;
  [self updateFrames];
}

- (BOOL)textView:(RCTUITextView *)textView shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
  if (textView.textWasPasted) {
    textView.textWasPasted = NO;
  } else {
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

- (NSString *)text
{
  return _textView.text;
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

    [self updatePlaceholderVisibility];
    [self updateContentSize]; //keep the text wrapping when the length of
    //the textline has been extended longer than the length of textinputView
  } else if (eventLag > RCTTextUpdateLagWarningThreshold) {
    RCTLogWarn(@"Native TextInput(%@) is %zd events ahead of JS - try to make your JS faster.", self.text, eventLag);
  }
}

- (void)updatePlaceholderVisibility
{
  if (_textView.text.length > 0) {
    [_placeholderView setHidden:YES];
  } else {
    [_placeholderView setHidden:NO];
  }
}

- (void)setAutoCorrect:(BOOL)autoCorrect
{
  _textView.autocorrectionType = (autoCorrect ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo);
}

- (BOOL)autoCorrect
{
  return _textView.autocorrectionType == UITextAutocorrectionTypeYes;
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
    [self updatePlaceholderVisibility];
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
  [self updatePlaceholderVisibility];
  [self updateContentSize];

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

- (void)layoutSubviews
{
  [super layoutSubviews];

  // Start sending content size updates only after the view has been laid out
  // otherwise we send multiple events with bad dimensions on initial render.
  _viewDidCompleteInitialLayout = YES;

  [self updateFrames];
}

- (UIFont *)defaultPlaceholderFont
{
  return [UIFont systemFontOfSize:17];
}

- (UIColor *)defaultPlaceholderTextColor
{
  return [UIColor colorWithRed:0.0/255.0 green:0.0/255.0 blue:0.098/255.0 alpha:0.22];
}

@end
