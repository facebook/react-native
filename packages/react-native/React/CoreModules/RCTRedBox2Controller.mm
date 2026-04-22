/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRedBox2Controller+Internal.h"

#import <React/RCTDefines.h>
#import <React/RCTJSStackFrame.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTUtils.h>

#if RCT_DEV_MENU

#pragma mark - RCTRedBox2Controller

// Color Palette (matching LogBoxStyle.js)
static UIColor *RCTRedBox2BackgroundColor()
{
  return [UIColor colorWithRed:51.0 / 255 green:51.0 / 255 blue:51.0 / 255 alpha:1.0];
}

static UIColor *RCTRedBox2ErrorColor()
{
  return [UIColor colorWithRed:243.0 / 255 green:83.0 / 255 blue:105.0 / 255 alpha:1.0];
}

static UIColor *RCTRedBox2TextColor(CGFloat opacity)
{
  return [UIColor colorWithWhite:1.0 alpha:opacity];
}

@implementation RCTRedBox2Controller {
  UITableView *_stackTraceTableView;
  UILabel *_headerTitleLabel;
  UILabel *_errorCategoryLabel;
  NSString *_lastErrorMessage;
  NSArray<RCTJSStackFrame *> *_lastStackTrace;
  NSArray<NSString *> *_customButtonTitles;
  NSArray<RCTRedBox2ButtonPressHandler> *_customButtonHandlers;
  int _lastErrorCookie;
}

- (instancetype)initWithCustomButtonTitles:(NSArray<NSString *> *)customButtonTitles
                      customButtonHandlers:(NSArray<RCTRedBox2ButtonPressHandler> *)customButtonHandlers
{
  self = [super init];
  if (self != nullptr) {
    _lastErrorCookie = -1;
    _customButtonTitles = customButtonTitles;
    _customButtonHandlers = customButtonHandlers;
    self.modalPresentationStyle = UIModalPresentationFullScreen;
  }
  return self;
}

