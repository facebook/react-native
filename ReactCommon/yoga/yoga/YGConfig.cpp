/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "YGConfig.h"

YGConfig::YGConfig(YGLogger logger) {
  logger_.noContext = logger;
  loggerUsesContext_ = false;
}

void YGConfig::log(
    YGConfig* config,
    YGNode* node,
    YGLogLevel logLevel,
    void* logContext,
    const char* format,
    va_list args) {
  if (loggerUsesContext_) {
    logger_.withContext(config, node, logLevel, logContext, format, args);
  } else {
    logger_.noContext(config, node, logLevel, format, args);
  }
}
