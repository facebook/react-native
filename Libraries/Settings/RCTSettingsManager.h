/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef RCTSETTINGSMANAGER_H
#define RCTSETTINGSMANAGER_H

#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

@interface RCTSettingsManager : NSObject <RCTBridgeModule>

- (instancetype)initWithUserDefaults:(NSUserDefaults *)defaults;

@end

#endif //RCTSETTINGSMANAGER_H
