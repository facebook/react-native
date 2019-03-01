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

#pragma once

// Only do anything if we are on windows.
#ifdef _WIN32
// This header is intended to be used in-place of including <Windows.h>,
// <WinSock2.h>, <io.h> or <direct.h>.
// It includes all of them, and undefines certain names defined by them that
// are used in places in Folly.
//
// These have to be this way because we define our own versions
// of close(), because the normal Windows versions don't handle
// sockets at all.
#ifndef __STDC__
/* nolint */
#define __STDC__ 1
#include <io.h> // nolint
#include <direct.h> // nolint
#undef __STDC__
#else
#include <io.h> // nolint
#include <direct.h> // nolint
#endif

#include <WinSock2.h>
#include <Windows.h>

#ifdef CAL_GREGORIAN
#undef CAL_GREGORIAN
#endif

// Defined in winnt.h
#ifdef DELETE
#undef DELETE
#endif

// Defined in the GDI interface.
#ifdef ERROR
#undef ERROR
#endif

// Defined in minwindef.h
#ifdef IN
#undef IN
#endif

// Defined in winerror.h
#ifdef NO_ERROR
#undef NO_ERROR
#endif

// Defined in minwindef.h
#ifdef OUT
#undef OUT
#endif

// Defined in minwindef.h
#ifdef STRICT
#undef STRICT
#endif

// Defined in Winbase.h
#ifdef Yield
#undef Yield
#endif

#endif
