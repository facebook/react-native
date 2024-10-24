/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRedBox.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <React/RCTErrorInfo.h>
#import <React/RCTEventDispatcherProtocol.h>
#import <React/RCTJSStackFrame.h>
#import <React/RCTRedBoxExtraDataViewController.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTUtils.h>

#import <objc/runtime.h>

#import "CoreModulesPlugins.h"

#if RCT_DEV_MENU

@class RCTRedBoxController;

#if !TARGET_OS_OSX // [macOS]
@interface UIButton (RCTRedBox)
#else // [macOS
@interface NSButton (RCTRedBox)
#endif // macOS]

@property (nonatomic) RCTRedBoxButtonPressHandler rct_handler;

#if !TARGET_OS_OSX // [macOS]
- (void)rct_addBlock:(RCTRedBoxButtonPressHandler)handler forControlEvents:(UIControlEvents)controlEvents;
#else // [macOS
- (void)rct_addBlock:(RCTRedBoxButtonPressHandler)handler;
#endif // macOS]

@end

#if !TARGET_OS_OSX // [macOS]
@implementation UIButton (RCTRedBox)
#else // [macOS
@implementation NSButton (RCTRedBox)
#endif // macOS]

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

#if !TARGET_OS_OSX // [macOS]
- (void)rct_addBlock:(RCTRedBoxButtonPressHandler)handler forControlEvents:(UIControlEvents)controlEvents;
#else // [macOS
- (void)rct_addBlock:(RCTRedBoxButtonPressHandler)handler
#endif // macOS]
{
  self.rct_handler = handler;
#if !TARGET_OS_OSX // [macOS]
  [self addTarget:self action:@selector(rct_callBlock) forControlEvents:controlEvents];
#else // [macOS
  [self setTarget:self];
  [self setAction:@selector(rct_callBlock)];
#endif // macOS]
}

@end

@protocol RCTRedBoxControllerActionDelegate <NSObject>

- (void)redBoxController:(RCTRedBoxController *)redBoxController openStackFrameInEditor:(RCTJSStackFrame *)stackFrame;
- (void)reloadFromRedBoxController:(RCTRedBoxController *)redBoxController;
- (void)loadExtraDataViewController;

@end

#if !TARGET_OS_OSX // [macOS]
@interface RCTRedBoxController : UIViewController <UITableViewDelegate, UITableViewDataSource>
#else // [macOS
@interface RCTRedBoxController : NSViewController <NSTableViewDelegate, NSTableViewDataSource>
#endif // macOS]
@property (nonatomic, weak) id<RCTRedBoxControllerActionDelegate> actionDelegate;
@end

@implementation RCTRedBoxController {
#if !TARGET_OS_OSX // [macOS]
  UITableView *_stackTraceTableView;
#else // [macOS
  NSTableView *_stackTraceTableView;
#endif //  macOS]
  NSString *_lastErrorMessage;
  NSArray<RCTJSStackFrame *> *_lastStackTrace;
  NSArray<NSString *> *_customButtonTitles;
  NSArray<RCTRedBoxButtonPressHandler> *_customButtonHandlers;
  int _lastErrorCookie;
}

- (instancetype)initWithCustomButtonTitles:(NSArray<NSString *> *)customButtonTitles
                      customButtonHandlers:(NSArray<RCTRedBoxButtonPressHandler> *)customButtonHandlers
{
  if (self = [super init]) {
    _lastErrorCookie = -1;
    _customButtonTitles = customButtonTitles;
    _customButtonHandlers = customButtonHandlers;
  }

  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];
#if !TARGET_OS_OSX // [macOS]
  self.view.backgroundColor = [UIColor blackColor];
#else // [macOS
  self.view.wantsLayer = YES;
  self.view.layer.backgroundColor = [[NSColor blackColor] CGColor];
#endif // macOS]

  const CGFloat buttonHeight = 60;

  CGRect detailsFrame = self.view.bounds;
  detailsFrame.size.height -= buttonHeight + (double)[self bottomSafeViewHeight];

#if !TARGET_OS_OSX // [macOS]
  _stackTraceTableView = [[UITableView alloc] initWithFrame:detailsFrame style:UITableViewStylePlain];
  _stackTraceTableView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  _stackTraceTableView.delegate = self;
  _stackTraceTableView.dataSource = self;
  _stackTraceTableView.backgroundColor = [UIColor clearColor];
  _stackTraceTableView.separatorColor = [UIColor colorWithWhite:1 alpha:0.3];
  _stackTraceTableView.separatorStyle = UITableViewCellSeparatorStyleNone;
  _stackTraceTableView.indicatorStyle = UIScrollViewIndicatorStyleWhite;
  [self.view addSubview:_stackTraceTableView];
