// Copyright 2004-present Facebook. All Rights Reserved.

/**
 * A simple protocol that any React-managed ViewControllers should implement.
 * We need all of our ViewControllers to cache layoutGuide changes so any View
 * in our View hierarchy can access accurate layoutGuide info at any time.
 */
@protocol RCTViewControllerProtocol <NSObject>

@property (nonatomic, readonly, strong) id<UILayoutSupport> currentTopLayoutGuide;
@property (nonatomic, readonly, strong) id<UILayoutSupport> currentBottomLayoutGuide;

@end
