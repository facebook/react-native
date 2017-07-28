/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "InspectorInterfaces.h"

namespace facebook {
namespace react {

// pure destructors in C++ are odd. You would think they don't want an
// implementation, but in fact the linker requires one. Define them to be
// empty so that people don't count on them for any particular behaviour.
IDestructible::~IDestructible() { }
ILocalConnection::~ILocalConnection() { }
IRemoteConnection::~IRemoteConnection() { }

}
}
