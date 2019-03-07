
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <react/components/view/ViewEventEmitter.h>

namespace facebook {
namespace react {

class ActivityIndicatorViewEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  
};
struct SwitchOnChangeStruct {
  bool value;
};

class SwitchEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onChange(SwitchOnChangeStruct value) const;
};
struct SliderOnChangeStruct {
  Float value;
bool fromUser;
};

struct SliderOnSlidingCompleteStruct {
  Float value;
bool fromUser;
};

struct SliderOnValueChangeStruct {
  Float value;
bool fromUser;
};

class SliderEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onChange(SliderOnChangeStruct value) const;

void onSlidingComplete(SliderOnSlidingCompleteStruct value) const;

void onValueChange(SliderOnValueChangeStruct value) const;
};

} // namespace react
} // namespace facebook
