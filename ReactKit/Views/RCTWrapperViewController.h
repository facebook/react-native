// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

@class RCTEventDispatcher;
@class RCTNavItem;
@class RCTWrapperViewController;

@protocol RCTWrapperViewControllerNavigationListener <NSObject>

- (void)wrapperViewController:(RCTWrapperViewController *)wrapperViewController
didMoveToNavigationController:(UINavigationController *)navigationController;

@end

@interface RCTWrapperViewController : UIViewController

- (instancetype)initWithContentView:(UIView *)contentView
                    eventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

- (instancetype)initWithNavItem:(RCTNavItem *)navItem
                eventDispatcher:(RCTEventDispatcher *)eventDispatcher;

@property (nonatomic, readwrite, weak) id<RCTWrapperViewControllerNavigationListener> navigationListener;
@property (nonatomic, strong, readwrite) RCTNavItem *navItem;

@end
