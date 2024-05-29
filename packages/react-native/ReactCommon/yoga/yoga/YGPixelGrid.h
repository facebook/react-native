/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <stdbool.h>

#include <yoga/YGConfig.h>
#include <yoga/YGEnums.h>
#include <yoga/YGMacros.h>

YG_EXTERN_C_BEGIN

/**
 * Rounds a point value to the nearest whole pixel, given a pointScaleFactor
 * describing pixel density.
 * @returns the rounded value in points
 */
YG_EXPORT float YGRoundValueToPixelGrid(
    double value,
    double pointScaleFactor,
    bool forceCeil,
    bool forceFloor);

YG_EXTERN_C_END
