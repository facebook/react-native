/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <string>

#include <jsi/jsi.h>
#include <react/renderer/core/EventPayload.h>
#include <react/renderer/core/EventTarget.h>
#include <react/renderer/core/ReactEventPriority.h>
#include <react/renderer/core/ValueFactory.h>

namespace facebook::react {

using EventPipe = std::function<void(
    jsi::Runtime& runtime,
    const EventTarget* eventTarget,
    const std::string& type,
    ReactEventPriority priority,
    const EventPayload& payload)>;

using EventPipeConclusion = std::function<void(jsi::Runtime& runtime)>;

} // namespace facebook::react
