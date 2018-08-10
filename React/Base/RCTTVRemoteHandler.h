/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>


extern NSString *const RCTTVRemoteEventMenu;
extern NSString *const RCTTVRemoteEventPlayPause;
extern NSString *const RCTTVRemoteEventSelect;

extern NSString *const RCTTVRemoteEventLongPlayPause;
extern NSString *const RCTTVRemoteEventLongSelect;

extern NSString *const RCTTVRemoteEventTapLeft;
extern NSString *const RCTTVRemoteEventTapRight;
extern NSString *const RCTTVRemoteEventTapTop;
extern NSString *const RCTTVRemoteEventTapBottom;

extern NSString *const RCTTVRemoteEventSwipeLeft;
extern NSString *const RCTTVRemoteEventSwipeRight;
extern NSString *const RCTTVRemoteEventSwipeUp;
extern NSString *const RCTTVRemoteEventSwipeDown;

@interface RCTTVRemoteHandler : NSObject

@property (nonatomic, copy, readonly) NSDictionary *tvRemoteGestureRecognizers;

@end
