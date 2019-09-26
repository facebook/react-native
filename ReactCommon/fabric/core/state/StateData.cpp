/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "StateData.h"

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace facebook {
namespace react {

#ifdef ANDROID
StateData::~StateData() {
  // This needs to be here or the linker will complain:
  // https://gcc.gnu.org/wiki/VerboseDiagnostics#missing_vtable
}
const folly::dynamic StateData::getDynamic() const {
  assert(false); // TODO: get rid of this?
  return folly::dynamic::object();
}

#endif

} // namespace react
} // namespace facebook
