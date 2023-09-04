/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/components/view/ViewEventEmitter.h>

namespace facebook::react {

class TextInputMetrics {
 public:
  std::string text;
  AttributedString::Range selectionRange;
  // ScrollView-like metrics
  Size contentSize;
  Point contentOffset;
  EdgeInsets contentInset;
  Size containerSize;
  int eventCount;
  Size layoutMeasurement;
  float zoomScale;
};

class KeyPressMetrics {
 public:
  std::string text;
  int eventCount;
};

class TextInputEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onFocus(const TextInputMetrics& textInputMetrics) const;
  void onBlur(const TextInputMetrics& textInputMetrics) const;
  void onChange(const TextInputMetrics& textInputMetrics) const;
  void onChangeSync(const TextInputMetrics& textInputMetrics) const;
  void onContentSizeChange(const TextInputMetrics& textInputMetrics) const;
  void onSelectionChange(const TextInputMetrics& textInputMetrics) const;
  void onEndEditing(const TextInputMetrics& textInputMetrics) const;
  void onSubmitEditing(const TextInputMetrics& textInputMetrics) const;
  void onKeyPress(const KeyPressMetrics& keyPressMetrics) const;
  void onKeyPressSync(const KeyPressMetrics& keyPressMetrics) const;
  void onScroll(const TextInputMetrics& textInputMetrics) const;

 private:
  void dispatchTextInputEvent(
      const std::string& name,
      const TextInputMetrics& textInputMetrics,
      EventPriority priority = EventPriority::AsynchronousBatched) const;

  void dispatchTextInputContentSizeChangeEvent(
      const std::string& name,
      const TextInputMetrics& textInputMetrics,
      EventPriority priority = EventPriority::AsynchronousBatched) const;
};

} // namespace facebook::react
