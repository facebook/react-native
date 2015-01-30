// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@class RCTJavaScriptEventDispatcher;

/**
 * Handles throttling of scroll events that are dispatched to JavaScript.
 */
@interface RCTScrollDispatcher : NSObject

@property (nonatomic, readwrite, assign) NSInteger throttleScrollCallbackMS;

- (instancetype)initWithEventDispatcher:(RCTJavaScriptEventDispatcher *)dispatcher;

- (void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag;
- (void)scrollViewDidScroll:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag;
- (void)scrollViewWillBeginDecelerating:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag;
- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag;
- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag;
- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag;

@end