- (void)viewDidLoad
{
  [super viewDidLoad];
  self.view.backgroundColor = RCTRedBox2BackgroundColor();

  // Header bar (adds itself to self.view)
  UIView *headerBar = [self createHeaderBar];

  // Footer button bar
  UIView *footerBar = [self createFooterBar];

  // Stack trace table
  _stackTraceTableView = [[UITableView alloc] initWithFrame:CGRectZero style:UITableViewStylePlain];
  _stackTraceTableView.translatesAutoresizingMaskIntoConstraints = NO;
  _stackTraceTableView.delegate = self;
  _stackTraceTableView.dataSource = self;
  _stackTraceTableView.backgroundColor = [UIColor clearColor];
  _stackTraceTableView.separatorStyle = UITableViewCellSeparatorStyleNone;
  _stackTraceTableView.indicatorStyle = UIScrollViewIndicatorStyleWhite;
  _stackTraceTableView.bounces = NO;
  [self.view addSubview:_stackTraceTableView];

  [NSLayoutConstraint activateConstraints:@[
    [_stackTraceTableView.topAnchor constraintEqualToAnchor:headerBar.bottomAnchor],
    [_stackTraceTableView.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [_stackTraceTableView.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],
    [_stackTraceTableView.bottomAnchor constraintEqualToAnchor:footerBar.topAnchor],
  ]];
}

#pragma mark - Header Bar

- (UIView *)createHeaderBar
{
  UIView *headerContainer = [[UIView alloc] init];
  headerContainer.translatesAutoresizingMaskIntoConstraints = NO;
  headerContainer.backgroundColor = RCTRedBox2ErrorColor();

  _headerTitleLabel = [[UILabel alloc] init];
  _headerTitleLabel.translatesAutoresizingMaskIntoConstraints = NO;
  _headerTitleLabel.textColor = [UIColor whiteColor];
  _headerTitleLabel.font = [UIFont systemFontOfSize:16 weight:UIFontWeightSemibold];
  _headerTitleLabel.textAlignment = NSTextAlignmentCenter;
  [headerContainer addSubview:_headerTitleLabel];

  [self.view addSubview:headerContainer];

  [NSLayoutConstraint activateConstraints:@[
    [headerContainer.topAnchor constraintEqualToAnchor:self.view.topAnchor],
    [headerContainer.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [headerContainer.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],

    [_headerTitleLabel.leadingAnchor constraintEqualToAnchor:headerContainer.leadingAnchor constant:12],
    [_headerTitleLabel.trailingAnchor constraintEqualToAnchor:headerContainer.trailingAnchor constant:-12],
    [_headerTitleLabel.bottomAnchor constraintEqualToAnchor:headerContainer.bottomAnchor constant:-12],
    [_headerTitleLabel.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor constant:12],
  ]];

  return headerContainer;
}

#pragma mark - Footer Bar

- (UIView *)createFooterBar
{
  const CGFloat buttonHeight = 48;

  NSString *reloadText = @"Reload";
  NSString *dismissText = @"Dismiss";
  NSString *copyText = @"Copy";

  UIButton *dismissButton = [self footerButton:dismissText
                       accessibilityIdentifier:@"redbox-dismiss"
                                      selector:@selector(dismiss)];
  UIButton *reloadButton = [self footerButton:reloadText
                      accessibilityIdentifier:@"redbox-reload"
                                     selector:@selector(reload)];
  UIButton *copyButton = [self footerButton:copyText
                    accessibilityIdentifier:@"redbox-copy"
                                   selector:@selector(copyStack)];

  UIStackView *buttonStackView = [[UIStackView alloc] init];
  buttonStackView.translatesAutoresizingMaskIntoConstraints = NO;
  buttonStackView.axis = UILayoutConstraintAxisHorizontal;
  buttonStackView.distribution = UIStackViewDistributionFillEqually;
  buttonStackView.alignment = UIStackViewAlignmentTop;
  buttonStackView.backgroundColor = RCTRedBox2BackgroundColor();

  [buttonStackView addArrangedSubview:dismissButton];
  [buttonStackView addArrangedSubview:reloadButton];
  [buttonStackView addArrangedSubview:copyButton];

  for (NSUInteger i = 0; i < [_customButtonTitles count]; i++) {
    UIButton *button = [self footerButton:_customButtonTitles[i]
                  accessibilityIdentifier:@""
                                  handler:_customButtonHandlers[i]];
    [buttonStackView addArrangedSubview:button];
  }

  // Shadow layer above footer
  buttonStackView.layer.shadowColor = [UIColor blackColor].CGColor;
  buttonStackView.layer.shadowOffset = CGSizeMake(0, -2);
  buttonStackView.layer.shadowRadius = 2;
  buttonStackView.layer.shadowOpacity = 0.5;

  [self.view addSubview:buttonStackView];

  CGFloat bottomInset = [self bottomSafeViewHeight];

  [NSLayoutConstraint activateConstraints:@[
    [buttonStackView.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
    [buttonStackView.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],
    [buttonStackView.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor],
    [buttonStackView.heightAnchor constraintEqualToConstant:buttonHeight + bottomInset],
  ]];

  for (UIButton *btn in buttonStackView.arrangedSubviews) {
    [btn.heightAnchor constraintEqualToConstant:buttonHeight].active = YES;
  }

  return buttonStackView;
}

- (UIButton *)styledButton:(NSString *)title accessibilityIdentifier:(NSString *)accessibilityIdentifier
{
  UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
  button.accessibilityIdentifier = accessibilityIdentifier;
  button.titleLabel.font = [UIFont systemFontOfSize:14];
  button.titleLabel.textAlignment = NSTextAlignmentCenter;
  button.backgroundColor = RCTRedBox2BackgroundColor();
  [button setTitle:title forState:UIControlStateNormal];
  [button setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
  [button setTitleColor:RCTRedBox2TextColor(0.5) forState:UIControlStateHighlighted];
  return button;
}

- (UIButton *)footerButton:(NSString *)title
    accessibilityIdentifier:(NSString *)accessibilityIdentifier
                   selector:(SEL)selector
{
  UIButton *button = [self styledButton:title accessibilityIdentifier:accessibilityIdentifier];
  [button addTarget:self action:selector forControlEvents:UIControlEventTouchUpInside];
  return button;
}

- (UIButton *)footerButton:(NSString *)title
    accessibilityIdentifier:(NSString *)accessibilityIdentifier
                    handler:(RCTRedBox2ButtonPressHandler)handler
{
  UIButton *button = [self styledButton:title accessibilityIdentifier:accessibilityIdentifier];
  [button addAction:[UIAction actionWithHandler:^(__unused UIAction *action) {
            handler();
          }]
      forControlEvents:UIControlEventTouchUpInside];
  return button;
}

- (CGFloat)bottomSafeViewHeight
{
#if TARGET_OS_MACCATALYST
  return 0;
#else
  return RCTKeyWindow().safeAreaInsets.bottom;
#endif
}

#pragma mark - Error Display

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
      [RCTKeyWindow().rootViewController presentViewController:self animated:NO completion:nil];
    }
  }
}

- (void)dismiss
{
  [self dismissViewControllerAnimated:NO completion:nil];
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
    if (stackFrame.file != nullptr) {
      [fullStackTrace appendFormat:@"    %@\n", [self formatFrameSource:stackFrame]];
    }
  }
#if !TARGET_OS_TV
  UIPasteboard *pb = [UIPasteboard generalPasteboard];
  [pb setString:fullStackTrace];
#endif
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

#pragma mark - TableView DataSource & Delegate

- (NSInteger)numberOfSectionsInTableView:(__unused UITableView *)tableView
{
  return _lastStackTrace.count > 0 ? 2 : 1;
}

- (NSInteger)tableView:(__unused UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
  return section == 0 ? 1 : static_cast<NSInteger>(_lastStackTrace.count);
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
  if (cell == nullptr) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"msg-cell"];
    cell.backgroundColor = RCTRedBox2BackgroundColor();
    cell.selectionStyle = UITableViewCellSelectionStyleNone;

    // Error category label (e.g. "Syntax Error", "Uncaught Error")
    _errorCategoryLabel = [[UILabel alloc] init];
    _errorCategoryLabel.translatesAutoresizingMaskIntoConstraints = NO;
    _errorCategoryLabel.textColor = RCTRedBox2ErrorColor();
    _errorCategoryLabel.font = [UIFont systemFontOfSize:21 weight:UIFontWeightBold];
    _errorCategoryLabel.numberOfLines = 1;
    [cell.contentView addSubview:_errorCategoryLabel];

    // Error message label
    UILabel *messageLabel = [[UILabel alloc] init];
    messageLabel.translatesAutoresizingMaskIntoConstraints = NO;
    messageLabel.accessibilityIdentifier = @"redbox-error";
    messageLabel.textColor = [UIColor whiteColor];
    messageLabel.font = [UIFont systemFontOfSize:14 weight:UIFontWeightMedium];
    messageLabel.lineBreakMode = NSLineBreakByWordWrapping;
    messageLabel.numberOfLines = 0;
    messageLabel.tag = 100;
    [cell.contentView addSubview:messageLabel];

    [NSLayoutConstraint activateConstraints:@[
      [_errorCategoryLabel.topAnchor constraintEqualToAnchor:cell.contentView.topAnchor constant:15],
      [_errorCategoryLabel.leadingAnchor constraintEqualToAnchor:cell.contentView.leadingAnchor constant:12],
      [_errorCategoryLabel.trailingAnchor constraintEqualToAnchor:cell.contentView.trailingAnchor constant:-12],

      [messageLabel.topAnchor constraintEqualToAnchor:_errorCategoryLabel.bottomAnchor constant:10],
      [messageLabel.leadingAnchor constraintEqualToAnchor:cell.contentView.leadingAnchor constant:12],
      [messageLabel.trailingAnchor constraintEqualToAnchor:cell.contentView.trailingAnchor constant:-12],
      [messageLabel.bottomAnchor constraintEqualToAnchor:cell.contentView.bottomAnchor constant:-15],
    ]];
  }

  _errorCategoryLabel.text = @"Error";
  UILabel *messageLabel = [cell.contentView viewWithTag:100];
  messageLabel.text = message;

  return cell;
}

