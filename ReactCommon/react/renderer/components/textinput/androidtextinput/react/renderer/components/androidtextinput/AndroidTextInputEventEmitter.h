/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/ViewEventEmitter.h>

namespace facebook {
namespace react {

struct AndroidTextInputOnBlurStruct {
  int target;
};

struct AndroidTextInputOnFocusStruct {
  int target;
};

struct AndroidTextInputOnChangeStruct {
  int target;
  int eventCount;
  std::string text;
};

struct AndroidTextInputOnChangeTextStruct {
  int target;
  int eventCount;
  std::string text;
};

struct AndroidTextInputOnContentSizeChangeContentSizeStruct {
  double width;
  double height;
};

struct AndroidTextInputOnContentSizeChangeStruct {
  int target;
  AndroidTextInputOnContentSizeChangeContentSizeStruct contentSize;
};

struct AndroidTextInputOnTextInputRangeStruct {
  double start;
  double end;
};

struct AndroidTextInputOnTextInputStruct {
  int target;
  std::string text;
  std::string previousText;
  AndroidTextInputOnTextInputRangeStruct range;
};

struct AndroidTextInputOnEndEditingStruct {
  int target;
  std::string text;
};

struct AndroidTextInputOnSelectionChangeSelectionStruct {
  double start;
  double end;
};

struct AndroidTextInputOnSelectionChangeStruct {
  int target;
  AndroidTextInputOnSelectionChangeSelectionStruct selection;
};

struct AndroidTextInputOnSubmitEditingStruct {
  int target;
  std::string text;
};

struct AndroidTextInputOnKeyPressStruct {
  int target;
  std::string key;
};

struct AndroidTextInputOnScrollContentInsetStruct {
  double top;
  double bottom;
  double left;
  double right;
};

struct AndroidTextInputOnScrollContentOffsetStruct {
  double x;
  double y;
};

struct AndroidTextInputOnScrollContentSizeStruct {
  double width;
  double height;
};

struct AndroidTextInputOnScrollLayoutMeasurementStruct {
  double width;
  double height;
};

struct AndroidTextInputOnScrollVelocityStruct {
  double x;
  double y;
};

struct AndroidTextInputOnScrollStruct {
  int target;
  bool responderIgnoreScroll;
  AndroidTextInputOnScrollContentInsetStruct contentInset;
  AndroidTextInputOnScrollContentOffsetStruct contentOffset;
  AndroidTextInputOnScrollContentSizeStruct contentSize;
  AndroidTextInputOnScrollLayoutMeasurementStruct layoutMeasurement;
  AndroidTextInputOnScrollVelocityStruct velocity;
};

class AndroidTextInputEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onBlur(AndroidTextInputOnBlurStruct value) const;

  void onFocus(AndroidTextInputOnFocusStruct value) const;

  void onChange(AndroidTextInputOnChangeStruct value) const;

  void onChangeText(AndroidTextInputOnChangeTextStruct value) const;

  void onContentSizeChange(
      AndroidTextInputOnContentSizeChangeStruct value) const;

  void onTextInput(AndroidTextInputOnTextInputStruct value) const;

  void onEndEditing(AndroidTextInputOnEndEditingStruct value) const;

  void onSelectionChange(AndroidTextInputOnSelectionChangeStruct value) const;

  void onSubmitEditing(AndroidTextInputOnSubmitEditingStruct value) const;

  void onKeyPress(AndroidTextInputOnKeyPressStruct value) const;

  void onScroll(AndroidTextInputOnScrollStruct value) const;
};

} // namespace react
} // namespace facebook
