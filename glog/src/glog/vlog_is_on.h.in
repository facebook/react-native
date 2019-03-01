// Copyright (c) 1999, 2007, Google Inc.
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
//
// Author: Ray Sidney and many others
//
// Defines the VLOG_IS_ON macro that controls the variable-verbosity
// conditional logging.
//
// It's used by VLOG and VLOG_IF in logging.h
// and by RAW_VLOG in raw_logging.h to trigger the logging.
//
// It can also be used directly e.g. like this:
//   if (VLOG_IS_ON(2)) {
//     // do some logging preparation and logging
//     // that can't be accomplished e.g. via just VLOG(2) << ...;
//   }
//
// The truth value that VLOG_IS_ON(level) returns is determined by 
// the three verbosity level flags:
//   --v=<n>  Gives the default maximal active V-logging level;
//            0 is the default.
//            Normally positive values are used for V-logging levels.
//   --vmodule=<str>  Gives the per-module maximal V-logging levels to override
//                    the value given by --v.
//                    E.g. "my_module=2,foo*=3" would change the logging level
//                    for all code in source files "my_module.*" and "foo*.*"
//                    ("-inl" suffixes are also disregarded for this matching).
//
// SetVLOGLevel helper function is provided to do limited dynamic control over
// V-logging by overriding the per-module settings given via --vmodule flag.
//
// CAVEAT: --vmodule functionality is not available in non gcc compilers.
//

#ifndef BASE_VLOG_IS_ON_H_
#define BASE_VLOG_IS_ON_H_

#include "glog/log_severity.h"

// Annoying stuff for windows -- makes sure clients can import these functions
#ifndef GOOGLE_GLOG_DLL_DECL
# if defined(_WIN32) && !defined(__CYGWIN__)
#   define GOOGLE_GLOG_DLL_DECL  __declspec(dllimport)
# else
#   define GOOGLE_GLOG_DLL_DECL
# endif
#endif

#if defined(__GNUC__)
// We emit an anonymous static int* variable at every VLOG_IS_ON(n) site.
// (Normally) the first time every VLOG_IS_ON(n) site is hit,
// we determine what variable will dynamically control logging at this site:
// it's either FLAGS_v or an appropriate internal variable
// matching the current source file that represents results of
// parsing of --vmodule flag and/or SetVLOGLevel calls.
#define VLOG_IS_ON(verboselevel)                                \
  __extension__  \
  ({ static @ac_google_namespace@::int32* vlocal__ = &@ac_google_namespace@::kLogSiteUninitialized;           \
     @ac_google_namespace@::int32 verbose_level__ = (verboselevel);                    \
     (*vlocal__ >= verbose_level__) &&                          \
     ((vlocal__ != &@ac_google_namespace@::kLogSiteUninitialized) ||                   \
      (@ac_google_namespace@::InitVLOG3__(&vlocal__, &FLAGS_v,                         \
                   __FILE__, verbose_level__))); })
#else
// GNU extensions not available, so we do not support --vmodule.
// Dynamic value of FLAGS_v always controls the logging level.
#define VLOG_IS_ON(verboselevel) (FLAGS_v >= (verboselevel))
#endif

// Set VLOG(_IS_ON) level for module_pattern to log_level.
// This lets us dynamically control what is normally set by the --vmodule flag.
// Returns the level that previously applied to module_pattern.
// NOTE: To change the log level for VLOG(_IS_ON) sites
//	 that have already executed after/during InitGoogleLogging,
//	 one needs to supply the exact --vmodule pattern that applied to them.
//       (If no --vmodule pattern applied to them
//       the value of FLAGS_v will continue to control them.)
extern GOOGLE_GLOG_DLL_DECL int SetVLOGLevel(const char* module_pattern,
                                             int log_level);

// Various declarations needed for VLOG_IS_ON above: =========================

// Special value used to indicate that a VLOG_IS_ON site has not been
// initialized.  We make this a large value, so the common-case check
// of "*vlocal__ >= verbose_level__" in VLOG_IS_ON definition
// passes in such cases and InitVLOG3__ is then triggered.
extern @ac_google_namespace@::int32 kLogSiteUninitialized;

// Helper routine which determines the logging info for a particalur VLOG site.
//   site_flag     is the address of the site-local pointer to the controlling
//                 verbosity level
//   site_default  is the default to use for *site_flag
//   fname         is the current source file name
//   verbose_level is the argument to VLOG_IS_ON
// We will return the return value for VLOG_IS_ON
// and if possible set *site_flag appropriately.
extern GOOGLE_GLOG_DLL_DECL bool InitVLOG3__(
    @ac_google_namespace@::int32** site_flag,
    @ac_google_namespace@::int32* site_default,
    const char* fname,
    @ac_google_namespace@::int32 verbose_level);

#endif  // BASE_VLOG_IS_ON_H_
