/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridge.h>
#import <React/RCTDefines.h>
#import <React/RCTResizeMode.h>
#import <React/RCTURLRequestHandler.h>
#import <React/RCTImageDataDecoder.h>
#import <React/RCTImageURLLoader.h>
#import <React/RCTImageCache.h>
#import <React/RCTImageLoaderProtocol.h>
#import <React/RCTImageLoaderLoggable.h>

@interface RCTImageLoader : NSObject <RCTBridgeModule, RCTImageLoaderProtocol, RCTImageLoaderLoggableProtocol>
- (instancetype)init;
- (instancetype)initWithRedirectDelegate:(id<RCTImageRedirectProtocol>)redirectDelegate NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithRedirectDelegate:(id<RCTImageRedirectProtocol>)redirectDelegate
                              loadersProvider:(NSArray<id<RCTImageURLLoader>> * (^)(RCTModuleRegistry *))getLoaders
                             decodersProvider:(NSArray<id<RCTImageDataDecoder>> * (^)(RCTModuleRegistry *))getDecoders;
@end

/**
 * DEPRECATED!! DO NOT USE
 * Instead use `[_bridge moduleForClass:[RCTImageLoader class]]`
 */
@interface RCTBridge (RCTImageLoader)

@property (nonatomic, readonly) RCTImageLoader *imageLoader;

@end
