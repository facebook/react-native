/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@protocol RCTImageLoaderInstrumentableProtocol

/**
* Image instrumentation - get name of the image loader module
*/
- (NSString *)loaderModuleNameForRequestUrl:(NSURL *)url;

@end
