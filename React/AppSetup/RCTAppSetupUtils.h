/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>
#import <React/RCTRootView.h>

@interface RCTAppSetupUtils : NSObject
+ (void)prepareApp:(UIApplication *_Nonnull)application;
+ (RCTRootView *_Nonnull)defaultRootViewWithBridge:(RCTBridge *_Nonnull)bridge
                                        moduleName:(NSString *_Nonnull)moduleName
                                 initialProperties:(nullable NSDictionary *)initialProperties;
@end
