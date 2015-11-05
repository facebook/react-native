/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTRedBox.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTDefines.h"
#import "RCTUtils.h"

#if RCT_DEBUG

@interface RCTRedBoxWindow : UIWindow <UITableViewDelegate, UITableViewDataSource>
@end

@implementation RCTRedBoxWindow
{
  UITableView *_stackTraceTableView;
  NSString *_lastErrorMessage;
  NSArray<NSDictionary *> *_lastStackTrace;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    self.windowLevel = UIWindowLevelAlert + 1000;
    self.backgroundColor = [UIColor colorWithRed:0.8 green:0 blue:0 alpha:1];
    self.hidden = YES;

    UIViewController *rootController = [UIViewController new];
    self.rootViewController = rootController;
    UIView *rootView = rootController.view;
    rootView.backgroundColor = [UIColor clearColor];

    const CGFloat buttonHeight = 60;

    CGRect detailsFrame = rootView.bounds;
    detailsFrame.size.height -= buttonHeight;

    _stackTraceTableView = [[UITableView alloc] initWithFrame:detailsFrame style:UITableViewStylePlain];
    _stackTraceTableView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _stackTraceTableView.delegate = self;
    _stackTraceTableView.dataSource = self;
    _stackTraceTableView.backgroundColor = [UIColor clearColor];
    _stackTraceTableView.separatorColor = [UIColor colorWithWhite:1 alpha:0.3];
    _stackTraceTableView.separatorStyle = UITableViewCellSeparatorStyleNone;
    _stackTraceTableView.indicatorStyle = UIScrollViewIndicatorStyleWhite;
    [rootView addSubview:_stackTraceTableView];

    UIButton *dismissButton = [UIButton buttonWithType:UIButtonTypeCustom];
    dismissButton.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleRightMargin;
    dismissButton.accessibilityIdentifier = @"redbox-dismiss";
    dismissButton.titleLabel.font = [UIFont systemFontOfSize:14];
    [dismissButton setTitle:@"Dismiss (ESC)" forState:UIControlStateNormal];
    [dismissButton setTitleColor:[UIColor colorWithWhite:1 alpha:0.5] forState:UIControlStateNormal];
    [dismissButton setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
    [dismissButton addTarget:self action:@selector(dismiss) forControlEvents:UIControlEventTouchUpInside];

    UIButton *reloadButton = [UIButton buttonWithType:UIButtonTypeCustom];
    reloadButton.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleLeftMargin;
    reloadButton.accessibilityIdentifier = @"redbox-reload";
    reloadButton.titleLabel.font = [UIFont systemFontOfSize:14];
    [reloadButton setTitle:@"Reload JS (\u2318R)" forState:UIControlStateNormal];
    [reloadButton setTitleColor:[UIColor colorWithWhite:1 alpha:0.5] forState:UIControlStateNormal];
    [reloadButton setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
    [reloadButton addTarget:self action:@selector(reload) forControlEvents:UIControlEventTouchUpInside];

    CGFloat buttonWidth = self.bounds.size.width / 2;
    dismissButton.frame = CGRectMake(0, self.bounds.size.height - buttonHeight, buttonWidth, buttonHeight);
    reloadButton.frame = CGRectMake(buttonWidth, self.bounds.size.height - buttonHeight, buttonWidth, buttonHeight);
    [rootView addSubview:dismissButton];
    [rootView addSubview:reloadButton];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)dealloc
{
  _stackTraceTableView.dataSource = nil;
  _stackTraceTableView.delegate = nil;
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)openStackFrameInEditor:(NSDictionary *)stackFrame
{
  NSData *stackFrameJSON = [RCTJSONStringify(stackFrame, nil) dataUsingEncoding:NSUTF8StringEncoding];
  NSString *postLength = [NSString stringWithFormat:@"%tu", stackFrameJSON.length];
  NSMutableURLRequest *request = [NSMutableURLRequest new];
  request.URL = [RCTConvert NSURL:@"http://localhost:8081/open-stack-frame"];
  request.HTTPMethod = @"POST";
  request.HTTPBody = stackFrameJSON;
  [request setValue:postLength forHTTPHeaderField:@"Content-Length"];
  [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];

  [[[NSURLSession sharedSession] dataTaskWithRequest:request] resume];
}

- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack showIfHidden:(BOOL)shouldShow
{
  if ((self.hidden && shouldShow) || (!self.hidden && [_lastErrorMessage isEqualToString:message])) {
    _lastStackTrace = stack;
    _lastErrorMessage = message;

    [_stackTraceTableView reloadData];

    if (self.hidden) {
      [_stackTraceTableView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]
                                  atScrollPosition:UITableViewScrollPositionTop
                                          animated:NO];
    }

    [self makeKeyAndVisible];
    [self becomeFirstResponder];
  }
}

- (void)dismiss
{
  self.hidden = YES;
  [self resignFirstResponder];
  [RCTSharedApplication().delegate.window makeKeyWindow];
}

- (void)reload
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTReloadNotification object:nil userInfo:nil];
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
  NSDictionary *stackFrame = _lastStackTrace[index];
  return [self reuseCell:cell forStackFrame:stackFrame];
}

