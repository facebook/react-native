/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/text/ParagraphShadowNode.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/dom/DOM.h>
#include <vector>

namespace facebook::react::dom {

std::vector<DOMRect> getClientRectsForTextNode(
    const ParagraphShadowNode &paragraphNode,
    const LayoutMetrics &paragraphLayoutMetrics,
    Tag targetTag,
    SurfaceId surfaceId);

} // namespace facebook::react::dom
