/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUtils.h>

#import "RCTPausedInDebuggerOverlayController.h"

@interface RCTPausedInDebuggerViewController : UIViewController
@property (nonatomic, copy) void (^onResume)(void);
@property (nonatomic, copy) void (^onStepOver)(void);
@property (nonatomic, strong) NSString *message;
@end

@interface RCTPausedInDebuggerOverlayController ()

@property (nonatomic, strong) UIWindow *alertWindow;

@end

@implementation RCTPausedInDebuggerViewController
- (void)viewDidLoad
{
  [super viewDidLoad];

  UIView *dimmingView = [[UIView alloc] init];
  dimmingView.translatesAutoresizingMaskIntoConstraints = NO;
  dimmingView.backgroundColor = [[UIColor blackColor] colorWithAlphaComponent:0.5];
  [self.view addSubview:dimmingView];
  [NSLayoutConstraint activateConstraints:@[
    [dimmingView.topAnchor constraintEqualToAnchor:self.view.topAnchor],
    [dimmingView.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor],
    [dimmingView.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [dimmingView.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor]
  ]];

  UILabel *messageLabel = [[UILabel alloc] init];
  messageLabel.text = self.message;
  messageLabel.textAlignment = NSTextAlignmentCenter;
  messageLabel.numberOfLines = 0;
  messageLabel.font = [UIFont boldSystemFontOfSize:14];
  messageLabel.textColor = [UIColor blackColor];
  messageLabel.translatesAutoresizingMaskIntoConstraints = NO;
  UIView *messageContainer = [[UIView alloc] init];
  [messageContainer addSubview:messageLabel];
  [NSLayoutConstraint activateConstraints:@[
    [messageLabel.topAnchor constraintEqualToAnchor:messageContainer.topAnchor],
    [messageLabel.bottomAnchor constraintEqualToAnchor:messageContainer.bottomAnchor],
    [messageLabel.leadingAnchor constraintEqualToAnchor:messageContainer.leadingAnchor constant:12],
    [messageLabel.trailingAnchor constraintEqualToAnchor:messageContainer.trailingAnchor constant:-12]
  ]];

  UIButton *resumeButton = [UIButton buttonWithType:UIButtonTypeCustom];
  [resumeButton setImage:[UIImage systemImageNamed:@"forward.frame.fill"] forState:UIControlStateNormal];
  [resumeButton addTarget:self action:@selector(resumeButtonTapped) forControlEvents:UIControlEventTouchUpInside];
  resumeButton.tintColor = [UIColor colorWithRed:0.26 green:0.5 blue:0.92 alpha:1];
  [NSLayoutConstraint activateConstraints:@[
    [resumeButton.widthAnchor constraintEqualToConstant:48],
    [resumeButton.heightAnchor constraintEqualToConstant:48],
  ]];

  UIView *divider1 = [[UIView alloc] init];
  divider1.backgroundColor = [UIColor colorWithRed:0.79 green:0.79 blue:0.79 alpha:1];
  divider1.translatesAutoresizingMaskIntoConstraints = NO;
  [NSLayoutConstraint activateConstraints:@[
    [divider1.widthAnchor constraintEqualToConstant:1.0],
    [divider1.heightAnchor constraintEqualToConstant:48.0],
  ]];

  UIButton *stepOverButton = [UIButton buttonWithType:UIButtonTypeCustom];
  [stepOverButton setImage:[UIImage systemImageNamed:@"hand.point.up.left.and.text.fill"]
                  forState:UIControlStateNormal];
  [stepOverButton addTarget:self action:@selector(stepOverButtonTapped) forControlEvents:UIControlEventTouchUpInside];
  [NSLayoutConstraint activateConstraints:@[
    [stepOverButton.widthAnchor constraintEqualToConstant:48],
    [stepOverButton.heightAnchor constraintEqualToConstant:48],
  ]];

  UIView *divider2 = [[UIView alloc] init];
  divider2.backgroundColor = [UIColor colorWithRed:0.79 green:0.79 blue:0.79 alpha:1];
  divider2.translatesAutoresizingMaskIntoConstraints = NO;
  [NSLayoutConstraint activateConstraints:@[
    [divider2.widthAnchor constraintEqualToConstant:1.0],
    [divider2.heightAnchor constraintEqualToConstant:48.0],
  ]];

  UIStackView *stackView = [[UIStackView alloc]
      initWithArrangedSubviews:@[ messageContainer, divider1, resumeButton, divider2, stepOverButton ]];
  stackView.axis = UILayoutConstraintAxisHorizontal;
  stackView.distribution = UIStackViewDistributionFill;
  stackView.alignment = UIStackViewAlignmentCenter;

  [self.view addSubview:stackView];

  stackView.translatesAutoresizingMaskIntoConstraints = NO;
  [NSLayoutConstraint activateConstraints:@[
    [stackView.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor constant:10],
    [stackView.centerXAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.centerXAnchor],
  ]];

  stackView.backgroundColor = [UIColor colorWithRed:1 green:1 blue:0.76 alpha:1];
  stackView.semanticContentAttribute = UISemanticContentAttributeForceLeftToRight;
}

- (void)resumeButtonTapped
{
  self.onResume();
}

- (void)stepOverButtonTapped
{
  self.onStepOver();
}
@end

@implementation RCTPausedInDebuggerOverlayController

- (UIWindow *)alertWindow
{
  if (_alertWindow == nil) {
    _alertWindow = [[UIWindow alloc] initWithWindowScene:RCTKeyWindow().windowScene];

    if (_alertWindow) {
      _alertWindow.rootViewController = [UIViewController new];
      _alertWindow.windowLevel = UIWindowLevelAlert + 1;
    }
  }

  return _alertWindow;
}

- (void)showWithMessage:(NSString *)message onResume:(void (^)(void))onResume onStepOver:(void (^)(void))onStepOver
{
  [self hide];

  RCTPausedInDebuggerViewController *view = [[RCTPausedInDebuggerViewController alloc] init];
  view.modalPresentationStyle = UIModalPresentationOverFullScreen;
  view.message = message;
  view.onResume = onResume;
  view.onStepOver = onStepOver;
  [self.alertWindow makeKeyAndVisible];
  [self.alertWindow.rootViewController presentViewController:view animated:NO completion:nil];
}

- (void)hide
{
  [_alertWindow setHidden:YES];

  _alertWindow.windowScene = nil;

  _alertWindow = nil;
}

@end
