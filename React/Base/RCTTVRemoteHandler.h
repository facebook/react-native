/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
