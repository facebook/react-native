/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/components/view/ViewProps.h>
#include <react/core/LayoutConstraints.h>
#include <react/core/LayoutContext.h>

namespace facebook {
namespace react {

class RootProps final : public ViewProps {
 public:
  RootProps() = default;
  RootProps(RootProps const &sourceProps, RawProps const &rawProps);
  RootProps(
      RootProps const &sourceProps,
      LayoutConstraints const &layoutConstraints,
      LayoutContext const &layoutContext);

#pragma mark - Props

  LayoutConstraints const layoutConstraints{};
  LayoutContext const layoutContext{};
};

} // namespace react
} // namespace facebook
