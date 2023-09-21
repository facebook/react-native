/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTMultilineTextInputView.h>

#import <React/RCTUtils.h>

#import <React/RCTUITextView.h>

@implementation RCTMultilineTextInputView {
#if TARGET_OS_OSX // [macOS
  RCTUIScrollView *_scrollView;
  RCTClipView *_clipView;
#endif // macOS]
  RCTUITextView *_backedTextInputView;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    _backedTextInputView = [[RCTUITextView alloc] initWithFrame:self.bounds];
    _backedTextInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
#if TARGET_OS_OSX // [macOS
    self.hideVerticalScrollIndicator = NO;
    _scrollView = [[RCTUIScrollView alloc] initWithFrame:self.bounds];
    _scrollView.backgroundColor = [RCTUIColor clearColor];
    _scrollView.drawsBackground = NO;
    _scrollView.borderType = NSNoBorder;
    _scrollView.hasHorizontalRuler = NO;
    _scrollView.hasVerticalRuler = NO;
    _scrollView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    [_scrollView setHasVerticalScroller:YES];
    
    _clipView = [[RCTClipView alloc] initWithFrame:_scrollView.frame];
    [_scrollView setContentView:_clipView];
    
    _backedTextInputView.verticallyResizable = YES;
    _backedTextInputView.horizontallyResizable = YES;
    _backedTextInputView.textContainer.containerSize = NSMakeSize(CGFLOAT_MAX, CGFLOAT_MAX);
    _backedTextInputView.textContainer.widthTracksTextView = YES;
#endif // macOS]
    _backedTextInputView.textInputDelegate = self;

#if !TARGET_OS_OSX // [macOS]
    [self addSubview:_backedTextInputView];
#else // [macOS
    _scrollView.documentView = _backedTextInputView;
    _scrollView.contentView.postsBoundsChangedNotifications = YES;
    // Enable focus ring by default
    _scrollView.enableFocusRing = YES;
    [self addSubview:_scrollView];
    
    // a register for those notifications on the content view.
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(boundDidChange:)
                                                 name:NSViewBoundsDidChangeNotification
                                               object:_scrollView.contentView];
#endif // macOS]
  }

  return self;
}

#if TARGET_OS_OSX // [macOS
- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}
#endif // macOS]

- (id<RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInputView;
}

#if TARGET_OS_OSX // [macOS
- (void)setReactPaddingInsets:(UIEdgeInsets)reactPaddingInsets
{
  [super setReactPaddingInsets:reactPaddingInsets];
  // We apply `paddingInsets` as `backedTextInputView`'s `textContainerInsets` on mac.
  ((RCTUITextView*)self.backedTextInputView).textContainerInsets = reactPaddingInsets;
  [self setNeedsLayout];
}

- (void)setReactBorderInsets:(UIEdgeInsets)reactBorderInsets
{
  [super setReactBorderInsets:reactBorderInsets];
  // We apply `borderInsets` as `_scrollView` layout offset on mac.
  _scrollView.frame = UIEdgeInsetsInsetRect(self.bounds, reactBorderInsets);
  [self setNeedsLayout];
}

- (void)setEnableFocusRing:(BOOL)enableFocusRing 
{
  [super setEnableFocusRing:enableFocusRing];
  if ([_scrollView respondsToSelector:@selector(setEnableFocusRing:)]) {
    [_scrollView setEnableFocusRing:enableFocusRing];
  }
}

- (void)setReadablePasteBoardTypes:(NSArray<NSPasteboardType> *)readablePasteboardTypes 
{
  [_backedTextInputView setReadablePasteBoardTypes:readablePasteboardTypes];
}

- (void)setScrollEnabled:(BOOL)scrollEnabled
{
  if (scrollEnabled) {
    _scrollView.scrollEnabled = YES;
    [_clipView setConstrainScrolling:NO];
  } else {
    _scrollView.scrollEnabled = NO;
    [_clipView setConstrainScrolling:YES];
  }
}

- (BOOL)scrollEnabled
{
  return _scrollView.isScrollEnabled;
}

- (BOOL)shouldShowVerticalScrollbar
{
  // Hide vertical scrollbar if explicity set to NO
  if (self.hideVerticalScrollIndicator) {
    return NO;
  }

  // Hide vertical scrollbar if attributed text overflows view
  CGSize textViewSize = [_backedTextInputView intrinsicContentSize];
  NSClipView *clipView = (NSClipView *)_scrollView.contentView;
  if (textViewSize.height > clipView.bounds.size.height) {
    return YES;
  };

  return NO;
}

- (void)textInputDidChange
{
  [super textInputDidChange];

  [_scrollView setHasVerticalScroller:[self shouldShowVerticalScrollbar]];
}

- (void)setAttributedText:(NSAttributedString *)attributedText
{
  [super setAttributedText:attributedText];
  
  [_scrollView setHasVerticalScroller:[self shouldShowVerticalScrollbar]];
}

#endif // macOS]

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(RCTUIScrollView *)scrollView // [macOS]
{
  RCTDirectEventBlock onScroll = self.onScroll;
  if (onScroll) {
    CGPoint contentOffset = scrollView.contentOffset;
    CGSize contentSize = scrollView.contentSize;
    CGSize size = scrollView.bounds.size;
    UIEdgeInsets contentInset = scrollView.contentInset;

    onScroll(@{
      @"contentOffset" : @{@"x" : @(contentOffset.x), @"y" : @(contentOffset.y)},
      @"contentInset" : @{
        @"top" : @(contentInset.top),
        @"left" : @(contentInset.left),
        @"bottom" : @(contentInset.bottom),
        @"right" : @(contentInset.right)
      },
      @"contentSize" : @{@"width" : @(contentSize.width), @"height" : @(contentSize.height)},
      @"layoutMeasurement" : @{@"width" : @(size.width), @"height" : @(size.height)},
      @"zoomScale" : @(scrollView.zoomScale ?: 1),
    });
  }
}

#if TARGET_OS_OSX // [macOS

#pragma mark - Notification handling

- (void)boundDidChange:(NSNotification*)NSNotification
{
  [self scrollViewDidScroll:_scrollView];
}

#pragma mark - NSResponder chain

- (BOOL)acceptsFirstResponder
{
  return _backedTextInputView.acceptsFirstResponder;
}

#endif // macOS]

@end
