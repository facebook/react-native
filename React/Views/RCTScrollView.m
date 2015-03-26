/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTScrollView.h"

#import <UIKit/UIKit.h>

#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUIManager.h"
#import "RCTUtils.h"
#import "UIView+React.h"

CGFloat const ZINDEX_DEFAULT = 0;
CGFloat const ZINDEX_STICKY_HEADER = 50;

/**
 * Include a custom scroll view subclass because we want to limit certain
 * default UIKit behaviors such as textFields automatically scrolling
 * scroll views that contain them and support sticky headers.
 */
@interface RCTCustomScrollView : UIScrollView<UIGestureRecognizerDelegate>

@property (nonatomic, copy, readwrite) NSArray *stickyHeaderIndices;
@property (nonatomic, readwrite, assign) BOOL centerContent;

@end


@implementation RCTCustomScrollView

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    [self.panGestureRecognizer addTarget:self action:@selector(handleCustomPan:)];
  }
  return self;
}

- (UIView *)contentView
{
  return ((RCTScrollView *)self.superview).contentView;
}

/**
 * @return Whether or not the scroll view interaction should be blocked because
 * JS was found to be the responder.
 */
- (BOOL)_shouldDisableScrollInteraction
{
  // Since this may be called on every pan, we need to make sure to only climb
  // the hierarchy on rare occasions.
  UIView *JSResponder = [RCTUIManager JSResponder];
  if (JSResponder && JSResponder != self.superview) {
    BOOL superviewHasResponder = [self isDescendantOfView:JSResponder];
    return superviewHasResponder;
  }
  return NO;
}

- (void)handleCustomPan:(UIPanGestureRecognizer *)sender
{
  if ([self _shouldDisableScrollInteraction]) {
    self.panGestureRecognizer.enabled = NO;
    self.panGestureRecognizer.enabled = YES;
    // TODO: If mid bounce, animate the scroll view to a non-bounced position
    // while disabling (but only if `stopScrollInteractionIfJSHasResponder` was
    // called *during* a `pan`. Currently, it will just snap into place which
    // is not so bad either.
    // Another approach:
    // self.scrollEnabled = NO;
    // self.scrollEnabled = YES;
  }
}

- (void)scrollRectToVisible:(CGRect)rect animated:(BOOL)animated
{
  // noop
}

/**
 * Returning `YES` cancels touches for the "inner" `view` and causes a scroll.
 * Returning `NO` causes touches to be directed to that inner view and prevents
 * the scroll view from scrolling.
 *
 * `YES` -> Allows scrolling.
 * `NO` -> Doesn't allow scrolling.
 *
 * By default this returns NO for all views that are UIControls and YES for
 * everything else. What that does is allows scroll views to scroll even when a
 * touch started inside of a `UIControl` (`UIButton` etc). For React scroll
 * views, we want the default to be the same behavior as `UIControl`s so we
 * return `YES` by default. But there's one case where we want to block the
 * scrolling no matter what: When JS believes it has its own responder lock on
 * a view that is *above* the scroll view in the hierarchy. So we abuse this
 * `touchesShouldCancelInContentView` API in order to stop the scroll view from
 * scrolling in this case.
 *
 * We are not aware of *any* other solution to the problem because alternative
 * approaches require that we disable the scrollview *before* touches begin or
 * move. This approach (`touchesShouldCancelInContentView`) works even if the
 * JS responder is set after touches start/move because
 * `touchesShouldCancelInContentView` is called as soon as the scroll view has
 * been touched and dragged *just* far enough to decide to begin the "drag"
 * movement of the scroll interaction. Returning `NO`, will cause the drag
 * operation to fail.
 *
 * `touchesShouldCancelInContentView` will stop the *initialization* of a
 * scroll pan gesture and most of the time this is sufficient. On rare
 * occasion, the scroll gesture would have already initialized right before JS
 * notifies native of the JS responder being set. In order to recover from that
 * timing issue we have a fallback that kills any ongoing pan gesture that
 * occurs when native is notified of a JS responder.
 *
 * Note: Explicitly returning `YES`, instead of relying on the default fixes
 * (at least) one bug where if you have a UIControl inside a UIScrollView and
 * tap on the UIControl and then start dragging (to scroll), it won't scroll.
 * Chat with andras for more details.
 *
 * In order to have this called, you must have delaysContentTouches set to NO
 * (which is the not the `UIKit` default).
 */
