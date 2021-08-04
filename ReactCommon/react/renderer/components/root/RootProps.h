/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/PropsParserContext.h>

namespace facebook {
namespace react {

class RootProps final : public ViewProps {
 public:
  RootProps() = default;
  RootProps(
      const PropsParserContext &context,
      RootProps const &sourceProps,
      RawProps const &rawProps);
  RootProps(
      const PropsParserContext &context,
      RootProps const &sourceProps,
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext);

#pragma mark - Props

  LayoutConstraints layoutConstraints{};
  LayoutContext layoutContext{};
};

} // namespace react
} // namespace facebook
