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

#include <folly/portability/Sockets.h>
#include <sys/types.h>

#if !defined(FOLLY_ALLOW_TFO)
#if defined(__linux__) || defined(__APPLE__)
// only allow for linux right now
#define FOLLY_ALLOW_TFO 1
#endif
#endif

namespace folly {
namespace detail {

/**
 * tfo_sendto has the same semantics as sendmsg, but is used to
 * send with TFO data.
 */
ssize_t tfo_sendmsg(int sockfd, const struct msghdr* msg, int flags);

/**
 * Enable TFO on a listening socket.
 */
int tfo_enable(int sockfd, size_t max_queue_size);

/**
 * Check if TFO succeeded in being used.
 */
bool tfo_succeeded(int sockfd);
} // namespace detail
} // namespace folly