- (UITableViewCell *)reuseCell:(UITableViewCell *)cell forErrorMessage:(NSString *)message
{
  if (!cell) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:@"msg-cell"];
    cell.textLabel.accessibilityIdentifier = @"redbox-error";
    cell.textLabel.textColor = [UIColor whiteColor];
    cell.textLabel.font = [UIFont boldSystemFontOfSize:16];
    cell.textLabel.lineBreakMode = NSLineBreakByWordWrapping;
    cell.textLabel.numberOfLines = 0;
    cell.detailTextLabel.textColor = [UIColor whiteColor];
    cell.backgroundColor = [UIColor clearColor];
    cell.selectionStyle = UITableViewCellSelectionStyleNone;
  }

  cell.textLabel.text = message;

  return cell;
}

- (UITableViewCell *)reuseCell:(UITableViewCell *)cell forStackFrame:(NSDictionary *)stackFrame
{
  if (!cell) {
    cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:@"cell"];
    cell.textLabel.textColor = [UIColor colorWithWhite:1 alpha:0.9];
    cell.textLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:14];
    cell.textLabel.numberOfLines = 2;
    cell.detailTextLabel.textColor = [UIColor colorWithWhite:1 alpha:0.7];
    cell.detailTextLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:11];
    cell.detailTextLabel.lineBreakMode = NSLineBreakByTruncatingMiddle;
    cell.backgroundColor = [UIColor clearColor];
    cell.selectedBackgroundView = [UIView new];
    cell.selectedBackgroundView.backgroundColor = [UIColor colorWithWhite:0 alpha:0.2];
  }

  cell.textLabel.text = stackFrame[@"methodName"];
  if (stackFrame[@"file"]) {
    cell.detailTextLabel.text = [NSString stringWithFormat:@"%@ @ %zd:%zd",
                                 [stackFrame[@"file"] lastPathComponent],
                                 [stackFrame[@"lineNumber"] integerValue],
                                 [stackFrame[@"column"] integerValue]];
  } else {
    cell.detailTextLabel.text = @"";
  }
  return cell;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.section == 0) {
    NSMutableParagraphStyle *paragraphStyle = [[NSParagraphStyle defaultParagraphStyle] mutableCopy];
    paragraphStyle.lineBreakMode = NSLineBreakByWordWrapping;

    NSDictionary *attributes = @{NSFontAttributeName: [UIFont boldSystemFontOfSize:16],
                                 NSParagraphStyleAttributeName: paragraphStyle};
    CGRect boundingRect = [_lastErrorMessage boundingRectWithSize:CGSizeMake(tableView.frame.size.width - 30, CGFLOAT_MAX) options:NSStringDrawingUsesLineFragmentOrigin attributes:attributes context:nil];
    return ceil(boundingRect.size.height) + 40;
  } else {
    return 50;
  }
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
  if (indexPath.section == 1) {
    NSUInteger row = indexPath.row;
    NSDictionary *stackFrame = _lastStackTrace[row];
    [self openStackFrameInEditor:stackFrame];
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
    [UIKeyCommand keyCommandWithInput:UIKeyInputEscape
                        modifierFlags:0
                               action:@selector(dismiss)],

    // Reload
    [UIKeyCommand keyCommandWithInput:@"r"
                        modifierFlags:UIKeyModifierCommand
                               action:@selector(reload)]
  ];
}

- (BOOL)canBecomeFirstResponder
{
  return YES;
}

@end

@interface RCTRedBox () <RCTInvalidating>
@end

@implementation RCTRedBox
{
  RCTRedBoxWindow *_window;
}

RCT_EXPORT_MODULE()

- (void)showError:(NSError *)error
{
  [self showErrorMessage:error.localizedDescription withDetails:error.localizedFailureReason];
}

- (void)showErrorMessage:(NSString *)message
{
  [self showErrorMessage:message withStack:nil showIfHidden:YES];
}

- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details
{
  NSString *combinedMessage = message;
  if (details) {
    combinedMessage = [NSString stringWithFormat:@"%@\n\n%@", message, details];
  }
  [self showErrorMessage:combinedMessage];
}

- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
  [self showErrorMessage:message withStack:stack showIfHidden:YES];
}

- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
  [self showErrorMessage:message withStack:stack showIfHidden:NO];
}

- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack showIfHidden:(BOOL)shouldShow
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!_window) {
      _window = [[RCTRedBoxWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
    }
    [_window showErrorMessage:message withStack:stack showIfHidden:shouldShow];
  });
}

- (void)dismiss
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [_window dismiss];
  });
}

- (void)invalidate
{
  [self dismiss];
}

@end

@implementation RCTBridge (RCTRedBox)

- (RCTRedBox *)redBox
{
  return self.modules[RCTBridgeModuleNameForClass([RCTRedBox class])];
}

@end

#else // Disabled

@implementation RCTRedBox

+ (NSString *)moduleName { return nil; }
- (void)showError:(NSError *)message {}
- (void)showErrorMessage:(NSString *)message {}
- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details {}
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack {}
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack {}
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack showIfHidden:(BOOL)shouldShow {}
- (void)dismiss {}

@end

@implementation RCTBridge (RCTRedBox)

- (RCTRedBox *)redBox { return nil; }

@end

#endif
