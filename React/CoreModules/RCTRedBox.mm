/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRedBox.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTErrorInfo.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTJSStackFrame.h>
#import <React/RCTRedBoxExtraDataViewController.h>
#import <React/RCTRedBoxSetEnabled.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTUtils.h>

#import <objc/runtime.h>

#import "CoreModulesPlugins.h"

#if RCT_DEV_MENU

@class RCTRedBoxWindow;

@interface UIButton (RCTRedBox)

@property (nonatomic) RCTRedBoxButtonPressHandler rct_handler;

- (void)rct_addBlock:(RCTRedBoxButtonPressHandler)handler forControlEvents:(UIControlEvents)controlEvents;

@end

@implementation UIButton (RCTRedBox)

- (RCTRedBoxButtonPressHandler)rct_handler
{
  return objc_getAssociatedObject(self, @selector(rct_handler));
}

- (void)setRct_handler:(RCTRedBoxButtonPressHandler)rct_handler
{
  objc_setAssociatedObject(self, @selector(rct_handler), rct_handler, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (void)rct_callBlock
{
  if (self.rct_handler) {
    self.rct_handler();
  }
}

- (void)rct_addBlock:(RCTRedBoxButtonPressHandler)handler forControlEvents:(UIControlEvents)controlEvents
{
  self.rct_handler = handler;
  [self addTarget:self action:@selector(rct_callBlock) forControlEvents:controlEvents];
}

@end

@protocol RCTRedBoxWindowActionDelegate <NSObject>

- (void)redBoxWindow:(RCTRedBoxWindow *)redBoxWindow openStackFrameInEditor:(RCTJSStackFrame *)stackFrame;
- (void)reloadFromRedBoxWindow:(RCTRedBoxWindow *)redBoxWindow;
- (void)loadExtraDataViewController;

@end

@interface RCTRedBoxWindow : NSObject <UITableViewDelegate, UITableViewDataSource>
@property (nonatomic, strong) UIViewController *rootViewController;
@property (nonatomic, weak) id<RCTRedBoxWindowActionDelegate> actionDelegate;
@end

@implementation RCTRedBoxWindow {
  UITableView *_stackTraceTableView;
  NSString *_lastErrorMessage;
  NSArray<RCTJSStackFrame *> *_lastStackTrace;
  int _lastErrorCookie;
}

- (instancetype)initWithFrame:(CGRect)frame
           customButtonTitles:(NSArray<NSString *> *)customButtonTitles
         customButtonHandlers:(NSArray<RCTRedBoxButtonPressHandler> *)customButtonHandlers
{
  if (self = [super init]) {
    _lastErrorCookie = -1;

    _rootViewController = [UIViewController new];
    UIView *rootView = _rootViewController.view;
    rootView.frame = frame;
    rootView.backgroundColor = [UIColor blackColor];

    const CGFloat buttonHeight = 60;

    CGRect detailsFrame = rootView.bounds;
    detailsFrame.size.height -= buttonHeight + (double)[self bottomSafeViewHeight];

    _stackTraceTableView = [[UITableView alloc] initWithFrame:detailsFrame style:UITableViewStylePlain];
    _stackTraceTableView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _stackTraceTableView.delegate = self;
    _stackTraceTableView.dataSource = self;
    _stackTraceTableView.backgroundColor = [UIColor clearColor];
    _stackTraceTableView.separatorColor = [UIColor colorWithWhite:1 alpha:0.3];
    _stackTraceTableView.separatorStyle = UITableViewCellSeparatorStyleNone;
    _stackTraceTableView.indicatorStyle = UIScrollViewIndicatorStyleWhite;
    [rootView addSubview:_stackTraceTableView];

#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST
    NSString *reloadText = @"Reload\n(\u2318R)";
    NSString *dismissText = @"Dismiss\n(ESC)";
    NSString *copyText = @"Copy\n(\u2325\u2318C)";
    NSString *extraText = @"Extra Info\n(\u2318E)";
#else
    NSString *reloadText = @"Reload JS";
    NSString *dismissText = @"Dismiss";
    NSString *copyText = @"Copy";
    NSString *extraText = @"Extra Info";
#endif

    UIButton *dismissButton = [self redBoxButton:dismissText
                         accessibilityIdentifier:@"redbox-dismiss"
                                        selector:@selector(dismiss)
                                           block:nil];
    UIButton *reloadButton = [self redBoxButton:reloadText
                        accessibilityIdentifier:@"redbox-reload"
                                       selector:@selector(reload)
                                          block:nil];
    UIButton *copyButton = [self redBoxButton:copyText
                      accessibilityIdentifier:@"redbox-copy"
                                     selector:@selector(copyStack)
                                        block:nil];
    UIButton *extraButton = [self redBoxButton:extraText
                       accessibilityIdentifier:@"redbox-extra"
                                      selector:@selector(showExtraDataViewController)
                                         block:nil];

    CGFloat buttonWidth = frame.size.width / (CGFloat)(4 + [customButtonTitles count]);
    CGFloat bottomButtonHeight = frame.size.height - buttonHeight - (CGFloat)[self bottomSafeViewHeight];
    dismissButton.frame = CGRectMake(0, bottomButtonHeight, buttonWidth, buttonHeight);
    reloadButton.frame = CGRectMake(buttonWidth, bottomButtonHeight, buttonWidth, buttonHeight);
    copyButton.frame = CGRectMake(buttonWidth * 2, bottomButtonHeight, buttonWidth, buttonHeight);
    extraButton.frame = CGRectMake(buttonWidth * 3, bottomButtonHeight, buttonWidth, buttonHeight);

    [rootView addSubview:dismissButton];
    [rootView addSubview:reloadButton];
    [rootView addSubview:copyButton];
    [rootView addSubview:extraButton];

    for (NSUInteger i = 0; i < [customButtonTitles count]; i++) {
      UIButton *button = [self redBoxButton:customButtonTitles[i]
                    accessibilityIdentifier:@""
                                   selector:nil
                                      block:customButtonHandlers[i]];
      button.frame = CGRectMake(buttonWidth * (double)(4 + i), bottomButtonHeight, buttonWidth, buttonHeight);
      [rootView addSubview:button];
    }

    UIView *topBorder =
        [[UIView alloc] initWithFrame:CGRectMake(0, bottomButtonHeight + 1, rootView.frame.size.width, 1)];
    topBorder.backgroundColor = [UIColor colorWithRed:0.70 green:0.70 blue:0.70 alpha:1.0];

    [rootView addSubview:topBorder];

    UIView *bottomSafeView = [UIView new];
    bottomSafeView.backgroundColor = [UIColor colorWithRed:0.1 green:0.1 blue:0.1 alpha:1];
    bottomSafeView.frame = CGRectMake(
        0,
        frame.size.height - (CGFloat)[self bottomSafeViewHeight],
        frame.size.width,
        (CGFloat)[self bottomSafeViewHeight]);

    [rootView addSubview:bottomSafeView];
  }
  return self;
}

- (UIButton *)redBoxButton:(NSString *)title
    accessibilityIdentifier:(NSString *)accessibilityIdentifier
                   selector:(SEL)selector
                      block:(RCTRedBoxButtonPressHandler)block
{
  UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
  button.autoresizingMask =
      UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleRightMargin;
  button.accessibilityIdentifier = accessibilityIdentifier;
  button.titleLabel.font = [UIFont systemFontOfSize:13];
  button.titleLabel.lineBreakMode = NSLineBreakByWordWrapping;
  button.titleLabel.textAlignment = NSTextAlignmentCenter;
  button.backgroundColor = [UIColor colorWithRed:0.1 green:0.1 blue:0.1 alpha:1];
  [button setTitle:title forState:UIControlStateNormal];
  [button setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
  [button setTitleColor:[UIColor colorWithWhite:1 alpha:0.5] forState:UIControlStateHighlighted];
  if (selector) {
    [button addTarget:self action:selector forControlEvents:UIControlEventTouchUpInside];
  } else if (block) {
    [button rct_addBlock:block forControlEvents:UIControlEventTouchUpInside];
  }
  return button;
}

- (NSInteger)bottomSafeViewHeight
{
  return RCTSharedApplication().delegate.window.safeAreaInsets.bottom;
}

RCT_NOT_IMPLEMENTED(-(instancetype)initWithCoder : (NSCoder *)aDecoder)

- (NSString *)stripAnsi:(NSString *)text
{
  NSError *error = nil;
  NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"\\x1b\\[[0-9;]*m"
                                                                         options:NSRegularExpressionCaseInsensitive
                                                                           error:&error];
  return [regex stringByReplacingMatchesInString:text options:0 range:NSMakeRange(0, [text length]) withTemplate:@""];
}

- (void)showErrorMessage:(NSString *)message
               withStack:(NSArray<RCTJSStackFrame *> *)stack
                isUpdate:(BOOL)isUpdate
             errorCookie:(int)errorCookie
{
  // Remove ANSI color codes from the message
  NSString *messageWithoutAnsi = [self stripAnsi:message];

  BOOL isRootViewControllerPresented = self.rootViewController.presentingViewController != nil;
  // Show if this is a new message, or if we're updating the previous message
  BOOL isNew = !isRootViewControllerPresented && !isUpdate;
  BOOL isUpdateForSameMessage = !isNew &&
      (isRootViewControllerPresented && isUpdate &&
       ((errorCookie == -1 && [_lastErrorMessage isEqualToString:messageWithoutAnsi]) ||
        (errorCookie == _lastErrorCookie)));
  if (isNew || isUpdateForSameMessage) {
    _lastStackTrace = stack;
    // message is displayed using UILabel, which is unable to render text of
    // unlimited length, so we truncate it
    _lastErrorMessage = [messageWithoutAnsi substringToIndex:MIN((NSUInteger)10000, messageWithoutAnsi.length)];
    _lastErrorCookie = errorCookie;

    [_stackTraceTableView reloadData];

    if (!isRootViewControllerPresented) {
      [_stackTraceTableView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]
                                  atScrollPosition:UITableViewScrollPositionTop
                                          animated:NO];
      [RCTKeyWindow().rootViewController presentViewController:self.rootViewController animated:YES completion:nil];
    }
  }
}

- (void)dismiss
{
  [self.rootViewController dismissViewControllerAnimated:YES completion:nil];
}

- (void)reload
{
  [_actionDelegate reloadFromRedBoxWindow:self];
}

- (void)showExtraDataViewController
{
  [_actionDelegate loadExtraDataViewController];
}

- (void)copyStack
{
  NSMutableString *fullStackTrace;

  if (_lastErrorMessage != nil) {
    fullStackTrace = [_lastErrorMessage mutableCopy];
    [fullStackTrace appendString:@"\n\n"];
  } else {
    fullStackTrace = [NSMutableString string];
  }

  for (RCTJSStackFrame *stackFrame in _lastStackTrace) {
    [fullStackTrace appendString:[NSString stringWithFormat:@"%@\n", stackFrame.methodName]];
    if (stackFrame.file) {
      [fullStackTrace appendFormat:@"    %@\n", [self formatFrameSource:stackFrame]];
    }
  }
  UIPasteboard *pb = [UIPasteboard generalPasteboard];
  [pb setString:fullStackTrace];
}

- (NSString *)formatFrameSource:(RCTJSStackFrame *)stackFrame
{
  NSString *fileName = RCTNilIfNull(stackFrame.file) ? [stackFrame.file lastPathComponent] : @"<unknown file>";
  NSString *lineInfo = [NSString stringWithFormat:@"%@:%lld", fileName, (long long)stackFrame.lineNumber];

  if (stackFrame.column != 0) {
    lineInfo = [lineInfo stringByAppendingFormat:@":%lld", (long long)stackFrame.column];
  }
  return lineInfo;
}

#pragma mark - TableView

- (NSInteger)numberOfSectionsInTableView:(__unused UITableView *)tableView
{
  return 2;
}

- (NSInteger)tableView:(__unused UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  return section == 0 ? 1 : _lastStackTrace.count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.section == 0) {
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"msg-cell"];
    return [self reuseCell:cell forErrorMessage:_lastErrorMessage];
  }
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"cell"];
  NSUInteger index = indexPath.row;
  RCTJSStackFrame *stackFrame = _lastStackTrace[index];
  return [self reuseCell:cell forStackFrame:stackFrame];
}

