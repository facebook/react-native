/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>
#include <unordered_map>

#include <folly/dynamic.h>

namespace facebook {
namespace react {

/*
 * `Tag` and `InstanceHandle` are used to address React Native components.
 */
using Tag = int32_t;
using InstanceHandle = struct InstanceHandleDummyStruct {} *;

/*
 * `RawProps` represents untyped map with props comes from JavaScript side.
 */
// TODO(T26954420): Use iterator as underlying type for RawProps.
using RawProps = std::unordered_map<std::string, folly::dynamic>;
using SharedRawProps = std::shared_ptr<const RawProps>;

/*
 * Universal component handle which allows to refer to `ComponentDescriptor`s
 * in maps efficiently.
 * Practically, it's something that concrete ShadowNode and concrete
 * ComponentDescriptor have in common.
 */
using ComponentHandle = int64_t;

/*
 * String identifier for components used for addressing them from
 * JavaScript side.
 */
using ComponentName = std::string;

} // namespace react
} // namespace facebook
