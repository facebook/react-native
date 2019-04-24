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

#pragma once

#include <sys/types.h>
#include <cstddef>
#include <iosfwd>
#include <string>

#include <folly/IPAddress.h>
#include <folly/Portability.h>
#include <folly/Range.h>
#include <folly/portability/Sockets.h>

namespace folly {

class SocketAddress {
 public:
  SocketAddress() = default;

  /**
   * Construct a SocketAddress from a hostname and port.
   *
   * Note: If the host parameter is not a numeric IP address, hostname
   * resolution will be performed, which can be quite slow.
   *
   * Raises std::system_error on error.
   *
   * @param host The IP address (or hostname, if allowNameLookup is true)
   * @param port The port (in host byte order)
   * @pram allowNameLookup  If true, attempt to perform hostname lookup
   *        if the hostname does not appear to be a numeric IP address.
   *        This is potentially a very slow operation, so is disabled by
   *        default.
   */
  SocketAddress(const char* host, uint16_t port, bool allowNameLookup = false) {
    // Initialize the address family first,
    // since setFromHostPort() and setFromIpPort() will check it.

    if (allowNameLookup) {
      setFromHostPort(host, port);
    } else {
      setFromIpPort(host, port);
    }
  }

  SocketAddress(
      const std::string& host,
      uint16_t port,
      bool allowNameLookup = false) {
    // Initialize the address family first,
    // since setFromHostPort() and setFromIpPort() will check it.

    if (allowNameLookup) {
      setFromHostPort(host.c_str(), port);
    } else {
      setFromIpPort(host.c_str(), port);
    }
  }

  SocketAddress(const IPAddress& ipAddr, uint16_t port) {
    setFromIpAddrPort(ipAddr, port);
  }

  SocketAddress(const SocketAddress& addr) {
    port_ = addr.port_;
    if (addr.getFamily() == AF_UNIX) {
      storage_.un.init(addr.storage_.un);
    } else {
      storage_ = addr.storage_;
    }
    external_ = addr.external_;
  }

  SocketAddress& operator=(const SocketAddress& addr) {
    if (!external_) {
      if (addr.getFamily() != AF_UNIX) {
        storage_ = addr.storage_;
      } else {
        storage_ = addr.storage_;
        storage_.un.init(addr.storage_.un);
      }
    } else {
      if (addr.getFamily() == AF_UNIX) {
        storage_.un.copy(addr.storage_.un);
      } else {
        storage_.un.free();
        storage_ = addr.storage_;
      }
    }
    port_ = addr.port_;
    external_ = addr.external_;
    return *this;
  }

  SocketAddress(SocketAddress&& addr) noexcept {
    storage_ = addr.storage_;
    port_ = addr.port_;
    external_ = addr.external_;
    addr.external_ = false;
  }

  SocketAddress& operator=(SocketAddress&& addr) {
    std::swap(storage_, addr.storage_);
    std::swap(port_, addr.port_);
    std::swap(external_, addr.external_);
    return *this;
  }

  ~SocketAddress() {
    if (external_) {
      storage_.un.free();
    }
  }

  bool isInitialized() const {
    return (getFamily() != AF_UNSPEC);
  }

  /**
   * Return whether this address is within private network.
   *
   * According to RFC1918, the 10/8 prefix, 172.16/12 prefix, and 192.168/16
   * prefix are reserved for private networks.
   * fc00::/7 is the IPv6 version, defined in RFC4139.  IPv6 link-local
   * addresses (fe80::/10) are also considered private addresses.
   *
   * The loopback addresses 127/8 and ::1 are also regarded as private networks
   * for the purpose of this function.
   *
   * Returns true if this is a private network address, and false otherwise.
   */
  bool isPrivateAddress() const;

  /**
   * Return whether this address is a loopback address.
   */
  bool isLoopbackAddress() const;

  void reset() {
    if (external_) {
      storage_.un.free();
    }
    storage_.addr = folly::IPAddress();
    external_ = false;
  }

  /**
   * Initialize this SocketAddress from a hostname and port.
   *
   * Note: If the host parameter is not a numeric IP address, hostname
   * resolution will be performed, which can be quite slow.
   *
   * If the hostname resolves to multiple addresses, only the first will be
   * returned.
   *
   * Raises std::system_error on error.
   *
   * @param host The hostname or IP address
   * @param port The port (in host byte order)
   */
  void setFromHostPort(const char* host, uint16_t port);

  void setFromHostPort(const std::string& host, uint16_t port) {
    setFromHostPort(host.c_str(), port);
  }

