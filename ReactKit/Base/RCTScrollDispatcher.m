// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTScrollDispatcher.h"

#import "RCTBridge.h"
#import "RCTEventExtractor.h"
#import "RCTJavaScriptEventDispatcher.h"
#import "UIView+ReactKit.h"

@implementation RCTScrollDispatcher
{
  RCTJavaScriptEventDispatcher *_eventDispatcher;
  NSTimeInterval _lastScrollDispatchTime;
  BOOL _allowNextScrollNoMatterWhat;
  NSMutableDictionary *_cachedChildFrames;
  CGPoint _lastContentOffset;
}

- (instancetype)initWithEventDispatcher:(RCTJavaScriptEventDispatcher *)dispatcher
{
  if (self = [super init]) {
    _eventDispatcher = dispatcher;
    _throttleScrollCallbackMS = 0;
    _lastScrollDispatchTime = CACurrentMediaTime();
    _cachedChildFrames = [NSMutableDictionary new];
  }
  return self;
}

- (NSArray *)_getUpdatedChildFrames:(UIScrollView *)scrollView forUpdateKey:(NSString *)updateKey
{
  NSArray *children = [scrollView.subviews[0] reactSubviews];
  NSMutableArray *updatedChildFrames = [NSMutableArray new];
  NSMutableArray *cachedFrames = _cachedChildFrames[updateKey];
  if (!cachedFrames) {
    cachedFrames = [[NSMutableArray alloc] initWithCapacity:children.count];
    _cachedChildFrames[updateKey] = cachedFrames;
  }
  for (int ii = 0; ii < children.count; ii++) {
    CGRect newFrame = [children[ii] frame];
    if (cachedFrames.count <= ii || !CGRectEqualToRect(newFrame, [cachedFrames[ii] CGRectValue])) {
      [updatedChildFrames addObject:
       @{
         @"index": @(ii),
         @"x": @(newFrame.origin.x),
         @"y": @(newFrame.origin.y),
         @"width": @(newFrame.size.width),
         @"height": @(newFrame.size.height),
         }];
      NSValue *frameObj = [NSValue valueWithCGRect:newFrame];
      if (cachedFrames.count <= ii) {
        [cachedFrames addObject:frameObj];
      } else {
        cachedFrames[ii] = frameObj;
      }
    }
  }
  return updatedChildFrames;
}

- (void)_dispatchScroll:(UIScrollView *)scrollView forUpdateKey:(NSString *)updateKey reactTag:(NSNumber *)reactTag
{
  NSTimeInterval now = CACurrentMediaTime();
  NSTimeInterval dt = now - _lastScrollDispatchTime;
  NSMutableDictionary *mutableNativeObj = [[RCTEventExtractor scrollEventObject:scrollView reactTag:reactTag] mutableCopy];
  if (updateKey) {
    NSArray *updatedChildFrames = [self _getUpdatedChildFrames:scrollView forUpdateKey:updateKey];
    if (updatedChildFrames.count > 0) {
      mutableNativeObj[@"updatedChildFrames"] = updatedChildFrames;
    }
  }
  mutableNativeObj[@"velocity"] = @{
                                    @"x": @((scrollView.contentOffset.x - _lastContentOffset.x) / dt),
                                    @"y": @((scrollView.contentOffset.y - _lastContentOffset.y) / dt),
                                    };
  [_eventDispatcher sendEventWithArgs:[RCTEventExtractor eventArgs:reactTag
                                                             type:RCTEventScroll
                                                   nativeEventObj:mutableNativeObj]];
  _lastScrollDispatchTime = now;
  _lastContentOffset = scrollView.contentOffset;
  _allowNextScrollNoMatterWhat = NO;
}

- (void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag
{
  [_eventDispatcher sendEventWithArgs:[RCTEventExtractor eventArgs:reactTag
                                                              type:RCTEventScrollAnimationEnd
                                                    nativeEventObj:[RCTEventExtractor scrollEventObject:scrollView reactTag:reactTag]]];
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag
{
  NSTimeInterval now = CACurrentMediaTime();
  NSTimeInterval throttleScrollCallbackSeconds = _throttleScrollCallbackMS / 1000.0f;
  if (_allowNextScrollNoMatterWhat ||
    (_throttleScrollCallbackMS != 0 && throttleScrollCallbackSeconds < (now - _lastScrollDispatchTime))) {
    [self _dispatchScroll:scrollView forUpdateKey:@"didScroll" reactTag:reactTag];
  }
}

- (void)scrollViewWillBeginDecelerating:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag
{
  [_eventDispatcher sendEventWithArgs:[RCTEventExtractor eventArgs:reactTag
                                                              type:RCTEventMomentumScrollBegin
                                                    nativeEventObj:[RCTEventExtractor scrollEventObject:scrollView reactTag:reactTag]]];
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag
{
  [_eventDispatcher sendEventWithArgs:[RCTEventExtractor eventArgs:reactTag
                                                              type:RCTEventMomentumScrollEnd
                                                   nativeEventObj:[RCTEventExtractor scrollEventObject:scrollView reactTag:reactTag]]];
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag
{
  _allowNextScrollNoMatterWhat = YES;
  [_eventDispatcher sendEventWithArgs:[RCTEventExtractor eventArgs:reactTag
                                                              type:RCTEventScrollBeginDrag
                                                   nativeEventObj:[RCTEventExtractor scrollEventObject:scrollView reactTag:reactTag]]];
}

- (void)scrollViewWillEndDragging:(UIScrollView *)scrollView reactTag:(NSNumber *)reactTag
{
  [_eventDispatcher sendEventWithArgs:[RCTEventExtractor eventArgs:reactTag
                                                              type:RCTEventScrollEndDrag
                                                   nativeEventObj:[RCTEventExtractor scrollEventObject:scrollView reactTag:reactTag]]];
}


@end
