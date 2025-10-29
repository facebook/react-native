/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Sealable.h"

#include <react/debug/flags.h>
#include <react/debug/react_native_assert.h>

namespace facebook::react {

/*
 * Note:
 * We must explicitly implement all *the rule of five* methods because:
 *   1. Using `std::atomic` behind `sealed_` implicitly deletes default
 *      constructors;
 *   2. We have to establish behaviour where any new cloned or moved instances
 *      of the object lose `sealed` flag.
 *
 * See more about the rule of three/five/zero:
 * http://en.cppreference.com/w/cpp/language/rule_of_three
 */

#ifdef REACT_NATIVE_DEBUG

Sealable::Sealable() : sealed_(false) {}

Sealable::Sealable(const Sealable& /*other*/) : sealed_(false) {};

Sealable::Sealable(Sealable&& other) noexcept : sealed_(false) {
  other.ensureUnsealed();
};

Sealable::~Sealable() noexcept = default;

Sealable& Sealable::operator=(const Sealable& /*other*/) {
  ensureUnsealed();
  return *this;
}

Sealable& Sealable::operator=(Sealable&& other) noexcept {
  ensureUnsealed();
  other.ensureUnsealed();
  return *this;
}

void Sealable::seal() const {
  sealed_ = true;
}

bool Sealable::getSealed() const {
  return sealed_;
}

void Sealable::ensureUnsealed() const {
  react_native_assert(!sealed_ && "Attempt to mutate a sealed object.");
}

#endif

} // namespace facebook::react
