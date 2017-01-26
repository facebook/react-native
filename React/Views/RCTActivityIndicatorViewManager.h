/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef RCTACTIVITYINDICATORVIEWMANAGER_H
#define RCTACTIVITYINDICATORVIEWMANAGER_H

#import <React/RCTViewManager.h>

@interface RCTConvert (UIActivityIndicatorView)

+ (UIActivityIndicatorViewStyle)UIActivityIndicatorViewStyle:(id)json;

@end

@interface RCTActivityIndicatorViewManager : RCTViewManager

@end

#endif //RCTACTIVITYINDICATORVIEWMANAGER_H
