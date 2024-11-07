/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ModalHostViewShadowNode.h"

#include <react/renderer/components/modal/ModalHostViewShadowNode.h>
#include <react/renderer/core/LayoutContext.h>

namespace facebook::react {

extern const char ModalHostViewComponentName[] = "ModalHostView";

void ModalHostViewShadowNode::setScreenSize(float width, float height) {
    ensureUnsealed();

    setStateData(ModalHostViewState{
        Size{
            .width =  width,
            .height =  height
        }
    });
}

} // namespace facebook::react

