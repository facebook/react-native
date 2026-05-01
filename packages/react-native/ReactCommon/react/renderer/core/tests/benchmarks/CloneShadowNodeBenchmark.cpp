/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <benchmark/benchmark.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/core/EventDispatcher.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

using ShadowNodeList = std::vector<std::shared_ptr<const ShadowNode>>;
using SharedShadowNodeList = std::shared_ptr<const ShadowNodeList>;

static auto makeViewComponentDescriptor() {
  auto contextContainer = std::make_shared<const ContextContainer>();
  auto eventDispatcher = std::shared_ptr<EventDispatcher>{nullptr};
  return ViewComponentDescriptor{ComponentDescriptorParameters{
      .eventDispatcher = eventDispatcher,
      .contextContainer = contextContainer,
      .flavor = nullptr}};
}

static auto createViewShadowNode(
    ViewComponentDescriptor& descriptor,
    Tag tag,
    SurfaceId surfaceId,
    const ShadowNodeList& children = {}) {
  auto family = descriptor.createFamily(
      ShadowNodeFamilyFragment{
          .tag = tag,
          .surfaceId = surfaceId,
          .instanceHandle = nullptr,
      });

  SharedShadowNodeList childrenPtr = children.empty()
      ? ShadowNode::emptySharedShadowNodeSharedList()
      : std::make_shared<const ShadowNodeList>(children);

  return descriptor.createShadowNode(
      ShadowNodeFragment{
          .props = ViewShadowNode::defaultSharedProps(),
          .children = childrenPtr,
      },
      family);
} // NOLINT(clang-analyzer-cplusplus.NewDeleteLeaks)

static void cloneShadowNodeNoChanges(benchmark::State& state) {
  auto descriptor = makeViewComponentDescriptor();
  auto node = createViewShadowNode(descriptor, 1, 1);

  for ([[maybe_unused]] auto _ : state) {
    auto cloned = descriptor.cloneShadowNode(*node, ShadowNodeFragment{});
    benchmark::DoNotOptimize(cloned);
  }
}
BENCHMARK(cloneShadowNodeNoChanges);

static void cloneShadowNodeWithNewProps(benchmark::State& state) {
  auto descriptor = makeViewComponentDescriptor();
  auto node = createViewShadowNode(descriptor, 1, 1);
  auto newProps = std::make_shared<const ViewShadowNodeProps>();

  for ([[maybe_unused]] auto _ : state) {
    auto cloned = descriptor.cloneShadowNode(
        *node,
        ShadowNodeFragment{
            .props = newProps,
        });
    benchmark::DoNotOptimize(cloned);
  }
}
BENCHMARK(cloneShadowNodeWithNewProps);

static void cloneShadowNodeWithChildren(benchmark::State& state) {
  auto descriptor = makeViewComponentDescriptor();

  ShadowNodeList children;
  for (int i = 0; i < 10; ++i) {
    children.push_back(createViewShadowNode(descriptor, 100 + i, 1));
  }
  auto parent = createViewShadowNode(descriptor, 1, 1, children);

  for ([[maybe_unused]] auto _ : state) {
    auto cloned = descriptor.cloneShadowNode(*parent, ShadowNodeFragment{});
    benchmark::DoNotOptimize(cloned);
  }
}
BENCHMARK(cloneShadowNodeWithChildren);

static void cloneShadowNodeWithNewChildren(benchmark::State& state) {
  auto descriptor = makeViewComponentDescriptor();

  ShadowNodeList children;
  for (int i = 0; i < 10; ++i) {
    children.push_back(createViewShadowNode(descriptor, 100 + i, 1));
  }
  auto parent = createViewShadowNode(descriptor, 1, 1, children);

  ShadowNodeList newChildren;
  for (int i = 0; i < 10; ++i) {
    newChildren.push_back(createViewShadowNode(descriptor, 200 + i, 1));
  }
  auto newChildrenPtr = std::make_shared<const ShadowNodeList>(newChildren);

  for ([[maybe_unused]] auto _ : state) {
    auto cloned = descriptor.cloneShadowNode(
        *parent,
        ShadowNodeFragment{
            .children = newChildrenPtr,
        });
    benchmark::DoNotOptimize(cloned);
  }
}
BENCHMARK(cloneShadowNodeWithNewChildren);

static void cloneShadowNodeDeepHierarchy(benchmark::State& state) {
  auto descriptor = makeViewComponentDescriptor();

  std::shared_ptr<ShadowNode> deepest = createViewShadowNode(descriptor, 50, 1);
  for (int i = 49; i >= 1; --i) {
    ShadowNodeList singleChild = {deepest};
    deepest = createViewShadowNode(descriptor, i, 1, singleChild);
  }

  for ([[maybe_unused]] auto _ : state) {
    auto cloned = descriptor.cloneShadowNode(*deepest, ShadowNodeFragment{});
    benchmark::DoNotOptimize(cloned);
  }
}
BENCHMARK(cloneShadowNodeDeepHierarchy);

} // namespace facebook::react

BENCHMARK_MAIN();
