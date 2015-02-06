// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

#import "RCTBridgeModule.h"
#import "RCTInvalidating.h"

@class RCTRootView;
@class RCTShadowView;
@class RCTSparseArray;

@protocol RCTScrollableProtocol;

@interface RCTUIManager : NSObject <RCTBridgeModule, RCTInvalidating>

@property (nonatomic, strong) RCTSparseArray *shadowViewRegistry;
@property (nonatomic, strong) RCTSparseArray *viewRegistry;
@property (nonatomic, weak) id<RCTScrollableProtocol> mainScrollView;

/**
 * Allows native environment code to respond to "the main scroll view" events.
 * see `RCTUIManager`'s `setMainScrollViewTag`.
 */
@property (nonatomic, readwrite, weak) id<UIScrollViewDelegate> nativeMainScrollDelegate;

- (void)registerRootView:(RCTRootView *)rootView;

+ (UIView *)JSResponder;

@end