- (UITableViewCell *)reuseCell:(UITableViewCell *)cell forErrorMessage:(NSString *)message
{
  if (!cell) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"msg-cell"];
    cell.textLabel.accessibilityIdentifier = @"redbox-error";
    cell.textLabel.textColor = [UIColor whiteColor];
    if (@available(iOS 13.0, *)) {
      // Prefer a monofont for formatting messages that were designed
      // to be displayed in a terminal.
      cell.textLabel.font = [UIFont monospacedSystemFontOfSize:14 weight:UIFontWeightBold];
    } else {
      cell.textLabel.font = [UIFont boldSystemFontOfSize:14];
    }
    cell.textLabel.lineBreakMode = NSLineBreakByWordWrapping;
    cell.textLabel.numberOfLines = 0;
    cell.detailTextLabel.textColor = [UIColor whiteColor];
    cell.backgroundColor = [UIColor colorWithRed:0.82 green:0.10 blue:0.15 alpha:1.0];
    cell.selectionStyle = UITableViewCellSelectionStyleNone;
  }

  cell.textLabel.text = message;

  return cell;
}

- (UITableViewCell *)reuseCell:(UITableViewCell *)cell forStackFrame:(RCTJSStackFrame *)stackFrame
{
  if (!cell) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:@"cell"];
    cell.textLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:14];
    cell.textLabel.lineBreakMode = NSLineBreakByCharWrapping;
    cell.textLabel.numberOfLines = 2;
    cell.detailTextLabel.textColor = [UIColor colorWithRed:0.70 green:0.70 blue:0.70 alpha:1.0];
    cell.detailTextLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:11];
    cell.detailTextLabel.lineBreakMode = NSLineBreakByTruncatingMiddle;
    cell.backgroundColor = [UIColor clearColor];
    cell.selectedBackgroundView = [UIView new];
    cell.selectedBackgroundView.backgroundColor = [UIColor colorWithWhite:0 alpha:0.2];
  }

  cell.textLabel.text = stackFrame.methodName ?: @"(unnamed method)";
  if (stackFrame.file) {
    cell.detailTextLabel.text = [self formatFrameSource:stackFrame];
  } else {
    cell.detailTextLabel.text = @"";
  }
  cell.textLabel.textColor = stackFrame.collapse ? [UIColor lightGrayColor] : [UIColor whiteColor];
  cell.detailTextLabel.textColor = stackFrame.collapse ? [UIColor colorWithRed:0.50 green:0.50 blue:0.50 alpha:1.0]
                                                       : [UIColor colorWithRed:0.70 green:0.70 blue:0.70 alpha:1.0];
  return cell;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.section == 0) {
    NSMutableParagraphStyle *paragraphStyle = [[NSParagraphStyle defaultParagraphStyle] mutableCopy];
    paragraphStyle.lineBreakMode = NSLineBreakByWordWrapping;

    NSDictionary *attributes =
        @{NSFontAttributeName : [UIFont boldSystemFontOfSize:16], NSParagraphStyleAttributeName : paragraphStyle};
    CGRect boundingRect =
        [_lastErrorMessage boundingRectWithSize:CGSizeMake(tableView.frame.size.width - 30, CGFLOAT_MAX)
                                        options:NSStringDrawingUsesLineFragmentOrigin
                                     attributes:attributes
                                        context:nil];
    return ceil(boundingRect.size.height) + 40;
  } else {
    return 50;
  }
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.section == 1) {
    NSUInteger row = indexPath.row;
    RCTJSStackFrame *stackFrame = _lastStackTrace[row];
    [_actionDelegate redBoxWindow:self openStackFrameInEditor:stackFrame];
  }
  [tableView deselectRowAtIndexPath:indexPath animated:YES];
}

