// Copyright 2004-present Facebook. All Rights Reserved.

/**

 * Logical node in a tree of application components. Both `ShadowView`s and
 * `UIView+ReactKit`s conform to this. Allows us to write utilities that
 * reason about trees generally.
 */
@protocol RCTViewNodeProtocol <NSObject>

@property (nonatomic, copy) NSNumber *reactTag;

- (void)insertReactSubview:(id<RCTViewNodeProtocol>)subview atIndex:(NSInteger)atIndex;
- (void)removeReactSubview:(id<RCTViewNodeProtocol>)subview;
- (NSMutableArray *)reactSubviews;
- (NSNumber *)reactTagAtPoint:(CGPoint)point;

// View is an RCTRootView
- (BOOL)isReactRootView;

@optional

// TODO: Deprecate this
// This method is called after layout has been performed for all views known
// to the RCTViewManager. It is only called on UIViews, not shadow views.
- (void)reactBridgeDidFinishTransaction;

@end
