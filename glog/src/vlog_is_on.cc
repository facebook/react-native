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
// Broken out from logging.cc by Soren Lassen
// logging_unittest.cc covers the functionality herein

#include "utilities.h"

#include <string.h>
#include <stdlib.h>
#include <errno.h>
#include <cstdio>
#include <string>
#include "base/commandlineflags.h"
#include "glog/logging.h"
#include "glog/raw_logging.h"
#include "base/googleinit.h"

// glog doesn't have annotation
#define ANNOTATE_BENIGN_RACE(address, description)

using std::string;

GLOG_DEFINE_int32(v, 0, "Show all VLOG(m) messages for m <= this."
" Overridable by --vmodule.");

GLOG_DEFINE_string(vmodule, "", "per-module verbose level."
" Argument is a comma-separated list of <module name>=<log level>."
" <module name> is a glob pattern, matched against the filename base"
" (that is, name ignoring .cc/.h./-inl.h)."
" <log level> overrides any value given by --v.");

_START_GOOGLE_NAMESPACE_

namespace glog_internal_namespace_ {

// Implementation of fnmatch that does not need 0-termination
// of arguments and does not allocate any memory,
// but we only support "*" and "?" wildcards, not the "[...]" patterns.
// It's not a static function for the unittest.
GOOGLE_GLOG_DLL_DECL bool SafeFNMatch_(const char* pattern,
                                       size_t patt_len,
                                       const char* str,
                                       size_t str_len) {
  size_t p = 0;
  size_t s = 0;
  while (1) {
    if (p == patt_len  &&  s == str_len) return true;
    if (p == patt_len) return false;
    if (s == str_len) return p+1 == patt_len  &&  pattern[p] == '*';
    if (pattern[p] == str[s]  ||  pattern[p] == '?') {
      p += 1;
      s += 1;
      continue;
    }
    if (pattern[p] == '*') {
      if (p+1 == patt_len) return true;
      do {
        if (SafeFNMatch_(pattern+(p+1), patt_len-(p+1), str+s, str_len-s)) {
          return true;
        }
        s += 1;
      } while (s != str_len);
      return false;
    }
    return false;
  }
}

}  // namespace glog_internal_namespace_

using glog_internal_namespace_::SafeFNMatch_;

int32 kLogSiteUninitialized = 1000;

// List of per-module log levels from FLAGS_vmodule.
// Once created each element is never deleted/modified
// except for the vlog_level: other threads will read VModuleInfo blobs
// w/o locks and we'll store pointers to vlog_level at VLOG locations
// that will never go away.
// We can't use an STL struct here as we wouldn't know
// when it's safe to delete/update it: other threads need to use it w/o locks.
struct VModuleInfo {
  string module_pattern;
  mutable int32 vlog_level;  // Conceptually this is an AtomicWord, but it's
                             // too much work to use AtomicWord type here
                             // w/o much actual benefit.
  const VModuleInfo* next;
};

// This protects the following global variables.
static Mutex vmodule_lock;
// Pointer to head of the VModuleInfo list.
// It's a map from module pattern to logging level for those module(s).
static VModuleInfo* vmodule_list = 0;
// Boolean initialization flag.
static bool inited_vmodule = false;

// L >= vmodule_lock.
static void VLOG2Initializer() {
  vmodule_lock.AssertHeld();
  // Can now parse --vmodule flag and initialize mapping of module-specific
  // logging levels.
  inited_vmodule = false;
  const char* vmodule = FLAGS_vmodule.c_str();
  const char* sep;
  VModuleInfo* head = NULL;
  VModuleInfo* tail = NULL;
  while ((sep = strchr(vmodule, '=')) != NULL) {
    string pattern(vmodule, sep - vmodule);
    int module_level;
    if (sscanf(sep, "=%d", &module_level) == 1) {
      VModuleInfo* info = new VModuleInfo;
      info->module_pattern = pattern;
      info->vlog_level = module_level;
      if (head)  tail->next = info;
      else  head = info;
      tail = info;
    }
    // Skip past this entry
    vmodule = strchr(sep, ',');
    if (vmodule == NULL) break;
    vmodule++;  // Skip past ","
  }
  if (head) {  // Put them into the list at the head:
    tail->next = vmodule_list;
    vmodule_list = head;
  }
  inited_vmodule = true;
}

// This can be called very early, so we use SpinLock and RAW_VLOG here.
int SetVLOGLevel(const char* module_pattern, int log_level) {
  int result = FLAGS_v;
  int const pattern_len = strlen(module_pattern);
  bool found = false;
  {
    MutexLock l(&vmodule_lock);  // protect whole read-modify-write
    for (const VModuleInfo* info = vmodule_list;
         info != NULL; info = info->next) {
      if (info->module_pattern == module_pattern) {
        if (!found) {
          result = info->vlog_level;
          found = true;
        }
        info->vlog_level = log_level;
      } else if (!found  &&
                 SafeFNMatch_(info->module_pattern.c_str(),
                              info->module_pattern.size(),
                              module_pattern, pattern_len)) {
        result = info->vlog_level;
        found = true;
      }
    }
    if (!found) {
      VModuleInfo* info = new VModuleInfo;
      info->module_pattern = module_pattern;
      info->vlog_level = log_level;
      info->next = vmodule_list;
      vmodule_list = info;
    }
  }
  RAW_VLOG(1, "Set VLOG level for \"%s\" to %d", module_pattern, log_level);
  return result;
}

// NOTE: Individual VLOG statements cache the integer log level pointers.
// NOTE: This function must not allocate memory or require any locks.
bool InitVLOG3__(int32** site_flag, int32* site_default,
                 const char* fname, int32 verbose_level) {
  MutexLock l(&vmodule_lock);
  bool read_vmodule_flag = inited_vmodule;
  if (!read_vmodule_flag) {
    VLOG2Initializer();
  }

  // protect the errno global in case someone writes:
  // VLOG(..) << "The last error was " << strerror(errno)
  int old_errno = errno;

  // site_default normally points to FLAGS_v
  int32* site_flag_value = site_default;

  // Get basename for file
  const char* base = strrchr(fname, '/');
  base = base ? (base+1) : fname;
  const char* base_end = strchr(base, '.');
  size_t base_length = base_end ? size_t(base_end - base) : strlen(base);

  // Trim out trailing "-inl" if any
  if (base_length >= 4 && (memcmp(base+base_length-4, "-inl", 4) == 0)) {
    base_length -= 4;
  }

  // TODO: Trim out _unittest suffix?  Perhaps it is better to have
  // the extra control and just leave it there.

  // find target in vector of modules, replace site_flag_value with
  // a module-specific verbose level, if any.
  for (const VModuleInfo* info = vmodule_list;
       info != NULL; info = info->next) {
    if (SafeFNMatch_(info->module_pattern.c_str(), info->module_pattern.size(),
                     base, base_length)) {
      site_flag_value = &info->vlog_level;
        // value at info->vlog_level is now what controls
        // the VLOG at the caller site forever
      break;
    }
  }

  // Cache the vlog value pointer if --vmodule flag has been parsed.
  ANNOTATE_BENIGN_RACE(site_flag,
                       "*site_flag may be written by several threads,"
                       " but the value will be the same");
  if (read_vmodule_flag) *site_flag = site_flag_value;

  // restore the errno in case something recoverable went wrong during
  // the initialization of the VLOG mechanism (see above note "protect the..")
  errno = old_errno;
  return *site_flag_value >= verbose_level;
}

_END_GOOGLE_NAMESPACE_
