/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/components/scrollview/primitives.h>

namespace facebook {
namespace react {

inline void fromRawValue(
    const RawValue &value,
    ScrollViewSnapToAlignment &result) {
  auto string = (std::string)value;
  if (string == "start") {
    result = ScrollViewSnapToAlignment::Start;
    return;
  }
  if (string == "center") {
    result = ScrollViewSnapToAlignment::Center;
    return;
  }
  if (string == "end") {
    result = ScrollViewSnapToAlignment::End;
    return;
  }
  abort();
}

inline void fromRawValue(
    const RawValue &value,
    ScrollViewIndicatorStyle &result) {
  auto string = (std::string)value;
  if (string == "default") {
    result = ScrollViewIndicatorStyle::Default;
    return;
  }
  if (string == "black") {
    result = ScrollViewIndicatorStyle::Black;
    return;
  }
  if (string == "white") {
    result = ScrollViewIndicatorStyle::White;
    return;
  }
  abort();
}

inline void fromRawValue(
    const RawValue &value,
    ScrollViewKeyboardDismissMode &result) {
  auto string = (std::string)value;
  if (string == "none") {
    result = ScrollViewKeyboardDismissMode::None;
    return;
  }
  if (string == "on-drag") {
    result = ScrollViewKeyboardDismissMode::OnDrag;
    return;
  }
  if (string == "interactive") {
    result = ScrollViewKeyboardDismissMode::Interactive;
    return;
  }
  abort();
}

inline void fromRawValue(
    const RawValue &value,
    ContentInsetAdjustmentBehavior &result) {
  auto string = (std::string)value;
  if (string == "never") {
    result = ContentInsetAdjustmentBehavior::Never;
    return;
  }
  if (string == "automatic") {
    result = ContentInsetAdjustmentBehavior::Automatic;
    return;
  }
  if (string == "scrollableAxes") {
    result = ContentInsetAdjustmentBehavior::ScrollableAxes;
    return;
  }
  if (string == "always") {
    result = ContentInsetAdjustmentBehavior::Always;
    return;
  }
  abort();
}

inline std::string toString(const ScrollViewSnapToAlignment &value) {
  switch (value) {
    case ScrollViewSnapToAlignment::Start:
      return "start";
    case ScrollViewSnapToAlignment::Center:
      return "center";
    case ScrollViewSnapToAlignment::End:
      return "end";
  }
}

inline std::string toString(const ScrollViewIndicatorStyle &value) {
  switch (value) {
    case ScrollViewIndicatorStyle::Default:
      return "default";
    case ScrollViewIndicatorStyle::Black:
      return "black";
    case ScrollViewIndicatorStyle::White:
      return "white";
  }
}

inline std::string toString(const ScrollViewKeyboardDismissMode &value) {
  switch (value) {
    case ScrollViewKeyboardDismissMode::None:
      return "none";
    case ScrollViewKeyboardDismissMode::OnDrag:
      return "on-drag";
    case ScrollViewKeyboardDismissMode::Interactive:
      return "interactive";
  }
}

inline std::string toString(const ContentInsetAdjustmentBehavior &value) {
  switch (value) {
    case ContentInsetAdjustmentBehavior::Never:
      return "never";
    case ContentInsetAdjustmentBehavior::Automatic:
      return "automatic";
    case ContentInsetAdjustmentBehavior::ScrollableAxes:
      return "scrollableAxes";
    case ContentInsetAdjustmentBehavior::Always:
      return "always";
  }
}

} // namespace react
} // namespace facebook
