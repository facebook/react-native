/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTMultilineTextInputView.h>

#import <React/RCTUtils.h>

#import <React/RCTUITextView.h>

@implementation RCTMultilineTextInputView
{
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  RCTUIScrollView *_scrollView;
#endif // ]TODO(macOS GH#774)
  RCTUITextView *_backedTextInputView;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    // `blurOnSubmit` defaults to `false` for <TextInput multiline={true}> by design.
    self.blurOnSubmit = NO;

    _backedTextInputView = [[RCTUITextView alloc] initWithFrame:self.bounds];
    _backedTextInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
#if TARGET_OS_OSX // TODO(macOS GH#774)
    _scrollView = [[RCTUIScrollView alloc] initWithFrame:self.bounds]; // TODO(macOS ISS#3536887)
    _scrollView.backgroundColor = [RCTUIColor clearColor];
    _scrollView.drawsBackground = NO;
    _scrollView.borderType = NSNoBorder;
    _scrollView.hasHorizontalRuler = NO;
    _scrollView.hasVerticalRuler = NO;
    _scrollView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    
    _backedTextInputView.verticallyResizable = YES;
    _backedTextInputView.horizontallyResizable = YES;
    _backedTextInputView.textContainer.containerSize = NSMakeSize(CGFLOAT_MAX, CGFLOAT_MAX);
    _backedTextInputView.textContainer.widthTracksTextView = YES;
#endif // ]TODO(macOS GH#774)
    _backedTextInputView.textInputDelegate = self;

#if !TARGET_OS_OSX // TODO(macOS GH#774)
    [self addSubview:_backedTextInputView];
#else // [TODO(macOS GH#774)
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
#endif // ]TODO(macOS GH#774)
  }

  return self;
}

#if TARGET_OS_OSX // [TODO(macOS GH#774)
- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}
#endif // ]TODO(macOS GH#774)

- (id<RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInputView;
}

#if TARGET_OS_OSX // [TODO(macOS GH#774)
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

- (void)setEnableFocusRing:(BOOL)enableFocusRing {
  [super setEnableFocusRing:enableFocusRing];
  if ([_scrollView respondsToSelector:@selector(setEnableFocusRing:)]) {
    [_scrollView setEnableFocusRing:enableFocusRing];
  }
}

#endif // ]TODO(macOS GH#774)

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(RCTUIScrollView *)scrollView // TODO(macOS ISS#3536887)
{
  RCTDirectEventBlock onScroll = self.onScroll;
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  [_scrollView setHasVerticalScroller:YES];
#endif // ]TODO(macOS GH#774)
  if (onScroll) {
    CGPoint contentOffset = scrollView.contentOffset;
    CGSize contentSize = scrollView.contentSize;
    CGSize size = scrollView.bounds.size;
    UIEdgeInsets contentInset = scrollView.contentInset;

    onScroll(@{
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

#if TARGET_OS_OSX // [TODO(macOS GH#774)

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

#endif // ]TODO(macOS GH#774)

@end
