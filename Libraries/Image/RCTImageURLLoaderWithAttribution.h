/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTImageURLLoader.h>

namespace facebook {
namespace react {

struct ImageURLLoaderAttribution {
  int32_t nativeViewTag = 0;
  int32_t surfaceId = 0;
};

} // namespace react
} // namespace facebook

@interface RCTImageURLLoaderRequest : NSObject

@property (nonatomic, strong, readonly) NSString *requestId;
@property (nonatomic, copy, readonly) RCTImageLoaderCancellationBlock cancellationBlock;

- (instancetype)initWithRequestId:(NSString *)requestId cancellationBlock:(RCTImageLoaderCancellationBlock)cancellationBlock;
- (void)cancel;

@end

/**
 * Same as the RCTImageURLLoader interface, but allows passing in optional `attribution` information.
 * This is useful for per-app logging and other instrumentation.
 */
@protocol RCTImageURLLoaderWithAttribution <RCTImageURLLoader>

/**
 * Same as the RCTImageURLLoader variant above, but allows optional `attribution` information.
 * Caller may also specify a preferred requestId for tracking purpose.
 */
- (RCTImageURLLoaderRequest *)loadImageForURL:(NSURL *)imageURL
                                         size:(CGSize)size
                                        scale:(CGFloat)scale
                                   resizeMode:(RCTResizeMode)resizeMode
                                    requestId:(NSString *)requestId
                                  attribution:(const facebook::react::ImageURLLoaderAttribution &)attribution
                              progressHandler:(RCTImageLoaderProgressBlock)progressHandler
                           partialLoadHandler:(RCTImageLoaderPartialLoadBlock)partialLoadHandler
                            completionHandler:(RCTImageLoaderCompletionBlock)completionHandler;

@end