#pragma mark - Key commands

- (NSArray<UIKeyCommand *> *)keyCommands
{
  // NOTE: We could use RCTKeyCommands for this, but since
  // we control this window, we can use the standard, non-hacky
  // mechanism instead

  return @[
    // Dismiss red box
    [UIKeyCommand keyCommandWithInput:UIKeyInputEscape modifierFlags:0 action:@selector(dismiss)],

    // Reload
    [UIKeyCommand keyCommandWithInput:@"r" modifierFlags:UIKeyModifierCommand action:@selector(reload)],

    // Copy = Cmd-Option C since Cmd-C in the simulator copies the pasteboard from
    // the simulator to the desktop pasteboard.
    [UIKeyCommand keyCommandWithInput:@"c"
                        modifierFlags:UIKeyModifierCommand | UIKeyModifierAlternate
                               action:@selector(copyStack)],

    // Extra data
    [UIKeyCommand keyCommandWithInput:@"e"
                        modifierFlags:UIKeyModifierCommand
                               action:@selector(showExtraDataViewController)]
  ];
}

- (BOOL)canBecomeFirstResponder
{
  return YES;
}

@end

@interface RCTRedBox () <
    RCTInvalidating,
    RCTRedBoxWindowActionDelegate,
    RCTRedBoxExtraDataActionDelegate,
    NativeRedBoxSpec>
