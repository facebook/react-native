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
#include <folly/io/async/test/BlockingSocket.h>

#include <iostream>

#include <folly/ExceptionWrapper.h>
#include <folly/portability/GFlags.h>

using namespace folly;

DEFINE_string(host, "localhost", "Host");
DEFINE_int32(port, 0, "port");
DEFINE_bool(tfo, false, "enable tfo");
DEFINE_string(msg, "", "Message to send");
DEFINE_bool(ssl, false, "use ssl");
DEFINE_int32(timeout_ms, 0, "timeout");
DEFINE_int32(sendtimeout_ms, 0, "send timeout");
DEFINE_int32(num_writes, 1, "number of writes");

int main(int argc, char** argv) {
  gflags::ParseCommandLineFlags(&argc, &argv, true);

  if (FLAGS_port == 0) {
    LOG(ERROR) << "Must specify port";
    exit(EXIT_FAILURE);
  }

  // Prep the socket
  EventBase evb;
  AsyncSocket::UniquePtr socket;
  if (FLAGS_ssl) {
    auto sslContext = std::make_shared<SSLContext>();
    socket = AsyncSocket::UniquePtr(new AsyncSSLSocket(sslContext, &evb));
  } else {
    socket = AsyncSocket::UniquePtr(new AsyncSocket(&evb));
  }
  socket->detachEventBase();

  if (FLAGS_tfo) {
#if FOLLY_ALLOW_TFO
    socket->enableTFO();
#endif
  }

  if (FLAGS_sendtimeout_ms != 0) {
    socket->setSendTimeout(FLAGS_sendtimeout_ms);
  }

  // Keep this around
  auto sockAddr = socket.get();

  BlockingSocket sock(std::move(socket));
  SocketAddress addr;
  addr.setFromHostPort(FLAGS_host, FLAGS_port);
  sock.setAddress(addr);
  std::chrono::milliseconds timeout(FLAGS_timeout_ms);
  sock.open(timeout);
  LOG(INFO) << "connected to " << addr.getAddressStr();

  for (int32_t i = 0; i < FLAGS_num_writes; ++i) {
    sock.write((const uint8_t*)FLAGS_msg.data(), FLAGS_msg.size());
  }

  LOG(INFO) << "TFO attempted: " << sockAddr->getTFOAttempted();
  LOG(INFO) << "TFO finished: " << sockAddr->getTFOFinished();
  LOG(INFO) << "TFO success: " << sockAddr->getTFOSucceded();

  std::array<char, 1024> buf;
  int32_t bytesRead = 0;
  while ((bytesRead = sock.read((uint8_t*)buf.data(), buf.size())) != 0) {
    std::cout << std::string(buf.data(), bytesRead);
  }

  sock.close();
  return 0;
}
