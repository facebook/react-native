/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTImageURLLoader.h>

// TODO (T61325135): Remove C++ checks
#ifdef __cplusplus
namespace facebook {
namespace react {

struct ImageURLLoaderAttribution {
  int32_t nativeViewTag = 0;
  int32_t surfaceId = 0;
};

} // namespace react
} // namespace facebook
#endif

/**
 * Same as the RCTImageURLLoader interface, but allows passing in optional `attribution` information.
 * This is useful for per-app logging and other instrumentation.
 */
@protocol RCTImageURLLoaderWithAttribution <RCTImageURLLoader>

// TODO (T61325135): Remove C++ checks
#ifdef __cplusplus
/**
 * Same as the RCTImageURLLoader variant above, but allows optional `attribution` information.
 */
- (RCTImageLoaderCancellationBlock)loadImageForURL:(NSURL *)imageURL
                                              size:(CGSize)size
                                             scale:(CGFloat)scale
                                        resizeMode:(RCTResizeMode)resizeMode
                                       attribution:(const facebook::react::ImageURLLoaderAttribution &)attribution
                                   progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                                partialLoadHandler:(RCTImageLoaderPartialLoadBlock)partialLoadHandler
                                 completionHandler:(RCTImageLoaderCompletionBlock)completionHandler;
#endif

@end