@end

@implementation RCTRedBox {
  RCTRedBoxWindow *_window;
  NSMutableArray<id<RCTErrorCustomizer>> *_errorCustomizers;
  RCTRedBoxExtraDataViewController *_extraDataViewController;
  NSMutableArray<NSString *> *_customButtonTitles;
  NSMutableArray<RCTRedBoxButtonPressHandler> *_customButtonHandlers;
}

@synthesize bridge = _bridge;
@synthesize moduleRegistry = _moduleRegistry;
@synthesize bundleManager = _bundleManager;

RCT_EXPORT_MODULE()

- (void)registerErrorCustomizer:(id<RCTErrorCustomizer>)errorCustomizer
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!self->_errorCustomizers) {
      self->_errorCustomizers = [NSMutableArray array];
    }
    if (![self->_errorCustomizers containsObject:errorCustomizer]) {
      [self->_errorCustomizers addObject:errorCustomizer];
    }
  });
}

// WARNING: Should only be called from the main thread/dispatch queue.
- (RCTErrorInfo *)_customizeError:(RCTErrorInfo *)error
{
  RCTAssertMainQueue();
  if (!self->_errorCustomizers) {
    return error;
  }
  for (id<RCTErrorCustomizer> customizer in self->_errorCustomizers) {
    RCTErrorInfo *newInfo = [customizer customizeErrorInfo:error];
    if (newInfo) {
      error = newInfo;
    }
  }
  return error;
}

