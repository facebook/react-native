/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/ShadowNode.h>
#include <cstdint>
#include <optional>
#include <string>
#include <tuple>
#include <vector>

namespace facebook::react::dom {

ShadowNode::Shared getParentNode(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

std::optional<std::vector<ShadowNode::Shared>> getChildNodes(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

bool isConnected(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

uint_fast16_t compareDocumentPosition(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode,
    const ShadowNode& otherShadowNode);

std::string getTextContent(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

std::optional<std::tuple<
    /* x: */ double,
    /* y: */ double,
    /* width: */ double,
    /* height: */
    double>>
getBoundingClientRect(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode,
    bool includeTransform);

std::optional<std::tuple<
    /* offsetParent: */ ShadowNode::Shared,
    /* top: */ double,
    /* left: */
    double>>
getOffset(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

std::optional<std::tuple</* scrollLeft: */ double, /* scrollTop: */ double>>
getScrollPosition(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

std::optional<std::tuple</* scrollWidth: */ int, /* scrollHeight */ int>>
getScrollSize(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

std::optional<std::tuple</* width: */ int, /* height: */ int>> getInnerSize(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

std::optional<std::tuple<
    /* topWidth: */ int,
    /* rightWidth: */ int,
    /* bottomWidth: */ int,
    /* leftWidth: */
    int>>
getBorderSize(
    const RootShadowNode::Shared& currentRevision,
    const ShadowNode& shadowNode);

std::string getTagName(const ShadowNode& shadowNode);

} // namespace facebook::react::dom
