/*
 *  Copyright (c) 2013, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import <UIKit/UIKit.h>

#import "RCTDefines.h"

/**
 * This function takes an input content size (typically from an image), a target
 * size and scale that it will be drawn at (typically in a CGContext) and then
 * calculates the rectangle to draw the image into so that it will be sized and
 * positioned correctly if drawn using the specified content mode.
 */
RCT_EXTERN CGRect RCTTargetRect(CGSize sourceSize, CGSize destSize,
                                CGFloat destScale, UIViewContentMode resizeMode);

/**
 * This function takes an input content size & scale (typically from an image),
 * a target size & scale at which it will be displayed (typically in a
 * UIImageView) and then calculates the optimal size at which to redraw the
 * image so that it will be displayed correctly with the specified content mode.
 */
RCT_EXTERN CGSize RCTTargetSize(CGSize sourceSize, CGFloat sourceScale,
                                CGSize destSize, CGFloat destScale,
                                UIViewContentMode resizeMode,
                                BOOL allowUpscaling);

/**
 * This function takes an input content size & scale (typically from an image),
 * a target size & scale that it will be displayed at, and determines if the
 * source will need to be upscaled to fit (which may result in pixelization).
 */
RCT_EXTERN BOOL RCTUpscalingRequired(CGSize sourceSize, CGFloat sourceScale,
                                     CGSize destSize, CGFloat destScale,
                                     UIViewContentMode resizeMode);
