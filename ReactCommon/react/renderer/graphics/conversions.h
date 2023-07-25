/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/graphicsConversions.h>

// This file belongs to the React-graphics module.
// This file also used to have a reference to two files that are located in the
// react/renderer/core folder. That folder belongs to a module that is called
// React-Fabric.
// The React-Fabric module declares an explicit dependency on
// React-graphics. Including those files in a React-graphics' file created a
// circular dependency because React-Fabric was explicitly depending on
// React-graphics, which was implicitly depending on React-Fabric. We break that
// dependency by moving the old `graphics/conversions.h` file to the
// React-Fabric module and renaming it `core/graphicsConversions.h`.

#warning \
    "[DEPRECATION] `graphics/conversions.h` is deprecated and will be removed in the future. \
    If this warning appears due to a library, please open an issue in that library, and ask for an update. \
    Please, replace the `#include <react/renderer/graphics/conversions.h>` statements \
    with `#include <react/renderer/core/graphicsConversions.h>`."
