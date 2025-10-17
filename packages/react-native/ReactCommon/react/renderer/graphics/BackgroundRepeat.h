/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook::react {

enum class BackgroundRepeatStyle {
  Repeat,
  Space,
  Round,
  NoRepeat,
};

struct BackgroundRepeat {
  BackgroundRepeatStyle x;
  BackgroundRepeatStyle y;

  BackgroundRepeat() : x(BackgroundRepeatStyle::Repeat), y(BackgroundRepeatStyle::Repeat) {}

  bool operator==(const BackgroundRepeat& other) const = default;
  bool operator!=(const BackgroundRepeat& other) const = default;
};

} // namespace facebook::react 