- (void)showError:(NSError *)error
{
  [self showErrorMessage:error.localizedDescription
             withDetails:error.localizedFailureReason
                   stack:error.userInfo[RCTJSStackTraceKey]
             errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message
{
  [self showErrorMessage:message withParsedStack:nil isUpdate:NO errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details
{
  [self showErrorMessage:message withDetails:details stack:nil errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message
             withDetails:(NSString *)details
                   stack:(NSArray<RCTJSStackFrame *> *)stack
             errorCookie:(int)errorCookie
{
  NSString *combinedMessage = message;
  if (details) {
    combinedMessage = [NSString stringWithFormat:@"%@\n\n%@", message, details];
  }
  [self showErrorMessage:combinedMessage withParsedStack:stack isUpdate:NO errorCookie:errorCookie];
}

- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack
{
  [self showErrorMessage:message withRawStack:rawStack errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack errorCookie:(int)errorCookie
{
  NSArray<RCTJSStackFrame *> *stack = [RCTJSStackFrame stackFramesWithLines:rawStack];
  [self showErrorMessage:message withParsedStack:stack isUpdate:NO errorCookie:errorCookie];
}

- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
  [self showErrorMessage:message withStack:stack errorCookie:-1];
}

- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
  [self updateErrorMessage:message withStack:stack errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack errorCookie:(int)errorCookie
{
  [self showErrorMessage:message
         withParsedStack:[RCTJSStackFrame stackFramesWithDictionaries:stack]
                isUpdate:NO
             errorCookie:errorCookie];
}

- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack errorCookie:(int)errorCookie
{
  [self showErrorMessage:message
         withParsedStack:[RCTJSStackFrame stackFramesWithDictionaries:stack]
                isUpdate:YES
             errorCookie:errorCookie];
}

- (void)showErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
{
  [self showErrorMessage:message withParsedStack:stack errorCookie:-1];
}

- (void)updateErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
{
  [self updateErrorMessage:message withParsedStack:stack errorCookie:-1];
}

- (void)showErrorMessage:(NSString *)message
         withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
             errorCookie:(int)errorCookie
{
  [self showErrorMessage:message withParsedStack:stack isUpdate:NO errorCookie:errorCookie];
}

- (void)updateErrorMessage:(NSString *)message
           withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
               errorCookie:(int)errorCookie
{
  [self showErrorMessage:message withParsedStack:stack isUpdate:YES errorCookie:errorCookie];
}

- (void)showErrorMessage:(NSString *)message
         withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
                isUpdate:(BOOL)isUpdate
             errorCookie:(int)errorCookie
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_extraDataViewController == nil) {
      self->_extraDataViewController = [RCTRedBoxExtraDataViewController new];
      self->_extraDataViewController.actionDelegate = self;
    }

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [[self->_moduleRegistry moduleForName:"EventDispatcher"] sendDeviceEventWithName:@"collectRedBoxExtraData"
                                                                                body:nil];
#pragma clang diagnostic pop

    if (!self->_window) {
      self->_window = [[RCTRedBoxWindow alloc] initWithFrame:[UIScreen mainScreen].bounds
                                          customButtonTitles:self->_customButtonTitles
                                        customButtonHandlers:self->_customButtonHandlers];
      self->_window.actionDelegate = self;
    }

    RCTErrorInfo *errorInfo = [[RCTErrorInfo alloc] initWithErrorMessage:message stack:stack];
    errorInfo = [self _customizeError:errorInfo];
    [self->_window showErrorMessage:errorInfo.errorMessage
                          withStack:errorInfo.stack
                           isUpdate:isUpdate
                        errorCookie:errorCookie];
  });
}

- (void)loadExtraDataViewController
{
  dispatch_async(dispatch_get_main_queue(), ^{
    // Make sure the CMD+E shortcut doesn't call this twice
    if (self->_extraDataViewController != nil && ![self->_window.rootViewController presentedViewController]) {
      [self->_window.rootViewController presentViewController:self->_extraDataViewController
                                                     animated:YES
                                                   completion:nil];
    }
  });
}

RCT_EXPORT_METHOD(setExtraData : (NSDictionary *)extraData forIdentifier : (NSString *)identifier)
{
  [_extraDataViewController addExtraData:extraData forIdentifier:identifier];
}

RCT_EXPORT_METHOD(dismiss)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_window dismiss];
  });
}

