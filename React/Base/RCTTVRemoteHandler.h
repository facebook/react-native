/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef RCTTVREMOTEHANDLER_H
#define RCTTVREMOTEHANDLER_H

#import <UIKit/UIKit.h>

@interface RCTTVRemoteHandler : NSObject

@property (nonatomic, copy, readonly) NSArray *tvRemoteGestureRecognizers;

@end

#endif //RCTTVREMOTEHANDLER_H
