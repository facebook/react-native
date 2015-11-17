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
/**
 * This function takes a source size and scale and returns the size in pixels.
 * Note that the pixel width/height is rounded up to the nearest integral size.
 */
RCT_EXTERN CGSize RCTSizeInPixels(CGSize pointSize, CGFloat scale);

/**
 * This function takes the source data for an image and decodes it at the
 * specified size. If the original image is smaller than the destination size,
 * the resultant image's scale will be decreased to compensate, so the
 * width/height of the returned image is guaranteed to be >= destSize.
 * Pass a destSize of CGSizeZero to decode the image at its original size.
 */
RCT_EXTERN UIImage *RCTDecodeImageWithData(NSData *data,
                                           CGSize destSize,
                                           CGFloat destScale,
                                           UIViewContentMode resizeMode);

/**
 * Convert an image back into data. Images with an alpha channel will be
 * converted to lossless PNG data. Images without alpha will be converted to
 * JPEG. The `quality` argument controls the compression ratio of the JPEG
 * conversion, with 1.0 being maximum quality. It has no effect for images
 * using PNG compression.
 */
RCT_EXTERN NSData *RCTGetImageData(CGImageRef image, float quality);