- (void)invalidate
{
  [self dismiss];
}

- (void)redBoxWindow:(__unused RCTRedBoxWindow *)redBoxWindow openStackFrameInEditor:(RCTJSStackFrame *)stackFrame
{
  NSURL *const bundleURL = _overrideBundleURL ?: _bundleManager.bundleURL;
  if (![bundleURL.scheme hasPrefix:@"http"]) {
    RCTLogWarn(@"Cannot open stack frame in editor because you're not connected to the packager.");
    return;
  }

  NSData *stackFrameJSON = [RCTJSONStringify([stackFrame toDictionary], NULL) dataUsingEncoding:NSUTF8StringEncoding];
  NSString *postLength = [NSString stringWithFormat:@"%tu", stackFrameJSON.length];
  NSMutableURLRequest *request = [NSMutableURLRequest new];
  request.URL = [NSURL URLWithString:@"/open-stack-frame" relativeToURL:bundleURL];
  request.HTTPMethod = @"POST";
  request.HTTPBody = stackFrameJSON;
  [request setValue:postLength forHTTPHeaderField:@"Content-Length"];
  [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];

  [[[NSURLSession sharedSession] dataTaskWithRequest:request] resume];
}

- (void)reload
{
  // Window is not used and can be nil
  [self reloadFromRedBoxWindow:nil];
}

