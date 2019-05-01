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

#ifndef _WIN32
#include <netdb.h>
#include <poll.h>

#include <arpa/inet.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <sys/socket.h>
#include <sys/un.h>

#ifdef MSG_ERRQUEUE
#define FOLLY_HAVE_MSG_ERRQUEUE 1
/* for struct sock_extended_err*/
#include <linux/errqueue.h>
#endif

#ifndef SO_EE_ORIGIN_ZEROCOPY
#define SO_EE_ORIGIN_ZEROCOPY 5
#endif

#ifndef SO_EE_CODE_ZEROCOPY_COPIED
#define SO_EE_CODE_ZEROCOPY_COPIED 1
#endif

#ifndef SO_ZEROCOPY
#define SO_ZEROCOPY 60
#endif

#ifndef MSG_ZEROCOPY
#define MSG_ZEROCOPY 0x4000000
#endif

#ifndef SOL_UDP
#define SOL_UDP 17
#endif

#ifndef ETH_MAX_MTU
#define ETH_MAX_MTU 0xFFFFU
#endif

#ifndef UDP_SEGMENT
#define UDP_SEGMENT 103
#endif

#ifndef UDP_MAX_SEGMENTS
#define UDP_MAX_SEGMENTS (1 << 6UL)
#endif

#else
#include <folly/portability/IOVec.h>
#include <folly/portability/SysTypes.h>
#include <folly/portability/Windows.h>

#include <WS2tcpip.h> // @manual

using nfds_t = int;
using sa_family_t = ADDRESS_FAMILY;

// these are not supported
#define SO_EE_ORIGIN_ZEROCOPY 0
#define SO_ZEROCOPY 0
#define MSG_ZEROCOPY 0x0
#define SOL_UDP 0x0
#define UDP_SEGMENT 0x0

// We don't actually support either of these flags
// currently.
#define MSG_DONTWAIT 0x1000
#define MSG_EOR 0
struct msghdr {
  void* msg_name;
  socklen_t msg_namelen;
  struct iovec* msg_iov;
  size_t msg_iovlen;
  void* msg_control;
  size_t msg_controllen;
  int msg_flags;
};

struct sockaddr_un {
  sa_family_t sun_family;
  char sun_path[108];
};

#define SHUT_RD SD_RECEIVE
#define SHUT_WR SD_SEND
#define SHUT_RDWR SD_BOTH

// These are the same, but PF_LOCAL
// isn't defined by WinSock.
#define AF_LOCAL PF_UNIX
#define PF_LOCAL PF_UNIX

// This isn't defined by Windows, and we need to
// distinguish it from SO_REUSEADDR
#define SO_REUSEPORT 0x7001

// Someone thought it would be a good idea
// to define a field via a macro...
#undef s_host
#endif

namespace folly {
namespace portability {
namespace sockets {
#ifndef _WIN32
using ::accept;
using ::bind;
using ::connect;
using ::getpeername;
using ::getsockname;
using ::getsockopt;
using ::inet_ntop;
using ::listen;
using ::poll;
using ::recv;
using ::recvfrom;
using ::send;
using ::sendmsg;
using ::sendto;
using ::setsockopt;
using ::shutdown;
using ::socket;
#else
// Some Windows specific helper functions.
bool is_fh_socket(int fh);
SOCKET fd_to_socket(int fd);
int socket_to_fd(SOCKET s);
int translate_wsa_error(int wsaErr);

// These aren't additional overloads, but rather other functions that
// are referenced that we need to wrap, or, in the case of inet_aton,
// implement.
int accept(int s, struct sockaddr* addr, socklen_t* addrlen);
int inet_aton(const char* cp, struct in_addr* inp);
int socketpair(int domain, int type, int protocol, int sv[2]);

// Unless you have a case where you would normally have
// to reference the function as being explicitly in the
// global scope, then you shouldn't be calling these directly.
int bind(int s, const struct sockaddr* name, socklen_t namelen);
int connect(int s, const struct sockaddr* name, socklen_t namelen);
int getpeername(int s, struct sockaddr* name, socklen_t* namelen);
int getsockname(int s, struct sockaddr* name, socklen_t* namelen);
int getsockopt(int s, int level, int optname, void* optval, socklen_t* optlen);
const char* inet_ntop(int af, const void* src, char* dst, socklen_t size);
int listen(int s, int backlog);
int poll(struct pollfd fds[], nfds_t nfds, int timeout);
ssize_t recv(int s, void* buf, size_t len, int flags);
ssize_t recvfrom(
    int s,
    void* buf,
    size_t len,
    int flags,
    struct sockaddr* from,
    socklen_t* fromlen);
ssize_t send(int s, const void* buf, size_t len, int flags);
ssize_t sendto(
    int s,
    const void* buf,
    size_t len,
    int flags,
    const sockaddr* to,
    socklen_t tolen);
ssize_t sendmsg(int socket, const struct msghdr* message, int flags);
int setsockopt(
    int s,
    int level,
    int optname,
    const void* optval,
    socklen_t optlen);
int shutdown(int s, int how);

// This is the only function that _must_ be referenced via the namespace
// because there is no difference in parameter types to overload
// on.
int socket(int af, int type, int protocol);

// Windows needs a few extra overloads of some of the functions in order to
// resolve to our portability functions rather than the SOCKET accepting
// ones.
int getsockopt(int s, int level, int optname, char* optval, socklen_t* optlen);
ssize_t recv(int s, char* buf, int len, int flags);
ssize_t recv(int s, void* buf, int len, int flags);
ssize_t recvfrom(
    int s,
    char* buf,
    int len,
    int flags,
    struct sockaddr* from,
    socklen_t* fromlen);
ssize_t recvfrom(
    int s,
    void* buf,
    int len,
    int flags,
    struct sockaddr* from,
    socklen_t* fromlen);
ssize_t recvmsg(int s, struct msghdr* message, int fl);
ssize_t send(int s, const char* buf, int len, int flags);
ssize_t send(int s, const void* buf, int len, int flags);
ssize_t sendto(
    int s,
    const char* buf,
    int len,
    int flags,
    const sockaddr* to,
    socklen_t tolen);
ssize_t sendto(
    int s,
    const void* buf,
    int len,
    int flags,
    const sockaddr* to,
    socklen_t tolen);
int setsockopt(
    int s,
    int level,
    int optname,
    const char* optval,
    socklen_t optlen);
#endif
} // namespace sockets
} // namespace portability
} // namespace folly

#ifdef _WIN32
// Add our helpers to the overload set.
/* using override */
using namespace folly::portability::sockets;
#endif
