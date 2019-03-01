/*
 * Copyright 2017 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <folly/SingletonVault_c.h>
#include <folly/Singleton.h>

extern "C" {

SingletonVault_t *SingletonVault_singleton() {
  return folly::SingletonVault::singleton();
}

void SingletonVault_registrationComplete(SingletonVault_t *vault) {
  ((folly::SingletonVault*) vault)->registrationComplete();
}

void SingletonVault_destroyInstances(SingletonVault_t *vault) {
  ((folly::SingletonVault*) vault)->destroyInstances();
}

void SingletonVault_reenableInstances(SingletonVault_t *vault) {
  ((folly::SingletonVault*) vault)->reenableInstances();
}

} // extern "C"
