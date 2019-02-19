/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "YGConfig.h"

YGConfig::YGConfig(YGLogger logger) : logger_{logger} {}

void YGConfig::log(
    YGConfig* config,
    YGNode* node,
    YGLogLevel logLevel,
    const char* format,
    va_list args) {
  logger_(config, node, logLevel, format, args);
}
