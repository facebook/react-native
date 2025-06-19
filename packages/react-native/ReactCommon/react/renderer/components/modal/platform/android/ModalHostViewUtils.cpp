/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/components/modal/ModalHostViewUtils.h>
#include <react/renderer/graphics/Size.h>
#include "JReactModalHostView.h"

namespace facebook::react {

Size ModalHostViewScreenSize() {
  return JReactModalHostView::getDisplayMetrics();
}

} // namespace facebook::react
