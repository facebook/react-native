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
  messageLabel.font = [UIFont boldSystemFontOfSize:16];
  messageLabel.textColor = [UIColor blackColor];
  messageLabel.translatesAutoresizingMaskIntoConstraints = NO;
  UIView *messageContainer = [[UIView alloc] init];
  [messageContainer addSubview:messageLabel];
  [NSLayoutConstraint activateConstraints:@[
    [messageLabel.topAnchor constraintEqualToAnchor:messageContainer.topAnchor],
    [messageLabel.bottomAnchor constraintEqualToAnchor:messageContainer.bottomAnchor],
    [messageLabel.leadingAnchor constraintEqualToAnchor:messageContainer.leadingAnchor constant:14],
    [messageLabel.trailingAnchor constraintEqualToAnchor:messageContainer.trailingAnchor],
  ]];

  UIButton *resumeButton = [UIButton buttonWithType:UIButtonTypeCustom];
  [resumeButton setImage:[UIImage systemImageNamed:@"forward.frame.fill"] forState:UIControlStateNormal];
  [resumeButton addTarget:self action:@selector(resumeButtonTapped) forControlEvents:UIControlEventTouchUpInside];
  resumeButton.tintColor = [UIColor colorWithRed:0.26 green:0.5 blue:0.92 alpha:1];
  [NSLayoutConstraint activateConstraints:@[
    [resumeButton.widthAnchor constraintEqualToConstant:48],
    [resumeButton.heightAnchor constraintEqualToConstant:48],
  ]];

  UIStackView *stackView = [[UIStackView alloc] initWithArrangedSubviews:@[ messageContainer, resumeButton ]];
  stackView.backgroundColor = [UIColor colorWithRed:1 green:1 blue:0.757 alpha:1];
  stackView.layer.cornerRadius = 12;
  stackView.layer.borderWidth = 2;
  stackView.layer.borderColor = [UIColor colorWithRed:0.816 green:0.816 blue:0.723 alpha:1].CGColor;
  stackView.translatesAutoresizingMaskIntoConstraints = NO;
  stackView.axis = UILayoutConstraintAxisHorizontal;
  stackView.distribution = UIStackViewDistributionFill;
  stackView.alignment = UIStackViewAlignmentCenter;

  [self.view addSubview:stackView];

  [NSLayoutConstraint activateConstraints:@[
    [stackView.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor constant:12],
    [stackView.centerXAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.centerXAnchor],
  ]];

  stackView.semanticContentAttribute = UISemanticContentAttributeForceLeftToRight;
}

- (void)resumeButtonTapped
{
  self.onResume();
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

- (void)showWithMessage:(NSString *)message onResume:(void (^)(void))onResume
{
  [self hide];

  RCTPausedInDebuggerViewController *view = [[RCTPausedInDebuggerViewController alloc] init];
  view.modalPresentationStyle = UIModalPresentationOverFullScreen;
  view.message = message;
  view.onResume = onResume;
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
