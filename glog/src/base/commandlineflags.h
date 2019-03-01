// Copyright (c) 2008, Google Inc.
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
// 
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

// ---
// This file is a compatibility layer that defines Google's version of
// command line flags that are used for configuration.
//
// We put flags into their own namespace.  It is purposefully
// named in an opaque way that people should have trouble typing
// directly.  The idea is that DEFINE puts the flag in the weird
// namespace, and DECLARE imports the flag from there into the
// current namespace.  The net result is to force people to use
// DECLARE to get access to a flag, rather than saying
//   extern bool FLAGS_logtostderr;
// or some such instead.  We want this so we can put extra
// functionality (like sanity-checking) in DECLARE if we want,
// and make sure it is picked up everywhere.
//
// We also put the type of the variable in the namespace, so that
// people can't DECLARE_int32 something that they DEFINE_bool'd
// elsewhere.
#ifndef BASE_COMMANDLINEFLAGS_H__
#define BASE_COMMANDLINEFLAGS_H__

#include "config.h"
#include <string>
#include <string.h>               // for memchr
#include <stdlib.h>               // for getenv

#ifdef HAVE_LIB_GFLAGS

#include <gflags/gflags.h>

#else

#include "glog/logging.h"

#define DECLARE_VARIABLE(type, shorttype, name, tn)                     \
  namespace fL##shorttype {                                             \
    extern GOOGLE_GLOG_DLL_DECL type FLAGS_##name;                      \
  }                                                                     \
  using fL##shorttype::FLAGS_##name
#define DEFINE_VARIABLE(type, shorttype, name, value, meaning, tn)      \
  namespace fL##shorttype {                                             \
    GOOGLE_GLOG_DLL_DECL type FLAGS_##name(value);                      \
    char FLAGS_no##name;                                                \
  }                                                                     \
  using fL##shorttype::FLAGS_##name

// bool specialization
#define DECLARE_bool(name) \
  DECLARE_VARIABLE(bool, B, name, bool)
#define DEFINE_bool(name, value, meaning) \
  DEFINE_VARIABLE(bool, B, name, value, meaning, bool)

// int32 specialization
#define DECLARE_int32(name) \
  DECLARE_VARIABLE(GOOGLE_NAMESPACE::int32, I, name, int32)
#define DEFINE_int32(name, value, meaning) \
  DEFINE_VARIABLE(GOOGLE_NAMESPACE::int32, I, name, value, meaning, int32)

// Special case for string, because we have to specify the namespace
// std::string, which doesn't play nicely with our FLAG__namespace hackery.
#define DECLARE_string(name)                                            \
  namespace fLS {                                                       \
    extern GOOGLE_GLOG_DLL_DECL std::string& FLAGS_##name;              \
  }                                                                     \
  using fLS::FLAGS_##name
#define DEFINE_string(name, value, meaning)                             \
  namespace fLS {                                                       \
    std::string FLAGS_##name##_buf(value);                              \
    GOOGLE_GLOG_DLL_DECL std::string& FLAGS_##name = FLAGS_##name##_buf; \
    char FLAGS_no##name;                                                \
  }                                                                     \
  using fLS::FLAGS_##name

#endif  // HAVE_LIB_GFLAGS

// Define GLOG_DEFINE_* using DEFINE_* . By using these macros, we
// have GLOG_* environ variables even if we have gflags installed.
//
// If both an environment variable and a flag are specified, the value
// specified by a flag wins. E.g., if GLOG_v=0 and --v=1, the
// verbosity will be 1, not 0.

#define GLOG_DEFINE_bool(name, value, meaning) \
  DEFINE_bool(name, EnvToBool("GLOG_" #name, value), meaning)

#define GLOG_DEFINE_int32(name, value, meaning) \
  DEFINE_int32(name, EnvToInt("GLOG_" #name, value), meaning)

#define GLOG_DEFINE_string(name, value, meaning) \
  DEFINE_string(name, EnvToString("GLOG_" #name, value), meaning)

// These macros (could be functions, but I don't want to bother with a .cc
// file), make it easier to initialize flags from the environment.

#define EnvToString(envname, dflt)   \
  (!getenv(envname) ? (dflt) : getenv(envname))

#define EnvToBool(envname, dflt)   \
  (!getenv(envname) ? (dflt) : memchr("tTyY1\0", getenv(envname)[0], 6) != NULL)

#define EnvToInt(envname, dflt)  \
  (!getenv(envname) ? (dflt) : strtol(getenv(envname), NULL, 10))

#endif  // BASE_COMMANDLINEFLAGS_H__
