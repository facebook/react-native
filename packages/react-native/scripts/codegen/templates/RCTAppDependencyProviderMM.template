/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAppDependencyProvider.h"
#import <ReactCodegen/RCTModulesConformingToProtocolsProvider.h>
#import <ReactCodegen/RCTThirdPartyComponentsProvider.h>
#import <ReactCodegen/RCTModuleProviders.h>

@implementation RCTAppDependencyProvider

- (nonnull NSArray<NSString *> *)URLRequestHandlerClassNames {
  return RCTModulesConformingToProtocolsProvider.URLRequestHandlerClassNames;
}

- (nonnull NSArray<NSString *> *)imageDataDecoderClassNames {
  return RCTModulesConformingToProtocolsProvider.imageDataDecoderClassNames;
}

- (nonnull NSArray<NSString *> *)imageURLLoaderClassNames {
  return RCTModulesConformingToProtocolsProvider.imageURLLoaderClassNames;
}

- (nonnull NSDictionary<NSString *,Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents {
  return RCTThirdPartyComponentsProvider.thirdPartyFabricComponents;
}

- (nonnull NSDictionary<NSString *, id<RCTModuleProvider>> *)moduleProviders {
  return RCTModuleProviders.moduleProviders;
}

@end
