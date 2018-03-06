/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTFabricSurface.h"

#import <React/RCTBridge.h>

@implementation RCTFabricSurface

- (void)unmountReactComponentWithBridge:(RCTBridge *)bridge rootViewTag:(NSNumber *)rootViewTag
{
  [bridge enqueueJSCall:@"ReactFabric"
                 method:@"unmountComponentAtNodeAndRemoveContainer"
                   args:@[rootViewTag]
             completion:NULL];
}

@end
