/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <stack>

#include "LayoutContext.h"

namespace facebook::yoga::vanillajni {

namespace {
std::stack<PtrJNodeMapVanilla*>& getContexts() {
  static thread_local std::stack<PtrJNodeMapVanilla*> contexts;
  return contexts;
}

} // namespace

LayoutContext::Provider::Provider(PtrJNodeMapVanilla* data) {
  getContexts().push(data);
}

LayoutContext::Provider::~Provider() {
  getContexts().pop();
}

/*static*/ PtrJNodeMapVanilla* LayoutContext::getNodeMap() {
  return getContexts().empty() ? nullptr : getContexts().top();
}

} // namespace facebook::yoga::vanillajni
