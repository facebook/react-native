/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/core/Sealable.h>
#include <react/debug/DebugStringConvertible.h>

namespace facebook {
namespace react {

class LocalData;

using SharedLocalData = std::shared_ptr<const LocalData>;

/*
 * Abstract class for any kind of concrete pieces of local data specific for
 * some kinds of `ShadowNode`s.
 * LocalData might be used to communicate some infomation between `ShadowNode`s
 * and native component views.
 * All `LocalData` objects *must* be immutable (sealed) when they became
 * a part of the shadow tree.
 */
class LocalData : public Sealable, public DebugStringConvertible {
 public:
  using Shared = std::shared_ptr<LocalData const>;

  virtual ~LocalData() = default;

  virtual folly::dynamic getDynamic() const {
    return folly::dynamic::object();
  }
};

} // namespace react
} // namespace facebook
