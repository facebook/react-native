/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModulePerfLogger.h"

namespace facebook {
namespace react {
namespace TurboModulePerfLogger {

std::shared_ptr<NativeModulePerfLogger> g_perfLogger = nullptr;

NativeModulePerfLogger &getInstance() {
  static std::shared_ptr<NativeModulePerfLogger> defaultPerfLogger =
      std::make_shared<NativeModulePerfLogger>();
  return g_perfLogger ? *g_perfLogger : *defaultPerfLogger;
}
void setInstance(std::shared_ptr<NativeModulePerfLogger> perfLogger) {
  g_perfLogger = perfLogger;
}

} // namespace TurboModulePerfLogger
} // namespace react
} // namespace facebook
