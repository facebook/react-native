/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
#pragma once

namespace folly {

class SocketPair {
 public:
  enum Mode {
    BLOCKING,
    NONBLOCKING
  };

  explicit SocketPair(Mode mode = NONBLOCKING);
  ~SocketPair();

  int operator[](int index) const {
    return fds_[index];
  }

  void closeFD0();
  void closeFD1();

  int extractFD0() {
    return extractFD(0);
  }
  int extractFD1() {
    return extractFD(1);
  }
  int extractFD(int index) {
    int fd = fds_[index];
    fds_[index] = -1;
    return fd;
  }

 private:
  int fds_[2];
};

}
