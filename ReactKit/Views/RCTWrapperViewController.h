// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@class RCTJavaScriptEventDispatcher;
@class RCTNavItem;
@class RCTWrapperViewController;

@protocol RCTWrapperViewControllerNavigationListener <NSObject>

- (void)wrapperViewController:(RCTWrapperViewController *)wrapperViewController
didMoveToNavigationController:(UINavigationController *)navigationController;

@end

@interface RCTWrapperViewController : UIViewController

- (instancetype)initWithContentView:(UIView *)contentView eventDispatcher:(RCTJavaScriptEventDispatcher *)eventDispatcher;
- (instancetype)initWithNavItem:(RCTNavItem *)navItem eventDispatcher:(RCTJavaScriptEventDispatcher *)eventDispatcher;

@property (nonatomic, readwrite, weak) id<RCTWrapperViewControllerNavigationListener> navigationListener;
@property (nonatomic, strong, readwrite) RCTNavItem *navItem;

@end
