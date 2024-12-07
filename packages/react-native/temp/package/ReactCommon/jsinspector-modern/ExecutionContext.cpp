/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ExecutionContext.h"

namespace facebook::react::jsinspector_modern {

namespace {

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunused-const-variable"
template <class>
inline constexpr bool always_false_v = false;
#pragma clang diagnostic pop

} // namespace

bool ExecutionContextSelector::matches(
    const ExecutionContextDescription& context) const noexcept {
  // Exhaustiveness checking based on the example in
  // https://en.cppreference.com/w/cpp/utility/variant/visit.
  return std::visit(
      [&context](auto&& arg) {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, AllContexts>) {
          return true;
        } else if constexpr (std::is_same_v<T, ContextId>) {
          return context.id == arg;
        } else if constexpr (std::is_same_v<T, ContextName>) {
          return context.name == arg;
        } else {
          static_assert(always_false_v<T>, "non-exhaustive visitor");
        }
      },
      value_);
}

ExecutionContextSelector ExecutionContextSelector::byId(int32_t id) {
  return ExecutionContextSelector{id};
}

ExecutionContextSelector ExecutionContextSelector::byName(std::string name) {
  return ExecutionContextSelector{std::move(name)};
}

ExecutionContextSelector ExecutionContextSelector::all() {
  return ExecutionContextSelector{AllContexts{}};
}

bool matchesAny(
    const ExecutionContextDescription& context,
    const ExecutionContextSelectorSet& selectors) {
  for (const auto& selector : selectors) {
    if (selector.matches(context)) {
      return true;
    }
  }
  return false;
}

} // namespace facebook::react::jsinspector_modern
