/*
 * Copyright 2016-present Facebook, Inc.
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

#include <sys/types.h>

#ifdef _WIN32
#include <basetsd.h> // @manual

#define HAVE_MODE_T 1

// This is a massive pain to have be an `int` due to the pthread implementation
// we support, but it's far more compatible with the rest of the windows world
// as an `int` than it would be as a `void*`
using pid_t = int;
// This isn't actually supposed to be defined here, but it's the most
// appropriate place without defining a portability header for stdint.h
// with just this single typedef.
using ssize_t = SSIZE_T;
// The Windows headers don't define this anywhere, nor do any of the libs
// that Folly depends on, so define it here.
using mode_t = unsigned short;
#endif
