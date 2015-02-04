// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

#import "RCTExport.h"
#import "RCTInvalidating.h"

@class RCTBridge;
@class RCTRootView;
@class RCTShadowView;

@protocol RCTScrollableProtocol;
@protocol RCTViewNodeProtocol;

@interface RCTUIManager : NSObject <RCTInvalidating, RCTNativeModule>

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@property (nonatomic, strong) RCTSparseArray *shadowViewRegistry;
@property (nonatomic, strong) RCTSparseArray *viewRegistry;
@property (nonatomic, weak) id<RCTScrollableProtocol> mainScrollView;

/**
 * Allows native environment code to respond to "the main scroll view" events.
 * see `RCTUIManager`'s `setMainScrollViewTag`.
 */
@property (nonatomic, readwrite, weak) id<UIScrollViewDelegate> nativeMainScrollDelegate;

+ (UIView <RCTViewNodeProtocol> *)closestReactAncestor:(UIView *)view;
+ (UIView <RCTViewNodeProtocol> *)closestReactAncestorThatRespondsToTouch:(UITouch *)touch;

- (void)registerRootView:(RCTRootView *)rootView;

+ (UIView *)JSResponder;

@end
