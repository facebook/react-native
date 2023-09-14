/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CoreFeatures.h"

namespace facebook::react {

bool CoreFeatures::enablePropIteratorSetter = false;
bool CoreFeatures::blockPaintForUseLayoutEffect = false;
bool CoreFeatures::useNativeState = false;
bool CoreFeatures::cacheLastTextMeasurement = false;
bool CoreFeatures::cancelImageDownloadsOnRecycle = false;
bool CoreFeatures::enableGranularScrollViewStateUpdatesIOS = false;
bool CoreFeatures::enableMountHooks = false;
bool CoreFeatures::doNotSwapLeftAndRightOnAndroidInLTR = false;
bool CoreFeatures::enableCleanParagraphYogaNode = false;
bool CoreFeatures::disableScrollEventThrottleRequirement = false;
bool CoreFeatures::enableGranularShadowTreeStateReconciliation = false;
bool CoreFeatures::enableDefaultAsyncBatchedPriority = false;
bool CoreFeatures::enableClonelessStateProgression = false;
bool CoreFeatures::excludeYogaFromRawProps = false;

} // namespace facebook::react
