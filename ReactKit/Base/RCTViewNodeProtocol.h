// Copyright 2004-present Facebook. All Rights Reserved.

/**

 * Logical node in a tree of application components. Both `ShadowView`s and
 * `UIView+ReactKit`s conform to this. Allows us to write utilities that
 * reason about trees generally.
 */
@protocol RCTViewNodeProtocol <NSObject>

@property (nonatomic, strong) NSNumber *reactTag;

- (void)insertReactSubview:(id<RCTViewNodeProtocol>)subview atIndex:(NSInteger)atIndex;
- (void)removeReactSubview:(id<RCTViewNodeProtocol>)subview;
- (NSMutableArray *)reactSubviews;
- (NSNumber *)reactTagAtPoint:(CGPoint)point;

// View is an RCTRootView
- (BOOL)isReactRootView;

@optional

// TODO: Deprecate this
- (void)reactBridgeDidFinishTransaction;

@end
