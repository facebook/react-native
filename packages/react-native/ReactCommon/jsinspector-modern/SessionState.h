/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <string_view>
#include <unordered_set>

namespace facebook::react::jsinspector_modern {

struct SessionState {
 public:
  // TODO: Generalise this to arbitrary domains
  bool isLogDomainEnabled{false};
  bool isRuntimeDomainEnabled{false};

  /**
   * The set of bindings registered during this session using @cdp
   * Runtime.addBinding. Even though bindings get added to the global scope as
   * functions that can outlive a session, they are treated as session state,
   * matching Chrome's behaviour (a binding not added by the current session
   * will not emit events on it).
   */
  std::unordered_set<std::string> subscribedBindingNames;

  // Here, we will eventually allow RuntimeAgents to store their own arbitrary
  // state (e.g. some sort of K/V storage of folly::dynamic?)

  // TODO: Figure out a good model for restricting write access / preventing
  // agents from unintentionally clobbering each other's state.
};

} // namespace facebook::react::jsinspector_modern
