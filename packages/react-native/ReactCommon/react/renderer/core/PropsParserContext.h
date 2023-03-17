/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ReactPrimitives.h>
#include <react/utils/ContextContainer.h>

namespace facebook {
namespace react {

// For props requiring some context to parse, this toolbox can be used.
// It should be used as infrequently as possible - most props can and should
// be parsed without any context.
struct PropsParserContext {
  // Non-copyable
  PropsParserContext(const PropsParserContext &) = delete;
  PropsParserContext &operator=(const PropsParserContext &) = delete;

  SurfaceId const surfaceId;
  ContextContainer const &contextContainer;
};

} // namespace react
} // namespace facebook