- (BOOL)touchesShouldCancelInContentView:(UIView *)view
{
  //TODO: shouldn't this call super if _shouldDisableScrollInteraction returns NO?
  return ![self _shouldDisableScrollInteraction];
}

/*
 * Automatically centers the content such that if the content is smaller than the
 * ScrollView, we force it to be centered, but when you zoom or the content otherwise
 * becomes larger than the ScrollView, there is no padding around the content but it
 * can still fill the whole view.
 */
- (void)setContentOffset:(CGPoint)contentOffset
{
  UIView *contentView = [self contentView];
  if (contentView && _centerContent) {
    CGSize subviewSize = contentView.frame.size;
    CGSize scrollViewSize = self.bounds.size;
    if (subviewSize.width < scrollViewSize.width) {
      contentOffset.x = -(scrollViewSize.width - subviewSize.width) / 2.0;
    }
    if (subviewSize.height < scrollViewSize.height) {
      contentOffset.y = -(scrollViewSize.height - subviewSize.height) / 2.0;
    }
  }
  [super setContentOffset:contentOffset];
}

- (void)setBounds:(CGRect)bounds
{
  [super setBounds:bounds];
  [self dockClosestSectionHeader];
}

- (void)dockClosestSectionHeader
{
  UIView *contentView = [self contentView];
  if (_stickyHeaderIndices.count == 0 || !contentView) {
    return;
  }

  // find the section header that needs to be docked
  NSInteger firstIndexInView = [[_stickyHeaderIndices firstObject] integerValue] + 1;
  CGRect scrollBounds = self.bounds;
  scrollBounds.origin.x += self.contentInset.left;
  scrollBounds.origin.y += self.contentInset.top;

  NSInteger i = 0;
  for (UIView *subview in contentView.subviews) {
    CGRect rowFrame = [RCTCustomScrollView _calculateUntransformedFrame:subview];
    if (CGRectIntersectsRect(scrollBounds, rowFrame)) {
      firstIndexInView = i;
      break;
    }
    i++;
  }
  NSInteger stickyHeaderii = 0;
  for (NSNumber *stickyHeaderI in _stickyHeaderIndices) {
    if ([stickyHeaderI integerValue] > firstIndexInView) {
      break;
    }
    stickyHeaderii++;
  }
  stickyHeaderii = MAX(0, stickyHeaderii - 1);

  // Set up transforms for the various section headers
  NSInteger currentlyDockedIndex = [_stickyHeaderIndices[stickyHeaderii] integerValue];
  NSInteger previouslyDockedIndex = stickyHeaderii > 0 ? [_stickyHeaderIndices[stickyHeaderii-1] integerValue] : -1;
  NSInteger nextDockedIndex = (stickyHeaderii < _stickyHeaderIndices.count - 1) ?
    [_stickyHeaderIndices[stickyHeaderii + 1] integerValue] : -1;

  UIView *currentHeader = contentView.subviews[currentlyDockedIndex];
  UIView *previousHeader = previouslyDockedIndex >= 0 ? contentView.subviews[previouslyDockedIndex] : nil;
  CGRect curFrame = [RCTCustomScrollView _calculateUntransformedFrame:currentHeader];

  if (previousHeader) {
    // the previous header is offset to sit right above the currentlyDockedHeader's initial position
    // (so it scrolls away nicely once the currentHeader locks into position)
    CGRect previousFrame = [RCTCustomScrollView _calculateUntransformedFrame:previousHeader];
    CGFloat yOffset = curFrame.origin.y - previousFrame.origin.y - previousFrame.size.height;
    previousHeader.transform = CGAffineTransformMakeTranslation(0, yOffset);
  }

  UIView *nextHeader = nextDockedIndex >= 0 ? contentView.subviews[nextDockedIndex] : nil;
  CGRect nextFrame = [RCTCustomScrollView _calculateUntransformedFrame:nextHeader];

  if (curFrame.origin.y < scrollBounds.origin.y) {
    // scrolled off (or being scrolled off) the top of the screen
    CGFloat yOffset = 0;
    if (nextHeader && nextFrame.origin.y < scrollBounds.origin.y + curFrame.size.height) {
      // next frame is bumping me off if scrolling down (or i'm bumping the next one off if scrolling up)
      yOffset = nextFrame.origin.y - curFrame.origin.y - curFrame.size.height;
    } else {
      // standard sticky header position
      yOffset = scrollBounds.origin.y - curFrame.origin.y;
    }
    currentHeader.transform = CGAffineTransformMakeTranslation(0, yOffset);
    currentHeader.layer.zPosition = ZINDEX_STICKY_HEADER;
  } else {
    // i'm the current header but in the viewport, so just scroll in normal position
    currentHeader.transform = CGAffineTransformIdentity;
    currentHeader.layer.zPosition = ZINDEX_DEFAULT;
  }

  // in our setup, 'next header' will always just scroll with the page
  if (nextHeader) {
    nextHeader.transform = CGAffineTransformIdentity;
    nextHeader.layer.zPosition = ZINDEX_DEFAULT;
  }
}

