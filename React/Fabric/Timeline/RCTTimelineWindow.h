/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>

@class RCTDevMenuItem;

#if RCT_DEV

#import <UIKit/UIKit.h>

#import <react/renderer/timeline/TimelineController.h>
#import <react/renderer/uimanager/UIManagerCommitHook.h>
#import <react/utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

UIKIT_EXTERN API_AVAILABLE(ios(13.0)) @interface RCTTimelineWindow : UIWindow

- (instancetype)initWithTimelineController:(facebook::react::TimelineController::Shared)timelineController;

@end

NS_ASSUME_NONNULL_END

#else

@interface RCTTimelineWindow : UIWindow
@end

#endif
