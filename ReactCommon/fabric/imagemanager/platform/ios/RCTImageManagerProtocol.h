/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <react/core/ReactPrimitives.h>
#import <react/imagemanager/ImageRequest.h>

@protocol RCTImageManagerProtocol <NSObject>

- (facebook::react::ImageRequest)requestImage:(facebook::react::ImageSource)imageSource
                                    surfaceId:(facebook::react::SurfaceId)surfaceId;
@end
