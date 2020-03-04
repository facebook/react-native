/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRootViewController.h"
#import "RCTUtils.h"
#import "RCTRootView.h"

@implementation RCTRootViewController
{
    UIStatusBarStyle _statusBarStyle;
    BOOL _statusBarHidden;
    UIStatusBarAnimation _statusBarAnimation;
}

- (instancetype)initWithRootView:(RCTRootView *)rootView
{
    RCTAssertParam(rootView);

    if (self = [super initWithNibName:nil bundle:nil]) {
        _rootView = rootView;
        _statusBarStyle = UIStatusBarStyleDefault;
        _statusBarHidden = false;
        _statusBarAnimation = UIStatusBarAnimationFade;
    }

    return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithNibName:(NSString *)nn bundle:(NSBundle *)nb)
RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)loadView
{
    self.view = _rootView;
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
    return _statusBarStyle;
}

- (BOOL)prefersStatusBarHidden
{
    return _statusBarHidden;
}

- (UIStatusBarAnimation)preferredStatusBarUpdateAnimation
{
    return _statusBarAnimation;
}

- (void)updateStatusBarStyle:(UIStatusBarStyle)style
                      hidden:(BOOL)hidden
                   animation:(UIStatusBarAnimation)animation
                    animated:(BOOL)animate;
{
    _statusBarStyle = style;
    _statusBarHidden = hidden;
    _statusBarAnimation = animation;
    if (animate) {
        [UIView animateWithDuration:0.150 animations:^{
            [self setNeedsStatusBarAppearanceUpdate];
        }];
    } else {
        [self setNeedsStatusBarAppearanceUpdate];
    }
}

@end
