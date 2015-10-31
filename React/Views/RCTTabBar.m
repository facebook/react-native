/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTabBar.h"

#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTTabBarItem.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "RCTViewControllerProtocol.h"
#import "RCTWrapperViewController.h"
#import "UIView+React.h"

@interface RCTTabBar() <UITabBarControllerDelegate>

@end

@implementation RCTTabBar
{
  BOOL _tabsChanged;
  UITabBarController *_tabController;
  NSMutableArray *_tabViews;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    _tabViews = [NSMutableArray new];
    _tabController = [UITabBarController new];
    _tabController.delegate = self;
    [self addSubview:_tabController.view];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (UIViewController *)reactViewController
{
  return _tabController;
}

- (void)dealloc
{
  _tabController.delegate = nil;
}

- (NSArray *)reactSubviews
{
  return _tabViews;
}

- (void)insertReactSubview:(UIView *)view atIndex:(NSInteger)atIndex
{
  if (![view isKindOfClass:[RCTTabBarItem class]]) {
    RCTLogError(@"subview should be of type RCTTabBarItem");
    return;
  }
  [_tabViews insertObject:view atIndex:atIndex];
  _tabsChanged = YES;
}

- (void)removeReactSubview:(UIView *)subview
{
  if (_tabViews.count == 0) {
    RCTLogError(@"should have at least one view to remove a subview");
    return;
  }
  [_tabViews removeObject:subview];
  _tabsChanged = YES;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self reactAddControllerToClosestParent:_tabController];
  _tabController.view.frame = self.bounds;
}

- (void)reactBridgeDidFinishTransaction
{
  // we can't hook up the VC hierarchy in 'init' because the subviews aren't
  // hooked up yet, so we do it on demand here whenever a transaction has finished
  [self reactAddControllerToClosestParent:_tabController];

  if (_tabsChanged) {

    NSMutableArray *viewControllers = [NSMutableArray array];
    for (RCTTabBarItem *tab in [self reactSubviews]) {
      UIViewController *controller = tab.reactViewController;
      if (!controller) {
        controller = [[RCTWrapperViewController alloc] initWithContentView:tab];
      }
      [viewControllers addObject:controller];
    }

    _tabController.viewControllers = viewControllers;
    _tabsChanged = NO;
  }

  [[self reactSubviews] enumerateObjectsUsingBlock:
   ^(RCTTabBarItem *tab, NSUInteger index, __unused BOOL *stop) {
    UIViewController *controller = _tabController.viewControllers[index];
    controller.tabBarItem = tab.barItem;
    if (tab.selected) {
      _tabController.selectedViewController = controller;
    }
  }];
}

- (UIColor *)barTintColor
{
  return _tabController.tabBar.barTintColor;
}

- (void)setBarTintColor:(UIColor *)barTintColor
{
  _tabController.tabBar.barTintColor = barTintColor;
}

- (UIColor *)tintColor
{
  return _tabController.tabBar.tintColor;
}

- (void)setTintColor:(UIColor *)tintColor
{
  _tabController.tabBar.tintColor = tintColor;
}

- (BOOL)translucent {
  return _tabController.tabBar.isTranslucent;
}

- (void)setTranslucent:(BOOL)translucent {
  _tabController.tabBar.translucent = translucent;
}

#pragma mark - UITabBarControllerDelegate

- (BOOL)tabBarController:(UITabBarController *)tabBarController shouldSelectViewController:(UIViewController *)viewController
{
  NSUInteger index = [tabBarController.viewControllers indexOfObject:viewController];
  RCTTabBarItem *tab = [self reactSubviews][index];
  if (tab.onPress) tab.onPress(nil);
  return NO;
}

@end