#else // [macOS
  NSScrollView *scrollView = [[NSScrollView alloc] initWithFrame:NSZeroRect];
  scrollView.translatesAutoresizingMaskIntoConstraints = NO;
  scrollView.autoresizesSubviews = YES;
  scrollView.drawsBackground = NO;

  _stackTraceTableView = [[NSTableView alloc] initWithFrame:NSZeroRect];
  _stackTraceTableView.translatesAutoresizingMaskIntoConstraints = NO;
  _stackTraceTableView.dataSource = self;
  _stackTraceTableView.delegate = self;
  _stackTraceTableView.headerView = nil;
  _stackTraceTableView.allowsColumnReordering = NO;
  _stackTraceTableView.allowsColumnResizing = NO;
  _stackTraceTableView.columnAutoresizingStyle = NSTableViewFirstColumnOnlyAutoresizingStyle;
  _stackTraceTableView.backgroundColor = [NSColor clearColor];
  _stackTraceTableView.allowsTypeSelect = NO;
  
  NSTableColumn *tableColumn = [[NSTableColumn alloc] initWithIdentifier:@"info"];
  [_stackTraceTableView addTableColumn:tableColumn];

  scrollView.documentView = _stackTraceTableView;
  [self.view addSubview:scrollView];
#endif // macOS]

#if TARGET_OS_SIMULATOR || TARGET_OS_MACCATALYST || TARGET_OS_OSX // [macOS]
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

#if !TARGET_OS_OSX // [macOS]
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
#else // [macOS
  NSButton *dismissButton = [self redBoxButton:dismissText
                       accessibilityIdentifier:@"redbox-dismiss"
                                      selector:@selector(dismiss)
                                         block:nil];
  [dismissButton setKeyEquivalent:@"\e"];
  NSButton *reloadButton = [self redBoxButton:reloadText
                      accessibilityIdentifier:@"redbox-reload"
                                     selector:@selector(reload)
                                        block:nil];
  [reloadButton setKeyEquivalent:@"r"];
  [reloadButton setKeyEquivalentModifierMask:NSEventModifierFlagCommand];
  NSButton *copyButton = [self redBoxButton:copyText
                    accessibilityIdentifier:@"redbox-copy"
                                   selector:@selector(copyStack)
                                      block:nil];
  [copyButton setKeyEquivalent:@"c"];
  [copyButton setKeyEquivalentModifierMask:NSEventModifierFlagOption | NSEventModifierFlagCommand];
  NSButton *extraButton = [self redBoxButton:extraText
                     accessibilityIdentifier:@"redbox-extra"
                                    selector:@selector(showExtraDataViewController)
                                       block:nil];
#endif // macOS]

  [NSLayoutConstraint activateConstraints:@[
    [dismissButton.heightAnchor constraintEqualToConstant:buttonHeight],
    [reloadButton.heightAnchor constraintEqualToConstant:buttonHeight],
    [copyButton.heightAnchor constraintEqualToConstant:buttonHeight],
    [extraButton.heightAnchor constraintEqualToConstant:buttonHeight]
  ]];

#if !TARGET_OS_OSX // [macOS]
  UIStackView *buttonStackView = [[UIStackView alloc] init];
  buttonStackView.translatesAutoresizingMaskIntoConstraints = NO;
  buttonStackView.axis = UILayoutConstraintAxisHorizontal;
  buttonStackView.distribution = UIStackViewDistributionFillEqually;
  buttonStackView.alignment = UIStackViewAlignmentTop;
  buttonStackView.backgroundColor = [UIColor colorWithRed:0.1 green:0.1 blue:0.1 alpha:1];
#else // [macOS
  NSStackView *buttonStackView = [[NSStackView alloc] init];
  buttonStackView.translatesAutoresizingMaskIntoConstraints = NO;
  buttonStackView.orientation = NSUserInterfaceLayoutOrientationHorizontal;
  buttonStackView.distribution = NSStackViewDistributionFillEqually;
  buttonStackView.alignment = NSLayoutAttributeTop;
  buttonStackView.wantsLayer = YES;
  buttonStackView.layer.backgroundColor = [NSColor colorWithRed:0.1 green:0.1 blue:0.1 alpha:1].CGColor;
