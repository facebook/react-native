/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModuleDecorator.h>
#import <React/RCTUIKit.h> // [macOS]
#include <folly/dynamic.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTComponentData;
@class RCTBridge;

typedef void (^InterceptorBlock)(std::string eventName, folly::dynamic event);

@interface RCTLegacyViewManagerInteropCoordinator : NSObject

- (instancetype)initWithComponentData:(RCTComponentData *)componentData
                               bridge:(RCTBridge *)bridge
                bridgelessInteropData:(RCTBridgeModuleDecorator *)bridgelessInteropData;

- (RCTUIView *)createPaperViewWithTag:(NSInteger)tag; // [macOS]

- (void)addObserveForTag:(NSInteger)tag usingBlock:(InterceptorBlock)block;

- (void)removeObserveForTag:(NSInteger)tag;

- (void)setProps:(const folly::dynamic &)props forView:(RCTUIView *)view; // [macOS]

- (NSString *)componentViewName;

- (void)handleCommand:(NSString *)commandName
                 args:(NSArray *)args
             reactTag:(NSInteger)tag
            paperView:(UIView *)paperView;

- (void)removeViewFromRegistryWithTag:(NSInteger)tag;

- (void)addViewToRegistry:(UIView *)view withTag:(NSInteger)tag;

@end

NS_ASSUME_NONNULL_END
