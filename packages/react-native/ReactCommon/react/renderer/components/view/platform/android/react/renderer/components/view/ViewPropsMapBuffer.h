/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/mapbuffer/MapBuffer.h>

namespace facebook::react {

constexpr MapBuffer::Key VP_BACKFACE_VISIBILITY = 9;
constexpr MapBuffer::Key VP_BG_COLOR = 10;
constexpr MapBuffer::Key VP_BORDER_COLOR = 11;
constexpr MapBuffer::Key VP_BORDER_RADII = 12;
constexpr MapBuffer::Key VP_BORDER_STYLE = 13;
constexpr MapBuffer::Key VP_COLLAPSABLE = 14;
constexpr MapBuffer::Key VP_ELEVATION = 15;
constexpr MapBuffer::Key VP_FOCUSABLE = 16;
constexpr MapBuffer::Key VP_HAS_TV_FOCUS = 17;
constexpr MapBuffer::Key VP_HIT_SLOP = 18;
constexpr MapBuffer::Key VP_NATIVE_BACKGROUND = 20;
constexpr MapBuffer::Key VP_NATIVE_FOREGROUND = 21;
constexpr MapBuffer::Key VP_OFFSCREEN_ALPHA_COMPOSITING = 23;
constexpr MapBuffer::Key VP_OPACITY = 24;
constexpr MapBuffer::Key VP_POINTER_EVENTS = 25;
constexpr MapBuffer::Key VP_POINTER_ENTER = 26;
constexpr MapBuffer::Key VP_POINTER_LEAVE = 27;
constexpr MapBuffer::Key VP_POINTER_MOVE = 28;
constexpr MapBuffer::Key VP_REMOVE_CLIPPED_SUBVIEW = 29;
constexpr MapBuffer::Key VP_RENDER_TO_HARDWARE_TEXTURE = 30;
constexpr MapBuffer::Key VP_SHADOW_COLOR = 31;
constexpr MapBuffer::Key VP_TEST_ID = 32;
constexpr MapBuffer::Key VP_TRANSFORM = 33;
constexpr MapBuffer::Key VP_ZINDEX = 34;
constexpr MapBuffer::Key VP_POINTER_ENTER_CAPTURE = 38;
constexpr MapBuffer::Key VP_POINTER_LEAVE_CAPTURE = 39;
constexpr MapBuffer::Key VP_POINTER_MOVE_CAPTURE = 40;
constexpr MapBuffer::Key VP_POINTER_OVER = 41;
constexpr MapBuffer::Key VP_POINTER_OVER_CAPTURE = 42;
constexpr MapBuffer::Key VP_POINTER_OUT = 43;
constexpr MapBuffer::Key VP_POINTER_OUT_CAPTURE = 44;
constexpr MapBuffer::Key VP_BORDER_CURVES = 45;

// Yoga values
constexpr MapBuffer::Key YG_BORDER_WIDTH = 100;
constexpr MapBuffer::Key YG_OVERFLOW = 101;

} // namespace facebook::react
