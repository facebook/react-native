/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/core/RawProps.h>
#include <react/core/RawValue.h>
#include <memory>
#include <string>
#include <unordered_map>

namespace facebook {
namespace react {

/*
 * `Tag` and `InstanceHandle` are used to address React Native components.
 */
using Tag = int32_t;
using InstanceHandle = struct InstanceHandleDummyStruct {
} *;

/*
 * An id of a running Surface instance that is used to refer to the instance.
 */
using SurfaceId = int32_t;

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
