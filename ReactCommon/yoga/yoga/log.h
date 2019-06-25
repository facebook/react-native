/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include "YGEnums.h"

struct YGNode;
struct YGConfig;

namespace facebook {
namespace yoga {

namespace detail {

struct Log {
  static void log(
      YGNode* node,
      YGLogLevel level,
      void*,
      const char* message,
      ...) noexcept;

  static void log(
      YGConfig* config,
      YGLogLevel level,
      void*,
      const char* format,
      ...) noexcept;
};

} // namespace detail
} // namespace yoga
} // namespace facebook
