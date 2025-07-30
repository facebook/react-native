/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CdpInteractionTypes.h"

namespace facebook::react {

const InteractionTypesMap& getInteractionTypes() {
  static InteractionTypesMap INTERACTION_TYPES = {
      {"auxclick", "pointer"},
      {"click", "pointer"},
      {"contextmenu", "pointer"},
      {"dblclick", "pointer"},
      {"mousedown", "pointer"},
      {"mouseenter", "pointer"},
      {"mouseleave", "pointer"},
      {"mouseout", "pointer"},
      {"mouseover", "pointer"},
      {"mouseup", "pointer"},
      {"pointerover", "pointer"},
      {"pointerenter", "pointer"},
      {"pointerdown", "pointer"},
      {"pointerup", "pointer"},
      {"pointercancel", "pointer"},
      {"pointerout", "pointer"},
      {"pointerleave", "pointer"},
      {"gotpointercapture", "pointer"},
      {"lostpointercapture", "pointer"},
      {"touchstart", "touch"},
      {"touchend", "touch"},
      {"touchcancel", "touch"},
      {"keydown", "keyboard"},
      {"keypress", "keyboard"},
      {"keyup", "keyboard"},
      {"beforeinput", "keyboard"},
      {"input", "keyboard"},
      {"compositionstart", "composition"},
      {"compositionupdate", "composition"},
      {"compositionend", "composition"},
      {"dragstart", "drag"},
      {"dragend", "drag"},
      {"dragenter", "drag"},
      {"dragleave", "drag"},
      {"dragover", "drag"},
      {"drop", "drag"},
  };
  return INTERACTION_TYPES;
}

const std::string_view getInteractionTypeForEvent(std::string_view eventName) {
  const auto& interactionTypes = getInteractionTypes();
  auto it = interactionTypes.find(eventName);
  if (it != interactionTypes.end()) {
    return it->second;
  }
  return "unknown";
}

} // namespace facebook::react
