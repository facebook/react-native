/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>

#if RCT_DEV

#import <UIKit/UIKit.h>

#import <memory>

#import <react/renderer/timeline/TimelineController.h>
#import <react/renderer/timeline/TimelineHandler.h>

NS_ASSUME_NONNULL_BEGIN

UIKIT_EXTERN API_AVAILABLE(ios(13.0)) @interface RCTTimelineToolbarView : UIView

- (instancetype)initWithFrame:(CGRect)frame
           timelineController:(facebook::react::TimelineController::Shared)timelineController
                    surfaceId:(facebook::react::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END

#endif
