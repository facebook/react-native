// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@class RCTJavaScriptEventDispatcher;

@interface RCTTouchHandler : NSObject

- (instancetype)initWithEventDispatcher:(RCTJavaScriptEventDispatcher *)eventDispatcher
                               rootView:(UIView *)rootView;

@property (nonatomic, readwrite, strong) RCTJavaScriptEventDispatcher *eventDispatcher;

/**
 * Maintaining the set of active touches by the time they started touching.
 */
@property (nonatomic, readonly, strong) NSMutableArray *orderedTouches;

/**
 * Array managed in parallel to `orderedTouches` tracking original `reactTag`
 * for each touch. This must be kept track of because `UIKit` destroys the
 * touch targets if touches are canceled and we have no other way to recover
 * this information.
 */
@property (nonatomic, readonly, strong) NSMutableArray *orderedTouchStartTags;

/**
 * IDs that uniquely represent a touch among all of the active touches.
 */
@property (nonatomic, readonly, strong) NSMutableArray *orderedTouchIDs;

@end
