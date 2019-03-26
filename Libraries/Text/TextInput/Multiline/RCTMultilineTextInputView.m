/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTMultilineTextInputView.h"

#import <React/RCTUtils.h>

#import "RCTUITextView.h"

@implementation RCTMultilineTextInputView
{
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
  UIScrollView *_scrollView;
#endif // ]TODO(macOS ISS#2323203)
  RCTUITextView *_backedTextInputView;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super initWithBridge:bridge]) {
    // `blurOnSubmit` defaults to `false` for <TextInput multiline={true}> by design.
    self.blurOnSubmit = NO;

    _backedTextInputView = [[RCTUITextView alloc] initWithFrame:self.bounds];
    _backedTextInputView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _backedTextInputView.backgroundColor = [UIColor clearColor];
    _backedTextInputView.textColor = [UIColor blackColor];
    // This line actually removes 5pt (default value) left and right padding in UITextView.
    _backedTextInputView.textContainer.lineFragmentPadding = 0;
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
#if !TARGET_OS_TV
    _backedTextInputView.scrollsToTop = NO;
#endif
    _backedTextInputView.scrollEnabled = YES;
#else // [TODO(macOS ISS#2323203)
    _scrollView = [[UIScrollView alloc] initWithFrame:self.bounds];
    _scrollView.backgroundColor = [UIColor clearColor];
    _scrollView.drawsBackground = NO;
    _scrollView.borderType = NSNoBorder;
    _scrollView.hasHorizontalRuler = NO;
    _scrollView.hasVerticalRuler = NO;
    _scrollView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    
    _backedTextInputView.verticallyResizable = YES;
    _backedTextInputView.horizontallyResizable = YES;
    _backedTextInputView.textContainer.containerSize = NSMakeSize(CGFLOAT_MAX, CGFLOAT_MAX);
    _backedTextInputView.textContainer.widthTracksTextView = YES;
#endif // ]TODO(macOS ISS#2323203)
    _backedTextInputView.textInputDelegate = self;

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    [self addSubview:_backedTextInputView];
#else // [TODO(macOS ISS#2323203)
    _scrollView.documentView = _backedTextInputView;
    _scrollView.contentView.postsBoundsChangedNotifications = YES;
    [self addSubview:_scrollView];
    
    // a register for those notifications on the content view.
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(boundDidChange:)
                                                 name:NSViewBoundsDidChangeNotification
                                               object:_scrollView.contentView];
#endif // ]TODO(macOS ISS#2323203)
  }

  return self;
}

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}
#endif // ]TODO(macOS ISS#2323203)

- (id<RCTBackedTextInputViewProtocol>)backedTextInputView
{
  return _backedTextInputView;
}

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
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
  _scrollView.frame = UIEdgeInsetsInsetRect(self.frame, reactBorderInsets);
  [self setNeedsLayout];
}
#endif // ]TODO(macOS ISS#2323203)

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  RCTDirectEventBlock onScroll = self.onScroll;

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

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)

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

#endif // ]TODO(macOS ISS#2323203)

@end
