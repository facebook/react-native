/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ComponentKit/CKComponent.h>
#import <ComponentKit/CKCompositeComponent.h>
#import <RCTSurfaceHostingComponent/RCTSurfaceHostingComponentOptions.h>

@class RCTBridge;

/**
 * ComponentKit component represents a React Native Surface created
 * (and stored in the state) with given `bridge`, `moduleName`,
 * and `properties`.
 */
@interface RCTSurfaceBackedComponent : CKCompositeComponent

+ (instancetype)newWithBridge:(RCTBridge *)bridge
                   moduleName:(NSString *)moduleName
                   properties:(NSDictionary *)properties
                      options:(RCTSurfaceHostingComponentOptions)options;

@end
