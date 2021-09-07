/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "AndroidDialogPickerShadowNode.h"

#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace react {

using AndroidDialogPickerComponentDescriptor =
    ConcreteComponentDescriptor<AndroidDialogPickerShadowNode>;

} // namespace react
} // namespace facebook
