/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef RCTI18NMANAGER_H
#define RCTI18NMANAGER_H

#import <React/RCTBridgeModule.h>

/**
 * @experimental
 * This is a experimental module for RTL support
 * This module bridges the i18n utility from RCTI18nUtil
 */
@interface RCTI18nManager : NSObject <RCTBridgeModule>

@end

#endif //RCTI18NMANAGER_H
