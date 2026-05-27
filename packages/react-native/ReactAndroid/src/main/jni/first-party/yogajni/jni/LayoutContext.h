/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>
#include "YGJTypesVanilla.h"

namespace facebook::yoga::vanillajni {

// TODO: This should not be exported or used outside of the JNI bindings
class YG_EXPORT LayoutContext {
 public:
  // Sets a context on the current thread for the duration of the Provider's
  // lifetime. This context should be set during the layout process to allow
  // layout callbacks to access context-data specific to the layout pass.
  struct Provider {
    explicit Provider(PtrJNodeMapVanilla* data);
    ~Provider();
  };

  static PtrJNodeMapVanilla* getNodeMap();
};

} // namespace facebook::yoga::vanillajni
