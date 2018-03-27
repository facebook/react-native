/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/YGStyle.h>

#include <fabric/core/Props.h>
#include <fabric/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class YogaStylableProps;

typedef std::shared_ptr<const YogaStylableProps> SharedYogaStylableProps;

class YogaStylableProps:
  public virtual DebugStringConvertible
{
public:
  const YGStyle &getYogaStyle() const;

  void apply(const RawProps &rawProps);

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override;

protected:
  YGStyle yogaStyle_ {};
};

} // namespace react
} // namespace facebook
