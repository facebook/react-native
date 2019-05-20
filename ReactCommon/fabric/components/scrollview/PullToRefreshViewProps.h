/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/view/ViewProps.h>

namespace facebook {
namespace react {

class PullToRefreshViewProps final : public ViewProps {
 public:
  PullToRefreshViewProps() = default;
  PullToRefreshViewProps(
      PullToRefreshViewProps const &sourceProps,
      RawProps const &rawProps);

#pragma mark - Props

  bool const refreshing{};
  SharedColor const tintColor{};
  std::string const title{};
  SharedColor const titleColor{};
};

} // namespace react
} // namespace facebook
