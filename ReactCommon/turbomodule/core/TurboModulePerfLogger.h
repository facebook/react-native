/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/NativeModulePerfLogger.h>
#include <memory>

namespace facebook {
namespace react {
namespace TurboModulePerfLogger {

NativeModulePerfLogger &getInstance();
void setInstance(std::shared_ptr<NativeModulePerfLogger> perfLogger);

} // namespace TurboModulePerfLogger
} // namespace react
} // namespace facebook
