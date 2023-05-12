/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTHostCreationHelpers.h"

RCTHost *RCTHostCreateDefault(
    id<RCTHostDelegate> hostDelegate,
    id<RCTTurboModuleManagerDelegate> turboModuleManagerDelegate,
    RCTHostJSEngineProvider jsEngineProvider)
{
  return [[RCTHost alloc] initWithHostDelegate:hostDelegate
                    turboModuleManagerDelegate:turboModuleManagerDelegate
                           bindingsInstallFunc:nullptr
                              jsEngineProvider:jsEngineProvider];
}
