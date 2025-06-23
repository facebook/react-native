/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTImageLoaderProtocol.h>
#import <React/RCTImageURLLoaderWithAttribution.h>

@protocol RCTImageLoaderWithAttributionProtocol <RCTImageLoaderProtocol, RCTImageLoaderLoggableProtocol>

// TODO (T61325135): Remove C++ checks
#ifdef __cplusplus
/**
 * Same as the variant in RCTImageURLLoaderProtocol, but allows passing attribution
 * information that each image URL loader can process.
 */
- (RCTImageURLLoaderRequest *)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                 size:(CGSize)size
                                                scale:(CGFloat)scale
                                              clipped:(BOOL)clipped
                                           resizeMode:(RCTResizeMode)resizeMode
                                             priority:(RCTImageLoaderPriority)priority
                                          attribution:(const facebook::react::ImageURLLoaderAttribution &)attribution
                                        progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                     partialLoadBlock:(RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                      completionBlock:(RCTImageLoaderCompletionBlockWithMetadata)completionBlock;
#endif

/**
 * Image instrumentation - start tracking the on-screen visibility of the native image view.
 */
- (void)trackURLImageVisibilityForRequest:(RCTImageURLLoaderRequest *)loaderRequest imageView:(UIView *)imageView;

/**
 * Image instrumentation - notify that the request was cancelled.
 */
- (void)trackURLImageRequestDidDestroy:(RCTImageURLLoaderRequest *)loaderRequest;

/**
 * Image instrumentation - notify that the native image view was destroyed.
 */
- (void)trackURLImageDidDestroy:(RCTImageURLLoaderRequest *)loaderRequest;

@end