- (void)reloadFromRedBoxWindow:(__unused RCTRedBoxWindow *)redBoxWindow
{
  if (_overrideReloadAction) {
    _overrideReloadAction();
  } else {
    RCTTriggerReloadCommandListeners(@"Redbox");
  }
  [self dismiss];
}

- (void)addCustomButton:(NSString *)title onPressHandler:(RCTRedBoxButtonPressHandler)handler
{
  if (!_customButtonTitles) {
    _customButtonTitles = [NSMutableArray new];
    _customButtonHandlers = [NSMutableArray new];
  }

  [_customButtonTitles addObject:title];
  [_customButtonHandlers addObject:handler];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeRedBoxSpecJSI>(params);
}

@end

@implementation RCTBridge (RCTRedBox)

- (RCTRedBox *)redBox
{
  return RCTRedBoxGetEnabled() ? [self moduleForClass:[RCTRedBox class]] : nil;
}

@end

#else // Disabled

@interface RCTRedBox () <NativeRedBoxSpec>
@end

@implementation RCTRedBox

+ (NSString *)moduleName
{
  return nil;
}
- (void)registerErrorCustomizer:(id<RCTErrorCustomizer>)errorCustomizer
{
}
- (void)showError:(NSError *)error
{
}
- (void)showErrorMessage:(NSString *)message
{
}
- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details
{
}
- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack
{
}
- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack errorCookie:(int)errorCookie
{
}
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
}
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
}
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack errorCookie:(int)errorCookie
{
}
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack errorCookie:(int)errorCookie
{
}
- (void)showErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
{
}
- (void)updateErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
{
}
- (void)showErrorMessage:(NSString *)message
         withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
             errorCookie:(int)errorCookie
{
}
- (void)updateErrorMessage:(NSString *)message
           withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
               errorCookie:(int)errorCookie
{
}
- (void)setExtraData:(NSDictionary *)extraData forIdentifier:(NSString *)identifier
{
}

- (void)dismiss
{
}

- (void)addCustomButton:(NSString *)title onPressHandler:(RCTRedBoxButtonPressHandler)handler
{
}
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeRedBoxSpecJSI>(params);
}

@end

@implementation RCTBridge (RCTRedBox)

- (RCTRedBox *)redBox
{
  return nil;
}

@end

#endif

Class RCTRedBoxCls(void)
{
  return RCTRedBox.class;
}
