/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeMethodCallInvokerHolder.h"

namespace facebook::react {

NativeMethodCallInvokerHolder::NativeMethodCallInvokerHolder(
    std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker)
    : _nativeMethodCallInvoker(nativeMethodCallInvoker) {}

std::shared_ptr<NativeMethodCallInvoker>
NativeMethodCallInvokerHolder::getNativeMethodCallInvoker() {
  return _nativeMethodCallInvoker;
}

void NativeMethodCallInvokerHolder::registerNatives() {}

} // namespace facebook::react
