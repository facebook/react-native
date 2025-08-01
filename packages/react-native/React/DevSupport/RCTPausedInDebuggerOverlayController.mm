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

@property (nonatomic, strong) RCTPlatformWindow *alertWindow; // [macOS]

@end

@implementation RCTPausedInDebuggerViewController
- (void)viewDidLoad
{
  [super viewDidLoad];

#if !TARGET_OS_OSX // [macOS]
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
#endif // [macOS]
  
  RCTUILabel *messageLabel = [[RCTUILabel alloc] init]; // [macOS]
  messageLabel.text = self.message;
  messageLabel.textAlignment = NSTextAlignmentCenter;
#if !TARGET_OS_OSX // [macOS]
  messageLabel.numberOfLines = 0;
#endif // [macOS]
  messageLabel.font = [UIFont boldSystemFontOfSize:16];
  messageLabel.textColor = [RCTUIColor blackColor]; // [macOS]
  messageLabel.translatesAutoresizingMaskIntoConstraints = NO;
  RCTUIView *messageContainer = [[RCTUIView alloc] init]; // [macOS]
  [messageContainer addSubview:messageLabel];
  [NSLayoutConstraint activateConstraints:@[
    [messageLabel.topAnchor constraintEqualToAnchor:messageContainer.topAnchor constant:-1],
    [messageLabel.bottomAnchor constraintEqualToAnchor:messageContainer.bottomAnchor],
    [messageLabel.leadingAnchor constraintEqualToAnchor:messageContainer.leadingAnchor constant:16],
    [messageLabel.trailingAnchor constraintEqualToAnchor:messageContainer.trailingAnchor],
  ]];

#if !TARGET_OS_OSX // [macOS]
  UIButton *resumeButton = [UIButton buttonWithType:UIButtonTypeCustom];
  [resumeButton setImage:[UIImage systemImageNamed:@"forward.frame.fill"] forState:UIControlStateNormal];
  resumeButton.tintColor = [UIColor colorWithRed:0.37 green:0.37 blue:0.37 alpha:1];
  resumeButton.adjustsImageWhenDisabled = NO;
  resumeButton.enabled = NO;
#else // [macOS
  NSButton *resumeButton = [[NSButton alloc] init];
  [resumeButton setImage:[NSImage imageWithSystemSymbolName:@"forward.frame.fill" accessibilityDescription:@"Resume"]];
  resumeButton.bordered = NO;
  resumeButton.target = self;
  resumeButton.action = @selector(handleResume:);
  resumeButton.contentTintColor = [NSColor colorWithRed:0.37 green:0.37 blue:0.37 alpha:1];
#endif // macOS]
  
  [NSLayoutConstraint activateConstraints:@[
    [resumeButton.widthAnchor constraintEqualToConstant:48],
    [resumeButton.heightAnchor constraintEqualToConstant:46],
  ]];

#if !TARGET_OS_OSX // [macOS]
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
#else // [macOS
  NSStackView *stackView = [NSStackView stackViewWithViews:@[ messageContainer, resumeButton ]];
  stackView.wantsLayer = YES;
  stackView.layer.backgroundColor = [NSColor colorWithRed:1 green:1 blue:0.757 alpha:1].CGColor;
  stackView.translatesAutoresizingMaskIntoConstraints = NO;
  stackView.orientation = NSUserInterfaceLayoutOrientationHorizontal;
  stackView.distribution = NSStackViewDistributionFill;
  stackView.alignment = NSLayoutAttributeCenterY;

  NSClickGestureRecognizer *gestureRecognizer = [[NSClickGestureRecognizer alloc] initWithTarget:self
                                                                                         action:@selector(handleResume:)];
  [stackView addGestureRecognizer:gestureRecognizer];
#endif // macOS]

#if !TARGET_OS_OSX
  [self.view addSubview:stackView];

  [NSLayoutConstraint activateConstraints:@[
    [stackView.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor constant:12],
    [stackView.centerXAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.centerXAnchor],
  ]];
#else
  [self setView:stackView];
#endif 

#if !TARGET_OS_OSX // [macOS]
  stackView.semanticContentAttribute = UISemanticContentAttributeForceLeftToRight;
#else // [macOS
  stackView.userInterfaceLayoutDirection = NSUserInterfaceLayoutDirectionLeftToRight;
#endif // macOS]
}

#if !TARGET_OS_OSX // [macOS]
- (void)handleResume:(UITapGestureRecognizer *)recognizer
{
  self.onResume();
}
#else // [macOS
- (void)handleResume:(id)sender
{
  self.onResume();
}
#endif // macOS]
@end

@implementation RCTPausedInDebuggerOverlayController

- (RCTPlatformWindow *)alertWindow // [macOS]
{
  if (_alertWindow == nil) {
#if !TARGET_OS_OSX // [macOS]
    _alertWindow = [[UIWindow alloc] initWithWindowScene:RCTKeyWindow().windowScene];

    if (_alertWindow) {
      _alertWindow.rootViewController = [UIViewController new];
      _alertWindow.windowLevel = UIWindowLevelAlert + 1;
    }
#else // [macOS]
    _alertWindow = [[NSWindow alloc] initWithContentRect:NSMakeRect(0, 0, 100, 100)
                                               styleMask:NSWindowStyleMaskBorderless | NSWindowStyleMaskFullSizeContentView
                                                 backing:NSBackingStoreBuffered
                                                   defer:YES];
    _alertWindow.backgroundColor = [NSColor clearColor];
    _alertWindow.opaque = NO;
#endif // macOS]
  }

  return _alertWindow;
}

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
#else // [macOS]
  view.message = message;
  view.onResume = onResume;

  self.alertWindow.contentViewController = view;
  NSWindow *parentWindow = RCTKeyWindow();
  if (![[parentWindow sheets] doesContain:self->_alertWindow]) {
    [parentWindow beginSheet:self.alertWindow completionHandler:^(NSModalResponse returnCode) {
      [self->_alertWindow orderOut:self];
    }];
  }
#endif // macOS]
}

- (void)hide
{
#if !TARGET_OS_OSX // [macOS]
  [_alertWindow setHidden:YES];

  _alertWindow.windowScene = nil;
#else // [macOS]
  NSWindow *parentWindow = RCTKeyWindow();
  if (parentWindow) {
    for (NSWindow *sheet in [parentWindow sheets]) {
      if (sheet == _alertWindow) {
        [parentWindow endSheet:sheet];
        break;
      }
    }
  }
#endif // macOS]

  _alertWindow = nil;
}

@end
