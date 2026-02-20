/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {
struct FlexDirection {}
} // namespace test

namespace facebook {

namespace yoga {

using test::FlexDirection;

struct Node {};

FloatOptional boundAxisWithinMinAndMax(
    const yoga::Node node,
    const Direction direction,
    const FlexDirection axis,
    const FloatOptional value,
    const float axisSize,
    const float widthSize);

FlexLine calculateFlexLine(
    yoga::Node node,
    Direction ownerDirection,
    float ownerWidth,
    float mainAxisOwnerSize,
    float availableInnerWidth,
    float availableInnerMainDim,
    Node::LayoutableChildren::Iterator &iterator,
    size_t lineCount);

struct Test {
  void test(std::function<void(Node node)> f);
  typedef void (*FnPtr)(FlexDirection node);
};

} // namespace yoga

} // namespace facebook
