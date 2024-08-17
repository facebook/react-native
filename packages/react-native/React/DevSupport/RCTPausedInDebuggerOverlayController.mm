/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUtils.h>
#import <React/RCTUIKit.h> // [macOS]

#import "RCTPausedInDebuggerOverlayController.h"

@interface RCTPausedInDebuggerViewController : UIViewController
@property (nonatomic, copy) void (^onResume)(void);
@property (nonatomic, strong) NSString *message;
@end

@interface RCTPausedInDebuggerOverlayController ()
#if !TARGET_OS_OSX // [macOS]

@property (nonatomic, strong) UIWindow *alertWindow;

#endif // [macOS];
@end

@implementation RCTPausedInDebuggerViewController
#if !TARGET_OS_OSX // [macOS]
- (void)viewDidLoad
{
  [super viewDidLoad];

  UIView *dimmingView = [[UIView alloc] init];
  dimmingView.translatesAutoresizingMaskIntoConstraints = NO;
  dimmingView.backgroundColor = [[UIColor blackColor] colorWithAlphaComponent:0.2];
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
    [messageLabel.topAnchor constraintEqualToAnchor:messageContainer.topAnchor constant:-1],
    [messageLabel.bottomAnchor constraintEqualToAnchor:messageContainer.bottomAnchor],
    [messageLabel.leadingAnchor constraintEqualToAnchor:messageContainer.leadingAnchor constant:16],
    [messageLabel.trailingAnchor constraintEqualToAnchor:messageContainer.trailingAnchor],
  ]];

  UIButton *resumeButton = [UIButton buttonWithType:UIButtonTypeCustom];
  [resumeButton setImage:[UIImage systemImageNamed:@"forward.frame.fill"] forState:UIControlStateNormal];
  resumeButton.tintColor = [UIColor colorWithRed:0.37 green:0.37 blue:0.37 alpha:1];
  resumeButton.adjustsImageWhenDisabled = NO;
  resumeButton.enabled = NO;
  [NSLayoutConstraint activateConstraints:@[
    [resumeButton.widthAnchor constraintEqualToConstant:48],
    [resumeButton.heightAnchor constraintEqualToConstant:46],
  ]];

  UIStackView *stackView = [[UIStackView alloc] initWithArrangedSubviews:@[ messageContainer, resumeButton ]];
  stackView.backgroundColor = [UIColor colorWithRed:1 green:1 blue:0.757 alpha:1];
  stackView.layer.cornerRadius = 12;
  stackView.layer.borderWidth = 2;
  stackView.layer.borderColor = [UIColor colorWithRed:0.71 green:0.71 blue:0.62 alpha:1].CGColor;
  stackView.translatesAutoresizingMaskIntoConstraints = NO;
  stackView.axis = UILayoutConstraintAxisHorizontal;
  stackView.distribution = UIStackViewDistributionFill;
  stackView.alignment = UIStackViewAlignmentCenter;

  UITapGestureRecognizer *gestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self
                                                                                      action:@selector(handleResume:)];
  [stackView addGestureRecognizer:gestureRecognizer];
  stackView.userInteractionEnabled = YES;

  [self.view addSubview:stackView];

  [NSLayoutConstraint activateConstraints:@[
    [stackView.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor constant:12],
    [stackView.centerXAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.centerXAnchor],
  ]];

  stackView.semanticContentAttribute = UISemanticContentAttributeForceLeftToRight;
}

- (void)handleResume:(UITapGestureRecognizer *)recognizer
{
  self.onResume();
}
#endif // [macOS]
@end

@implementation RCTPausedInDebuggerOverlayController

#if !TARGET_OS_OSX // [macOS]
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
#endif // [macOS]

- (void)showWithMessage:(NSString *)message onResume:(void (^)(void))onResume
{
  [self hide];

  RCTPausedInDebuggerViewController *view = [[RCTPausedInDebuggerViewController alloc] init];
#if !TARGET_OS_OSX // [macOS]
  view.modalPresentationStyle = UIModalPresentationOverFullScreen;
  view.message = message;
  view.onResume = onResume;
  [self.alertWindow makeKeyAndVisible];
  [self.alertWindow.rootViewController presentViewController:view animated:NO completion:nil];
#endif // [macOS]
}

- (void)hide
{
#if !TARGET_OS_OSX // [macOS]
  [_alertWindow setHidden:YES];

  _alertWindow.windowScene = nil;

  _alertWindow = nil;
#endif // macOS]
}

@end