#endif // macOS]

  [buttonStackView addArrangedSubview:dismissButton];
  [buttonStackView addArrangedSubview:reloadButton];
  [buttonStackView addArrangedSubview:copyButton];
  [buttonStackView addArrangedSubview:extraButton];

  [self.view addSubview:buttonStackView];

  [NSLayoutConstraint activateConstraints:@[
    [buttonStackView.heightAnchor constraintEqualToConstant:buttonHeight + [self bottomSafeViewHeight]],
    [buttonStackView.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [buttonStackView.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],
    [buttonStackView.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor]
  ]];


  for (NSUInteger i = 0; i < [_customButtonTitles count]; i++) {
#if !TARGET_OS_OSX // [macOS]
    UIButton *button = [self redBoxButton:_customButtonTitles[i]
                  accessibilityIdentifier:@""
                                 selector:nil
                                    block:_customButtonHandlers[i]];
#else // [macOS
  NSButton *button = [self redBoxButton:_customButtonTitles[i]
                  accessibilityIdentifier:@""
                                 selector:nil
                                    block:_customButtonHandlers[i]];
#endif // macOS]
    [button.heightAnchor constraintEqualToConstant:buttonHeight].active = YES;
    [buttonStackView addArrangedSubview:button];
  }

  RCTPlatformView *topBorder = [[RCTPlatformView alloc] init]; // [macOS]
  topBorder.translatesAutoresizingMaskIntoConstraints = NO;
#if !TARGET_OS_OSX // [macOS]
  topBorder.backgroundColor = [UIColor colorWithRed:0.70 green:0.70 blue:0.70 alpha:1.0];
#else // [macOS
  topBorder.wantsLayer = true;
  topBorder.layer.backgroundColor = [NSColor colorWithRed:0.70 green:0.70 blue:0.70 alpha:1.0].CGColor;
#endif // macOS]
  [topBorder.heightAnchor constraintEqualToConstant:1].active = YES;

  [self.view addSubview:topBorder];

  [NSLayoutConstraint activateConstraints:@[
    [topBorder.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [topBorder.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],
    [topBorder.bottomAnchor constraintEqualToAnchor:buttonStackView.topAnchor]
  ]];

#if TARGET_OS_OSX // [macOS
  [NSLayoutConstraint activateConstraints:@[
    [[scrollView leadingAnchor] constraintEqualToAnchor:[[self view] leadingAnchor]],
    [[scrollView topAnchor] constraintEqualToAnchor:[[self view] topAnchor]],
    [[scrollView trailingAnchor] constraintEqualToAnchor:[[self view] trailingAnchor]],
    [[scrollView bottomAnchor] constraintEqualToAnchor:[topBorder topAnchor]],
  ]];
#endif // macOS]
}

#if !TARGET_OS_OSX // [macOS]
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
#else // [macOS
- (NSButton *)redBoxButton:(NSString *)title
   accessibilityIdentifier:(NSString *)accessibilityIdentifier
                  selector:(SEL)selector
                     block:(RCTRedBoxButtonPressHandler)block
{
  NSButton *button = [[NSButton alloc] initWithFrame:NSZeroRect];
  button.translatesAutoresizingMaskIntoConstraints = NO;
  button.accessibilityIdentifier = @"accessibilityIdentifier";
  button.bordered = NO;
  NSAttributedString *attributedTitle = [[NSAttributedString alloc]
                                         initWithString:title
                                         attributes:@{NSForegroundColorAttributeName : [ NSColor whiteColor] }];
  button.attributedTitle = attributedTitle;
  [button setButtonType:NSButtonTypeMomentaryPushIn];
  if (selector) {
    button.target = self;
    button.action = selector;
  } else if (block) {
    [button rct_addBlock:block];
  }
  return button;
}
#endif // macOS]

- (NSInteger)bottomSafeViewHeight
{
#if TARGET_OS_MACCATALYST || TARGET_OS_OSX // [macOS]
  return 0;
#else
  return RCTSharedApplication().delegate.window.safeAreaInsets.bottom;
#endif
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

  BOOL isRootViewControllerPresented = self.presentingViewController != nil;
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
#if !TARGET_OS_OSX // [macOS]
      [_stackTraceTableView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]
                                  atScrollPosition:UITableViewScrollPositionTop
                                          animated:NO];
      [RCTKeyWindow().rootViewController presentViewController:self animated:YES completion:nil];
#else // [macOS
	  [_stackTraceTableView scrollRowToVisible:0];
    [[RCTKeyWindow() contentViewController] presentViewControllerAsSheet:self];
#endif // macOS]
    }
  }
}

