// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTWrapperViewController.h"

#import "RCTEventDispatcher.h"
#import "RCTNavItem.h"
#import "RCTUtils.h"
#import "UIView+ReactKit.h"

@implementation RCTWrapperViewController
{
  UIView *_contentView;
  RCTEventDispatcher *_eventDispatcher;
  CGFloat _previousTopLayout;
  CGFloat _previousBottomLayout;
}

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
  RCT_NOT_DESIGNATED_INITIALIZER();
}

- (instancetype)initWithContentView:(UIView *)contentView eventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [super initWithNibName:nil bundle:nil])) {
    _contentView = contentView;
    _eventDispatcher = eventDispatcher;
    self.automaticallyAdjustsScrollViewInsets = NO;
  }
  return self;
}

- (instancetype)initWithNavItem:(RCTNavItem *)navItem eventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
  if ((self = [self initWithContentView:navItem eventDispatcher:eventDispatcher])) {
    _navItem = navItem;
  }
  return self;
}

- (void)viewWillAppear:(BOOL)animated
{
  [super viewWillAppear:animated];

  [self.navigationController setNavigationBarHidden:!_navItem animated:animated];
  if (!_navItem) {
    return;
  }

  self.navigationItem.title = _navItem.title;

  [self _configureNavBarStyle];

  if (_navItem.rightButtonTitle.length > 0) {
    self.navigationItem.rightBarButtonItem =
      [[UIBarButtonItem alloc] initWithTitle:_navItem.rightButtonTitle
                                      style:UIBarButtonItemStyleDone
                                      target:self
                                      action:@selector(rightButtonTapped)];
  }

  if (_navItem.backButtonTitle.length > 0) {
    self.navigationItem.backBarButtonItem =
      [[UIBarButtonItem alloc] initWithTitle:_navItem.backButtonTitle
          style:UIBarButtonItemStylePlain
          target:nil
          action:nil];
  }
}

- (void)_configureNavBarStyle
{
  UINavigationBar *bar = self.navigationController.navigationBar;
  if (_navItem.barTintColor) {
    bar.barTintColor = _navItem.barTintColor;
  }
  if (_navItem.tintColor) {
    BOOL canSetTintColor = _navItem.barTintColor == nil;
    if (canSetTintColor) {
      bar.tintColor = _navItem.tintColor;
    }
  }
  if (_navItem.titleTextColor) {
    [bar setTitleTextAttributes:@{NSForegroundColorAttributeName : _navItem.titleTextColor}];
  }
}

- (void)loadView
{
  // Add a wrapper so that UIViewControllerWrapperView (managed by the
  // UINavigationController) doesn't end up resetting the frames for
  // `contentView` which is a react-managed view.
  self.view = [[UIView alloc] init];
  [self.view addSubview:_contentView];
}

- (void)rightButtonTapped
{
  [_eventDispatcher sendInputEventWithName:@"topNavRightButtonTap" body:@{@"target":_navItem.reactTag}];
}

- (void)didMoveToParentViewController:(UIViewController *)parent
{
  // There's no clear setter for navigation controllers, but did move to parent view controller
  // provides the desired effect. This is called after a pop finishes, be it a swipe to go back
  // or a standard tap on the back button
  [super didMoveToParentViewController:parent];
  if (parent == nil || [parent isKindOfClass:[UINavigationController class]]) {
    [self.navigationListener wrapperViewController:self didMoveToNavigationController:(UINavigationController *)parent];
  }
}

@end