  /**
   * Initialize this SocketAddress from an IP address and port.
   *
   * This is similar to setFromHostPort(), but only accepts numeric IP
   * addresses.  If the IP string does not look like an IP address, it throws a
   * std::invalid_argument rather than trying to perform a hostname resolution.
   *
   * Raises std::system_error on error.
   *
   * @param ip The IP address, as a human-readable string.
   * @param port The port (in host byte order)
   */
  void setFromIpPort(const char* ip, uint16_t port);

  void setFromIpPort(const std::string& ip, uint16_t port) {
    setFromIpPort(ip.c_str(), port);
  }

  /**
   * Initialize this SocketAddress from an IPAddress struct and port.
   *
   * @param ip The IP address in IPAddress format
   * @param port The port (in host byte order)
   */
  void setFromIpAddrPort(const IPAddress& ip, uint16_t port);

  /**
   * Initialize this SocketAddress from a local port number.
   *
   * This is intended to be used by server code to determine the address to
   * listen on.
   *
   * If the current machine has any IPv6 addresses configured, an IPv6 address
   * will be returned (since connections from IPv4 clients can be mapped to the
   * IPv6 address).  If the machine does not have any IPv6 addresses, an IPv4
   * address will be returned.
   */
  void setFromLocalPort(uint16_t port);

  /**
   * Initialize this SocketAddress from a local port number.
   *
   * This version of setFromLocalPort() accepts the port as a string.  A
   * std::invalid_argument will be raised if the string does not refer to a port
   * number.  Non-numeric service port names are not accepted.
   */
  void setFromLocalPort(const char* port);
  void setFromLocalPort(const std::string& port) {
    return setFromLocalPort(port.c_str());
  }

  /**
   * Initialize this SocketAddress from a local port number and optional IP
   * address.
   *
   * The addressAndPort string may be specified either as "<ip>:<port>", or
   * just as "<port>".  If the IP is not specified, the address will be
   * initialized to 0, so that a server socket bound to this address will
   * accept connections on all local IP addresses.
   *
   * Both the IP address and port number must be numeric.  DNS host names and
   * non-numeric service port names are not accepted.
   */
  void setFromLocalIpPort(const char* addressAndPort);
  void setFromLocalIpPort(const std::string& addressAndPort) {
    return setFromLocalIpPort(addressAndPort.c_str());
  }

  /**
   * Initialize this SocketAddress from an IP address and port number.
   *
   * The addressAndPort string must be of the form "<ip>:<port>".  E.g.,
   * "10.0.0.1:1234".
   *
   * Both the IP address and port number must be numeric.  DNS host names and
   * non-numeric service port names are not accepted.
   */
  void setFromIpPort(const char* addressAndPort);
  void setFromIpPort(const std::string& addressAndPort) {
    return setFromIpPort(addressAndPort.c_str());
  }

  /**
   * Initialize this SocketAddress from a host name and port number.
   *
   * The addressAndPort string must be of the form "<host>:<port>".  E.g.,
   * "www.facebook.com:443".
   *
   * If the host name is not a numeric IP address, a DNS lookup will be
   * performed.  Beware that the DNS lookup may be very slow.  The port number
   * must be numeric; non-numeric service port names are not accepted.
   */
  void setFromHostPort(const char* hostAndPort);
  void setFromHostPort(const std::string& hostAndPort) {
    return setFromHostPort(hostAndPort.c_str());
  }

  /**
   * Returns the port number from the given socketaddr structure.
   *
   * Currently only IPv4 and IPv6 are supported.
   *
   * Returns -1 for unsupported socket families.
   */
  static int getPortFrom(const struct sockaddr* address);

  /**
   * Returns the family name from the given socketaddr structure (e.g.: AF_INET6
   * for IPv6).
   *
   * Returns `defaultResult` for unsupported socket families.
   */
  static const char* getFamilyNameFrom(
      const struct sockaddr* address,
      const char* defaultResult = nullptr);

  /**
   * Initialize this SocketAddress from a local unix path.
   *
   * Raises std::invalid_argument on error.
   */
  void setFromPath(StringPiece path);

  void setFromPath(const char* path, size_t length) {
    setFromPath(StringPiece{path, length});
  }

  /**
   * Construct a SocketAddress from a local unix socket path.
   *
   * Raises std::invalid_argument on error.
   *
   * @param path The Unix domain socket path.
   */
  static SocketAddress makeFromPath(StringPiece path) {
    SocketAddress addr;
    addr.setFromPath(path);
    return addr;
  }

