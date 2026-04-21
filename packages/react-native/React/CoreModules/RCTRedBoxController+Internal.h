/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>

#import "RCTRedBox.h"

#if RCT_DEV_MENU

@class RCTJSStackFrame;
@class RCTRedBoxController;

@protocol RCTRedBoxControllerActionDelegate <NSObject>

- (void)redBoxController:(RCTRedBoxController *)redBoxController openStackFrameInEditor:(RCTJSStackFrame *)stackFrame;
- (void)reloadFromRedBoxController:(RCTRedBoxController *)redBoxController;
- (void)loadExtraDataViewController;

@end

@interface RCTRedBoxController : UIViewController <UITableViewDelegate, UITableViewDataSource>

@property (nonatomic, weak) id<RCTRedBoxControllerActionDelegate> actionDelegate;

- (instancetype)initWithCustomButtonTitles:(NSArray<NSString *> *)customButtonTitles
                      customButtonHandlers:(NSArray<RCTRedBoxButtonPressHandler> *)customButtonHandlers;

- (void)showErrorMessage:(NSString *)message
               withStack:(NSArray<RCTJSStackFrame *> *)stack
                isUpdate:(BOOL)isUpdate
             errorCookie:(int)errorCookie;

- (void)dismiss;

@end

#endif
