/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@protocol RCTComponentViewProtocol;

NS_ASSUME_NONNULL_BEGIN

@protocol RCTDependencyProvider <NSObject>

- (NSArray<NSString *> *)imageURLLoaderClassNames;

- (NSArray<NSString *> *)imageDataDecoderClassNames;

- (NSArray<NSString *> *)URLRequestHandlerClassNames;

- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents;

@end

NS_ASSUME_NONNULL_END
