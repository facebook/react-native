/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTComponent.h>
#import <React/RCTDefines.h>
#import <React/RCTViewManager.h>

@class RCTBridge;
@class RCTShadowView;
@class UIView;

NS_ASSUME_NONNULL_BEGIN

@interface RCTComponentData : NSObject

@property (nonatomic, readonly) Class managerClass;
@property (nonatomic, copy, readonly) NSString *name;
@property (nonatomic, weak, readonly) RCTViewManager *manager;

- (instancetype)initWithManagerClass:(Class)managerClass bridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (UIView *)createViewWithTag:(nullable NSNumber *)tag rootTag:(nullable NSNumber *)rootTag;
- (RCTShadowView *)createShadowViewWithTag:(NSNumber *)tag;
- (void)setProps:(NSDictionary<NSString *, id> *)props forView:(id<RCTComponent>)view;
- (void)setProps:(NSDictionary<NSString *, id> *)props forShadowView:(RCTShadowView *)shadowView;

@property (nonatomic, copy, nullable) void (^eventInterceptor)
    (NSString *eventName, NSDictionary *event, NSNumber *reactTag);

- (NSDictionary<NSString *, id> *)viewConfig;

@end

NS_ASSUME_NONNULL_END
