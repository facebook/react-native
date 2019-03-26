/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
#pragma once

#include <fabric/components/view/ViewEventEmitter.h>

namespace facebook {
namespace react {

class SwitchEventEmitter:
  public ViewEventEmitter {

public:

  using ViewEventEmitter::ViewEventEmitter;

  void onChange(const bool &value) const;
};

} // namespace react
} // namespace facebook
