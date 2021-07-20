/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AndroidTextInputEventEmitter.h"

namespace facebook {
namespace react {

void AndroidTextInputEventEmitter::onBlur(
    AndroidTextInputOnBlurStruct event) const {
  dispatchEvent("blur", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "target", event.target);
    return payload;
  });
}
void AndroidTextInputEventEmitter::onFocus(
    AndroidTextInputOnFocusStruct event) const {
  dispatchEvent("focus", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "target", event.target);
    return payload;
  });
}
void AndroidTextInputEventEmitter::onChange(
    AndroidTextInputOnChangeStruct event) const {
  dispatchEvent("change", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "target", event.target);
    payload.setProperty(runtime, "eventCount", event.eventCount);
    payload.setProperty(runtime, "text", event.text);
    return payload;
  });
}
void AndroidTextInputEventEmitter::onChangeText(
    AndroidTextInputOnChangeTextStruct event) const {
  dispatchEvent(
      "changeText", [event = std::move(event)](jsi::Runtime &runtime) {
        auto payload = jsi::Object(runtime);
        payload.setProperty(runtime, "target", event.target);
        payload.setProperty(runtime, "eventCount", event.eventCount);
        payload.setProperty(runtime, "text", event.text);
        return payload;
      });
}
void AndroidTextInputEventEmitter::onContentSizeChange(
    AndroidTextInputOnContentSizeChangeStruct event) const {
  dispatchEvent(
      "contentSizeChange", [event = std::move(event)](jsi::Runtime &runtime) {
        auto payload = jsi::Object(runtime);
        payload.setProperty(runtime, "target", event.target);
        {
          auto contentSize = jsi::Object(runtime);
          contentSize.setProperty(runtime, "width", event.contentSize.width);
          contentSize.setProperty(runtime, "height", event.contentSize.height);

          payload.setProperty(runtime, "contentSize", contentSize);
        }
        return payload;
      });
}
void AndroidTextInputEventEmitter::onTextInput(
    AndroidTextInputOnTextInputStruct event) const {
  dispatchEvent("textInput", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "target", event.target);
    payload.setProperty(runtime, "text", event.text);
    payload.setProperty(runtime, "previousText", event.previousText);
    {
      auto range = jsi::Object(runtime);
      range.setProperty(runtime, "start", event.range.start);
      range.setProperty(runtime, "end", event.range.end);

      payload.setProperty(runtime, "range", range);
    }
    return payload;
  });
}
void AndroidTextInputEventEmitter::onEndEditing(
    AndroidTextInputOnEndEditingStruct event) const {
  dispatchEvent(
      "endEditing", [event = std::move(event)](jsi::Runtime &runtime) {
        auto payload = jsi::Object(runtime);
        payload.setProperty(runtime, "target", event.target);
        payload.setProperty(runtime, "text", event.text);
        return payload;
      });
}
void AndroidTextInputEventEmitter::onSelectionChange(
    AndroidTextInputOnSelectionChangeStruct event) const {
  dispatchEvent(
      "selectionChange", [event = std::move(event)](jsi::Runtime &runtime) {
        auto payload = jsi::Object(runtime);
        payload.setProperty(runtime, "target", event.target);
        {
          auto selection = jsi::Object(runtime);
          selection.setProperty(runtime, "start", event.selection.start);
          selection.setProperty(runtime, "end", event.selection.end);

          payload.setProperty(runtime, "selection", selection);
        }
        return payload;
      });
}
void AndroidTextInputEventEmitter::onSubmitEditing(
    AndroidTextInputOnSubmitEditingStruct event) const {
  dispatchEvent(
      "submitEditing", [event = std::move(event)](jsi::Runtime &runtime) {
        auto payload = jsi::Object(runtime);
        payload.setProperty(runtime, "target", event.target);
        payload.setProperty(runtime, "text", event.text);
        return payload;
      });
}
void AndroidTextInputEventEmitter::onKeyPress(
    AndroidTextInputOnKeyPressStruct event) const {
  dispatchEvent("keyPress", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "target", event.target);
    payload.setProperty(runtime, "key", event.key);
    return payload;
  });
}
void AndroidTextInputEventEmitter::onScroll(
    AndroidTextInputOnScrollStruct event) const {
  dispatchEvent("scroll", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "target", event.target);
    payload.setProperty(
        runtime, "responderIgnoreScroll", event.responderIgnoreScroll);
    {
      auto contentInset = jsi::Object(runtime);
      contentInset.setProperty(runtime, "top", event.contentInset.top);
      contentInset.setProperty(runtime, "bottom", event.contentInset.bottom);
      contentInset.setProperty(runtime, "left", event.contentInset.left);
      contentInset.setProperty(runtime, "right", event.contentInset.right);

      payload.setProperty(runtime, "contentInset", contentInset);
    }
    {
      auto contentOffset = jsi::Object(runtime);
      contentOffset.setProperty(runtime, "x", event.contentOffset.x);
      contentOffset.setProperty(runtime, "y", event.contentOffset.y);

      payload.setProperty(runtime, "contentOffset", contentOffset);
    }
    {
      auto contentSize = jsi::Object(runtime);
      contentSize.setProperty(runtime, "width", event.contentSize.width);
      contentSize.setProperty(runtime, "height", event.contentSize.height);

      payload.setProperty(runtime, "contentSize", contentSize);
    }
    {
      auto layoutMeasurement = jsi::Object(runtime);
      layoutMeasurement.setProperty(
          runtime, "width", event.layoutMeasurement.width);
      layoutMeasurement.setProperty(
          runtime, "height", event.layoutMeasurement.height);

      payload.setProperty(runtime, "layoutMeasurement", layoutMeasurement);
    }
    {
      auto velocity = jsi::Object(runtime);
      velocity.setProperty(runtime, "x", event.velocity.x);
      velocity.setProperty(runtime, "y", event.velocity.y);

      payload.setProperty(runtime, "velocity", velocity);
    }
    return payload;
  });
}

} // namespace react
} // namespace facebook
