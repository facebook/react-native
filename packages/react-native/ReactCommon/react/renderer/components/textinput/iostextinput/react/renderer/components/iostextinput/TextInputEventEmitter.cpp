/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextInputEventEmitter.h"

#include <iostream>

namespace facebook::react {

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
      
    auto cursorPosition = jsi::Object(runtime);
    auto cursorStartPosition = jsi::Object(runtime);

    cursorStartPosition.setProperty(
        runtime,
        "x",
        textInputMetrics.cursorPosition.start.first);
    cursorStartPosition.setProperty(
        runtime,
        "y",
        textInputMetrics.cursorPosition.start.second);
    cursorPosition.setProperty(runtime, "start", cursorStartPosition);

    auto cursorEndPosition = jsi::Object(runtime);
    cursorEndPosition.setProperty(
        runtime,
        "x",
        textInputMetrics.cursorPosition.end.first);
    cursorEndPosition.setProperty(
        runtime,
        "y",
        textInputMetrics.cursorPosition.end.second);
    cursorPosition.setProperty(runtime, "end", cursorEndPosition);

    selection.setProperty(runtime, "cursorPosition", cursorPosition);
  }

  return payload;
};

static jsi::Value textInputMetricsContentSizePayload(
    jsi::Runtime &runtime,
    TextInputMetrics const &textInputMetrics) {
  auto payload = jsi::Object(runtime);

  {
    auto contentSize = jsi::Object(runtime);
    contentSize.setProperty(
        runtime, "width", textInputMetrics.contentSize.width);
    contentSize.setProperty(
        runtime, "height", textInputMetrics.contentSize.height);
    payload.setProperty(runtime, "contentSize", contentSize);
  }

  return payload;
};

static jsi::Value keyPressMetricsPayload(
    jsi::Runtime &runtime,
    KeyPressMetrics const &keyPressMetrics) {
  auto payload = jsi::Object(runtime);
  payload.setProperty(runtime, "eventCount", keyPressMetrics.eventCount);

  std::string key;
  if (keyPressMetrics.text.empty()) {
    key = "Backspace";
  } else {
    if (keyPressMetrics.text.front() == '\n') {
      key = "Enter";
    } else if (keyPressMetrics.text.front() == '\t') {
      key = "Tab";
    } else {
      key = keyPressMetrics.text.front();
    }
  }
  payload.setProperty(
      runtime, "key", jsi::String::createFromUtf8(runtime, key));
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

void TextInputEventEmitter::onChangeSync(
    TextInputMetrics const &textInputMetrics) const {
  dispatchTextInputEvent(
      "changeSync", textInputMetrics, EventPriority::SynchronousBatched);
}

void TextInputEventEmitter::onContentSizeChange(
    TextInputMetrics const &textInputMetrics) const {
  dispatchTextInputContentSizeChangeEvent(
      "contentSizeChange", textInputMetrics);
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
    KeyPressMetrics const &keyPressMetrics) const {
  dispatchEvent(
      "keyPress",
      [keyPressMetrics](jsi::Runtime &runtime) {
        return keyPressMetricsPayload(runtime, keyPressMetrics);
      },
      EventPriority::AsynchronousBatched);
}

void TextInputEventEmitter::onKeyPressSync(
    KeyPressMetrics const &keyPressMetrics) const {
  dispatchEvent(
      "keyPressSync",
      [keyPressMetrics](jsi::Runtime &runtime) {
        return keyPressMetricsPayload(runtime, keyPressMetrics);
      },
      EventPriority::SynchronousBatched);
}

void TextInputEventEmitter::onScroll(
    TextInputMetrics const &textInputMetrics) const {
  dispatchTextInputEvent("scroll", textInputMetrics);
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

void TextInputEventEmitter::dispatchTextInputContentSizeChangeEvent(
    std::string const &name,
    TextInputMetrics const &textInputMetrics,
    EventPriority priority) const {
  dispatchEvent(
      name,
      [textInputMetrics](jsi::Runtime &runtime) {
        return textInputMetricsContentSizePayload(runtime, textInputMetrics);
      },
      priority);
}

} // namespace facebook::react
