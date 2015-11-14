/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTComponent.h"
#import "RCTDefines.h"

@class RCTShadowView;
@class RCTViewManager;
@class UIView;

@interface RCTComponentData : NSObject

@property (nonatomic, copy, readonly) NSString *name;
@property (nonatomic, strong, readonly) RCTViewManager *manager;

- (instancetype)initWithManager:(RCTViewManager *)manager NS_DESIGNATED_INITIALIZER;

- (UIView *)createViewWithTag:(NSNumber *)tag props:(NSDictionary<NSString *, id> *)props;
- (RCTShadowView *)createShadowViewWithTag:(NSNumber *)tag;
- (void)setProps:(NSDictionary<NSString *, id> *)props forView:(id<RCTComponent>)view;
- (void)setProps:(NSDictionary<NSString *, id> *)props forShadowView:(RCTShadowView *)shadowView;

- (NSDictionary<NSString *, id> *)viewConfig;

@end
