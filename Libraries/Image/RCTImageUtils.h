/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>
#import <React/RCTResizeMode.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * This function takes an source size (typically from an image), a target size
 * and scale that it will be drawn at (typically in a CGContext) and then
 * calculates the rectangle to draw the image into so that it will be sized and
 * positioned correctly according to the specified resizeMode.
 */
RCT_EXTERN CGRect RCTTargetRect(CGSize sourceSize, CGSize destSize, CGFloat destScale, RCTResizeMode resizeMode);

/**
 * This function takes a source size (typically from an image), a target rect
 * that it will be drawn into (typically relative to a CGContext), and works out
 * the transform needed to draw the image at the correct scale and position.
 */
RCT_EXTERN CGAffineTransform RCTTransformFromTargetRect(CGSize sourceSize, CGRect targetRect);

/**
 * This function takes an input content size & scale (typically from an image),
 * a target size & scale at which it will be displayed (typically in a
 * UIImageView) and then calculates the optimal size at which to redraw the
 * image so that it will be displayed correctly with the specified resizeMode.
 */
RCT_EXTERN CGSize RCTTargetSize(
    CGSize sourceSize,
    CGFloat sourceScale,
    CGSize destSize,
    CGFloat destScale,
    RCTResizeMode resizeMode,
    BOOL allowUpscaling);

/**
 * This function takes an input content size & scale (typically from an image),
 * a target size & scale that it will be displayed at, and determines if the
 * source will need to be upscaled to fit (which may result in pixelization).
 */
RCT_EXTERN BOOL RCTUpscalingRequired(
    CGSize sourceSize,
    CGFloat sourceScale,
    CGSize destSize,
    CGFloat destScale,
    RCTResizeMode resizeMode);

/**
 * This function takes the source data for an image and decodes it at the
 * specified size. If the original image is smaller than the destination size,
 * the resultant image's scale will be decreased to compensate, so the
 * width/height of the returned image is guaranteed to be >= destSize.
 * Pass a destSize of CGSizeZero to decode the image at its original size.
 */
RCT_EXTERN UIImage *__nullable
RCTDecodeImageWithData(NSData *data, CGSize destSize, CGFloat destScale, RCTResizeMode resizeMode);

/**
 * This function takes the source data for an image and decodes just the
 * metadata, without decompressing the image itself.
 */
RCT_EXTERN NSDictionary<NSString *, id> *__nullable RCTGetImageMetadata(NSData *data);

/**
 * Convert an image back into data. Images with an alpha channel will be
 * converted to lossless PNG data. Images without alpha will be converted to
 * JPEG. The `quality` argument controls the compression ratio of the JPEG
 * conversion, with 1.0 being maximum quality. It has no effect for images
 * using PNG compression.
 */
RCT_EXTERN NSData *__nullable RCTGetImageData(UIImage *image, float quality);

/**
 * This function transforms an image. `destSize` is the size of the final image,
 * and `destScale` is its scale. The `transform` argument controls how the
 * source image will be mapped to the destination image.
 */
RCT_EXTERN UIImage *__nullable
RCTTransformImage(UIImage *image, CGSize destSize, CGFloat destScale, CGAffineTransform transform);

/*
 * Return YES if image has an alpha component
 */
RCT_EXTERN BOOL RCTImageHasAlpha(CGImageRef image);

NS_ASSUME_NONNULL_END
