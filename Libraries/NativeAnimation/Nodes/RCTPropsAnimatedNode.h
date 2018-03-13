/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAnimatedNode.h"

@class RCTUIManager;
@class RCTViewPropertyMapper;

@interface RCTPropsAnimatedNode : RCTAnimatedNode

- (void)connectToView:(NSNumber *)viewTag
             viewName:(NSString *)viewName
            uiManager:(RCTUIManager *)uiManager;

- (void)disconnectFromView:(NSNumber *)viewTag;

- (void)restoreDefaultValues;

@end