- (void)dismiss
{
#if !TARGET_OS_OSX // [macOS]
  [self dismissViewControllerAnimated:YES completion:nil];
#else // [macOS
  [[RCTKeyWindow() contentViewController] dismissViewController:self];
#endif // macOS]
}

- (void)reload
{
  if (_actionDelegate != nil) {
    [_actionDelegate reloadFromRedBoxController:self];
  } else {
    // In bridgeless mode `RCTRedBox` gets deallocated, we need to notify listeners anyway.
    RCTTriggerReloadCommandListeners(@"Redbox");
    [self dismiss];
  }
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
#if !TARGET_OS_OSX // [macOS]
  UIPasteboard *pb = [UIPasteboard generalPasteboard];
  [pb setString:fullStackTrace];
#else // [macOS
  NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
  [pasteboard clearContents];
  [pasteboard setString:fullStackTrace forType:NSPasteboardTypeString];
#endif // macOS]
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

#if !TARGET_OS_OSX // [macOS]
- (NSInteger)numberOfSectionsInTableView:(__unused UITableView *)tableView
{
  return 2;
}

- (NSInteger)tableView:(__unused UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  return section == 0 ? 1 : _lastStackTrace.count;
}
#else // [macOS
- (NSInteger)numberOfRowsInTableView:(__unused NSTableView *)tableView
{
  return (_lastErrorMessage != nil) + _lastStackTrace.count;
}
#endif // macOS]

#if !TARGET_OS_OSX // [macOS]
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
#else // [macOS
- (nullable NSView *)tableView:(NSTableView *)tableView viewForTableColumn:(nullable NSTableColumn *)tableColumn row:(NSInteger)row
{
  if (row == 0) {
    NSTableCellView *cell = [tableView makeViewWithIdentifier:@"msg-cell" owner:nil];
    return [self reuseCell:cell forErrorMessage:_lastErrorMessage];
  }
  NSTableCellView *cell = [tableView makeViewWithIdentifier:@"cell" owner:nil];
  NSUInteger index = row - 1;
  RCTJSStackFrame *stackFrame = _lastStackTrace[index];
  return [self reuseCell:cell forStackFrame:stackFrame];

}
#endif // macOS]

#if !TARGET_OS_OSX
- (UITableViewCell *)reuseCell:(UITableViewCell *)cell forErrorMessage:(NSString *)message
{
  if (!cell) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"msg-cell"];
    cell.textLabel.accessibilityIdentifier = @"redbox-error";
    cell.textLabel.textColor = [UIColor whiteColor];

    // Prefer a monofont for formatting messages that were designed
    // to be displayed in a terminal.
    cell.textLabel.font = [UIFont monospacedSystemFontOfSize:14 weight:UIFontWeightBold];

    cell.textLabel.lineBreakMode = NSLineBreakByWordWrapping;
    cell.textLabel.numberOfLines = 0;
    cell.detailTextLabel.textColor = [UIColor whiteColor];
    cell.backgroundColor = [UIColor colorWithRed:0.82 green:0.10 blue:0.15 alpha:1.0];
    cell.selectionStyle = UITableViewCellSelectionStyleNone;
  }

  cell.textLabel.text = message;

  return cell;
}
#else // [macOS
- (NSTableCellView *)reuseCell:(NSTableCellView *)cell forErrorMessage:(NSString *)message
{
  if (!cell) {
    cell = [[NSTableCellView alloc] initWithFrame:NSZeroRect];
    cell.rowSizeStyle = NSTableViewRowSizeStyleCustom;
    cell.textField.accessibilityIdentifier = @"red box-error";

    NSTextField *label = [[NSTextField alloc] initWithFrame:NSZeroRect];
    label.translatesAutoresizingMaskIntoConstraints = NO;
    label.drawsBackground = NO;
    label.bezeled = NO;
    label.editable = NO;
    
    [cell addSubview:label];
    cell.textField = label;
    
    [NSLayoutConstraint activateConstraints:@[
      [[label leadingAnchor] constraintEqualToAnchor:[cell leadingAnchor] constant:5],
      [[label topAnchor] constraintEqualToAnchor:[cell topAnchor] constant:5],
      [[label trailingAnchor] constraintEqualToAnchor:[cell trailingAnchor] constant:-5],
      [[label bottomAnchor] constraintEqualToAnchor:[cell bottomAnchor] constant:-5],
    ]];

    // Prefer a monofont for formatting messages that were designed
    // to be displayed in a terminal.
    cell.textField.font = [NSFont monospacedSystemFontOfSize:14 weight:NSFontWeightBold];

    cell.textField.lineBreakMode = NSLineBreakByWordWrapping;
    cell.textField.maximumNumberOfLines = 0;
    cell.wantsLayer = true;
    cell.layer.cornerRadius = 8.0;
    cell.layer.cornerCurve = kCACornerCurveContinuous;
    
    cell.layer.backgroundColor = [NSColor colorWithRed:0.82 green:0.10 blue:0.15 alpha:1.0].CGColor;
  }

  NSDictionary<NSString *, id> *attributes = @{
    NSForegroundColorAttributeName : [NSColor whiteColor],
    NSFontAttributeName : [NSFont systemFontOfSize:16],
  };
  NSAttributedString *title = [[NSAttributedString alloc] initWithString:message attributes:attributes];
  
  cell.textField.attributedStringValue = title;

  return cell;
}
#endif // [macOS]

