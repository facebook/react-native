/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The image loader (i.e. RCTImageLoader) implement this to declare whether image performance should be logged.
 */
@protocol RCTImageLoaderLoggableProtocol

/**
 * Image instrumentation - declares whether its caller should log images
 */
- (BOOL)shouldEnablePerfLoggingForRequestUrl:(NSURL *)url;

@end

/**
 * Image handlers in the image loader implement this to declare whether image performance should be logged.
 */
@protocol RCTImageLoaderLoggable

/**
 * Image instrumentation - declares whether its caller should log images
 */
- (BOOL)shouldEnablePerfLogging;

@end
