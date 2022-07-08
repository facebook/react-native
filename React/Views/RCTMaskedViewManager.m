/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTMaskedViewManager.h"

#import "RCTMaskedView.h"
#import "RCTUIManager.h"

@implementation RCTMaskedViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  RCTNewArchitectureValidationPlaceholder(
      RCTNotAllowedInFabricWithoutLegacy,
      self,
      @"This native component is still using the legacy interop layer -- please migrate it to use a Fabric specific implementation.");
  return [RCTMaskedView new];
}

@end
