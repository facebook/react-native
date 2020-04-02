/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

#import "UpdatePropertiesExampleView.h"

#import <React/RCTRootView.h>
#import <React/RCTViewManager.h>

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
#import "AppDelegate.h"
#else // [TODO(macOS ISS#2323203)
#import "../../RNTester-macOS/AppDelegate.h"
#endif // ]TODO(macOS ISS#2323203)

@interface UpdatePropertiesExampleViewManager : RCTViewManager

@end

@implementation UpdatePropertiesExampleViewManager

RCT_EXPORT_MODULE();

- (RCTUIView *)view // TODO(macOS ISS#2323203)
{
  return [UpdatePropertiesExampleView new];
}

@end

@implementation UpdatePropertiesExampleView
{
  RCTRootView *_rootView;
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UIButton *_button;
#else // [TODO(macOS ISS#2323203)
  NSButton *_button;
#endif // ]TODO(macOS ISS#2323203)
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
                                  initialProperties:@{@"color":@"beige"}];

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    _button = [UIButton buttonWithType:UIButtonTypeRoundedRect];
    [_button setTitle:@"Native Button" forState:UIControlStateNormal];
    [_button setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
    [_button setBackgroundColor:[UIColor grayColor]];

    [_button addTarget:self
                action:@selector(changeColor)
      forControlEvents:UIControlEventTouchUpInside];
#else // [TODO(macOS ISS#2323203)
    _button = [[NSButton alloc] init];
    [_button setTitle:@"Native Button"];
    [_button setTarget:self];
    [_button setAction:@selector(changeColor)];
#endif // ]TODO(macOS ISS#2323203)

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
  [_rootView setAppProperties:@{@"color":_beige ? @"beige" : @"purple"}];
}

- (NSArray<RCTUIView<RCTComponent> *> *)reactSubviews // TODO(macOS ISS#2323203)
{
  // this is to avoid unregistering our RCTRootView when the component is removed from RN hierarchy
  (void)[super reactSubviews];
  return @[];
}

@end
