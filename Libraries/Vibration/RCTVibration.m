// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTVibration.h"

#import <AudioToolbox/AudioToolbox.h>

@implementation RCTVibration

- (void)vibrate
{
  RCT_EXPORT();
  AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

@end
