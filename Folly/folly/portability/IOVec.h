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

// This file only exists because without it there would be
// a circular dependency between SysUio.h, Sockets.h, and Unistd.h
#ifndef _WIN32
#include <limits.h>
#include <sys/uio.h>
#else
#include <stdlib.h>

#define UIO_MAXIOV 16
#define IOV_MAX UIO_MAXIOV

struct iovec {
  void* iov_base;
  size_t iov_len;
};
#endif
