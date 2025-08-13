/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@protocol RCTComponentViewProtocol;
@protocol RCTModuleProvider;

NS_ASSUME_NONNULL_BEGIN

@protocol RCTDependencyProvider <NSObject>

- (NSArray<NSString *> *)imageURLLoaderClassNames;

- (NSArray<NSString *> *)imageDataDecoderClassNames;

- (NSArray<NSString *> *)URLRequestHandlerClassNames;

- (NSArray<NSString *> *)unstableModulesRequiringMainQueueSetup;

- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents;

- (nonnull NSDictionary<NSString *, id<RCTModuleProvider>> *)moduleProviders;

@end

NS_ASSUME_NONNULL_END
