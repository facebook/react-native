/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Logical node in a tree of application components. Both `ShadowView`s and
 * `UIView+React`s conform to this. Allows us to write utilities that
 * reason about trees generally.
 */
@protocol RCTViewNodeProtocol <NSObject>

@property (nonatomic, copy) NSNumber *reactTag;

- (void)insertReactSubview:(id<RCTViewNodeProtocol>)subview atIndex:(NSInteger)atIndex;
- (void)removeReactSubview:(id<RCTViewNodeProtocol>)subview;
- (NSMutableArray *)reactSubviews;
- (id<RCTViewNodeProtocol>)reactSuperview;
- (NSNumber *)reactTagAtPoint:(CGPoint)point;

// View/ShadowView is a root view
- (BOOL)isReactRootView;

@optional

// TODO: Deprecate this
// This method is called after layout has been performed for all views known
// to the RCTViewManager. It is only called on UIViews, not shadow views.
- (void)reactBridgeDidFinishTransaction;

@end

// TODO: this is kinda dumb - let's come up with a
// better way of identifying root react views please!
static inline BOOL RCTIsReactRootView(NSNumber *reactTag) {
  return reactTag.integerValue % 10 == 1;
}
