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

@implementation RCTWrapperViewController
{
  UIView *_wrapperView;
  UIView *_contentView;
  RCTEventDispatcher *_eventDispatcher;
  CGFloat _previousTopLayout;
  CGFloat _previousBottomLayout;
}

@synthesize currentTopLayoutGuide = _currentTopLayoutGuide;
@synthesize currentBottomLayoutGuide = _currentBottomLayoutGuide;

- (instancetype)initWithContentView:(UIView *)contentView
                    eventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  RCTAssertParam(contentView);
  RCTAssertParam(eventDispatcher);

  if ((self = [super initWithNibName:nil bundle:nil])) {
    _contentView = contentView;
    _eventDispatcher = eventDispatcher;
    self.automaticallyAdjustsScrollViewInsets = NO;
  }
  return self;
}

- (instancetype)initWithNavItem:(RCTNavItem *)navItem
                eventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [self initWithContentView:navItem eventDispatcher:eventDispatcher])) {
    _navItem = navItem;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-initWithNibName:(NSString *)nn bundle:(NSBundle *)nb)
RCT_NOT_IMPLEMENTED(-initWithCoder:(NSCoder *)aDecoder)

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];

  _currentTopLayoutGuide = self.topLayoutGuide;
  _currentBottomLayoutGuide = self.bottomLayoutGuide;
}

- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];

  // TODO: find a way to make this less-tightly coupled to navigation controller
  if ([self.parentViewController isKindOfClass:[UINavigationController class]])
  {
    [self.navigationController
      setNavigationBarHidden:_navItem.navigationBarHidden
      animated:animated];

    if (!_navItem) {
      return;
    }

    UINavigationBar *bar = self.navigationController.navigationBar;
    bar.barTintColor = _navItem.barTintColor;
    bar.tintColor = _navItem.tintColor;
    bar.translucent = _navItem.translucent;
    if (_navItem.titleTextColor) {
      [bar setTitleTextAttributes:@{NSForegroundColorAttributeName : _navItem.titleTextColor}];
    }

    UINavigationItem *item = self.navigationItem;
    item.title = _navItem.title;
    item.backBarButtonItem = _navItem.backButtonItem;
    if ((item.leftBarButtonItem = _navItem.leftButtonItem)) {
      item.leftBarButtonItem.target = self;
      item.leftBarButtonItem.action = @selector(handleNavLeftButtonTapped);
    }
    if ((item.rightBarButtonItem = _navItem.rightButtonItem)) {
      item.rightBarButtonItem.target = self;
      item.rightBarButtonItem.action = @selector(handleNavRightButtonTapped);
    }
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

- (void)handleNavLeftButtonTapped
{
  [_eventDispatcher sendInputEventWithName:@"topNavLeftButtonTap"
                                      body:@{@"target":_navItem.reactTag}];
}

- (void)handleNavRightButtonTapped
{
  [_eventDispatcher sendInputEventWithName:@"topNavRightButtonTap"
                                      body:@{@"target":_navItem.reactTag}];
}

- (void)didMoveToParentViewController:(UIViewController *)parent
{
  // There's no clear setter for navigation controllers, but did move to parent
  // view controller provides the desired effect. This is called after a pop
  // finishes, be it a swipe to go back or a standard tap on the back button
  [super didMoveToParentViewController:parent];
  if (parent == nil || [parent isKindOfClass:[UINavigationController class]]) {
    [self.navigationListener wrapperViewController:self didMoveToNavigationController:(UINavigationController *)parent];
  }
}

@end
