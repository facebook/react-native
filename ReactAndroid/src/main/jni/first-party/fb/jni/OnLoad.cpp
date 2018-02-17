/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <jni/Countable.h>
#include <fb/Environment.h>
#include <fb/fbjni.h>
#include <fb/fbjni/NativeRunnable.h>

using namespace facebook::jni;

void initialize_fbjni() {
  CountableOnLoad(Environment::current());
  HybridDataOnLoad();
  JNativeRunnable::OnLoad();
  ThreadScope::OnLoad();
}