+ (CGRect)_calculateUntransformedFrame:(UIView *)view
{
  CGRect frame = CGRectNull;
  if (view) {
    frame.size = view.bounds.size;
    frame.origin = CGPointMake(view.layer.position.x - view.bounds.size.width * view.layer.anchorPoint.x, view.layer.position.y - view.bounds.size.height * view.layer.anchorPoint.y);
  }
  return frame;
}

@end

@implementation RCTScrollView
{
  RCTEventDispatcher *_eventDispatcher;
  RCTCustomScrollView *_scrollView;
  UIView *_contentView;
  NSTimeInterval _lastScrollDispatchTime;
  NSMutableArray *_cachedChildFrames;
  BOOL _allowNextScrollNoMatterWhat;
}

@synthesize nativeMainScrollDelegate = _nativeMainScrollDelegate;

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithFrame:CGRectZero])) {

    _eventDispatcher = eventDispatcher;
    _scrollView = [[RCTCustomScrollView alloc] initWithFrame:CGRectZero];
    _scrollView.delegate = self;
    _scrollView.delaysContentTouches = NO;
    _automaticallyAdjustContentInsets = YES;
    _contentInset = UIEdgeInsetsZero;
    _contentSize = CGSizeZero;

    _throttleScrollCallbackMS = 0;
    _lastScrollDispatchTime = CACurrentMediaTime();
    _cachedChildFrames = [[NSMutableArray alloc] init];

    [self addSubview:_scrollView];
  }
  return self;
}

- (void)setRemoveClippedSubviews:(__unused BOOL)removeClippedSubviews
{
  // Does nothing
}

- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  RCTAssert(_contentView == nil, @"RCTScrollView may only contain a single subview");
  _contentView = view;
  [_scrollView addSubview:view];
}

- (void)removeReactSubview:(UIView *)subview
{
  RCTAssert(_contentView == subview, @"Attempted to remove non-existent subview");
  _contentView = nil;
  [subview removeFromSuperview];
}

- (NSArray *)reactSubviews
{
  return _contentView ? @[_contentView] : @[];
}

- (void)setCenterContent:(BOOL)centerContent
{
  _scrollView.centerContent = centerContent;
}

- (void)setStickyHeaderIndices:(NSArray *)headerIndices
{
  RCTAssert(_scrollView.contentSize.width <= self.frame.size.width,
           @"sticky headers are not supported with horizontal scrolled views");
  _scrollView.stickyHeaderIndices = headerIndices;
}

- (void)dealloc
{
  _scrollView.delegate = nil;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  RCTAssert(self.subviews.count == 1, @"we should only have exactly one subview");
  RCTAssert([self.subviews lastObject] == _scrollView, @"our only subview should be a scrollview");
  _scrollView.frame = self.bounds;

  [RCTView autoAdjustInsetsForView:self
                    withScrollView:_scrollView
                      updateOffset:YES];

  [self updateClippedSubviews];
}

- (void)setContentInset:(UIEdgeInsets)contentInset
{
  CGPoint contentOffset = _scrollView.contentOffset;

  _contentInset = contentInset;
  [RCTView autoAdjustInsetsForView:self
                    withScrollView:_scrollView
                      updateOffset:NO];

  _scrollView.contentOffset = contentOffset;
}

- (void)scrollToOffset:(CGPoint)offset
{
  [self scrollToOffset:offset animated:YES];
}

