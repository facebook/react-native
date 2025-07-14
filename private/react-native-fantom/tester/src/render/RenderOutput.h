/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/json.h>
#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/mounting/stubs/StubViewTree.h>
#include "RenderFormatOptions.h"

namespace facebook::react {
class RenderOutput {
 public:
  static std::string render(
      const StubViewTree& tree,
      const RenderFormatOptions& options);

 private:
  static folly::dynamic renderView(
      const StubView& view,
      const RenderFormatOptions& options);

#if RN_DEBUG_STRING_CONVERTIBLE
  static folly::dynamic renderProps(
      const SharedDebugStringConvertibleList& propsList);
#endif

  static folly::dynamic renderAttributedString(
      const Tag& selfTag,
      const AttributedString& string);
};
} // namespace facebook::react
