/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <React/RCTView.h>

//  A RCTView with additional properties and methods for user interaction using the Apple TV focus engine.
@interface RCTTVView : RCTView

/**
 * TV event handlers
 */
@property (nonatomic, assign) BOOL isTVSelectable; // True if this view is TV-focusable

/**
 *  Properties for Apple TV focus parallax effects
 */
@property (nonatomic, copy) NSDictionary *tvParallaxProperties;

/**
 * TV preferred focus
 */
@property (nonatomic, assign) BOOL hasTVPreferredFocus;

@end