- (void)scrollToOffset:(CGPoint)offset animated:(BOOL)animated
{
  if (!CGPointEqualToPoint(_scrollView.contentOffset, offset)) {
    [_scrollView setContentOffset:offset animated:animated];
  }
}

- (void)zoomToRect:(CGRect)rect animated:(BOOL)animated
{
  [_scrollView zoomToRect:rect animated:animated];
}

#pragma mark - ScrollView delegate

#define RCT_SCROLL_EVENT_HANDLER(delegateMethod, eventName) \
- (void)delegateMethod:(UIScrollView *)scrollView           \
{                                                           \
  [_eventDispatcher sendScrollEventWithType:eventName reactTag:self.reactTag scrollView:scrollView userData:nil]; \
  if ([_nativeMainScrollDelegate respondsToSelector:_cmd]) { \
    [_nativeMainScrollDelegate delegateMethod:scrollView]; \
  } \
}

#define RCT_FORWARD_SCROLL_EVENT(call) \
if ([_nativeMainScrollDelegate respondsToSelector:_cmd]) { \
  [_nativeMainScrollDelegate call]; \
}

RCT_SCROLL_EVENT_HANDLER(scrollViewDidEndScrollingAnimation, RCTScrollEventTypeEndDeceleration)
RCT_SCROLL_EVENT_HANDLER(scrollViewWillBeginDecelerating, RCTScrollEventTypeStartDeceleration)
RCT_SCROLL_EVENT_HANDLER(scrollViewDidEndDecelerating, RCTScrollEventTypeEndDeceleration)
RCT_SCROLL_EVENT_HANDLER(scrollViewDidZoom, RCTScrollEventTypeMove)

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  [self updateClippedSubviews];

  NSTimeInterval now = CACurrentMediaTime();
  NSTimeInterval throttleScrollCallbackSeconds = _throttleScrollCallbackMS / 1000.0;

  /**
   * TODO: this logic looks wrong, and it may be because it is. Currently, if _throttleScrollCallbackMS
   * is set to zero (the default), the "didScroll" event is only sent once per scroll, instead of repeatedly
   * while scrolling as expected. However, if you "fix" that bug, ScrollView will generate repeated
   * warnings, and behave strangely (ListView works fine however), so don't fix it unless you fix that too!
   */
  if (_allowNextScrollNoMatterWhat ||
      (_throttleScrollCallbackMS != 0 && throttleScrollCallbackSeconds < (now - _lastScrollDispatchTime))) {

    // Calculate changed frames
    NSMutableArray *updatedChildFrames = [[NSMutableArray alloc] init];
    [[_contentView reactSubviews] enumerateObjectsUsingBlock:^(UIView *subview, NSUInteger idx, BOOL *stop) {

      // Check if new or changed
      CGRect newFrame = subview.frame;
      BOOL frameChanged = NO;
      if (_cachedChildFrames.count <= idx) {
        frameChanged = YES;
        [_cachedChildFrames addObject:[NSValue valueWithCGRect:newFrame]];
      } else if (!CGRectEqualToRect(newFrame, [_cachedChildFrames[idx] CGRectValue])) {
        frameChanged = YES;
        _cachedChildFrames[idx] = [NSValue valueWithCGRect:newFrame];
      }

      // Create JS frame object
      if (frameChanged) {
        [updatedChildFrames addObject: @{
          @"index": @(idx),
          @"x": @(newFrame.origin.x),
          @"y": @(newFrame.origin.y),
          @"width": @(newFrame.size.width),
          @"height": @(newFrame.size.height),
        }];
      }

    }];

    // If there are new frames, add them to event data
    NSDictionary *userData = nil;
    if (updatedChildFrames.count > 0) {
      userData = @{@"updatedChildFrames": updatedChildFrames};
    }

    // Dispatch event
    [_eventDispatcher sendScrollEventWithType:RCTScrollEventTypeMove
                                     reactTag:self.reactTag
                                   scrollView:scrollView
                                     userData:userData];
    // Update dispatch time
    _lastScrollDispatchTime = now;
    _allowNextScrollNoMatterWhat = NO;
  }
  RCT_FORWARD_SCROLL_EVENT(scrollViewDidScroll:scrollView);
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
  _allowNextScrollNoMatterWhat = YES; // Ensure next scroll event is recorded, regardless of throttle
  [_eventDispatcher sendScrollEventWithType:RCTScrollEventTypeStart reactTag:self.reactTag scrollView:scrollView userData:nil];
  RCT_FORWARD_SCROLL_EVENT(scrollViewWillBeginDragging:scrollView);
}

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView withVelocity:(CGPoint)velocity targetContentOffset:(inout CGPoint *)targetContentOffset
{
  [_eventDispatcher sendScrollEventWithType:RCTScrollEventTypeEnd reactTag:self.reactTag scrollView:scrollView userData:nil];
  RCT_FORWARD_SCROLL_EVENT(scrollViewWillEndDragging:scrollView withVelocity:velocity targetContentOffset:targetContentOffset);
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
  RCT_FORWARD_SCROLL_EVENT(scrollViewDidEndDragging:scrollView willDecelerate:decelerate);
}

