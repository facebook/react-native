/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTimelineWindow.h"

#import <React/RCTDefines.h>
#import <React/RCTDevSettings.h>
#import <react/utils/ContextContainer.h>
#import <react/utils/ManagedObjectWrapper.h>

#if RCT_DEV

#import <React/RCTDevMenu.h>

#import "RCTTimelineToolbarView.h"

using namespace facebook::react;

CGFloat const kWindowMargins = 20;
CGFloat const kWindowCornerRadius = 39 - kWindowMargins;
CGFloat const kWindowBorderSize = 4;
CGFloat const kWindowHeight = 110;

@implementation RCTTimelineWindow {
  TimelineController::Shared _timelineController;
  UIView *_borderView;
  UIView *_backgroundView;
  RCTTimelineToolbarView *_toolbarView;
}

- (instancetype)initWithTimelineController:(TimelineController::Shared)timelineController
{
  if (self = [super initWithFrame:CGRectZero]) {
    self.windowLevel = UIWindowLevelAlert;
    _timelineController = timelineController;

    _borderView = [[UIVisualEffectView alloc] initWithEffect:[UIBlurEffect effectWithStyle:UIBlurEffectStyleLight]];
    _borderView.clipsToBounds = YES;
    _borderView.layer.cornerRadius = kWindowCornerRadius;
    [self addSubview:_borderView];

    _backgroundView = [[UIVisualEffectView alloc] initWithEffect:[UIBlurEffect effectWithStyle:UIBlurEffectStyleDark]];
    _backgroundView.clipsToBounds = YES;
    _backgroundView.layer.cornerRadius = kWindowCornerRadius - kWindowBorderSize;
    [self addSubview:_backgroundView];

    if (@available(iOS 13.0, *)) {
      _borderView.layer.cornerCurve = kCACornerCurveContinuous;
      _backgroundView.layer.cornerCurve = kCACornerCurveContinuous;
    }

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      [self initToolbar];
    });
        
    [self reposition];
  }

  return self;
}

- (void)becomeKeyWindow
{
  //[self initToolbar];
}

- (void)initToolbar
{
  auto surfaceId = _timelineController->lastUpdatedSurface();

  _toolbarView = [[RCTTimelineToolbarView alloc] initWithFrame:CGRectZero
                                            timelineController:_timelineController
                                                     surfaceId:surfaceId];
  [self addSubview:_toolbarView];
}

- (void)layoutSubviews
{
  CGRect bounds = self.bounds;
  _borderView.frame = bounds;
  _backgroundView.frame = CGRectInset(bounds, kWindowBorderSize, kWindowBorderSize);
  _toolbarView.frame = CGRectInset(bounds, kWindowBorderSize, kWindowBorderSize);
}

- (void)reposition
{
  CGRect screenBounds = self.screen.bounds;
  CGRect windowFrame = CGRectInset(screenBounds, kWindowMargins, kWindowMargins);
  CGSize size = [self sizeThatFits:windowFrame.size];
  windowFrame.origin.y = windowFrame.origin.y + windowFrame.size.height - size.height;
  windowFrame.size = size;
  self.frame = windowFrame;
}

- (CGSize)sizeThatFits:(CGSize)size
{
  return CGSizeMake(size.width, kWindowHeight);
}

@end

#else

#import "RCTTimelineWindow.h"

@implementation RCTTimelineWindow
@end

#endif
