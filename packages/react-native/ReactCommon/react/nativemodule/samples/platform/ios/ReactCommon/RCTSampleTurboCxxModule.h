/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <React/RCTCxxModule.h>
#import <ReactCommon/RCTTurboModule.h>

/**
 * Sample backward-compatible RCTCxxModule-based module.
 */
@interface RCTSampleTurboCxxModule : RCTCxxModule <RCTTurboModule>

@end