- (void)scrollViewWillBeginZooming:(UIScrollView *)scrollView withView:(UIView *)view
{
  [_eventDispatcher sendScrollEventWithType:RCTScrollEventTypeStart reactTag:self.reactTag scrollView:scrollView userData:nil];
  RCT_FORWARD_SCROLL_EVENT(scrollViewWillBeginZooming:scrollView withView:view);
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView withView:(UIView *)view atScale:(CGFloat)scale
{
  [_eventDispatcher sendScrollEventWithType:RCTScrollEventTypeEnd reactTag:self.reactTag scrollView:scrollView userData:nil];
  RCT_FORWARD_SCROLL_EVENT(scrollViewDidEndZooming:scrollView withView:view atScale:scale);
}

- (BOOL)scrollViewShouldScrollToTop:(UIScrollView *)scrollView
{
  if ([_nativeMainScrollDelegate respondsToSelector:_cmd]) {
    return [_nativeMainScrollDelegate scrollViewShouldScrollToTop:scrollView];
  }
  return YES;
}

- (UIView *)viewForZoomingInScrollView:(UIScrollView *)scrollView
{
  return _contentView;
}

#pragma mark - Setters

- (CGSize)_calculateViewportSize
{
  CGSize viewportSize = self.bounds.size;
  if (_automaticallyAdjustContentInsets) {
    UIEdgeInsets contentInsets = [RCTView contentInsetsForView:self];
    viewportSize = CGSizeMake(self.bounds.size.width - contentInsets.left - contentInsets.right,
                                self.bounds.size.height - contentInsets.top - contentInsets.bottom);
  }
  return viewportSize;
}

- (CGPoint)calculateOffsetForContentSize:(CGSize)newContentSize
{
  CGPoint oldOffset = _scrollView.contentOffset;
  CGPoint newOffset = oldOffset;

  CGSize oldContentSize = _scrollView.contentSize;
  CGSize viewportSize = [self _calculateViewportSize];

  BOOL fitsinViewportY = oldContentSize.height <= viewportSize.height && newContentSize.height <= viewportSize.height;
  if (newContentSize.height < oldContentSize.height && !fitsinViewportY) {
    CGFloat offsetHeight = oldOffset.y + viewportSize.height;
    if (oldOffset.y < 0) {
      // overscrolled on top, leave offset alone
    } else if (offsetHeight > oldContentSize.height) {
      // overscrolled on the bottom, preserve overscroll amount
      newOffset.y = MAX(0, oldOffset.y - (oldContentSize.height - newContentSize.height));
    } else if (offsetHeight > newContentSize.height) {
      // offset falls outside of bounds, scroll back to end of list
      newOffset.y = MAX(0, newContentSize.height - viewportSize.height);
    }
  }

  BOOL fitsinViewportX = oldContentSize.width <= viewportSize.width && newContentSize.width <= viewportSize.width;
  if (newContentSize.width < oldContentSize.width && !fitsinViewportX) {
    CGFloat offsetHeight = oldOffset.x + viewportSize.width;
    if (oldOffset.x < 0) {
      // overscrolled at the beginning, leave offset alone
    } else if (offsetHeight > oldContentSize.width && newContentSize.width > viewportSize.width) {
      // overscrolled at the end, preserve overscroll amount as much as possible
      newOffset.x = MAX(0, oldOffset.x - (oldContentSize.width - newContentSize.width));
    } else if (offsetHeight > newContentSize.width) {
      // offset falls outside of bounds, scroll back to end
      newOffset.x = MAX(0, newContentSize.width - viewportSize.width);
    }
  }

  // all other cases, offset doesn't change
  return newOffset;
}

/**
 * Once you set the `contentSize`, to a nonzero value, it is assumed to be
 * managed by you, and we'll never automatically compute the size for you,
 * unless you manually reset it back to {0, 0}
 */
- (CGSize)contentSize
{
  if (!CGSizeEqualToSize(_contentSize, CGSizeZero)) {
    return _contentSize;
  } else if (!_contentView) {
    return CGSizeZero;
  } else {
    CGSize singleSubviewSize = _contentView.frame.size;
    CGPoint singleSubviewPosition = _contentView.frame.origin;
    return (CGSize){
      singleSubviewSize.width + singleSubviewPosition.x,
      singleSubviewSize.height + singleSubviewPosition.y
    };
  }
}

- (void)reactBridgeDidFinishTransaction
{
  CGSize contentSize = self.contentSize;
  if (!CGSizeEqualToSize(_scrollView.contentSize, contentSize)) {
    // When contentSize is set manually, ScrollView internals will reset
    // contentOffset to  {0, 0}. Since we potentially set contentSize whenever
    // anything in the ScrollView updates, we workaround this issue by manually
    // adjusting contentOffset whenever this happens
    CGPoint newOffset = [self calculateOffsetForContentSize:contentSize];
    _scrollView.contentSize = contentSize;
    _scrollView.contentOffset = newOffset;
  }
  [_scrollView dockClosestSectionHeader];
}

// Note: setting several properties of UIScrollView has the effect of
// resetting its contentOffset to {0, 0}. To prevent this, we generate
// setters here that will record the contentOffset beforehand, and
// restore it after the property has been set.

#define RCT_SET_AND_PRESERVE_OFFSET(setter, type)    \
- (void)setter:(type)value                           \
{                                                    \
  CGPoint contentOffset = _scrollView.contentOffset; \
  [_scrollView setter:value];                        \
  _scrollView.contentOffset = contentOffset;         \
}

RCT_SET_AND_PRESERVE_OFFSET(setAlwaysBounceHorizontal, BOOL)
RCT_SET_AND_PRESERVE_OFFSET(setAlwaysBounceVertical, BOOL)
RCT_SET_AND_PRESERVE_OFFSET(setBounces, BOOL)
RCT_SET_AND_PRESERVE_OFFSET(setBouncesZoom, BOOL)
RCT_SET_AND_PRESERVE_OFFSET(setCanCancelContentTouches, BOOL)
RCT_SET_AND_PRESERVE_OFFSET(setDecelerationRate, CGFloat)
RCT_SET_AND_PRESERVE_OFFSET(setDirectionalLockEnabled, BOOL)
RCT_SET_AND_PRESERVE_OFFSET(setKeyboardDismissMode, UIScrollViewKeyboardDismissMode)
RCT_SET_AND_PRESERVE_OFFSET(setMaximumZoomScale, CGFloat)
RCT_SET_AND_PRESERVE_OFFSET(setMinimumZoomScale, CGFloat)
RCT_SET_AND_PRESERVE_OFFSET(setPagingEnabled, BOOL)
RCT_SET_AND_PRESERVE_OFFSET(setScrollEnabled, BOOL)
RCT_SET_AND_PRESERVE_OFFSET(setScrollsToTop, BOOL)
RCT_SET_AND_PRESERVE_OFFSET(setShowsHorizontalScrollIndicator, BOOL)
RCT_SET_AND_PRESERVE_OFFSET(setShowsVerticalScrollIndicator, BOOL)
RCT_SET_AND_PRESERVE_OFFSET(setZoomScale, CGFloat);
RCT_SET_AND_PRESERVE_OFFSET(setScrollIndicatorInsets, UIEdgeInsets);

#pragma mark - Forward methods and properties to underlying UIScrollView

- (BOOL)respondsToSelector:(SEL)aSelector
{
  return [super respondsToSelector:aSelector] || [_scrollView respondsToSelector:aSelector];
}

- (void)setValue:(id)value forUndefinedKey:(NSString *)key
{
  [_scrollView setValue:value forKey:key];
}

- (id)valueForUndefinedKey:(NSString *)key
{
  return [_scrollView valueForKey:key];
}

@end
