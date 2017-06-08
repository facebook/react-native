/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTWrapperViewController.h"

#import <UIKit/UIScrollView.h>

#import "RCTEventDispatcher.h"
#import "RCTNavItem.h"
#import "RCTUtils.h"
#import "RCTViewControllerProtocol.h"
#import "UIView+React.h"
#import "RCTAutoInsetsProtocol.h"

@implementation RCTWrapperViewController
{
  UIView *_wrapperView;
  UIView *_contentView;
  RCTEventDispatcher *_eventDispatcher;
  CGFloat _previousTopLayoutLength;
  CGFloat _previousBottomLayoutLength;
}

@synthesize currentTopLayoutGuide = _currentTopLayoutGuide;
@synthesize currentBottomLayoutGuide = _currentBottomLayoutGuide;
@synthesize navItem = _navItem;

- (instancetype)initWithContentView:(UIView *)contentView
{
  RCTAssertParam(contentView);

  if ((self = [super initWithNibName:nil bundle:nil])) {
    _contentView = contentView;
    self.automaticallyAdjustsScrollViewInsets = NO;
  }
  return self;
}

- (instancetype)initWithNavItem:(RCTNavItem *)navItem
{
  if ((self = [self initWithContentView:navItem])) {
    self.navItem = navItem;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithNibName:(NSString *)nn bundle:(NSBundle *)nb)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];

  _currentTopLayoutGuide = self.topLayoutGuide;
  _currentBottomLayoutGuide = self.bottomLayoutGuide;
}

static BOOL RCTFindScrollViewAndRefreshContentInsetInView(UIView *view)
{
  if ([view conformsToProtocol:@protocol(RCTAutoInsetsProtocol)]) {
    [(id <RCTAutoInsetsProtocol>) view refreshContentInset];
    return YES;
  }
  for (UIView *subview in view.subviews) {
    if (RCTFindScrollViewAndRefreshContentInsetInView(subview)) {
      return YES;
    }
  }
  return NO;
}

- (void)viewDidLayoutSubviews
{
  [super viewDidLayoutSubviews];

  if (_previousTopLayoutLength != _currentTopLayoutGuide.length ||
      _previousBottomLayoutLength != _currentBottomLayoutGuide.length) {
    RCTFindScrollViewAndRefreshContentInsetInView(_contentView);
    _previousTopLayoutLength = _currentTopLayoutGuide.length;
    _previousBottomLayoutLength = _currentBottomLayoutGuide.length;
  }
}

static UIView *RCTFindNavBarShadowViewInView(UIView *view)
{
  if ([view isKindOfClass:[UIImageView class]] && view.bounds.size.height <= 1) {
    return view;
  }
  for (UIView *subview in view.subviews) {
    UIView *shadowView = RCTFindNavBarShadowViewInView(subview);
    if (shadowView) {
      return shadowView;
    }
  }
  return nil;
}

- (void)setNavItem:(RCTNavItem *)navItem;
{
  if (navItem != _navItem)
  {
    // stop observing of current item if possible
    [self stopNavigationItemChangeObserving];
    _navItem = navItem;
    // start observing for new nav item if possible
    [self startNavigationItemChangeObserving];
  }
}

- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];
  [self updateNavigationBar:animated];
  // begin nav item observation if not already started
  [self startNavigationItemChangeObserving];
}

- (void)viewWillDisappear:(BOOL)animated
{
  [super viewWillDisappear:animated];
  // do not observing nav item changes anymore
  [self stopNavigationItemChangeObserving];
}

- (void)dealloc {
  // remove possibly set nav item observer
  [self stopNavigationItemChangeObserving];
}

- (void)updateNavigationBar:(BOOL)animated
{
  // TODO: find a way to make this less-tightly coupled to navigation controller
  if ([self.parentViewController isKindOfClass:[UINavigationController class]])
  {
    [self.navigationController
     setNavigationBarHidden:_navItem.navigationBarHidden
     animated:animated];

    UINavigationBar *bar = self.navigationController.navigationBar;
    bar.barTintColor = _navItem.barTintColor;
    bar.tintColor = _navItem.tintColor;
    bar.translucent = _navItem.translucent;
    bar.titleTextAttributes = _navItem.titleTextColor ? @{
      NSForegroundColorAttributeName: _navItem.titleTextColor
    } : nil;

    RCTFindNavBarShadowViewInView(bar).hidden = _navItem.shadowHidden;

    UINavigationItem *item = self.navigationItem;
    item.title = _navItem.title;
    item.titleView = _navItem.titleImageView;
#if !TARGET_OS_TV
    item.backBarButtonItem = _navItem.backButtonItem;
#endif //TARGET_OS_TV
    item.leftBarButtonItem = _navItem.leftButtonItem;
    item.rightBarButtonItem = _navItem.rightButtonItem;
  }
}

- (void)startNavigationItemChangeObserving
{
  // starts observing for nav item property changes if not
  // not already listen for
  if (_navItem && !_navItemObserving) {
    _navItemObserving = true;
    [_navItem addObserver:self forKeyPath:@"propertiesChanged" options:NSKeyValueObservingOptionNew context:nil];
  }
}

- (void)stopNavigationItemChangeObserving
{
  // stops observing the current nav item for property changes
  // if item is valid and observed before
  if (_navItem && _navItemObserving) {
    @try {
      _navItemObserving = false;
      [_navItem removeObserver:self forKeyPath:@"propertiesChanged"];
    }
    @catch (NSException * __unused exception) {}
  }
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey,id> *)change context:(void *)context
{
  if (object == _navItem) {
    [self updateNavigationBar:false];
  }
}

- (void)loadView
{
  // Add a wrapper so that the wrapper view managed by the
  // UINavigationController doesn't end up resetting the frames for
  //`contentView` which is a react-managed view.
  _wrapperView = [[UIView alloc] initWithFrame:_contentView.bounds];
  [_wrapperView addSubview:_contentView];
  self.view = _wrapperView;
}

- (void)didMoveToParentViewController:(UIViewController *)parent
{
  // There's no clear setter for navigation controllers, but did move to parent
  // view controller provides the desired effect. This is called after a pop
  // finishes, be it a swipe to go back or a standard tap on the back button
  [super didMoveToParentViewController:parent];
  if (parent == nil || [parent isKindOfClass:[UINavigationController class]]) {
    [self.navigationListener wrapperViewController:self
                     didMoveToNavigationController:(UINavigationController *)parent];
  }
}

@end
