//
//  RCTTVViewManager.m
//  React
//
//  Created by Douglas Lowder on 11/5/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "RCTTVViewManager.h"
#import "RCTTVView.h"

@implementation RCTTVViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RCTTVView new];
}

// Apple TV properties
RCT_EXPORT_VIEW_PROPERTY(onTVSelect, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onTVFocus, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onTVBlur, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onTVNavEvent, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
RCT_EXPORT_VIEW_PROPERTY(tvParallaxDisable, BOOL)
RCT_EXPORT_VIEW_PROPERTY(tvParallaxShiftDistanceX, float)
RCT_EXPORT_VIEW_PROPERTY(tvParallaxShiftDistanceY, float)
RCT_EXPORT_VIEW_PROPERTY(tvParallaxTiltAngle, float)
RCT_EXPORT_VIEW_PROPERTY(tvParallaxMagnification, float)

@end
