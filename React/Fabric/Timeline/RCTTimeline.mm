/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTimeline.h"


#if RCT_DEV

#import <React/RCTDefines.h>
#import <React/RCTDevSettings.h>
#import <React/RCTDevMenu.h>

#import <react/utils/ManagedObjectWrapper.h>

#import "RCTTimelineWindow.h"

using namespace facebook::react;

@implementation RCTTimeline {
  TimelineController::Shared _timelineController;
  RCTTimelineWindow *_timelineWindow;
}

+ (instancetype)currentInstance
{
  static dispatch_once_t onceToken;
  static RCTTimeline *timeline;
  dispatch_once(&onceToken, ^{
    timeline = [[RCTTimeline alloc] init];
  });
  return timeline;
}

- (instancetype)init
{
  if (self = [super init]) {
    _timelineController = std::make_shared<TimelineController>();

    if (@available(iOS 13.0, *)) {
      _timelineWindow = [[RCTTimelineWindow alloc] initWithTimelineController:_timelineController];
    }
  }

  return self;
}

- (void)initializeWithContextContainer:(facebook::react::ContextContainer::Shared)contextContainer
{
  if (!_timelineWindow) {
    return;
  }

  UIWindow *timelineWindow = _timelineWindow;
  
  RCTModuleRegistry *moduleRegistry =
    (RCTModuleRegistry *)unwrapManagedObjectWeakly(contextContainer->at<std::shared_ptr<void>>("ModuleRegistry"));
  RCTDevSettings *devSettings = [moduleRegistry moduleForName:"DevSettings"];
  RCTDevMenu *devMenu = [moduleRegistry moduleForName:"DevMenu"];
  
  [devMenu addItem:[RCTDevMenuItem
                           buttonItemWithTitleBlock:^NSString * {
                             return (devSettings.isTimelineRecordingEnabled) ? @"Disable Timeline Recording" : @"Enable Timeline Recording";
                           }
                           handler:^{
      devSettings.isTimelineRecordingEnabled = !devSettings.isTimelineRecordingEnabled;
  }]];
  
  if (devSettings.isTimelineRecordingEnabled) {
    [devMenu addItem:[RCTDevMenuItem
                             buttonItemWithTitleBlock:^NSString * {
                               return timelineWindow.isHidden ? @"Show Timeline" : @"Hide Timeline";
                             }
                             handler:^{
      
      if (timelineWindow.isHidden) {
        [timelineWindow makeKeyAndVisible];
      } else {
        [timelineWindow setHidden:YES];
      }
    }]];
  }
}

- (std::shared_ptr<UIManagerCommitHook const>)commitHook
{
  if (!_timelineWindow) {
    return {};
  }

  return _timelineController;
}

@end

#else

@implementation RCTTimelineWindow

+ (instancetype)currentInstance
{
  return nil;
}

- (void)initializeWithContextContainer:(facebook::react::ContextContainer::Shared)contextContainer
{
}

- (std::shared_ptr<facebook::react::UIManagerCommitHook const>)commitHook
{
  return {};
}

@end

#endif