  /**
   * Initialize this SocketAddress from a socket's peer address.
   *
   * Raises std::system_error on error.
   */
  void setFromPeerAddress(int socket);

  /**
   * Initialize this SocketAddress from a socket's local address.
   *
   * Raises std::system_error on error.
   */
  void setFromLocalAddress(int socket);

  /**
   * Initialize this folly::SocketAddress from a struct sockaddr.
   *
   * Raises std::system_error on error.
   *
   * This method is not supported for AF_UNIX addresses.  For unix addresses,
   * the address length must be explicitly specified.
   *
   * @param address  A struct sockaddr.  The size of the address is implied
   *                 from address->sa_family.
   */
  void setFromSockaddr(const struct sockaddr* address);

  /**
   * Initialize this SocketAddress from a struct sockaddr.
   *
   * Raises std::system_error on error.
   *
   * @param address  A struct sockaddr.
   * @param addrlen  The length of address data available.  This must be long
   *                 enough for the full address type required by
   *                 address->sa_family.
   */
  void setFromSockaddr(const struct sockaddr* address, socklen_t addrlen);

  /**
   * Initialize this SocketAddress from a struct sockaddr_in.
   */
  void setFromSockaddr(const struct sockaddr_in* address);

  /**
   * Initialize this SocketAddress from a struct sockaddr_in6.
   */
  void setFromSockaddr(const struct sockaddr_in6* address);

  /**
   * Initialize this SocketAddress from a struct sockaddr_un.
   *
   * Note that the addrlen parameter is necessary to properly detect anonymous
   * addresses, which have 0 valid path bytes, and may not even have a NUL
   * character at the start of the path.
   *
   * @param address  A struct sockaddr_un.
   * @param addrlen  The length of address data.  This should include all of
   *                 the valid bytes of sun_path, not including any NUL
   *                 terminator.
   */
  void setFromSockaddr(const struct sockaddr_un* address, socklen_t addrlen);

  /**
   * Fill in a given sockaddr_storage with the ip or unix address.
   *
   * Returns the actual size of the storage used.
   */
  socklen_t getAddress(sockaddr_storage* addr) const {
    if (!external_) {
      return storage_.addr.toSockaddrStorage(addr, htons(port_));
    } else {
      memcpy(addr, storage_.un.addr, sizeof(*storage_.un.addr));
      return storage_.un.len;
    }
  }

  const folly::IPAddress& getIPAddress() const;

  // Deprecated: getAddress() above returns the same size as getActualSize()
  socklen_t getActualSize() const;

  sa_family_t getFamily() const {
    DCHECK(external_ || AF_UNIX != storage_.addr.family());
    return external_ ? sa_family_t(AF_UNIX) : storage_.addr.family();
  }

  bool empty() const {
    return getFamily() == AF_UNSPEC;
  }

  /**
   * Get a string representation of the IPv4 or IPv6 address.
   *
   * Raises std::invalid_argument if an error occurs (for example, if
   * the address is not an IPv4 or IPv6 address).
   */
  std::string getAddressStr() const;

  /**
   * Get a string representation of the IPv4 or IPv6 address.
   *
   * Raises std::invalid_argument if an error occurs (for example, if
   * the address is not an IPv4 or IPv6 address).
   */
  void getAddressStr(char* buf, size_t buflen) const;

  /**
   * Return true if it is a valid IPv4 or IPv6 address.
   */
  bool isFamilyInet() const;

  /**
   * For v4 & v6 addresses, return the fully qualified address string
   */
  std::string getFullyQualified() const;

  /**
   * Get the IPv4 or IPv6 port for this address.
   *
   * Raises std::invalid_argument if this is not an IPv4 or IPv6 address.
   *
   * @return Returns the port, in host byte order.
   */
  uint16_t getPort() const;

  /**
   * Set the IPv4 or IPv6 port for this address.
   *
   * Raises std::invalid_argument if this is not an IPv4 or IPv6 address.
   */
  void setPort(uint16_t port);

  /**
   * Return true if this is an IPv4-mapped IPv6 address.
   */
  bool isIPv4Mapped() const {
    return (getFamily() == AF_INET6 && storage_.addr.isIPv4Mapped());
  }

  /**
   * Convert an IPv4-mapped IPv6 address to an IPv4 address.
   *
   * Raises std::invalid_argument if this is not an IPv4-mapped IPv6 address.
   */
  void convertToIPv4();

  /**
   * Try to convert an address to IPv4.
   *
   * This attempts to convert an address to an IPv4 address if possible.
   * If the address is an IPv4-mapped IPv6 address, it is converted to an IPv4
   * address and true is returned.  Otherwise nothing is done, and false is
   * returned.
   */
  bool tryConvertToIPv4();

