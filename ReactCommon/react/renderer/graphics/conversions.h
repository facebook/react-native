/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/graphicsConversions.h>

#warning \
    "[DEPRECATION] graphics/conversions is deprecated because \
    it introduce a circular dependency between React-Fabric and React-graphics. \
    We will remove this from the next version of React Native. \
    Replace the `#include <react/renderer/graphics/conversions.h>` statements \
    with `#include <react/renderer/core/graphicsConversions.h>`"
