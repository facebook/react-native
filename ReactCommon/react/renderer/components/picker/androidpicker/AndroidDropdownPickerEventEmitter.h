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

struct AndroidDropdownPickerOnSelectStruct {
  int position;
};

class AndroidDropdownPickerEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onSelect(AndroidDropdownPickerOnSelectStruct value) const;
};

} // namespace react
} // namespace facebook
