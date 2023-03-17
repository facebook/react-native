/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef ANDROID

#include <react/renderer/mapbuffer/MapBuffer.h>

namespace facebook {
namespace react {

// Yoga values
constexpr MapBuffer::Key YG_BORDER_WIDTH = 100;
constexpr MapBuffer::Key YG_OVERFLOW = 101;

} // namespace react
} // namespace facebook

#endif
