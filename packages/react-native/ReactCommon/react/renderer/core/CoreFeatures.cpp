/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CoreFeatures.h"

namespace facebook {
namespace react {

bool CoreFeatures::enablePropIteratorSetter = false;
bool CoreFeatures::enableMapBuffer = false;
bool CoreFeatures::blockPaintForUseLayoutEffect = false;
bool CoreFeatures::useNativeState = false;
bool CoreFeatures::cacheNSTextStorage = false;
bool CoreFeatures::cacheLastTextMeasurement = false;
bool CoreFeatures::cancelImageDownloadsOnRecycle = false;

} // namespace react
} // namespace facebook
