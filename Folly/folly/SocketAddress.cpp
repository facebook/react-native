/*
 * Copyright 2014-present Facebook, Inc.
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

#ifndef __STDC_FORMAT_MACROS
#define __STDC_FORMAT_MACROS
#endif

#include <folly/SocketAddress.h>

#include <cerrno>
#include <cstdio>
#include <cstring>
#include <sstream>
#include <string>
#include <system_error>

#include <boost/functional/hash.hpp>

#include <folly/CppAttributes.h>
#include <folly/Exception.h>
#include <folly/Format.h>
#include <folly/hash/Hash.h>

namespace {

/**
 * A structure to free a struct addrinfo when it goes out of scope.
 */
struct ScopedAddrInfo {
  explicit ScopedAddrInfo(struct addrinfo* addrinfo) : info(addrinfo) {}
  ~ScopedAddrInfo() {
    freeaddrinfo(info);
  }

  struct addrinfo* info;
};

/**
 * A simple data structure for parsing a host-and-port string.
 *
 * Accepts a string of the form "<host>:<port>" or just "<port>",
 * and contains two string pointers to the host and the port portion of the
 * string.
 *
 * The HostAndPort may contain pointers into the original string.  It is
 * responsible for the user to ensure that the input string is valid for the
 * lifetime of the HostAndPort structure.
 */
struct HostAndPort {
  HostAndPort(const char* str, bool hostRequired)
      : host(nullptr), port(nullptr), allocated(nullptr) {
    // Look for the last colon
    const char* colon = strrchr(str, ':');
    if (colon == nullptr) {
      // No colon, just a port number.
      if (hostRequired) {
        throw std::invalid_argument(
            "expected a host and port string of the "
            "form \"<host>:<port>\"");
      }
      port = str;
      return;
    }

    // We have to make a copy of the string so we can modify it
    // and change the colon to a NUL terminator.
    allocated = strdup(str);
    if (!allocated) {
      throw std::bad_alloc();
    }

    char* allocatedColon = allocated + (colon - str);
    *allocatedColon = '\0';
    host = allocated;
    port = allocatedColon + 1;
    // bracketed IPv6 address, remove the brackets
    // allocatedColon[-1] is fine, as allocatedColon >= host and
    // *allocatedColon != *host therefore allocatedColon > host
    if (*host == '[' && allocatedColon[-1] == ']') {
      allocatedColon[-1] = '\0';
      ++host;
    }
  }

  ~HostAndPort() {
    free(allocated);
  }

  const char* host;
  const char* port;
  char* allocated;
};

} // namespace