#if !TARGET_OS_OSX // [macOS]
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
#else // [macOS
- (NSTableCellView *)reuseCell:(NSTableCellView *)cell forStackFrame:(RCTJSStackFrame *)stackFrame
{
  if (!cell) {
    cell = [[NSTableCellView alloc] initWithFrame:NSZeroRect];

    NSTextField *label = [[NSTextField alloc] initWithFrame:NSZeroRect];
    label.translatesAutoresizingMaskIntoConstraints = NO;
    label.backgroundColor = [NSColor clearColor];
    label.bezeled = NO;
    label.editable = NO;
    
    label.maximumNumberOfLines = 2;

    [cell addSubview:label];
    cell.textField = label;

    [NSLayoutConstraint activateConstraints:@[
      [[label leadingAnchor] constraintEqualToAnchor:[cell leadingAnchor] constant:5],
      [[label topAnchor] constraintEqualToAnchor:[cell topAnchor]],
      [[label trailingAnchor] constraintEqualToAnchor:[cell trailingAnchor] constant:-5],
      [[label bottomAnchor] constraintEqualToAnchor:[cell bottomAnchor]],
    ]];
  }
  
  NSString *text = stackFrame.methodName ?: @"(unnamed method)";
  
  NSMutableParagraphStyle *textParagraphStyle = [NSMutableParagraphStyle new];
  textParagraphStyle.lineBreakMode = NSLineBreakByCharWrapping;
  
  NSDictionary<NSString *, id> *textAttributes = @{
    NSForegroundColorAttributeName : stackFrame.collapse ? [NSColor lightGrayColor] : [NSColor whiteColor],
    NSFontAttributeName : [NSFont fontWithName:@"Menlo-Regular" size:14],
    NSParagraphStyleAttributeName : textParagraphStyle,
  };
  
  NSAttributedString *attributedText = [[NSAttributedString alloc] initWithString:text attributes:textAttributes];
  
  
  NSMutableAttributedString *title = [attributedText mutableCopy];

  // NSTableCellView doesn't contain a subtitle text field. Rather than define our own custom row view,
  // let's append the detail text with a new line if it is needed.
  if (stackFrame.file) {
    cell.textField.maximumNumberOfLines = 3;
    
    NSString *detailText = [self formatFrameSource:stackFrame];
    
    NSMutableParagraphStyle *detailTextParagraphStyle = [NSMutableParagraphStyle new];
    detailTextParagraphStyle.lineBreakMode = NSLineBreakByTruncatingMiddle;
    
    NSDictionary<NSString *, id> *detailTextAttributes = @{
      NSForegroundColorAttributeName : stackFrame.collapse ?
        [NSColor colorWithRed:0.50 green:0.50 blue:0.50 alpha:1.0] :
        [NSColor colorWithRed:0.70 green:0.70 blue:0.70 alpha:1.0],
      NSFontAttributeName : [NSFont fontWithName:@"Menlo-Regular" size:11],
      NSParagraphStyleAttributeName : detailTextParagraphStyle,
    };
    NSAttributedString *attributedDetailText = [[NSAttributedString alloc] initWithString:detailText attributes:detailTextAttributes];
    
    [title appendAttributedString:[[NSAttributedString alloc] initWithString:@"\n"]];
    [title appendAttributedString:attributedDetailText];
  }
  
  cell.textField.attributedStringValue = title;

  return cell;
}
#endif // macOS]

