/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextInputEventEmitter.h"

namespace facebook::react {

static jsi::Value textInputMetricsPayload(
    jsi::Runtime& runtime,
    const TextInputMetrics& textInputMetrics) {
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

static jsi::Value textInputMetricsScrollPayload(
    jsi::Runtime& runtime,
    const TextInputMetrics& textInputMetrics) {
  auto payload = jsi::Object(runtime);

  {
    auto contentOffset = jsi::Object(runtime);
    contentOffset.setProperty(runtime, "x", textInputMetrics.contentOffset.x);
    contentOffset.setProperty(runtime, "y", textInputMetrics.contentOffset.y);
    payload.setProperty(runtime, "contentOffset", contentOffset);
  }

  {
    auto contentInset = jsi::Object(runtime);
    contentInset.setProperty(runtime, "top", textInputMetrics.contentInset.top);
    contentInset.setProperty(
        runtime, "left", textInputMetrics.contentInset.left);
    contentInset.setProperty(
        runtime, "bottom", textInputMetrics.contentInset.bottom);
    contentInset.setProperty(
        runtime, "right", textInputMetrics.contentInset.right);
    payload.setProperty(runtime, "contentInset", contentInset);
  }

  {
    auto contentSize = jsi::Object(runtime);
    contentSize.setProperty(
        runtime, "width", textInputMetrics.contentSize.width);
    contentSize.setProperty(
        runtime, "height", textInputMetrics.contentSize.height);
    payload.setProperty(runtime, "contentSize", contentSize);
  }

  {
    auto layoutMeasurement = jsi::Object(runtime);
    layoutMeasurement.setProperty(
        runtime, "width", textInputMetrics.layoutMeasurement.width);
    layoutMeasurement.setProperty(
        runtime, "height", textInputMetrics.layoutMeasurement.height);
    payload.setProperty(runtime, "layoutMeasurement", layoutMeasurement);
  }

  payload.setProperty(
      runtime,
      "zoomScale",
      textInputMetrics.zoomScale ? textInputMetrics.zoomScale : 1);

  return payload;
};

static jsi::Value textInputMetricsContentSizePayload(
    jsi::Runtime& runtime,
    const TextInputMetrics& textInputMetrics) {
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
    jsi::Runtime& runtime,
    const KeyPressMetrics& keyPressMetrics) {
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
    const TextInputMetrics& textInputMetrics) const {
  dispatchTextInputEvent("focus", textInputMetrics);
}

void TextInputEventEmitter::onBlur(
    const TextInputMetrics& textInputMetrics) const {
  dispatchTextInputEvent("blur", textInputMetrics);
}

void TextInputEventEmitter::onChange(
    const TextInputMetrics& textInputMetrics) const {
  dispatchTextInputEvent("change", textInputMetrics);
}

void TextInputEventEmitter::onChangeSync(
    const TextInputMetrics& textInputMetrics) const {
  dispatchTextInputEvent(
      "changeSync", textInputMetrics, EventPriority::SynchronousBatched);
}

void TextInputEventEmitter::onContentSizeChange(
    const TextInputMetrics& textInputMetrics) const {
  dispatchTextInputContentSizeChangeEvent(
      "contentSizeChange", textInputMetrics);
}

void TextInputEventEmitter::onSelectionChange(
    const TextInputMetrics& textInputMetrics) const {
  dispatchTextInputEvent("selectionChange", textInputMetrics);
}

void TextInputEventEmitter::onEndEditing(
    const TextInputMetrics& textInputMetrics) const {
  dispatchTextInputEvent("endEditing", textInputMetrics);
}

void TextInputEventEmitter::onSubmitEditing(
    const TextInputMetrics& textInputMetrics) const {
  dispatchTextInputEvent("submitEditing", textInputMetrics);
}

void TextInputEventEmitter::onKeyPress(
    const KeyPressMetrics& keyPressMetrics) const {
  dispatchEvent(
      "keyPress",
      [keyPressMetrics](jsi::Runtime& runtime) {
        return keyPressMetricsPayload(runtime, keyPressMetrics);
      },
      EventPriority::AsynchronousBatched);
}

void TextInputEventEmitter::onKeyPressSync(
    const KeyPressMetrics& keyPressMetrics) const {
  dispatchEvent(
      "keyPressSync",
      [keyPressMetrics](jsi::Runtime& runtime) {
        return keyPressMetricsPayload(runtime, keyPressMetrics);
      },
      EventPriority::SynchronousBatched);
}

void TextInputEventEmitter::onScroll(
    const TextInputMetrics& textInputMetrics) const {
  dispatchEvent("scroll", [textInputMetrics](jsi::Runtime& runtime) {
    return textInputMetricsScrollPayload(runtime, textInputMetrics);
  });
}

void TextInputEventEmitter::dispatchTextInputEvent(
    const std::string& name,
    const TextInputMetrics& textInputMetrics,
    EventPriority priority) const {
  dispatchEvent(
      name,
      [textInputMetrics](jsi::Runtime& runtime) {
        return textInputMetricsPayload(runtime, textInputMetrics);
      },
      priority);
}

void TextInputEventEmitter::dispatchTextInputContentSizeChangeEvent(
    const std::string& name,
    const TextInputMetrics& textInputMetrics,
    EventPriority priority) const {
  dispatchEvent(
      name,
      [textInputMetrics](jsi::Runtime& runtime) {
        return textInputMetricsContentSizePayload(runtime, textInputMetrics);
      },
      priority);
}

} // namespace facebook::react
