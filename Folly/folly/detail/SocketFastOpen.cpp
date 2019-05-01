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

#include <folly/detail/SocketFastOpen.h>

#include <folly/portability/Sockets.h>

#include <cerrno>
#include <cstdio>

namespace folly {
namespace detail {

#if FOLLY_ALLOW_TFO && defined(__linux__)

// Sometimes these flags are not present in the headers,
// so define them if not present.
#if !defined(MSG_FASTOPEN)
#define MSG_FASTOPEN 0x20000000
#endif

#if !defined(TCP_FASTOPEN)
#define TCP_FASTOPEN 23
#endif

#if !defined(TCPI_OPT_SYN_DATA)
#define TCPI_OPT_SYN_DATA 32
#endif

ssize_t tfo_sendmsg(int sockfd, const struct msghdr* msg, int flags) {
  flags |= MSG_FASTOPEN;
  return sendmsg(sockfd, msg, flags);
}

int tfo_enable(int sockfd, size_t max_queue_size) {
  return setsockopt(
      sockfd, SOL_TCP, TCP_FASTOPEN, &max_queue_size, sizeof(max_queue_size));
}

bool tfo_succeeded(int sockfd) {
  // Call getsockopt to check if TFO was used.
  struct tcp_info info;
  socklen_t info_len = sizeof(info);
  errno = 0;
  if (getsockopt(sockfd, IPPROTO_TCP, TCP_INFO, &info, &info_len) != 0) {
    // errno is set from getsockopt
    return false;
  }
  return info.tcpi_options & TCPI_OPT_SYN_DATA;
}

#elif FOLLY_ALLOW_TFO && defined(__APPLE__)

ssize_t tfo_sendmsg(int sockfd, const struct msghdr* msg, int flags) {
  sa_endpoints_t endpoints;
  endpoints.sae_srcif = 0;
  endpoints.sae_srcaddr = nullptr;
  endpoints.sae_srcaddrlen = 0;
  endpoints.sae_dstaddr = (struct sockaddr*)msg->msg_name;
  endpoints.sae_dstaddrlen = msg->msg_namelen;
  int ret = connectx(
      sockfd,
      &endpoints,
      SAE_ASSOCID_ANY,
      CONNECT_RESUME_ON_READ_WRITE | CONNECT_DATA_IDEMPOTENT,
      nullptr,
      0,
      nullptr,
      nullptr);

  if (ret != 0) {
    return ret;
  }
  ret = sendmsg(sockfd, msg, flags);
  return ret;
}

int tfo_enable(int sockfd, size_t max_queue_size) {
  return setsockopt(
      sockfd,
      IPPROTO_TCP,
      TCP_FASTOPEN,
      &max_queue_size,
      sizeof(max_queue_size));
}

bool tfo_succeeded(int /* sockfd */) {
  errno = EOPNOTSUPP;
  return false;
}

#else

ssize_t
tfo_sendmsg(int /* sockfd */, const struct msghdr* /* msg */, int /* flags */) {
  errno = EOPNOTSUPP;
  return -1;
}

int tfo_enable(int /* sockfd */, size_t /* max_queue_size */) {
  errno = ENOPROTOOPT;
  return -1;
}

bool tfo_succeeded(int /* sockfd */) {
  errno = EOPNOTSUPP;
  return false;
}

#endif
} // namespace detail
} // namespace folly
