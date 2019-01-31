/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "YGMarker.h"
#include "YGConfig.h"

void YGConfigSetMarkerCallbacks(
    YGConfigRef config,
    YGMarkerCallbacks markerCallbacks) {
  config->markerCallbacks = markerCallbacks;
}
