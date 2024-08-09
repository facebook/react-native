/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CoreFeatures.h"

namespace facebook::react {

bool CoreFeatures::enablePropIteratorSetter = false;
bool CoreFeatures::cacheLastTextMeasurement = false;
bool CoreFeatures::enableGranularScrollViewStateUpdatesIOS = false;
bool CoreFeatures::enableMountHooks = false;
bool CoreFeatures::enableGranularShadowTreeStateReconciliation = false;
bool CoreFeatures::enableClonelessStateProgression = false;
bool CoreFeatures::excludeYogaFromRawProps = false;
bool CoreFeatures::enableReportEventPaintTime = false;

} // namespace facebook::react
