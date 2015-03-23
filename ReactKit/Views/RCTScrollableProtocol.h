// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

/**
 * Contains any methods related to scrolling. Any `RCTView` that has scrolling
 * features should implement these methods.
 */
@protocol RCTScrollableProtocol

@property (nonatomic, weak) NSObject<UIScrollViewDelegate> *nativeMainScrollDelegate;
@property (nonatomic, readonly) CGSize contentSize;

- (void)scrollToOffset:(CGPoint)offset;
- (void)scrollToOffset:(CGPoint)offset animated:(BOOL)animated;
- (void)zoomToRect:(CGRect)rect animated:(BOOL)animated;

@end
