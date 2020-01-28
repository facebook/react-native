/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTImageLoaderProtocol.h>
#import <React/RCTImageURLLoaderWithAttribution.h>

@protocol RCTImageLoaderWithAttributionProtocol<RCTImageLoaderProtocol>

// TODO (T61325135): Remove C++ checks
#ifdef __cplusplus
/**
 * Same as the variant in RCTImageURLLoaderProtocol, but allows passing attribution
 * information that each image URL loader can process.
 */
- (RCTImageLoaderCancellationBlock)loadImageWithURLRequest:(NSURLRequest *)imageURLRequest
                                                      size:(CGSize)size
                                                     scale:(CGFloat)scale
                                                   clipped:(BOOL)clipped
                                                resizeMode:(RCTResizeMode)resizeMode
                                               attribution:(const facebook::react::ImageURLLoaderAttribution &)attribution
                                             progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                          partialLoadBlock:(RCTImageLoaderPartialLoadBlock)partialLoadBlock
                                           completionBlock:(RCTImageLoaderCompletionBlock)completionBlock;
#endif

@end
