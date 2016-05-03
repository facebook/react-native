/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTShadowView.h"
#import "RCTImageComponent.h"
#import "RCTImageSource.h"
#import "RCTResizeMode.h"

@class RCTBridge;

/**
 * Shadow image component, used for embedding images in non-view contexts such
 * as text. This is NOT used for ordinary <Image> views.
 */
@interface RCTShadowVirtualImage : RCTShadowView <RCTImageComponent>

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@property (nonatomic, strong) RCTImageSource *source;
@property (nonatomic, assign) RCTResizeMode resizeMode;

@end
