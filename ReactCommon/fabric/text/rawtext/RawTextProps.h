/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fabric/core/Props.h>
#include <fabric/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class RawTextProps;

using SharedRawTextProps = std::shared_ptr<const RawTextProps>;

class RawTextProps:
  public Props {

public:

  void apply(const RawProps &rawProps) override;

#pragma mark - Getters

  std::string getText() const;

#pragma mark - DebugStringConvertible

  SharedDebugStringConvertibleList getDebugProps() const override;

private:

  std::string text_ {""};
};

} // namespace react
} // namespace facebook
