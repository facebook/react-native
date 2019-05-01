/*
 * Copyright 2013-present Facebook, Inc.
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
#include <folly/io/ShutdownSocketSet.h>

#include <atomic>
#include <chrono>
#include <thread>

#include <glog/logging.h>

#include <folly/portability/GTest.h>
#include <folly/portability/Sockets.h>

using folly::ShutdownSocketSet;

namespace fsp = folly::portability::sockets;

namespace folly {
namespace test {

ShutdownSocketSet shutdownSocketSet;

class Server {
 public:
  Server();

  void stop(bool abortive);
  void join();
  int port() const {
    return port_;
  }
  int closeClients(bool abortive);

 private:
  int acceptSocket_;
  int port_;
  enum StopMode { NO_STOP, ORDERLY, ABORTIVE };
  std::atomic<StopMode> stop_;
  std::thread serverThread_;
  std::vector<int> fds_;
};

Server::Server() : acceptSocket_(-1), port_(0), stop_(NO_STOP) {
  acceptSocket_ = fsp::socket(PF_INET, SOCK_STREAM, 0);
  CHECK_ERR(acceptSocket_);
  shutdownSocketSet.add(acceptSocket_);

  sockaddr_in addr;
  addr.sin_family = AF_INET;
  addr.sin_port = 0;
  addr.sin_addr.s_addr = INADDR_ANY;
  CHECK_ERR(bind(
      acceptSocket_, reinterpret_cast<const sockaddr*>(&addr), sizeof(addr)));

  CHECK_ERR(listen(acceptSocket_, 10));

  socklen_t addrLen = sizeof(addr);
  CHECK_ERR(
      getsockname(acceptSocket_, reinterpret_cast<sockaddr*>(&addr), &addrLen));

  port_ = ntohs(addr.sin_port);

  serverThread_ = std::thread([this] {
    while (stop_ == NO_STOP) {
      sockaddr_in peer;
      socklen_t peerLen = sizeof(peer);
      int fd =
          accept(acceptSocket_, reinterpret_cast<sockaddr*>(&peer), &peerLen);
      if (fd == -1) {
        if (errno == EINTR) {
          continue;
        }
        if (errno == EINVAL || errno == ENOTSOCK) { // socket broken
          break;
        }
      }
      CHECK_ERR(fd);
      shutdownSocketSet.add(fd);
      fds_.push_back(fd);
    }

    if (stop_ != NO_STOP) {
      closeClients(stop_ == ABORTIVE);
    }

    shutdownSocketSet.close(acceptSocket_);
    acceptSocket_ = -1;
    port_ = 0;
  });
}

int Server::closeClients(bool abortive) {
  for (int fd : fds_) {
    if (abortive) {
      struct linger l = {1, 0};
      CHECK_ERR(setsockopt(fd, SOL_SOCKET, SO_LINGER, &l, sizeof(l)));
    }
    shutdownSocketSet.close(fd);
  }
  int n = fds_.size();
  fds_.clear();
  return n;
}

void Server::stop(bool abortive) {
  stop_ = abortive ? ABORTIVE : ORDERLY;
  shutdown(acceptSocket_, SHUT_RDWR);
}

void Server::join() {
  serverThread_.join();
}

int createConnectedSocket(int port) {
  int sock = fsp::socket(PF_INET, SOCK_STREAM, 0);
  CHECK_ERR(sock);
  sockaddr_in addr;
  addr.sin_family = AF_INET;
  addr.sin_port = htons(port);
  addr.sin_addr.s_addr = htonl((127 << 24) | 1); // XXX
  CHECK_ERR(
      connect(sock, reinterpret_cast<const sockaddr*>(&addr), sizeof(addr)));
  return sock;
}

void runCloseTest(bool abortive) {
  Server server;

  int sock = createConnectedSocket(server.port());

  std::thread stopper([&server, abortive] {
    std::this_thread::sleep_for(std::chrono::milliseconds(200));
    server.stop(abortive);
    server.join();
  });

  char c;
  int r = read(sock, &c, 1);
  if (abortive) {
    int e = errno;
    EXPECT_EQ(-1, r);
    EXPECT_EQ(ECONNRESET, e);
  } else {
    EXPECT_EQ(0, r);
  }

  close(sock);

  stopper.join();

  EXPECT_EQ(0, server.closeClients(false)); // closed by server when it exited
}

TEST(ShutdownSocketSetTest, OrderlyClose) {
  runCloseTest(false);
}

TEST(ShutdownSocketSetTest, AbortiveClose) {
  runCloseTest(true);
}

void runKillTest(bool abortive) {
  Server server;

  int sock = createConnectedSocket(server.port());

  std::thread killer([&server, abortive] {
    std::this_thread::sleep_for(std::chrono::milliseconds(200));
    shutdownSocketSet.shutdownAll(abortive);
    server.join();
  });

  char c;
  int r = read(sock, &c, 1);

  // "abortive" is just a hint for ShutdownSocketSet, so accept both
  // behaviors
  if (abortive) {
    if (r == -1) {
      EXPECT_EQ(ECONNRESET, errno);
    } else {
      EXPECT_EQ(r, 0);
    }
  } else {
    EXPECT_EQ(0, r);
  }

  close(sock);

  killer.join();

  // NOT closed by server when it exited
  EXPECT_EQ(1, server.closeClients(false));
}

TEST(ShutdownSocketSetTest, OrderlyKill) {
  runKillTest(false);
}

TEST(ShutdownSocketSetTest, AbortiveKill) {
  runKillTest(true);
}
} // namespace test
} // namespace folly
