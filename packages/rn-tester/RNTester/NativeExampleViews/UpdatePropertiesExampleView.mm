/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "UpdatePropertiesExampleView.h"

#import <React/RCTRootView.h>
#import <React/RCTViewManager.h>

#import "AppDelegate.h"

@interface UpdatePropertiesExampleViewManager : RCTViewManager

@end

@implementation UpdatePropertiesExampleViewManager

RCT_EXPORT_MODULE();

- (RCTUIView *)view // [macOS]
{
  return [UpdatePropertiesExampleView new];
}

@end

@implementation UpdatePropertiesExampleView {
  RCTRootView *_rootView;
#if !TARGET_OS_OSX // [macOS]
  UIButton *_button;
#else // [macOS
  NSButton *_button;
#endif // macOS]
  BOOL _beige;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  self = [super initWithFrame:frame];
  if (self) {
    _beige = YES;

    AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];

    _rootView = [[RCTRootView alloc] initWithBridge:appDelegate.bridge
                                         moduleName:@"SetPropertiesExampleApp"
                                  initialProperties:@{@"color" : @"beige"}];

    // [macOS Github#1642: Suppress analyzer error of nonlocalized string
    NSString *buttonTitle = NSLocalizedString(@"Native Button", nil);
#if !TARGET_OS_OSX
    _button = [UIButton buttonWithType:UIButtonTypeRoundedRect];
    [_button setTitle:buttonTitle /* [macOS] */ forState:UIControlStateNormal];
    [_button setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
    [_button setBackgroundColor:[UIColor grayColor]];

    [_button addTarget:self action:@selector(changeColor) forControlEvents:UIControlEventTouchUpInside];
#else
    _button = [NSButton new];
    [_button setTitle:buttonTitle];
    [_button setTarget:self];
    [_button setAction:@selector(changeColor)];
#endif // macOS]

    [self addSubview:_button];
    [self addSubview:_rootView];
  }
  return self;
}

- (void)layoutSubviews
{
  float spaceHeight = 20;
  float buttonHeight = 40;
  float rootViewWidth = self.bounds.size.width;
  float rootViewHeight = self.bounds.size.height - spaceHeight - buttonHeight;

  [_rootView setFrame:CGRectMake(0, 0, rootViewWidth, rootViewHeight)];
  [_button setFrame:CGRectMake(0, rootViewHeight + spaceHeight, rootViewWidth, buttonHeight)];
}

- (void)changeColor
{
  _beige = !_beige;
  [_rootView setAppProperties:@{@"color" : _beige ? @"beige" : @"purple"}];
}

- (NSArray<RCTUIView<RCTComponent> *> *)reactSubviews // [macOS]
{
  // this is to avoid unregistering our RCTRootView when the component is removed from RN hierarchy
  (void)[super reactSubviews];
  return @[];
}

@end
