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

class PickerEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  struct PickerIOSChangeEvent {
    std::string newValue;
    int newIndex;
  };

  void onChange(PickerIOSChangeEvent event) const;
};

} // namespace react
} // namespace facebook
