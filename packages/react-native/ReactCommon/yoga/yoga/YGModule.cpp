/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YGModule.h"
#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include <Yoga.h>

namespace yoga {

YogaModule::YogaModule(std::shared_ptr<facebook::react::CallInvoker> jsInvoker)
    : facebook::react::NativeModule("YogaModule", jsInvoker) {}

std::string YogaModule::getName() {
    return "YogaModule";
}

void YogaModule::calculateLayout(float width, float height) {
    YGConfigRef config = YGConfigNew();
    YGNodeRef root = YGNodeNewWithConfig(config);

    // Set the layout properties
    YGNodeStyleSetWidth(root, width);
    YGNodeStyleSetHeight(root, height);

    // Perform the layout calculation
    YGNodeCalculateLayout(root, width, height, YGDirectionLTR);

    // Retrieve the layout results
    float x = YGNodeLayoutGetLeft(root);
    float y = YGNodeLayoutGetTop(root);

    // Output the result (for debugging purposes)
    printf("Yoga Layout: X=%f, Y=%f\n", x, y);

    // Clean up the Yoga node and config
    YGNodeFree(root);
    YGConfigFree(config);
}

// Wrapper to expose the calculateLayout function to JavaScript
void YogaModule::calculateLayoutWrapper(
    const facebook::react::CallInvoker& jsInvoker,
    float width,
    float height
) {
    YogaModule* module = new YogaModule(jsInvoker);
    module->calculateLayout(width, height);
}

} // namespace yoga
