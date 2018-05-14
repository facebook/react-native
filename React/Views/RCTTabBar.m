/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTabBar.h"

#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTTabBarItem.h"
#import "RCTUtils.h"
#import "RCTView.h"
#import "RCTWrapperViewController.h"
#import "UIView+React.h"

@interface RCTTabBar() <UITabBarControllerDelegate>

@end

@implementation RCTTabBar
{
  BOOL _tabsChanged;
  UITabBarController *_tabController;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
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
  [_tabController removeFromParentViewController];
}

- (void)insertReactSubview:(RCTTabBarItem *)subview atIndex:(NSInteger)atIndex
{
  if (![subview isKindOfClass:[RCTTabBarItem class]]) {
    RCTLogError(@"subview should be of type RCTTabBarItem");
    return;
  }
  [super insertReactSubview:subview atIndex:atIndex];
  _tabsChanged = YES;
}

- (void)removeReactSubview:(RCTTabBarItem *)subview
{
  if (self.reactSubviews.count == 0) {
    RCTLogError(@"should have at least one view to remove a subview");
    return;
  }
  [super removeReactSubview:subview];
  _tabsChanged = YES;
}

- (void)didUpdateReactSubviews
{
  // Do nothing, as subviews are managed by `uiManagerDidPerformMounting`
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self reactAddControllerToClosestParent:_tabController];
  _tabController.view.frame = self.bounds;
}

- (void)uiManagerDidPerformMounting
{
  // we can't hook up the VC hierarchy in 'init' because the subviews aren't
  // hooked up yet, so we do it on demand here whenever a transaction has finished
  [self reactAddControllerToClosestParent:_tabController];

  if (_tabsChanged) {

    NSMutableArray<UIViewController *> *viewControllers = [NSMutableArray array];
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

  [self.reactSubviews enumerateObjectsUsingBlock:^(UIView *view, NSUInteger index, __unused BOOL *stop) {

    RCTTabBarItem *tab = (RCTTabBarItem *)view;
    UIViewController *controller = self->_tabController.viewControllers[index];
    if (self->_unselectedTintColor) {
      [tab.barItem setTitleTextAttributes:@{NSForegroundColorAttributeName: self->_unselectedTintColor} forState:UIControlStateNormal];
    }

    [tab.barItem setTitleTextAttributes:@{NSForegroundColorAttributeName: self.tintColor} forState:UIControlStateSelected];

    controller.tabBarItem = tab.barItem;
#if TARGET_OS_TV
// On Apple TV, disable JS control of selection after initial render
    if (tab.selected && !tab.wasSelectedInJS) {
      self->_tabController.selectedViewController = controller;
    }
    tab.wasSelectedInJS = YES;
#else
    if (tab.selected) {
      self->_tabController.selectedViewController = controller;
    }
#endif
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

- (BOOL)translucent
{
  return _tabController.tabBar.isTranslucent;
}

- (void)setTranslucent:(BOOL)translucent
{
  _tabController.tabBar.translucent = translucent;
}

#if !TARGET_OS_TV
- (UIBarStyle)barStyle
{
  return _tabController.tabBar.barStyle;
}

- (void)setBarStyle:(UIBarStyle)barStyle
{
  _tabController.tabBar.barStyle = barStyle;
}
#endif

- (void)setUnselectedItemTintColor:(UIColor *)unselectedItemTintColor {
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0
  if ([_tabController.tabBar respondsToSelector:@selector(unselectedItemTintColor)]) {
    _tabController.tabBar.unselectedItemTintColor = unselectedItemTintColor;
  }
#endif
}

- (UITabBarItemPositioning)itemPositioning
{
#if TARGET_OS_TV
  return 0;
#else
  return _tabController.tabBar.itemPositioning;
#endif
}

- (void)setItemPositioning:(UITabBarItemPositioning)itemPositioning
{
#if !TARGET_OS_TV
  _tabController.tabBar.itemPositioning = itemPositioning;
#endif
}

#pragma mark - UITabBarControllerDelegate

#if TARGET_OS_TV

- (void)tabBarController:(UITabBarController *)tabBarController didSelectViewController:(nonnull UIViewController *)viewController
{
  NSUInteger index = [tabBarController.viewControllers indexOfObject:viewController];
  RCTTabBarItem *tab = (RCTTabBarItem *)self.reactSubviews[index];
  if (tab.onPress) tab.onPress(nil);
  return;
}

#else

- (BOOL)tabBarController:(UITabBarController *)tabBarController shouldSelectViewController:(UIViewController *)viewController
{
  NSUInteger index = [tabBarController.viewControllers indexOfObject:viewController];
  RCTTabBarItem *tab = (RCTTabBarItem *)self.reactSubviews[index];
  if (tab.onPress) tab.onPress(nil);
  return NO;
}

#endif

#if TARGET_OS_TV

- (BOOL)isUserInteractionEnabled
{
  return YES;
}

- (void)didUpdateFocusInContext:(UIFocusUpdateContext *)context withAnimationCoordinator:(UIFocusAnimationCoordinator *)coordinator
{
  if (context.nextFocusedView == self) {
    [self becomeFirstResponder];
  } else {
    [self resignFirstResponder];
  }
}

#endif

@end
