/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <React/RCTBridgeModule.h>

@class RCTLoadingProgress;

@interface RCTDevLoadingView : NSObject <RCTBridgeModule>
- (void)updateProgress:(RCTLoadingProgress *)progress;
@end
