/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/cxxreact/NativeModule.h>
#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include <Yoga.h>

namespace yoga {

class YogaModule : public facebook::react::NativeModule {
public:
    YogaModule(std::shared_ptr<facebook::react::CallInvoker> jsInvoker);

    std::string getName() override;

    // Exposed to JavaScript
    void calculateLayout(float width, float height);

    static void calculateLayoutWrapper(
        const facebook::react::CallInvoker& jsInvoker,
        float width,
        float height
    );
};

} // namespace yoga
