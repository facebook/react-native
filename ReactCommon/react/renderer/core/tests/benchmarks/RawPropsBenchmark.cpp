/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <benchmark/benchmark.h>
#include <folly/dynamic.h>
#include <folly/json.h>
#include <react/renderer/components/view/ViewComponentDescriptor.h>
#include <react/renderer/core/EventDispatcher.h>
#include <react/renderer/core/RawProps.h>
#include <react/utils/ContextContainer.h>
#include <exception>
#include <string>

namespace facebook {
namespace react {

auto contextContainer = std::make_shared<ContextContainer const>();
auto eventDispatcher = std::shared_ptr<EventDispatcher>{nullptr};
auto viewComponentDescriptor = ViewComponentDescriptor{
    ComponentDescriptorParameters{eventDispatcher, contextContainer}};

auto emptyPropsDynamic = folly::parseJson("{}");
auto propsString = std::string{
    "{\"flex\": 1, \"padding\": 10, \"position\": \"absolute\", \"display\": \"none\", \"nativeID\": \"some-id\", \"direction\": \"rtl\"}"};
auto propsDynamic = folly::parseJson(propsString);
auto propsStringWithSomeUnsupportedProps = std::string{
    "{\"someName1\": 1, \"someName2\": 10, \"someName3\": \"absolute\", \"someName4\": \"none\", \"someName5\": \"some-id\", \"someName6\": \"rtl\"}"};
auto unsupportedPropsDynamic =
    folly::parseJson(propsStringWithSomeUnsupportedProps);

auto sourceProps = ViewProps{};
auto sharedSourceProps = ViewShadowNode::defaultSharedProps();

static void emptyPropCreation(benchmark::State &state) {
  for (auto _ : state) {
    ViewProps{};
  }
}
BENCHMARK(emptyPropCreation);

static void propParsingEmptyRawProps(benchmark::State &state) {
  for (auto _ : state) {
    viewComponentDescriptor.cloneProps(
        sharedSourceProps, RawProps{emptyPropsDynamic});
  }
}
BENCHMARK(propParsingEmptyRawProps);

static void propParsingRegularRawProps(benchmark::State &state) {
  for (auto _ : state) {
    viewComponentDescriptor.cloneProps(
        sharedSourceProps, RawProps{propsDynamic});
  }
}
BENCHMARK(propParsingRegularRawProps);

static void propParsingUnsupportedRawProps(benchmark::State &state) {
  for (auto _ : state) {
    viewComponentDescriptor.cloneProps(
        sharedSourceProps, RawProps{unsupportedPropsDynamic});
  }
}
BENCHMARK(propParsingUnsupportedRawProps);

static void propParsingRegularRawPropsWithNoSourceProps(
    benchmark::State &state) {
  for (auto _ : state) {
    viewComponentDescriptor.cloneProps(nullptr, RawProps{propsDynamic});
  }
}
BENCHMARK(propParsingRegularRawPropsWithNoSourceProps);

} // namespace react
} // namespace facebook

BENCHMARK_MAIN();
