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
 * Returns the optimal context size for an image drawn using the clip rect
 * returned by RCTClipRect.
 */
RCT_EXTERN CGSize RCTTargetSizeForClipRect(CGRect clipRect);

/**
 * This function takes an input content size & scale (typically from an image),
 * a target size & scale that it will be drawn into (typically a CGContext) and
 * then calculates the optimal rectangle to draw the image into so that it will
 * be sized and positioned correctly if drawn using the specified content mode.
 */
RCT_EXTERN CGRect RCTClipRect(CGSize sourceSize, CGFloat sourceScale,
                              CGSize destSize, CGFloat destScale,
                              UIViewContentMode resizeMode);

/**
 * This function takes an input content size & scale (typically from an image),
 * a target size & scale that it will be displayed at, and determines if the
 * source will need to be upscaled to fit (which may result in pixelization).
 */
RCT_EXTERN BOOL RCTUpscalingRequired(CGSize sourceSize, CGFloat sourceScale,
                                     CGSize destSize, CGFloat destScale,
                                     UIViewContentMode resizeMode);
