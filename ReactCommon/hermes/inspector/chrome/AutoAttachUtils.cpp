/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AutoAttachUtils.h"

#include <arpa/inet.h>
#include <sys/socket.h>
#include <unistd.h>

#include <folly/String.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

// The following code is copied from
// https://phabricator.intern.facebook.com/diffusion/FBS/browse/master/xplat/js/react-native-github/ReactCommon/cxxreact/JSCExecutor.cpp;431c4d01b7072d9a1a52f8bd6c6ba2ff3e47e25d$250
bool isNetworkInspected(
    const std::string &owner,
    const std::string &app,
    const std::string &device) {
  auto connect_socket = [](int socket_desc, std::string address, int port) {
    if (socket_desc < 0) {
      close(socket_desc);
      return false;
    }

    struct timeval tv;
    tv.tv_sec = 1;
    tv.tv_usec = 0;
    auto sock_opt_rcv_resp = setsockopt(
        socket_desc,
        SOL_SOCKET,
        SO_RCVTIMEO,
        (const char *)&tv,
        sizeof(struct timeval));
    if (sock_opt_rcv_resp < 0) {
      close(socket_desc);
      return false;
    }

    auto sock_opt_snd_resp = setsockopt(
        socket_desc,
        SOL_SOCKET,
        SO_SNDTIMEO,
        (const char *)&tv,
        sizeof(struct timeval));
    if (sock_opt_snd_resp < 0) {
      close(socket_desc);
      return false;
    }

    struct sockaddr_in server;
    server.sin_addr.s_addr = inet_addr(address.c_str());
    server.sin_family = AF_INET;
    server.sin_port = htons(port);
    auto connect_resp =
        ::connect(socket_desc, (struct sockaddr *)&server, sizeof(server));
    if (connect_resp < 0) {
      ::close(socket_desc);
      return false;
    }

    return true;
  };

  int socket_desc = socket(AF_INET, SOCK_STREAM, 0);

  if (!connect_socket(socket_desc, "127.0.0.1", 8082)) {
#if defined(__ANDROID__)
    socket_desc = socket(AF_INET, SOCK_STREAM, 0);
    if (!connect_socket(socket_desc, "10.0.2.2", 8082) /* emulator */) {
      socket_desc = socket(AF_INET, SOCK_STREAM, 0);
      if (!connect_socket(socket_desc, "10.0.3.2", 8082) /* genymotion */) {
        return false;
      }
    }
#else //! defined(__ANDROID__)
    return false;
#endif // defined(__ANDROID__)
  }

  std::string escapedOwner =
      folly::uriEscape<std::string>(owner, folly::UriEscapeMode::QUERY);
  std::string escapedApp =
      folly::uriEscape<std::string>(app, folly::UriEscapeMode::QUERY);
  std::string escapedDevice =
      folly::uriEscape<std::string>(device, folly::UriEscapeMode::QUERY);
  std::string msg = folly::to<std::string>(
      "GET /autoattach?title=",
      escapedOwner,
      "&app=",
      escapedApp,
      "&device=",
      escapedDevice,
      " HTTP/1.1\r\n\r\n");
  auto send_resp = ::send(socket_desc, msg.c_str(), msg.length(), 0);
  if (send_resp < 0) {
    close(socket_desc);
    return false;
  }

  char server_reply[200];
  server_reply[199] = '\0';
  auto recv_resp =
      ::recv(socket_desc, server_reply, sizeof(server_reply) - 1, 0);
  if (recv_resp < 0) {
    close(socket_desc);
    return false;
  }

  std::string response(server_reply);
  if (response.size() < 25) {
    close(socket_desc);
    return false;
  }
  auto responseCandidate = response.substr(response.size() - 25);
  auto found =
      responseCandidate.find("{\"autoattach\":true}") != std::string::npos;
  close(socket_desc);
  return found;
}

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