- (UITableViewCell *)reuseCell:(UITableViewCell *)cell forStackFrame:(RCTJSStackFrame *)stackFrame
{
  if (cell == nullptr) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:@"cell"];
    cell.textLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:14];
    cell.textLabel.lineBreakMode = NSLineBreakByCharWrapping;
    cell.textLabel.numberOfLines = 2;
    cell.detailTextLabel.font = [UIFont systemFontOfSize:12 weight:UIFontWeightLight];
    cell.detailTextLabel.lineBreakMode = NSLineBreakByTruncatingMiddle;
    cell.backgroundColor = [UIColor clearColor];
    cell.selectedBackgroundView = [UIView new];
    cell.selectedBackgroundView.backgroundColor = RCTRedBox2BackgroundColor();
    cell.selectedBackgroundView.layer.cornerRadius = 5;
  }

  cell.textLabel.text = stackFrame.methodName ?: @"(unnamed method)";
  if (stackFrame.file != nullptr) {
    cell.detailTextLabel.text = [self formatFrameSource:stackFrame];
  } else {
    cell.detailTextLabel.text = @"";
  }

  if (stackFrame.collapse) {
    cell.textLabel.textColor = RCTRedBox2TextColor(0.4);
    cell.detailTextLabel.textColor = RCTRedBox2TextColor(0.3);
  } else {
    cell.textLabel.textColor = [UIColor whiteColor];
    cell.detailTextLabel.textColor = RCTRedBox2TextColor(0.8);
  }

  return cell;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.section == 0) {
    return UITableViewAutomaticDimension;
  } else {
    return 50;
  }
}

