/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string_view>

namespace facebook::react::jsinspector_modern {

struct SessionState {
 public:
  // TODO: Generalise this to arbitrary domains
  bool isLogDomainEnabled;
  bool isRuntimeDomainEnabled;

  // Here, we will eventually allow RuntimeAgents to store their own arbitrary
  // state (e.g. some sort of K/V storage of folly::dynamic?)

  // TODO: Figure out a good model for restricting write access / preventing
  // agents from unintentionally clobbering each other's state.
};

} // namespace facebook::react::jsinspector_modern
