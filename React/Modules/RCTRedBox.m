/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRedBox.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTDefines.h"
#import "RCTErrorInfo.h"
#import "RCTEventDispatcher.h"
#import "RCTJSStackFrame.h"
#import "RCTRedBoxExtraDataViewController.h"
#import "RCTUtils.h"

#if RCT_DEBUG

@class RCTRedBoxWindow;

@protocol RCTRedBoxWindowActionDelegate <NSObject>

- (void)redBoxWindow:(RCTRedBoxWindow *)redBoxWindow openStackFrameInEditor:(RCTJSStackFrame *)stackFrame;
- (void)reloadFromRedBoxWindow:(RCTRedBoxWindow *)redBoxWindow;
- (void)loadExtraDataViewController;

@end

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
@interface RCTRedBoxWindow : UIWindow <UITableViewDelegate, UITableViewDataSource>
@property (nonatomic, weak) id<RCTRedBoxWindowActionDelegate> actionDelegate;
@end

@implementation RCTRedBoxWindow
{
    UITableView *_stackTraceTableView;
    NSString *_lastErrorMessage;
    NSArray<RCTJSStackFrame *> *_lastStackTrace;
}

- (instancetype)initWithFrame:(CGRect)frame
{
    if ((self = [super initWithFrame:frame])) {
#if TARGET_OS_TV
        self.windowLevel = UIWindowLevelAlert + 1000;
#else
        self.windowLevel = UIWindowLevelStatusBar - 1;
#endif
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
#if !TARGET_OS_TV
        _stackTraceTableView.separatorColor = [UIColor colorWithWhite:1 alpha:0.3];
        _stackTraceTableView.separatorStyle = UITableViewCellSeparatorStyleNone;
#endif
        _stackTraceTableView.indicatorStyle = UIScrollViewIndicatorStyleWhite;
        [rootView addSubview:_stackTraceTableView];

#if TARGET_OS_SIMULATOR
        NSString *reloadText = @"Reload JS (\u2318R)";
        NSString *dismissText = @"Dismiss (ESC)";
        NSString *copyText = @"Copy (\u2325\u2318C)";
        NSString *extraText = @"Extra Info (\u2318E)";
#else
        NSString *reloadText = @"Reload JS";
        NSString *dismissText = @"Dismiss";
        NSString *copyText = @"Copy";
        NSString *extraText = @"Extra Info";
#endif

        UIButton *dismissButton = [UIButton buttonWithType:UIButtonTypeCustom];
        dismissButton.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleRightMargin;
        dismissButton.accessibilityIdentifier = @"redbox-dismiss";
        dismissButton.titleLabel.font = [UIFont systemFontOfSize:13];
        [dismissButton setTitle:dismissText forState:UIControlStateNormal];
        [dismissButton setTitleColor:[UIColor colorWithWhite:1 alpha:0.5] forState:UIControlStateNormal];
        [dismissButton setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
        [dismissButton addTarget:self action:@selector(dismiss) forControlEvents:UIControlEventTouchUpInside];

        UIButton *reloadButton = [UIButton buttonWithType:UIButtonTypeCustom];
        reloadButton.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleLeftMargin;
        reloadButton.accessibilityIdentifier = @"redbox-reload";
        reloadButton.titleLabel.font = [UIFont systemFontOfSize:13];

        [reloadButton setTitle:reloadText forState:UIControlStateNormal];
        [reloadButton setTitleColor:[UIColor colorWithWhite:1 alpha:0.5] forState:UIControlStateNormal];
        [reloadButton setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
        [reloadButton addTarget:self action:@selector(reload) forControlEvents:UIControlEventTouchUpInside];

        UIButton *copyButton = [UIButton buttonWithType:UIButtonTypeCustom];
        copyButton.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleLeftMargin;
        copyButton.accessibilityIdentifier = @"redbox-copy";
        copyButton.titleLabel.font = [UIFont systemFontOfSize:13];
        [copyButton setTitle:copyText forState:UIControlStateNormal];
        [copyButton setTitleColor:[UIColor colorWithWhite:1 alpha:0.5] forState:UIControlStateNormal];
        [copyButton setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
        [copyButton addTarget:self action:@selector(copyStack) forControlEvents:UIControlEventTouchUpInside];

        UIButton *extraButton = [UIButton buttonWithType:UIButtonTypeCustom];
        extraButton.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleLeftMargin;
        extraButton.accessibilityIdentifier = @"redbox-extra";
        extraButton.titleLabel.font = [UIFont systemFontOfSize:13];
        [extraButton setTitle:extraText forState:UIControlStateNormal];
        [extraButton setTitleColor:[UIColor colorWithWhite:1 alpha:0.5] forState:UIControlStateNormal];
        [extraButton setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
        [extraButton addTarget:self action:@selector(showExtraDataViewController) forControlEvents:UIControlEventTouchUpInside];

        CGFloat buttonWidth = self.bounds.size.width / 4;
        dismissButton.frame = CGRectMake(0, self.bounds.size.height - buttonHeight, buttonWidth, buttonHeight);
        reloadButton.frame = CGRectMake(buttonWidth, self.bounds.size.height - buttonHeight, buttonWidth, buttonHeight);
        copyButton.frame = CGRectMake(buttonWidth * 2, self.bounds.size.height - buttonHeight, buttonWidth, buttonHeight);
        extraButton.frame = CGRectMake(buttonWidth * 3, self.bounds.size.height - buttonHeight, buttonWidth, buttonHeight);

        [rootView addSubview:dismissButton];
        [rootView addSubview:reloadButton];
        [rootView addSubview:copyButton];
        [rootView addSubview:extraButton];
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

- (void)showErrorMessage:(NSString *)message withStack:(NSArray<RCTJSStackFrame *> *)stack isUpdate:(BOOL)isUpdate
{
    // Show if this is a new message, or if we're updating the previous message
    if ((self.hidden && !isUpdate) || (!self.hidden && isUpdate && [_lastErrorMessage isEqualToString:message])) {
        _lastStackTrace = stack;
        // message is displayed using UILabel, which is unable to render text of
        // unlimited length, so we truncate it
        _lastErrorMessage = [message substringToIndex:MIN((NSUInteger)10000, message.length)];

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
    }
    else {
        fullStackTrace = [NSMutableString string];
    }

    for (RCTJSStackFrame *stackFrame in _lastStackTrace) {
        [fullStackTrace appendString:[NSString stringWithFormat:@"%@\n", stackFrame.methodName]];
        if (stackFrame.file) {
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
    NSString *lineInfo = [NSString stringWithFormat:@"%@:%lld",
                          fileName,
                          (long long)stackFrame.lineNumber];

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

- (UITableViewCell *)reuseCell:(UITableViewCell *)cell forStackFrame:(RCTJSStackFrame *)stackFrame
{
    if (!cell) {
        cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:@"cell"];
        cell.textLabel.textColor = [UIColor colorWithWhite:1 alpha:0.9];
        cell.textLabel.font = [UIFont fontWithName:@"Menlo-Regular" size:14];
        cell.textLabel.lineBreakMode = NSLineBreakByCharWrapping;
        cell.textLabel.numberOfLines = 2;
        cell.detailTextLabel.textColor = [UIColor colorWithWhite:1 alpha:0.7];
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
             [UIKeyCommand keyCommandWithInput:UIKeyInputEscape
                                 modifierFlags:0
                                        action:@selector(dismiss)],

             // Reload
             [UIKeyCommand keyCommandWithInput:@"r"
                                 modifierFlags:UIKeyModifierCommand
                                        action:@selector(reload)],

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
#elif TARGET_OS_OSX // [TODO(macOS ISS#2323203)

@interface RCTRedBoxScrollView : NSScrollView
@end

@implementation RCTRedBoxScrollView

- (NSSize)intrinsicContentSize
{
  NSView *documentView = self.documentView;
  return documentView != nil ? documentView.intrinsicContentSize : super.intrinsicContentSize;
}

@end

@interface RCTRedBoxWindow : NSObject <NSTableViewDataSource, NSTableViewDelegate>

- (void)showErrorMessage:(NSString *)message withStack:(NSArray<RCTJSStackFrame *> *)stack isUpdate:(BOOL)isUpdate;
- (void)dismiss;

@property (nonatomic, weak) id<RCTRedBoxWindowActionDelegate> actionDelegate;

@end

@implementation RCTRedBoxWindow
{
  NSWindow *_window;
  NSTableView *_stackTraceTableView;
  NSString *_lastErrorMessage;
  NSArray<RCTJSStackFrame *> *_lastStackTrace;
  BOOL _visible;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _window = [[NSWindow alloc] initWithContentRect:NSZeroRect styleMask:NSWindowStyleMaskTitled backing:NSBackingStoreBuffered defer:YES];
    _window.backgroundColor = [NSColor colorWithRed:0.8 green:0 blue:0 alpha:1];
    _window.animationBehavior = NSWindowAnimationBehaviorDocumentWindow;

    NSScrollView *scrollView = [[RCTRedBoxScrollView alloc] initWithFrame:NSZeroRect];
    scrollView.translatesAutoresizingMaskIntoConstraints = NO;
    scrollView.backgroundColor = [NSColor clearColor];
    scrollView.drawsBackground = NO;
    scrollView.hasVerticalScroller = YES;

    NSTableColumn *tableColumn = [[NSTableColumn alloc] initWithIdentifier:@"info"];
    tableColumn.editable = false;
    tableColumn.resizingMask = NSTableColumnAutoresizingMask;

    _stackTraceTableView = [[NSTableView alloc] initWithFrame:NSZeroRect];
    _stackTraceTableView.dataSource = self;
    _stackTraceTableView.delegate = self;
    _stackTraceTableView.headerView = nil;
    _stackTraceTableView.allowsColumnReordering = NO;
    _stackTraceTableView.allowsColumnResizing = NO;
    _stackTraceTableView.columnAutoresizingStyle = NSTableViewFirstColumnOnlyAutoresizingStyle;
    _stackTraceTableView.backgroundColor = [NSColor clearColor];
    _stackTraceTableView.allowsTypeSelect = NO;
    [_stackTraceTableView addTableColumn:tableColumn];
    scrollView.documentView = _stackTraceTableView;

    NSButton *dismissButton = [[NSButton alloc] initWithFrame:NSZeroRect];
    dismissButton.accessibilityIdentifier = @"redbox-dismiss";
    dismissButton.translatesAutoresizingMaskIntoConstraints = NO;
    dismissButton.target = self;
    dismissButton.action = @selector(dismiss:);
    [dismissButton setButtonType:NSButtonTypeMomentaryPushIn];
    dismissButton.bezelStyle = NSBezelStyleRounded;
    dismissButton.title = @"Dismiss (Esc)";
    dismissButton.keyEquivalent = @"\e";
    [dismissButton setContentCompressionResistancePriority:NSLayoutPriorityRequired forOrientation:NSLayoutConstraintOrientationHorizontal];

    NSButton *reloadButton = [[NSButton alloc] initWithFrame:NSZeroRect];
    reloadButton.accessibilityIdentifier = @"redbox-reload";
    reloadButton.translatesAutoresizingMaskIntoConstraints = NO;
    reloadButton.target = self;
    reloadButton.action = @selector(reload:);
    reloadButton.bezelStyle = NSBezelStyleRounded;
    reloadButton.title = @"Reload JS (\u2318R)";
    [reloadButton setButtonType:NSButtonTypeMomentaryPushIn];
    reloadButton.keyEquivalent = @"r";
    reloadButton.keyEquivalentModifierMask = NSEventModifierFlagCommand;
    [reloadButton setContentCompressionResistancePriority:NSLayoutPriorityRequired forOrientation:NSLayoutConstraintOrientationHorizontal];
    [reloadButton setContentCompressionResistancePriority:NSLayoutPriorityRequired forOrientation:NSLayoutConstraintOrientationVertical];

    NSButton *copyButton = [[NSButton alloc] initWithFrame:NSZeroRect];
    copyButton.accessibilityIdentifier = @"redbox-copy";
    copyButton.translatesAutoresizingMaskIntoConstraints = NO;
    copyButton.target = self;
    copyButton.action = @selector(copyStack:);
    copyButton.title = @"Copy (\u2325\u2318C)";
    copyButton.bezelStyle = NSBezelStyleRounded;
    [copyButton setButtonType:NSButtonTypeMomentaryPushIn];
    copyButton.keyEquivalent = @"c";
    copyButton.keyEquivalentModifierMask = NSEventModifierFlagOption | NSEventModifierFlagCommand;
    [copyButton setContentCompressionResistancePriority:NSLayoutPriorityRequired forOrientation:NSLayoutConstraintOrientationHorizontal];

    NSView *contentView = _window.contentView;
    [contentView addSubview:scrollView];
    [contentView addSubview:dismissButton];
    [contentView addSubview:reloadButton];
    [contentView addSubview:copyButton];

    [NSLayoutConstraint activateConstraints:@[
      // the window shouldn't be any bigger than 375x643 points
      [NSLayoutConstraint constraintWithItem:contentView attribute:NSLayoutAttributeWidth relatedBy:NSLayoutRelationEqual toItem:nil attribute:NSLayoutAttributeNotAnAttribute multiplier:1 constant:375],
      [NSLayoutConstraint constraintWithItem:contentView attribute:NSLayoutAttributeHeight relatedBy:NSLayoutRelationLessThanOrEqual toItem:nil attribute:NSLayoutAttributeNotAnAttribute multiplier:1 constant:643],
      // scroll view hugs the left, top, and right sides of the window, and the buttons at the bottom
      [NSLayoutConstraint constraintWithItem:scrollView attribute:NSLayoutAttributeLeading relatedBy:NSLayoutRelationEqual toItem:contentView attribute:NSLayoutAttributeLeading multiplier:1 constant:16],
      [NSLayoutConstraint constraintWithItem:scrollView attribute:NSLayoutAttributeTop relatedBy:NSLayoutRelationEqual toItem:contentView attribute:NSLayoutAttributeTop multiplier:1 constant:16],
      [NSLayoutConstraint constraintWithItem:scrollView attribute:NSLayoutAttributeTrailing relatedBy:NSLayoutRelationEqual toItem:contentView attribute:NSLayoutAttributeTrailing multiplier:1 constant:-16],
      [NSLayoutConstraint constraintWithItem:scrollView attribute:NSLayoutAttributeBottom relatedBy:NSLayoutRelationEqual toItem:reloadButton attribute:NSLayoutAttributeTop multiplier:1 constant:-8],
      // buttons have equal widths
      [NSLayoutConstraint constraintWithItem:dismissButton attribute:NSLayoutAttributeWidth relatedBy:NSLayoutRelationEqual toItem:reloadButton attribute:NSLayoutAttributeWidth multiplier:1 constant:0],
      [NSLayoutConstraint constraintWithItem:dismissButton attribute:NSLayoutAttributeWidth relatedBy:NSLayoutRelationEqual toItem:copyButton attribute:NSLayoutAttributeWidth multiplier:1 constant:0],
      // buttons are centered horizontally in the window
      [NSLayoutConstraint constraintWithItem:dismissButton attribute:NSLayoutAttributeLeading relatedBy:NSLayoutRelationGreaterThanOrEqual toItem:contentView attribute:NSLayoutAttributeLeading multiplier:1 constant:16],
      [NSLayoutConstraint constraintWithItem:copyButton attribute:NSLayoutAttributeTrailing relatedBy:NSLayoutRelationLessThanOrEqual toItem:contentView attribute:NSLayoutAttributeTrailing multiplier:1 constant:-16],
      [NSLayoutConstraint constraintWithItem:dismissButton attribute:NSLayoutAttributeTrailing relatedBy:NSLayoutRelationEqual toItem:reloadButton attribute:NSLayoutAttributeLeading multiplier:1 constant:-8],
      [NSLayoutConstraint constraintWithItem:reloadButton attribute:NSLayoutAttributeCenterX relatedBy:NSLayoutRelationEqual toItem:contentView attribute:NSLayoutAttributeCenterX multiplier:1 constant:0],
      [NSLayoutConstraint constraintWithItem:copyButton attribute:NSLayoutAttributeLeading relatedBy:NSLayoutRelationEqual toItem:reloadButton attribute:NSLayoutAttributeTrailing multiplier:1 constant:8],
      // buttons are baseline aligned
      [NSLayoutConstraint constraintWithItem:dismissButton attribute:NSLayoutAttributeBaseline relatedBy:NSLayoutRelationEqual toItem:reloadButton attribute:NSLayoutAttributeBaseline multiplier:1 constant:0],
      [NSLayoutConstraint constraintWithItem:dismissButton attribute:NSLayoutAttributeBaseline relatedBy:NSLayoutRelationEqual toItem:copyButton attribute:NSLayoutAttributeBaseline multiplier:1 constant:0],
      // buttons appear at the bottom of the window
      [NSLayoutConstraint constraintWithItem:reloadButton attribute:NSLayoutAttributeBottom relatedBy:NSLayoutRelationEqual toItem:contentView attribute:NSLayoutAttributeBottom multiplier:1 constant:-16],
    ]];
  }
  return self;
}

- (void)dealloc
{
  // VSO#1878643: On macOS the RedBox can be dealloc'd on the JS thread causing the Main Thread Checker to throw when the NSTableView properties below are accessed.
  NSTableView *stackTraceTableView = _stackTraceTableView;
  RCTUnsafeExecuteOnMainQueueSync(^{
    stackTraceTableView.dataSource = nil;
    stackTraceTableView.delegate = nil;
  });
}

- (void)showErrorMessage:(NSString *)message withStack:(NSArray<RCTJSStackFrame *> *)stack isUpdate:(BOOL)isUpdate
{
  // Show if this is a new message, or if we're updating the previous message
  if ((!_visible && !isUpdate) || (_visible && isUpdate && [_lastErrorMessage isEqualToString:message])) {
    _lastStackTrace = stack;

    // message is displayed using UILabel, which is unable to render text of
    // unlimited length, so we truncate it
    _lastErrorMessage = [message substringToIndex:MIN((NSUInteger)10000, message.length)];

    [_window layoutIfNeeded]; // layout the window for the correct width
    [_stackTraceTableView reloadData]; // load the new data
    [_stackTraceTableView.enclosingScrollView invalidateIntrinsicContentSize]; // the height of the scroll view changed with the new data
    [_window layoutIfNeeded]; // layout the window for the correct height

    if (!_visible) {
      _visible = YES;
      [_window center];
			if (!RCTRunningInTestEnvironment()) {
				[NSApp runModalForWindow:_window];
			}
			else {
				[NSApp activateIgnoringOtherApps:YES];
				[[NSApp mainWindow] makeKeyAndOrderFront:_window];
			}
    }
  }
}

- (void)dismiss
{
  if (_visible) {
    [NSApp stopModal];
    [_window orderOut:self];
    _visible = NO;
  }
}

- (IBAction)dismiss:(__unused NSButton *)sender
{
  [self dismiss];
}

- (IBAction)reload:(__unused NSButton *)sender
{
  [_actionDelegate reloadFromRedBoxWindow:self];
}

- (IBAction)copyStack:(__unused NSButton *)sender
{
  // TODO: This is copy/paste from the iOS implementation
  NSMutableString *fullStackTrace;

  if (_lastErrorMessage != nil) {
    fullStackTrace = [_lastErrorMessage mutableCopy];
    [fullStackTrace appendString:@"\n\n"];
  }
  else {
    fullStackTrace = [NSMutableString string];
  }

  for (RCTJSStackFrame *stackFrame in _lastStackTrace) {
    [fullStackTrace appendString:[NSString stringWithFormat:@"%@\n", stackFrame.methodName]];
    if (stackFrame.file) {
      [fullStackTrace appendFormat:@"    %@\n", [self formatFrameSource:stackFrame]];
    }
  }

  NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
  [pasteboard clearContents];
  [pasteboard setString:fullStackTrace forType:NSPasteboardTypeString];
}

- (NSString *)formatFrameSource:(RCTJSStackFrame *)stackFrame
{
  // TODO: This is copy/paste from the iOS implementation
  NSString *lineInfo = [NSString stringWithFormat:@"%@:%zd",
                        [stackFrame.file lastPathComponent],
                        stackFrame.lineNumber];

  if (stackFrame.column != 0) {
    lineInfo = [lineInfo stringByAppendingFormat:@":%zd", stackFrame.column];
  }
  return lineInfo;
}

#pragma mark - TableView

- (NSInteger)numberOfRowsInTableView:(__unused NSTableView *)tableView
{
  return (_lastErrorMessage != nil) + _lastStackTrace.count;
}

- (BOOL)tableView:(__unused NSTableView *)tableView shouldSelectRow:(__unused NSInteger)row
{
  return NO;
}

- (nullable NSView *)tableView:(NSTableView *)tableView viewForTableColumn:(nullable NSTableColumn *)tableColumn row:(NSInteger)row
{
  NSTableCellView *view = [tableView makeViewWithIdentifier:tableColumn.identifier owner:nil];

  if (view == nil) {
    view = [[NSTableCellView alloc] initWithFrame:NSZeroRect];
    view.identifier = tableColumn.identifier;

    NSTextField *label = [[NSTextField alloc] initWithFrame:NSZeroRect];
    label.translatesAutoresizingMaskIntoConstraints = NO;
    label.backgroundColor = [NSColor clearColor];
    label.drawsBackground = NO;
    label.bezeled = NO;
    label.editable = NO;
    [label setContentCompressionResistancePriority:NSLayoutPriorityRequired forOrientation:NSLayoutConstraintOrientationHorizontal];
    [label setContentCompressionResistancePriority:NSLayoutPriorityRequired forOrientation:NSLayoutConstraintOrientationVertical];

    [view addSubview:label];
    view.textField = label;

    [NSLayoutConstraint activateConstraints:@[
      [NSLayoutConstraint constraintWithItem:label attribute:NSLayoutAttributeLeading relatedBy:NSLayoutRelationEqual toItem:view attribute:NSLayoutAttributeLeading multiplier:1 constant:0],
      [NSLayoutConstraint constraintWithItem:label attribute:NSLayoutAttributeTop relatedBy:NSLayoutRelationEqual toItem:view attribute:NSLayoutAttributeTop multiplier:1 constant:0],
      [NSLayoutConstraint constraintWithItem:label attribute:NSLayoutAttributeTrailing relatedBy:NSLayoutRelationEqual toItem:view attribute:NSLayoutAttributeTrailing multiplier:1 constant:0],
      [NSLayoutConstraint constraintWithItem:label attribute:NSLayoutAttributeBottom relatedBy:NSLayoutRelationEqual toItem:view attribute:NSLayoutAttributeBottom multiplier:1 constant:0],
    ]];
  }

  view.textField.attributedStringValue = [self attributedStringForRow:row];

  return view;
}

- (CGFloat)tableView:(NSTableView *)tableView heightOfRow:(NSInteger)row
{
  NSAttributedString *attributedString = [self attributedStringForRow:row];
  NSRect boundingRect = [attributedString boundingRectWithSize:NSMakeSize(tableView.frame.size.width, CGFLOAT_MAX) options:NSStringDrawingUsesLineFragmentOrigin];
  CGFloat height = ceilf(NSMaxY(boundingRect));

  if (row == 0) {
    height += 32;
  }

  return height;
}

- (NSAttributedString *)attributedStringForRow:(NSUInteger)row
{
  if (_lastErrorMessage != nil) {
    if (row == 0) {
      NSDictionary<NSString *, id> *attributes = @{
        NSForegroundColorAttributeName : [NSColor whiteColor],
        NSFontAttributeName : [NSFont systemFontOfSize:16],
      };
      return [[NSAttributedString alloc] initWithString:_lastErrorMessage attributes:attributes];
    }
    --row;
  }

  RCTJSStackFrame *stackFrame = _lastStackTrace[row];

  NSMutableParagraphStyle *titleParagraphStyle = [NSMutableParagraphStyle new];
  titleParagraphStyle.lineBreakMode = NSLineBreakByCharWrapping;

  NSDictionary<NSString *, id> *titleAttributes = @{
    NSForegroundColorAttributeName : [NSColor colorWithWhite:1 alpha:0.9],
    NSFontAttributeName : [NSFont fontWithName:@"Menlo-Regular" size:14],
    NSParagraphStyleAttributeName : titleParagraphStyle,
  };

  NSString *rawTitle = stackFrame.methodName ?: @"(unnamed method)";
  NSAttributedString *title = [[NSAttributedString alloc] initWithString:rawTitle attributes:titleAttributes];
  if (stackFrame.file == nil) {
    return title;
  }

  NSMutableParagraphStyle *frameParagraphStyle = [NSMutableParagraphStyle new];
  frameParagraphStyle.lineBreakMode = NSLineBreakByTruncatingMiddle;

  NSDictionary<NSString *, id> *frameAttributes = @{
    NSForegroundColorAttributeName : [NSColor colorWithWhite:1 alpha:0.7],
    NSFontAttributeName : [NSFont fontWithName:@"Menlo-Regular" size:11],
    NSParagraphStyleAttributeName : frameParagraphStyle,
  };

  NSMutableAttributedString *frameSource = [[NSMutableAttributedString alloc] initWithString:[self formatFrameSource:stackFrame] attributes:frameAttributes];
  [frameSource replaceCharactersInRange:NSMakeRange(0, 0) withString:@"\n"];
  [frameSource insertAttributedString:title atIndex:0];
  return frameSource;
}

@end

#endif // ]TODO(macOS ISS#2323203)

@interface RCTRedBox () <RCTInvalidating, RCTRedBoxWindowActionDelegate, RCTRedBoxExtraDataActionDelegate>
@end

@implementation RCTRedBox
{
    RCTRedBoxWindow *_window;
    NSMutableArray<id<RCTErrorCustomizer>> *_errorCustomizers;
    RCTRedBoxExtraDataViewController *_extraDataViewController;
}

@synthesize bridge = _bridge;

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
                     stack:error.userInfo[RCTJSStackTraceKey]];
}

- (void)showErrorMessage:(NSString *)message
{
    [self showErrorMessage:message withParsedStack:nil isUpdate:NO];
}

- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details
{
    [self showErrorMessage:message withDetails:details stack:nil];
}

- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details stack:(NSArray<RCTJSStackFrame *> *)stack {
    NSString *combinedMessage = message;
    if (details) {
        combinedMessage = [NSString stringWithFormat:@"%@\n\n%@", message, details];
    }
    [self showErrorMessage:combinedMessage withParsedStack:stack isUpdate:NO];
}

- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack
{
    NSArray<RCTJSStackFrame *> *stack = [RCTJSStackFrame stackFramesWithLines:rawStack];
    [self showErrorMessage:message withParsedStack:stack isUpdate:NO];
}

- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
    [self showErrorMessage:message withParsedStack:[RCTJSStackFrame stackFramesWithDictionaries:stack] isUpdate:NO];
}

- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack
{
    [self showErrorMessage:message withParsedStack:[RCTJSStackFrame stackFramesWithDictionaries:stack] isUpdate:YES];
}

- (void)showErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
{
    [self showErrorMessage:message withParsedStack:stack isUpdate:NO];
}

- (void)updateErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack
{
    [self showErrorMessage:message withParsedStack:stack isUpdate:YES];
}

- (void)showErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack isUpdate:(BOOL)isUpdate
{
    dispatch_async(dispatch_get_main_queue(), ^{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
        if (self->_extraDataViewController == nil) {
            self->_extraDataViewController = [RCTRedBoxExtraDataViewController new];
            self->_extraDataViewController.actionDelegate = self;
        }
#endif // TODO(macOS ISS#2323203)
        [self->_bridge.eventDispatcher sendDeviceEventWithName:@"collectRedBoxExtraData" body:nil];

        if (!self->_window) {
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
            self->_window = [[RCTRedBoxWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
#else // [TODO(macOS ISS#2323203)
            self->_window = [RCTRedBoxWindow new];
#endif // ]TODO(macOS ISS#2323203)
            self->_window.actionDelegate = self;
        }

        RCTErrorInfo *errorInfo = [[RCTErrorInfo alloc] initWithErrorMessage:message
                                                                       stack:stack];
        errorInfo = [self _customizeError:errorInfo];
        [self->_window showErrorMessage:errorInfo.errorMessage
                              withStack:errorInfo.stack
                               isUpdate:isUpdate];
    });
}

- (void)loadExtraDataViewController {
    dispatch_async(dispatch_get_main_queue(), ^{
        // Make sure the CMD+E shortcut doesn't call this twice
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
        if (self->_extraDataViewController != nil && ![self->_window.rootViewController presentedViewController]) {
            [self->_window.rootViewController presentViewController:self->_extraDataViewController animated:YES completion:nil];
        }
#else // [TODO(macOS ISS#2323203)
      if (self->_extraDataViewController != nil && [NSApp modalWindow] == nil) {
        [[[NSApp keyWindow] contentViewController] presentViewControllerAsModalWindow:self->_extraDataViewController];
      }
#endif // ]TODO(macOS ISS#2323203)
    });
}

RCT_EXPORT_METHOD(setExtraData:(NSDictionary *)extraData forIdentifier:(NSString *)identifier) {
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
    NSURL *const bundleURL = _overrideBundleURL ?: _bridge.bundleURL;
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
        [_bridge reload];
    }
    [self dismiss];
}

@end

@implementation RCTBridge (RCTRedBox)

- (RCTRedBox *)redBox
{
    return [self moduleForClass:[RCTRedBox class]];
}

@end

#else // Disabled

@implementation RCTRedBox

+ (NSString *)moduleName { return nil; }
- (void)registerErrorCustomizer:(id<RCTErrorCustomizer>)errorCustomizer {}
- (void)showError:(NSError *)message {}
- (void)showErrorMessage:(NSString *)message {}
- (void)showErrorMessage:(NSString *)message withDetails:(NSString *)details {}
- (void)showErrorMessage:(NSString *)message withRawStack:(NSString *)rawStack {}
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack {}
- (void)updateErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack {}
- (void)showErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack {}
- (void)updateErrorMessage:(NSString *)message withParsedStack:(NSArray<RCTJSStackFrame *> *)stack {}
- (void)showErrorMessage:(NSString *)message withStack:(NSArray<NSDictionary *> *)stack isUpdate:(BOOL)isUpdate {}
- (void)dismiss {}

@end

@implementation RCTBridge (RCTRedBox)

- (RCTRedBox *)redBox { return nil; }

@end

#endif
