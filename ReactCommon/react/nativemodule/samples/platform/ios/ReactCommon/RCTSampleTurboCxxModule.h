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
 * With jsi::HostObject, this class is no longer necessary, but the system supports it for
 * backward compatibility.
 */
@interface RCTSampleTurboCxxModule_v1 : RCTCxxModule <RCTTurboModule>

@end

/**
 * Second variant of a sample backward-compatible RCTCxxModule-based module.
 */
@interface RCTSampleTurboCxxModule_v2 : RCTCxxModule <RCTTurboModule>

@end
