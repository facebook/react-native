/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDevMenu.h>

@interface RCTDevMenuConfigurationDecorator : NSObject

#if RCT_DEV_MENU

@property (nonatomic, strong, readonly) RCTDevMenuConfiguration *devMenuConfiguration;

- (instancetype)initWithDevMenuConfiguration:(RCTDevMenuConfiguration *__nullable)devMenuConfiguration;
- (void)decorate:(RCTDevMenu *)devMenuModule;

#endif

@end
