/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTWrapperViewController.h"

#import <UIKit/UIScrollView.h>

#import "RCTAutoInsetsProtocol.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"
#import "UIView+React.h"

@implementation RCTWrapperViewController {
  UIView *_wrapperView;
  UIView *_contentView;
  RCTEventDispatcher *_eventDispatcher;
  CGFloat _previousTopLayoutLength;
  CGFloat _previousBottomLayoutLength;

  id<UILayoutSupport> _currentTopLayoutGuide;
  id<UILayoutSupport> _currentBottomLayoutGuide;
}

- (instancetype)initWithContentView:(UIView *)contentView
{
  RCTAssertParam(contentView);

  if ((self = [super initWithNibName:nil bundle:nil])) {
    _contentView = contentView;
    self.automaticallyAdjustsScrollViewInsets = NO;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithNibName : (NSString *)nn bundle : (NSBundle *)nb)
RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

- (void)viewWillLayoutSubviews
{
  [super viewWillLayoutSubviews];

  _currentTopLayoutGuide = self.topLayoutGuide;
  _currentBottomLayoutGuide = self.bottomLayoutGuide;
}

static BOOL RCTFindScrollViewAndRefreshContentInsetInView(UIView *view)
{
  if ([view conformsToProtocol:@protocol(RCTAutoInsetsProtocol)]) {
    [(id<RCTAutoInsetsProtocol>)view refreshContentInset];
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

- (void)loadView
{
  // Add a wrapper so that the wrapper view managed by the
  // UINavigationController doesn't end up resetting the frames for
  //`contentView` which is a react-managed view.
  _wrapperView = [[UIView alloc] initWithFrame:_contentView.bounds];
  [_wrapperView addSubview:_contentView];
  self.view = _wrapperView;
}

@end