  /**
   * Convert an IPv4 address to IPv6 [::ffff:a.b.c.d]
   */

  bool mapToIPv6();

  /**
   * Get string representation of the host name (or IP address if the host name
   * cannot be resolved).
   *
   * Warning: Using this method is strongly discouraged.  It performs a
   * DNS lookup, which may block for many seconds.
   *
   * Raises std::invalid_argument if an error occurs.
   */
  std::string getHostStr() const;

  /**
   * Get the path name for a Unix domain socket.
   *
   * Returns a std::string containing the path.  For anonymous sockets, an
   * empty string is returned.
   *
   * For addresses in the abstract namespace (Linux-specific), a std::string
   * containing binary data is returned.  In this case the first character will
   * always be a NUL character.
   *
   * Raises std::invalid_argument if called on a non-Unix domain socket.
   */
  std::string getPath() const;

  /**
   * Get human-readable string representation of the address.
   *
   * This prints a string representation of the address, for human consumption.
   * For IP addresses, the string is of the form "<IP>:<port>".
   */
  std::string describe() const;

  bool operator==(const SocketAddress& other) const;
  bool operator!=(const SocketAddress& other) const {
    return !(*this == other);
  }

  /**
   * Check whether the first N bits of this address match the first N
   * bits of another address.
   * @note returns false if the addresses are not from the same
   *       address family or if the family is neither IPv4 nor IPv6
   */
  bool prefixMatch(const SocketAddress& other, unsigned prefixLength) const;

  /**
   * Use this operator for storing maps based on SocketAddress.
   */
  bool operator<(const SocketAddress& other) const;

  /**
   * Compuate a hash of a SocketAddress.
   */
  size_t hash() const;

 private:
  /**
   * Unix socket addresses require more storage than IPv4 and IPv6 addresses,
   * and are comparatively little-used.
   *
   * Therefore SocketAddress' internal storage_ member variable doesn't
   * contain room for a full unix address, to avoid wasting space in the common
   * case.  When we do need to store a Unix socket address, we use this
   * ExternalUnixAddr structure to allocate a struct sockaddr_un separately on
   * the heap.
   */
  struct ExternalUnixAddr {
    struct sockaddr_un* addr;
    socklen_t len;

    socklen_t pathLength() const {
      return socklen_t(len - offsetof(struct sockaddr_un, sun_path));
    }

    void init() {
      addr = new struct sockaddr_un;
      addr->sun_family = AF_UNIX;
      len = 0;
    }
    void init(const ExternalUnixAddr& other) {
      addr = new struct sockaddr_un;
      len = other.len;
      memcpy(addr, other.addr, size_t(len));
    }
    void copy(const ExternalUnixAddr& other) {
      len = other.len;
      memcpy(addr, other.addr, size_t(len));
    }
    void free() {
      delete addr;
    }
  };

  struct addrinfo* getAddrInfo(const char* host, uint16_t port, int flags);
  struct addrinfo* getAddrInfo(const char* host, const char* port, int flags);
  void setFromAddrInfo(const struct addrinfo* results);
  void setFromLocalAddr(const struct addrinfo* results);
  void setFromSocket(int socket, int (*fn)(int, struct sockaddr*, socklen_t*));
  std::string getIpString(int flags) const;
  void getIpString(char* buf, size_t buflen, int flags) const;

  void updateUnixAddressLength(socklen_t addrlen);

  /*
   * storage_ contains room for a full IPv4 or IPv6 address, so they can be
   * stored inline without a separate allocation on the heap.
   *
   * If we need to store a Unix socket address, ExternalUnixAddr is a shim to
   * track a struct sockaddr_un allocated separately on the heap.
   */
  union AddrStorage {
    folly::IPAddress addr;
    ExternalUnixAddr un;
    AddrStorage() : addr() {}
  } storage_{};
  // IPAddress class does nto save zone or port, and must be saved here
  uint16_t port_;

  bool external_{false};
};

/**
 * Hash a SocketAddress object.
 *
 * boost::hash uses hash_value(), so this allows boost::hash to automatically
 * work for SocketAddress.
 */
size_t hash_value(const SocketAddress& address);

std::ostream& operator<<(std::ostream& os, const SocketAddress& addr);
} // namespace folly

namespace std {

// Provide an implementation for std::hash<SocketAddress>
template <>
struct hash<folly::SocketAddress> {
  size_t operator()(const folly::SocketAddress& addr) const {
    return addr.hash();
  }
};
} // namespace std
