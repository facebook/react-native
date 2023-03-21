/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Touch.h"

namespace facebook::react {

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(Touch const & /*touch*/) {
  return "Touch";
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    Touch const &touch,
    DebugStringConvertibleOptions options) {
  return {
      {"pagePoint", getDebugDescription(touch.pagePoint, options)},
      {"offsetPoint", getDebugDescription(touch.offsetPoint, options)},
      {"screenPoint", getDebugDescription(touch.screenPoint, options)},
      {"identifier", getDebugDescription(touch.identifier, options)},
      {"target", getDebugDescription(touch.target, options)},
      {"force", getDebugDescription(touch.force, options)},
      {"timestamp", getDebugDescription(touch.timestamp, options)},
      {"button", getDebugDescription(touch.button, options)}, // [macOS]
      {"altKey", getDebugDescription(touch.altKey, options)}, // [macOS]
      {"ctrlKey", getDebugDescription(touch.ctrlKey, options)}, // [macOS]
      {"shiftKey", getDebugDescription(touch.shiftKey, options)}, // [macOS]
      {"metaKey", getDebugDescription(touch.metaKey, options)}, // [macOS]
  };
}

#endif

} // namespace facebook::react