namespace folly {

bool SocketAddress::isPrivateAddress() const {
  auto family = getFamily();
  if (family == AF_INET || family == AF_INET6) {
    return storage_.addr.isPrivate() ||
        (storage_.addr.isV6() && storage_.addr.asV6().isLinkLocal());
  } else if (external_) {
    // Unix addresses are always local to a host.  Return true,
    // since this conforms to the semantics of returning true for IP loopback
    // addresses.
    return true;
  }
  return false;
}

bool SocketAddress::isLoopbackAddress() const {
  auto family = getFamily();
  if (family == AF_INET || family == AF_INET6) {
    return storage_.addr.isLoopback();
  } else if (external_) {
    // Return true for UNIX addresses, since they are always local to a host.
    return true;
  }
  return false;
}

void SocketAddress::setFromHostPort(const char* host, uint16_t port) {
  ScopedAddrInfo results(getAddrInfo(host, port, 0));
  setFromAddrInfo(results.info);
}

void SocketAddress::setFromIpPort(const char* ip, uint16_t port) {
  ScopedAddrInfo results(getAddrInfo(ip, port, AI_NUMERICHOST));
  setFromAddrInfo(results.info);
}

void SocketAddress::setFromIpAddrPort(const IPAddress& ipAddr, uint16_t port) {
  if (external_) {
    storage_.un.free();
    external_ = false;
  }
  storage_.addr = ipAddr;
  port_ = port;
}

void SocketAddress::setFromLocalPort(uint16_t port) {
  ScopedAddrInfo results(getAddrInfo(nullptr, port, AI_ADDRCONFIG));
  setFromLocalAddr(results.info);
}

void SocketAddress::setFromLocalPort(const char* port) {
  ScopedAddrInfo results(getAddrInfo(nullptr, port, AI_ADDRCONFIG));
  setFromLocalAddr(results.info);
}

void SocketAddress::setFromLocalIpPort(const char* addressAndPort) {
  HostAndPort hp(addressAndPort, false);
  ScopedAddrInfo results(
      getAddrInfo(hp.host, hp.port, AI_NUMERICHOST | AI_ADDRCONFIG));
  setFromLocalAddr(results.info);
}

void SocketAddress::setFromIpPort(const char* addressAndPort) {
  HostAndPort hp(addressAndPort, true);
  ScopedAddrInfo results(getAddrInfo(hp.host, hp.port, AI_NUMERICHOST));
  setFromAddrInfo(results.info);
}

void SocketAddress::setFromHostPort(const char* hostAndPort) {
  HostAndPort hp(hostAndPort, true);
  ScopedAddrInfo results(getAddrInfo(hp.host, hp.port, 0));
  setFromAddrInfo(results.info);
}

int SocketAddress::getPortFrom(const struct sockaddr* address) {
  switch (address->sa_family) {
    case AF_INET:
      return ntohs(((sockaddr_in*)address)->sin_port);

    case AF_INET6:
      return ntohs(((sockaddr_in6*)address)->sin6_port);

    default:
      return -1;
  }
}

const char* SocketAddress::getFamilyNameFrom(
    const struct sockaddr* address,
    const char* defaultResult) {
#define GETFAMILYNAMEFROM_IMPL(Family) \
  case Family:                         \
    return #Family

  switch (address->sa_family) {
    GETFAMILYNAMEFROM_IMPL(AF_INET);
    GETFAMILYNAMEFROM_IMPL(AF_INET6);
    GETFAMILYNAMEFROM_IMPL(AF_UNIX);
    GETFAMILYNAMEFROM_IMPL(AF_UNSPEC);

    default:
      return defaultResult;
  }

#undef GETFAMILYNAMEFROM_IMPL
}

void SocketAddress::setFromPath(StringPiece path) {
  // Before we touch storage_, check to see if the length is too big.
  // Note that "storage_.un.addr->sun_path" may not be safe to evaluate here,
  // but sizeof() just uses its type, and does't evaluate it.
  if (path.size() > sizeof(storage_.un.addr->sun_path)) {
    throw std::invalid_argument(
        "socket path too large to fit into sockaddr_un");
  }

  if (!external_) {
    storage_.un.init();
    external_ = true;
  }

  size_t len = path.size();
  storage_.un.len = socklen_t(offsetof(struct sockaddr_un, sun_path) + len);
  memcpy(storage_.un.addr->sun_path, path.data(), len);
  // If there is room, put a terminating NUL byte in sun_path.  In general the
  // path should be NUL terminated, although getsockname() and getpeername()
  // may return Unix socket addresses with paths that fit exactly in sun_path
  // with no terminating NUL.
  if (len < sizeof(storage_.un.addr->sun_path)) {
    storage_.un.addr->sun_path[len] = '\0';
  }
}

void SocketAddress::setFromPeerAddress(int socket) {
  setFromSocket(socket, getpeername);
}

void SocketAddress::setFromLocalAddress(int socket) {
  setFromSocket(socket, getsockname);
}

void SocketAddress::setFromSockaddr(const struct sockaddr* address) {
  uint16_t port;

  if (address->sa_family == AF_INET) {
    port = ntohs(((sockaddr_in*)address)->sin_port);
  } else if (address->sa_family == AF_INET6) {
    port = ntohs(((sockaddr_in6*)address)->sin6_port);
  } else if (address->sa_family == AF_UNIX) {
    // We need an explicitly specified length for AF_UNIX addresses,
    // to be able to distinguish anonymous addresses from addresses
    // in Linux's abstract namespace.
    throw std::invalid_argument(
        "SocketAddress::setFromSockaddr(): the address "
        "length must be explicitly specified when "
        "setting AF_UNIX addresses");
  } else {
    throw std::invalid_argument(
        "SocketAddress::setFromSockaddr() called "
        "with unsupported address type");
  }

  setFromIpAddrPort(folly::IPAddress(address), port);
}

void SocketAddress::setFromSockaddr(
    const struct sockaddr* address,
    socklen_t addrlen) {
  // Check the length to make sure we can access address->sa_family
  if (addrlen <
      (offsetof(struct sockaddr, sa_family) + sizeof(address->sa_family))) {
    throw std::invalid_argument(
        "SocketAddress::setFromSockaddr() called "
        "with length too short for a sockaddr");
  }

  if (address->sa_family == AF_INET) {
    if (addrlen < sizeof(struct sockaddr_in)) {
      throw std::invalid_argument(
          "SocketAddress::setFromSockaddr() called "
          "with length too short for a sockaddr_in");
    }
    setFromSockaddr(reinterpret_cast<const struct sockaddr_in*>(address));
  } else if (address->sa_family == AF_INET6) {
    if (addrlen < sizeof(struct sockaddr_in6)) {
      throw std::invalid_argument(
          "SocketAddress::setFromSockaddr() called "
          "with length too short for a sockaddr_in6");
    }
    setFromSockaddr(reinterpret_cast<const struct sockaddr_in6*>(address));
  } else if (address->sa_family == AF_UNIX) {
    setFromSockaddr(
        reinterpret_cast<const struct sockaddr_un*>(address), addrlen);
  } else {
    throw std::invalid_argument(
        "SocketAddress::setFromSockaddr() called "
        "with unsupported address type");
  }
}

void SocketAddress::setFromSockaddr(const struct sockaddr_in* address) {
  assert(address->sin_family == AF_INET);
  setFromSockaddr((sockaddr*)address);
}

void SocketAddress::setFromSockaddr(const struct sockaddr_in6* address) {
  assert(address->sin6_family == AF_INET6);
  setFromSockaddr((sockaddr*)address);
}

void SocketAddress::setFromSockaddr(
    const struct sockaddr_un* address,
    socklen_t addrlen) {
  assert(address->sun_family == AF_UNIX);
  if (addrlen > sizeof(struct sockaddr_un)) {
    throw std::invalid_argument(
        "SocketAddress::setFromSockaddr() called "
        "with length too long for a sockaddr_un");
  }

  if (!external_) {
    storage_.un.init();
  }
  external_ = true;
  memcpy(storage_.un.addr, address, size_t(addrlen));
  updateUnixAddressLength(addrlen);

  // Fill the rest with 0s, just for safety
  if (addrlen < sizeof(struct sockaddr_un)) {
    char* p = reinterpret_cast<char*>(storage_.un.addr);
    memset(p + addrlen, 0, sizeof(struct sockaddr_un) - addrlen);
  }
}

const folly::IPAddress& SocketAddress::getIPAddress() const {
  auto family = getFamily();
  if (family != AF_INET && family != AF_INET6) {
    throw InvalidAddressFamilyException(family);
  }
  return storage_.addr;
}

socklen_t SocketAddress::getActualSize() const {
  if (external_) {
    return storage_.un.len;
  }
  switch (getFamily()) {
    case AF_UNSPEC:
    case AF_INET:
      return sizeof(struct sockaddr_in);
    case AF_INET6:
      return sizeof(struct sockaddr_in6);
    default:
      throw std::invalid_argument(
          "SocketAddress::getActualSize() called "
          "with unrecognized address family");
  }
}

std::string SocketAddress::getFullyQualified() const {
  if (!isFamilyInet()) {
    throw std::invalid_argument("Can't get address str for non ip address");
  }
  return storage_.addr.toFullyQualified();
}

std::string SocketAddress::getAddressStr() const {
  if (!isFamilyInet()) {
    throw std::invalid_argument("Can't get address str for non ip address");
  }
  return storage_.addr.str();
}

bool SocketAddress::isFamilyInet() const {
  auto family = getFamily();
  return family == AF_INET || family == AF_INET6;
}

void SocketAddress::getAddressStr(char* buf, size_t buflen) const {
  auto ret = getAddressStr();
  size_t len = std::min(buflen - 1, ret.size());
  memcpy(buf, ret.data(), len);
  buf[len] = '\0';
}

uint16_t SocketAddress::getPort() const {
  switch (getFamily()) {
    case AF_INET:
    case AF_INET6:
      return port_;
    default:
      throw std::invalid_argument(
          "SocketAddress::getPort() called on non-IP "
          "address");
  }
}

void SocketAddress::setPort(uint16_t port) {
  switch (getFamily()) {
    case AF_INET:
    case AF_INET6:
      port_ = port;
      return;
    default:
      throw std::invalid_argument(
          "SocketAddress::setPort() called on non-IP "
          "address");
  }
}

void SocketAddress::convertToIPv4() {
  if (!tryConvertToIPv4()) {
    throw std::invalid_argument(
        "convertToIPv4() called on an addresse that is "
        "not an IPv4-mapped address");
  }
}

bool SocketAddress::tryConvertToIPv4() {
  if (!isIPv4Mapped()) {
    return false;
  }

  storage_.addr = folly::IPAddress::createIPv4(storage_.addr);
  return true;
}

bool SocketAddress::mapToIPv6() {
  if (getFamily() != AF_INET) {
    return false;
  }

  storage_.addr = folly::IPAddress::createIPv6(storage_.addr);
  return true;
}

std::string SocketAddress::getHostStr() const {
  return getIpString(0);
}

std::string SocketAddress::getPath() const {
  if (!external_) {
    throw std::invalid_argument(
        "SocketAddress: attempting to get path "
        "for a non-Unix address");
  }

  if (storage_.un.pathLength() == 0) {
    // anonymous address
    return std::string();
  }
  if (storage_.un.addr->sun_path[0] == '\0') {
    // abstract namespace
    return std::string(
        storage_.un.addr->sun_path, size_t(storage_.un.pathLength()));
  }

  return std::string(
      storage_.un.addr->sun_path,
      strnlen(storage_.un.addr->sun_path, size_t(storage_.un.pathLength())));
}

std::string SocketAddress::describe() const {
  if (external_) {
    if (storage_.un.pathLength() == 0) {
      return "<anonymous unix address>";
    }

    if (storage_.un.addr->sun_path[0] == '\0') {
      // Linux supports an abstract namespace for unix socket addresses
      return "<abstract unix address>";
    }

    return std::string(
        storage_.un.addr->sun_path,
        strnlen(storage_.un.addr->sun_path, size_t(storage_.un.pathLength())));
  }
  switch (getFamily()) {
    case AF_UNSPEC:
      return "<uninitialized address>";
    case AF_INET: {
      char buf[NI_MAXHOST + 16];
      getAddressStr(buf, sizeof(buf));
      size_t iplen = strlen(buf);
      snprintf(buf + iplen, sizeof(buf) - iplen, ":%" PRIu16, getPort());
      return buf;
    }
    case AF_INET6: {
      char buf[NI_MAXHOST + 18];
      buf[0] = '[';
      getAddressStr(buf + 1, sizeof(buf) - 1);
      size_t iplen = strlen(buf);
      snprintf(buf + iplen, sizeof(buf) - iplen, "]:%" PRIu16, getPort());
      return buf;
    }
    default: {
      char buf[64];
      snprintf(buf, sizeof(buf), "<unknown address family %d>", getFamily());
      return buf;
    }
  }
}

bool SocketAddress::operator==(const SocketAddress& other) const {
  if (external_ != other.external_ || other.getFamily() != getFamily()) {
    return false;
  }
  if (external_) {
    // anonymous addresses are never equal to any other addresses
    if (storage_.un.pathLength() == 0 || other.storage_.un.pathLength() == 0) {
      return false;
    }

    if (storage_.un.len != other.storage_.un.len) {
      return false;
    }
    int cmp = memcmp(
        storage_.un.addr->sun_path,
        other.storage_.un.addr->sun_path,
        size_t(storage_.un.pathLength()));
    return cmp == 0;
  }

  switch (getFamily()) {
    case AF_INET:
    case AF_INET6:
      return (other.storage_.addr == storage_.addr) && (other.port_ == port_);
    default:
      throw std::invalid_argument(
          "SocketAddress: unsupported address family "
          "for comparison");
  }
}

bool SocketAddress::prefixMatch(
    const SocketAddress& other,
    unsigned prefixLength) const {
  if (other.getFamily() != getFamily()) {
    return false;
  }
  uint8_t mask_length = 128;
  switch (getFamily()) {
    case AF_INET:
      mask_length = 32;
      FOLLY_FALLTHROUGH;
    case AF_INET6: {
      auto prefix = folly::IPAddress::longestCommonPrefix(
          {storage_.addr, mask_length}, {other.storage_.addr, mask_length});
      return prefix.second >= prefixLength;
    }
    default:
      return false;
  }
}

size_t SocketAddress::hash() const {
  size_t seed = folly::hash::twang_mix64(getFamily());

  if (external_) {
    enum { kUnixPathMax = sizeof(storage_.un.addr->sun_path) };
    const char* path = storage_.un.addr->sun_path;
    auto pathLength = storage_.un.pathLength();
    // TODO: this probably could be made more efficient
    for (off_t n = 0; n < pathLength; ++n) {
      boost::hash_combine(seed, folly::hash::twang_mix64(uint64_t(path[n])));
    }
  }

  switch (getFamily()) {
    case AF_INET:
    case AF_INET6: {
      boost::hash_combine(seed, port_);
      boost::hash_combine(seed, storage_.addr.hash());
      break;
    }
    case AF_UNIX:
      DCHECK(external_);
      break;
    case AF_UNSPEC:
    default:
      throw std::invalid_argument(
          "SocketAddress: unsupported address family "
          "for hashing");
  }

  return seed;
}

struct addrinfo*
SocketAddress::getAddrInfo(const char* host, uint16_t port, int flags) {
  // getaddrinfo() requires the port number as a string
  char portString[sizeof("65535")];
  snprintf(portString, sizeof(portString), "%" PRIu16, port);

  return getAddrInfo(host, portString, flags);
}

struct addrinfo*
SocketAddress::getAddrInfo(const char* host, const char* port, int flags) {
  struct addrinfo hints;
  memset(&hints, 0, sizeof(hints));
  hints.ai_family = AF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  hints.ai_flags = AI_PASSIVE | AI_NUMERICSERV | flags;

  struct addrinfo* results;
  int error = getaddrinfo(host, port, &hints, &results);
  if (error != 0) {
    auto os = folly::sformat(
        "Failed to resolve address for '{}': {} (error={})",
        host,
        gai_strerror(error),
        error);
    throw std::system_error(error, std::generic_category(), os);
  }

  return results;
}

void SocketAddress::setFromAddrInfo(const struct addrinfo* info) {
  setFromSockaddr(info->ai_addr, socklen_t(info->ai_addrlen));
}

void SocketAddress::setFromLocalAddr(const struct addrinfo* info) {
  // If an IPv6 address is present, prefer to use it, since IPv4 addresses
  // can be mapped into IPv6 space.
  for (const struct addrinfo* ai = info; ai != nullptr; ai = ai->ai_next) {
    if (ai->ai_family == AF_INET6) {
      setFromSockaddr(ai->ai_addr, socklen_t(ai->ai_addrlen));
      return;
    }
  }

  // Otherwise, just use the first address in the list.
  setFromSockaddr(info->ai_addr, socklen_t(info->ai_addrlen));
}

void SocketAddress::setFromSocket(
    int socket,
    int (*fn)(int, struct sockaddr*, socklen_t*)) {
  // Try to put the address into a local storage buffer.
  sockaddr_storage tmp_sock;
  socklen_t addrLen = sizeof(tmp_sock);
  if (fn(socket, (sockaddr*)&tmp_sock, &addrLen) != 0) {
    folly::throwSystemError("setFromSocket() failed");
  }

  setFromSockaddr((sockaddr*)&tmp_sock, addrLen);
}

std::string SocketAddress::getIpString(int flags) const {
  char addrString[NI_MAXHOST];
  getIpString(addrString, sizeof(addrString), flags);
  return std::string(addrString);
}

void SocketAddress::getIpString(char* buf, size_t buflen, int flags) const {
  auto family = getFamily();
  if (family != AF_INET && family != AF_INET6) {
    throw std::invalid_argument(
        "SocketAddress: attempting to get IP address "
        "for a non-IP address");
  }

  sockaddr_storage tmp_sock;
  storage_.addr.toSockaddrStorage(&tmp_sock, port_);
  int rc = getnameinfo(
      (sockaddr*)&tmp_sock,
      sizeof(sockaddr_storage),
      buf,
      buflen,
      nullptr,
      0,
      flags);
  if (rc != 0) {
    auto os = sformat(
        "getnameinfo() failed in getIpString() error = {}", gai_strerror(rc));
    throw std::system_error(rc, std::generic_category(), os);
  }
}

void SocketAddress::updateUnixAddressLength(socklen_t addrlen) {
  if (addrlen < offsetof(struct sockaddr_un, sun_path)) {
    throw std::invalid_argument(
        "SocketAddress: attempted to set a Unix socket "
        "with a length too short for a sockaddr_un");
  }

  storage_.un.len = addrlen;
  if (storage_.un.pathLength() == 0) {
    // anonymous address
    return;
  }

  if (storage_.un.addr->sun_path[0] == '\0') {
    // abstract namespace.  honor the specified length
  } else {
    // Call strnlen(), just in case the length was overspecified.
    size_t maxLength = addrlen - offsetof(struct sockaddr_un, sun_path);
    size_t pathLength = strnlen(storage_.un.addr->sun_path, maxLength);
    storage_.un.len =
        socklen_t(offsetof(struct sockaddr_un, sun_path) + pathLength);
  }
}

bool SocketAddress::operator<(const SocketAddress& other) const {
  if (getFamily() != other.getFamily()) {
    return getFamily() < other.getFamily();
  }

  if (external_) {
    // Anonymous addresses can't be compared to anything else.
    // Return that they are never less than anything.
    //
    // Note that this still meets the requirements for a strict weak
    // ordering, so we can use this operator<() with standard C++ containers.
    auto thisPathLength = storage_.un.pathLength();
    if (thisPathLength == 0) {
      return false;
    }
    auto otherPathLength = other.storage_.un.pathLength();
    if (otherPathLength == 0) {
      return true;
    }

    // Compare based on path length first, for efficiency
    if (thisPathLength != otherPathLength) {
      return thisPathLength < otherPathLength;
    }
    int cmp = memcmp(
        storage_.un.addr->sun_path,
        other.storage_.un.addr->sun_path,
        size_t(thisPathLength));
    return cmp < 0;
  }
  switch (getFamily()) {
    case AF_INET:
    case AF_INET6: {
      if (port_ != other.port_) {
        return port_ < other.port_;
      }

      return storage_.addr < other.storage_.addr;
    }
    case AF_UNSPEC:
    default:
      throw std::invalid_argument(
          "SocketAddress: unsupported address family for comparing");
  }
}

size_t hash_value(const SocketAddress& address) {
  return address.hash();
}

std::ostream& operator<<(std::ostream& os, const SocketAddress& addr) {
  os << addr.describe();
  return os;
}

} // namespace folly
