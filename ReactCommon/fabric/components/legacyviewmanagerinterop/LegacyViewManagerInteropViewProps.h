/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <folly/dynamic.h>
#include <react/components/view/ViewProps.h>
#include <unordered_map>

namespace facebook {
namespace react {

class LegacyViewManagerInteropViewProps final : public ViewProps {
 public:
  LegacyViewManagerInteropViewProps() = default;
  LegacyViewManagerInteropViewProps(
      const LegacyViewManagerInteropViewProps &sourceProps,
      const RawProps &rawProps);

#pragma mark - Props

  const std::unordered_map<std::string, folly::dynamic> otherProps;
};

} // namespace react
} // namespace facebook