#if !TARGET_OS_OSX // [macOS]
- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
#else // [macOS
- (CGFloat)tableView:(NSTableView *)tableView heightOfRow:(NSInteger)row
#endif // macOS]
{
#if !TARGET_OS_OSX // [macOS]
  if (indexPath.section == 0) {
#else // [macOS
  if (row == 0) {
#endif // macOS]
    NSMutableParagraphStyle *paragraphStyle = [[NSParagraphStyle defaultParagraphStyle] mutableCopy];
    paragraphStyle.lineBreakMode = NSLineBreakByWordWrapping;

    NSDictionary *attributes =
#if !TARGET_OS_OSX // [macOS]
        @{NSFontAttributeName : [UIFont boldSystemFontOfSize:16], NSParagraphStyleAttributeName : paragraphStyle};
#else // [macOS
        @{NSFontAttributeName : [NSFont boldSystemFontOfSize:16], NSParagraphStyleAttributeName : paragraphStyle};
#endif // macOS]
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

#if !TARGET_OS_OSX // [macOS
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.section == 1) {
    NSUInteger row = indexPath.row;
    RCTJSStackFrame *stackFrame = _lastStackTrace[row];
    [_actionDelegate redBoxController:self openStackFrameInEditor:stackFrame];
  }
  [tableView deselectRowAtIndexPath:indexPath animated:YES];
}
#else // [macOS
- (BOOL)tableView:(__unused NSTableView *)tableView shouldSelectRow:(__unused NSInteger)row
{
  if (row != 0) {
    NSUInteger index = row - 1;
    RCTJSStackFrame *stackFrame = _lastStackTrace[index];
    [_actionDelegate redBoxController:self openStackFrameInEditor:stackFrame];
  }
  return NO;
}
#endif // macOS]

#pragma mark - Key commands

#if !TARGET_OS_OSX // [macOS]
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
#endif // [macOS]

@end

@interface RCTRedBox () <
    RCTInvalidating,
    RCTRedBoxControllerActionDelegate,
    RCTRedBoxExtraDataActionDelegate,
    NativeRedBoxSpec>
@end

@implementation RCTRedBox {
  RCTRedBoxController *_controller;
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
    if (!self->_controller) {
      self->_controller = [[RCTRedBoxController alloc] initWithCustomButtonTitles:self->_customButtonTitles
                                                             customButtonHandlers:self->_customButtonHandlers];
      self->_controller.actionDelegate = self;
    }

    RCTErrorInfo *errorInfo = [[RCTErrorInfo alloc] initWithErrorMessage:message stack:stack];
    errorInfo = [self _customizeError:errorInfo];
    [self->_controller showErrorMessage:errorInfo.errorMessage
                              withStack:errorInfo.stack
                               isUpdate:isUpdate
                            errorCookie:errorCookie];
  });
}

- (void)loadExtraDataViewController {
  dispatch_async(dispatch_get_main_queue(), ^{
#if !TARGET_OS_OSX // [macOS]
    // Make sure the CMD+E shortcut doesn't call this twice
    if (self->_extraDataViewController != nil && ![self->_controller presentedViewController]) {
      [self->_controller presentViewController:self->_extraDataViewController animated:YES completion:nil];
    }
#else // [macOS
    // Do nothing, as we haven't implemented `RCTRedBoxExtraDataViewController` on macOS yet
#endif // [macOS]
  });
}

RCT_EXPORT_METHOD(setExtraData:(NSDictionary *)extraData forIdentifier:(NSString *)identifier) {
    [_extraDataViewController addExtraData:extraData forIdentifier:identifier];
}

RCT_EXPORT_METHOD(dismiss)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_controller dismiss];
  });
}

- (void)invalidate
{
  [self dismiss];
}

- (void)redBoxController:(__unused RCTRedBoxController *)redBoxController
    openStackFrameInEditor:(RCTJSStackFrame *)stackFrame
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
  [self reloadFromRedBoxController:nil];
}

- (void)reloadFromRedBoxController:(__unused RCTRedBoxController *)redBoxController
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

#endif

Class RCTRedBoxCls(void)
{
  return RCTRedBox.class;
}
