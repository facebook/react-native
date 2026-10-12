/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <folly/dynamic.h>
#include <react/renderer/components/scrollview/BaseScrollViewProps.h>

namespace facebook::react {

class HostPlatformScrollViewProps : public BaseScrollViewProps {
 public:
  HostPlatformScrollViewProps() = default;
  HostPlatformScrollViewProps(
      const PropsParserContext &context,
      const HostPlatformScrollViewProps &sourceProps,
      const RawProps &rawProps);

  void
  setProp(const PropsParserContext &context, RawPropsPropNameHash hash, const char *propName, const RawValue &value);

#pragma mark - Props

  folly::dynamic fadingEdgeLength{};
};

} // namespace facebook::react
