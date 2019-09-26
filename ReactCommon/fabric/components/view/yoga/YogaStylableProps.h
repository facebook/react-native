/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/YGStyle.h>

#include <react/core/Props.h>
#include <react/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class YogaStylableProps;

typedef std::shared_ptr<const YogaStylableProps> SharedYogaStylableProps;

class YogaStylableProps {
 public:
  YogaStylableProps() = default;
  YogaStylableProps(const YGStyle &yogaStyle);
  YogaStylableProps(
      const YogaStylableProps &sourceProps,
      const RawProps &rawProps);

#pragma mark - Props

 protected:
  friend class YogaLayoutableShadowNode;
  const YGStyle yogaStyle{};

#if RN_DEBUG_STRING_CONVERTIBLE

#pragma mark - DebugStringConvertible (Partial)

 public:
  SharedDebugStringConvertibleList getDebugProps() const;

#endif
};

} // namespace react
} // namespace facebook
