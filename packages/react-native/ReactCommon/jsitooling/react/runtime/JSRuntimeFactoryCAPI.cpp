/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JSRuntimeFactoryCAPI.h"
#include "JSRuntimeFactory.h"

void js_runtime_factory_destroy(JSRuntimeFactoryRef factory) {
  if (factory) {
    delete static_cast<facebook::react::JSRuntimeFactory*>(factory);
  }
}
