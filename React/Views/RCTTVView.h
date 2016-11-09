//
//  RCTTVView.h
//  React
//
//  Created by Douglas Lowder on 11/5/16.
//  Copyright © 2016 Facebook. All rights reserved.
//
//  A RCTView with additional properties and methods for user interaction using the Apple TV focus engine.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "RCTComponent.h"

#import "RCTView.h"

@interface RCTTVView : RCTView

/**
 * TV event handlers
 */
@property (nonatomic, copy) RCTDirectEventBlock onTVSelect; // Called if this view is focused and the TV remote select button is pressed
@property (nonatomic, copy) RCTDirectEventBlock onTVFocus; // Called when this view comes into focus when navigating via TV remote swipes or arrow keys
@property (nonatomic, copy) RCTDirectEventBlock onTVBlur; // Called when this view leaves focus when navigating via TV remote swipes or arrow keys
@property (nonatomic, copy) RCTDirectEventBlock onTVNavEvent; // Called on any TV remote action other than select (menu, play/pause, swipes or arrow keys);

/**
 *  Properties for Apple TV focus parallax effects
 */
@property (nonatomic, assign) BOOL tvParallaxDisable;
@property (nonatomic, assign) float tvParallaxShiftDistanceX;
@property (nonatomic, assign) float tvParallaxShiftDistanceY;
@property (nonatomic, assign) float tvParallaxTiltAngle;
@property (nonatomic, assign) float tvParallaxMagnification;

/**
 * TV preferred focus
 */
@property (nonatomic, assign) BOOL hasTVPreferredFocus;

@end
