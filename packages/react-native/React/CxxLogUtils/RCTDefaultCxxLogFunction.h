/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <logger/react_native_log.h>

namespace facebook::react {

void RCTDefaultCxxLogFunction(ReactNativeLogLevel level, const char *message);

} // namespace facebook::react
