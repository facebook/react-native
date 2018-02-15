/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridge.h>
#import <React/RCTInvalidating.h>
#import <React/RCTShadowView.h>

@class RCTShadowView;

/**
 * The RCTFabricUIManager is the module responsible for updating the view hierarchy.
 */
@interface RCTFabricUIManager : NSObject <RCTInvalidating>

- (RCTShadowView *)createNode:(nonnull NSNumber *)reactTag
                      viewName:(NSString *)viewName
                      rootTag:(nonnull NSNumber *)rootTag
                        props:(NSDictionary *)props
                instanceHandle:(void *)instanceHandle;

- (RCTShadowView *)cloneNode:(RCTShadowView *)node;
- (RCTShadowView *)cloneNodeWithNewChildren:(RCTShadowView *)node;
- (RCTShadowView *)cloneNodeWithNewProps:(RCTShadowView *)node
                                newProps:(NSDictionary *)props;
- (RCTShadowView *)cloneNodeWithNewChildrenAndProps:(RCTShadowView *)node
                                            newProps:(NSDictionary *)props;
- (void)appendChild:(RCTShadowView *)parentNode
          childNode:(RCTShadowView *)childNode;

- (NSMutableArray<RCTShadowView *> *)createChildSet:(nonnull NSNumber *)rootTag;
- (void)appendChildToSet:(NSMutableArray<RCTShadowView *> *)childSet
               childNode:(RCTShadowView *)childNode;
- (void)completeRoot:(nonnull NSNumber *)rootTag
            childSet:(NSArray<RCTShadowView *> *)childSet;

@end

@interface RCTBridge (RCTFabricUIManager)

@property (nonatomic, readonly) RCTFabricUIManager *fabricUIManager;

@end