- (CGFloat)tableView:(__unused UITableView *)tableView estimatedHeightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.section == 0) {
    return 100;
  }
  return 50;
}

- (UIView *)tableView:(__unused UITableView *)tableView viewForHeaderInSection:(NSInteger)section
{
  if (section == 1) {
    UIView *headerView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 0, 38)];
    headerView.backgroundColor = [UIColor clearColor];

    UILabel *label = [[UILabel alloc] init];
    label.translatesAutoresizingMaskIntoConstraints = NO;
    label.text = @"Call Stack";
    label.textColor = [UIColor whiteColor];
    label.font = [UIFont systemFontOfSize:18 weight:UIFontWeightSemibold];
    [headerView addSubview:label];

    [NSLayoutConstraint activateConstraints:@[
      [label.leadingAnchor constraintEqualToAnchor:headerView.leadingAnchor constant:12],
      [label.trailingAnchor constraintEqualToAnchor:headerView.trailingAnchor constant:-12],
      [label.bottomAnchor constraintEqualToAnchor:headerView.bottomAnchor constant:-10],
    ]];

    return headerView;
  }
  return nil;
}

- (CGFloat)tableView:(__unused UITableView *)tableView heightForHeaderInSection:(NSInteger)section
{
  return section == 1 ? 38 : 0;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.section == 1) {
    NSUInteger row = indexPath.row;
    RCTJSStackFrame *stackFrame = _lastStackTrace[row];
    [_actionDelegate redBoxController:self openStackFrameInEditor:stackFrame];
  }
  [tableView deselectRowAtIndexPath:indexPath animated:YES];
}

#pragma mark - Key Commands

- (NSArray<UIKeyCommand *> *)keyCommands
{
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
  ];
}

- (BOOL)canBecomeFirstResponder
{
  return YES;
}

@end

#endif
