/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "AndroidDialogPickerEventEmitter.h"
#include "AndroidDialogPickerProps.h"

#include <react/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

extern const char AndroidDialogPickerComponentName[];

/*
 * `ShadowNode` for <AndroidDialogPicker> component.
 */
using AndroidDialogPickerShadowNode = ConcreteViewShadowNode<
    AndroidDialogPickerComponentName,
    AndroidDialogPickerProps,
    AndroidDialogPickerEventEmitter>;

} // namespace react
} // namespace facebook
