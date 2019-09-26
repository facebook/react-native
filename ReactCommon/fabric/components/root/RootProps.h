/**
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

class RootProps;

using SharedRootProps = std::shared_ptr<const RootProps>;

class RootProps final : public ViewProps {
 public:
  RootProps() = default;
  RootProps(const RootProps &sourceProps, const RawProps &rawProps);
  RootProps(
      const RootProps &sourceProps,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext);

#pragma mark - Props

  const LayoutConstraints layoutConstraints{};
  const LayoutContext layoutContext{};
};

} // namespace react
} // namespace facebook
