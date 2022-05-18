/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>

@interface RNTNewFabricComponentExampleViewManager : RCTViewManager
@end

@implementation RNTNewFabricComponentExampleViewManager

RCT_EXPORT_MODULE(RNTNewFabricComponentExampleView)

RCT_EXPORT_VIEW_PROPERTY(text, NSString)

- (UIView *)view
{
  return [[UIView alloc] init];
}

@end
