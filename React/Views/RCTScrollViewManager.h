/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef RCTSCROLLVIEWMANAGER_H
#define RCTSCROLLVIEWMANAGER_H

#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>

@interface RCTConvert (UIScrollView)

+ (UIScrollViewKeyboardDismissMode)UIScrollViewKeyboardDismissMode:(id)json;

@end

@interface RCTScrollViewManager : RCTViewManager

@end

#endif //RCTSCROLLVIEWMANAGER_H
