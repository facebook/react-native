/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAppDependencyProvider.h"
#import <ReactCodegen/RCTModulesConformingToProtocolsProvider.h>
#import <ReactCodegen/RCTThirdPartyComponentsProvider.h>

@implementation RCTAppDependencyProvider {
  NSArray<NSString *> * _URLRequestHandlerClassNames;
  NSArray<NSString *> * _imageDataDecoderClassNames;
  NSArray<NSString *> * _imageURLLoaderClassNames;
  NSDictionary<NSString *,Class<RCTComponentViewProtocol>> * _thirdPartyFabricComponents;
}

- (nonnull NSArray<NSString *> *)URLRequestHandlerClassNames {
  static dispatch_once_t requestUrlToken;
  dispatch_once(&requestUrlToken, ^{
    self->_URLRequestHandlerClassNames = RCTModulesConformingToProtocolsProvider.URLRequestHandlerClassNames;
  });

  return _URLRequestHandlerClassNames;
}

- (nonnull NSArray<NSString *> *)imageDataDecoderClassNames {
  static dispatch_once_t dataDecoderToken;
  dispatch_once(&dataDecoderToken, ^{
    _imageDataDecoderClassNames = RCTModulesConformingToProtocolsProvider.imageDataDecoderClassNames;
  });

  return _imageDataDecoderClassNames;
}

- (nonnull NSArray<NSString *> *)imageURLLoaderClassNames {
  static dispatch_once_t urlLoaderToken;
  dispatch_once(&urlLoaderToken, ^{
    _imageURLLoaderClassNames = RCTModulesConformingToProtocolsProvider.imageURLLoaderClassNames;
  });

  return _imageURLLoaderClassNames;
}

- (nonnull NSDictionary<NSString *,Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents {
  static dispatch_once_t nativeComponentsToken;
  dispatch_once(&nativeComponentsToken, ^{
    _thirdPartyFabricComponents = RCTThirdPartyComponentsProvider.thirdPartyFabricComponents;
  });

  return _thirdPartyFabricComponents;
}

@end
