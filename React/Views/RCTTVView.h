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
@property (nonatomic, assign) BOOL isTVSelectable; // True if this view is TV-focusable

/**
 *  Properties for Apple TV focus parallax effects
 */
@property (nonatomic, strong) NSDictionary *tvParallaxProperties;

/**
 * TV preferred focus
 */
@property (nonatomic, assign) BOOL hasTVPreferredFocus;

@end
