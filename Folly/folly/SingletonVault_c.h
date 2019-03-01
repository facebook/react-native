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

// Plain C interface to SingletonVault. This facilitates combining programs
// that cannot use C++ (e.g. programs written in C) with libraries that use
// Singleton, by allowing the program to perform the required SingletonVault
// lifecycle calls.

#pragma once

#ifdef __cplusplus
extern "C" {
#endif

typedef void SingletonVault_t;

SingletonVault_t *SingletonVault_singleton();
void SingletonVault_registrationComplete(SingletonVault_t *vault);
void SingletonVault_destroyInstances(SingletonVault_t *vault);
void SingletonVault_reenableInstances(SingletonVault_t *vault);

#ifdef __cplusplus
} // extern "C"
#endif
