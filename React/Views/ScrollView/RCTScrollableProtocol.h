/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)
#import <React/RCTComponent.h>

/**
 * Contains any methods related to scrolling. Any `RCTView` that has scrolling
 * features should implement these methods.
 */
@protocol RCTScrollableProtocol

@property (nonatomic, readonly) CGSize contentSize;

- (void)scrollToOffset:(CGPoint)offset;
- (void)scrollToOffset:(CGPoint)offset animated:(BOOL)animated;
/**
 * If this is a vertical scroll view, scrolls to the bottom.
 * If this is a horizontal scroll view, scrolls to the right.
 */
- (void)scrollToEnd:(BOOL)animated;
- (void)zoomToRect:(CGRect)rect animated:(BOOL)animated;

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (void)addScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener;
- (void)removeScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener;
#endif // TODO(macOS ISS#2323203)

@end

/**
 * Denotes a view which implements custom pull to refresh functionality.
 */
@protocol RCTCustomRefreshContolProtocol

@property (nonatomic, copy) RCTDirectEventBlock onRefresh;
@property (nonatomic, readonly, getter=isRefreshing) BOOL refreshing;

@end
