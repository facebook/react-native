/*
 * Copyright 2012-present Facebook, Inc.
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

#pragma once

// A clone of the relevant parts of unwind-cxx.h from libstdc++
// The layout of these structures is defined by the ABI.

#include <exception>
#include <typeinfo>

#include <unwind.h>

namespace __cxxabiv1 {

struct __cxa_exception {
  std::type_info* exceptionType;
  void (*exceptionDestructor)(void*);
  std::unexpected_handler unexpectedHandler;
  std::terminate_handler terminateHandler;
  __cxa_exception* nextException;

  int handlerCount;
  int handlerSwitchValue;
  const char* actionRecord;
  const char* languageSpecificData;
  void* catchTemp;
  void* adjustedPtr;

  _Unwind_Exception unwindHeader;
};

struct __cxa_eh_globals {
  __cxa_exception* caughtExceptions;
  unsigned int uncaughtExceptions;
};

extern "C" {
__cxa_eh_globals* __cxa_get_globals(void) noexcept;
__cxa_eh_globals* __cxa_get_globals_fast(void) noexcept;
}

} // namespace __cxxabiv1
