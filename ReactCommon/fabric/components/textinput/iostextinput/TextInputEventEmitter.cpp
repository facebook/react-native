/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextInputEventEmitter.h"

namespace facebook {
namespace react {

static jsi::Value textInputMetricsPayload(
    jsi::Runtime &runtime,
    TextInputMetrics const &textInputMetrics) {
  auto payload = jsi::Object(runtime);

  payload.setProperty(
      runtime,
      "text",
      jsi::String::createFromUtf8(runtime, textInputMetrics.text));

  payload.setProperty(runtime, "eventCount", textInputMetrics.eventCount);

  {
    auto selection = jsi::Object(runtime);
    selection.setProperty(
        runtime, "start", textInputMetrics.selectionRange.location);
    selection.setProperty(
        runtime,
        "end",
        textInputMetrics.selectionRange.location +
            textInputMetrics.selectionRange.length);
    payload.setProperty(runtime, "selection", selection);
  }

  return payload;
};

void TextInputEventEmitter::onFocus(
    TextInputMetrics const &textInputMetrics) const {
  dispatchTextInputEvent("focus", textInputMetrics);
}

void TextInputEventEmitter::onBlur(
    TextInputMetrics const &textInputMetrics) const {
  dispatchTextInputEvent("blur", textInputMetrics);
}

void TextInputEventEmitter::onChange(
    TextInputMetrics const &textInputMetrics) const {
  dispatchTextInputEvent("change", textInputMetrics);
}

void TextInputEventEmitter::onChangeText(
    TextInputMetrics const &textInputMetrics) const {
  dispatchTextInputEvent("changeText", textInputMetrics);
}

void TextInputEventEmitter::onContentSizeChange(
    TextInputMetrics const &textInputMetrics) const {
  dispatchTextInputEvent("contentSizeChange", textInputMetrics);
}

void TextInputEventEmitter::onSelectionChange(
    TextInputMetrics const &textInputMetrics) const {
  dispatchTextInputEvent("selectionChange", textInputMetrics);
}

void TextInputEventEmitter::onEndEditing(
    TextInputMetrics const &textInputMetrics) const {
  dispatchTextInputEvent("endEditing", textInputMetrics);
}

void TextInputEventEmitter::onSubmitEditing(
    TextInputMetrics const &textInputMetrics) const {
  dispatchTextInputEvent("submitEditing", textInputMetrics);
}

void TextInputEventEmitter::onKeyPress(
    TextInputMetrics const &textInputMetrics) const {
  dispatchTextInputEvent("keyPress", textInputMetrics);
}

void TextInputEventEmitter::dispatchTextInputEvent(
    std::string const &name,
    TextInputMetrics const &textInputMetrics,
    EventPriority priority) const {
  dispatchEvent(
      name,
      [textInputMetrics](jsi::Runtime &runtime) {
        return textInputMetricsPayload(runtime, textInputMetrics);
      },
      priority);
}

} // namespace react
} // namespace facebook
