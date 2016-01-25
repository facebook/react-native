/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTBridge.h"
#import "RCTURLRequestHandler.h"
#import "RCTResizeMode.h"

@class ALAssetsLibrary;

typedef void (^RCTImageLoaderProgressBlock)(int64_t progress, int64_t total);
typedef void (^RCTImageLoaderCompletionBlock)(NSError *error, UIImage *image);
typedef void (^RCTImageLoaderCancellationBlock)(void);

@interface UIImage (React)

@property (nonatomic, copy) CAKeyframeAnimation *reactKeyframeAnimation;

@end

@interface RCTImageLoader : NSObject <RCTBridgeModule, RCTURLRequestHandler>

/**
 * Loads the specified image at the highest available resolution.
 * Can be called from any thread, will call back on an unspecified thread.
 */
- (RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                           callback:(RCTImageLoaderCompletionBlock)callback;

/**
 * As above, but includes target size, scale and resizeMode, which are used to
 * select the optimal dimensions for the loaded image.
 */
- (RCTImageLoaderCancellationBlock)loadImageWithTag:(NSString *)imageTag
                                               size:(CGSize)size
                                              scale:(CGFloat)scale
                                         resizeMode:(RCTResizeMode)resizeMode
                                      progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                    completionBlock:(RCTImageLoaderCompletionBlock)completionBlock;

/**
 * Loads an image without clipping the result to fit - used by RCTImageView.
 */
- (RCTImageLoaderCancellationBlock)loadImageWithoutClipping:(NSString *)imageTag
                                                       size:(CGSize)size
                                                      scale:(CGFloat)scale
                                                 resizeMode:(RCTResizeMode)resizeMode
                                              progressBlock:(RCTImageLoaderProgressBlock)progressBlock
                                            completionBlock:(RCTImageLoaderCompletionBlock)completionBlock;

/**
 * Finds an appropriate image decoder and passes the target size, scale and
 * resizeMode for optimal image decoding. Can be called from any thread,
 * will call callback on an unspecified thread.
 */
- (RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(RCTResizeMode)resizeMode
                                   completionBlock:(RCTImageLoaderCompletionBlock)completionBlock;

/**
 * Get image size, in pixels. This method will do the least work possible to get
 * the information, and won't decode the image if it doesn't have to.
 */
- (RCTImageLoaderCancellationBlock)getImageSize:(NSString *)imageTag
                                          block:(void(^)(NSError *error, CGSize size))completionBlock;

@end

@interface RCTBridge (RCTImageLoader)

/**
 * The shared image loader instance
 */
@property (nonatomic, readonly) RCTImageLoader *imageLoader;

@end

/**
 * Provides the interface needed to register an image loader. Image data
 * loaders are also bridge modules, so should be registered using
 * RCT_EXPORT_MODULE().
 */
@protocol RCTImageURLLoader <RCTBridgeModule>

/**
 * Indicates whether this data loader is capable of processing the specified
 * request URL. Typically the handler would examine the scheme/protocol of the
 * URL to determine this.
 */
- (BOOL)canLoadImageURL:(NSURL *)requestURL;

/**
 * Send a network request to load the request URL. The method should call the
 * progressHandler (if applicable) and the completionHandler when the request
 * has finished. The method should also return a cancellation block, if
 * applicable.
 */
- (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(RCTResizeMode)resizeMode
                                   progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                 completionHandler:(RCTImageLoaderCompletionBlock)completionHandler;

@optional

/**
 * If more than one RCTImageURLLoader responds YES to `-canLoadImageURL:`
 * then `loaderPriority` is used to determine which one to use. The loader
 * with the highest priority will be selected. Default priority is zero. If
 * two or more valid loaders have the same priority, the selection order is
 * undefined.
 */
- (float)loaderPriority;

@end

/**
 * Provides the interface needed to register an image decoder. Image decoders
 * are also bridge modules, so should be registered using RCT_EXPORT_MODULE().
 */
@protocol RCTImageDataDecoder <RCTBridgeModule>

/**
 * Indicates whether this handler is capable of decoding the specified data.
 * Typically the handler would examine some sort of header data to determine
 * this.
 */
- (BOOL)canDecodeImageData:(NSData *)imageData;

/**
 * Decode an image from the data object. The method should call the
 * completionHandler when the decoding operation  has finished. The method
 * should also return a cancellation block, if applicable.
 */
- (RCTImageLoaderCancellationBlock)decodeImageData:(NSData *)imageData
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(RCTResizeMode)resizeMode
                                 completionHandler:(RCTImageLoaderCompletionBlock)completionHandler;

@optional

/**
 * If more than one RCTImageDataDecoder responds YES to `-canDecodeImageData:`
 * then `decoderPriority` is used to determine which one to use. The decoder
 * with the highest priority will be selected. Default priority is zero.
 * If two or more valid decoders have the same priority, the selection order is
 * undefined.
 */
- (float)decoderPriority;

@end
