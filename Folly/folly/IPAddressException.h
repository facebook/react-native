/*
 * Copyright 2017 Facebook, Inc.
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

#include <exception>
#include <string>
#include <utility>

#include <folly/detail/IPAddress.h>

namespace folly {

/**
 * Exception for invalid IP addresses.
 */
class IPAddressFormatException : public std::exception {
 public:
  explicit IPAddressFormatException(std::string msg) noexcept
      : msg_(std::move(msg)) {}
  IPAddressFormatException(const IPAddressFormatException&) = default;
  IPAddressFormatException(IPAddressFormatException&&) = default;
  IPAddressFormatException& operator=(const IPAddressFormatException&) =
      default;
  IPAddressFormatException& operator=(IPAddressFormatException&&) = default;

  virtual ~IPAddressFormatException() noexcept {}
  virtual const char *what(void) const noexcept {
    return msg_.c_str();
  }

 private:
  std::string msg_;
};

class InvalidAddressFamilyException : public IPAddressFormatException {
 public:
  explicit InvalidAddressFamilyException(std::string msg) noexcept
      : IPAddressFormatException(std::move(msg)) {}
  explicit InvalidAddressFamilyException(sa_family_t family) noexcept
      : InvalidAddressFamilyException(
            "Address family " + detail::familyNameStr(family) +
            " is not AF_INET or AF_INET6") {}
  InvalidAddressFamilyException(const InvalidAddressFamilyException&) = default;
  InvalidAddressFamilyException(InvalidAddressFamilyException&&) = default;
  InvalidAddressFamilyException& operator=(
      const InvalidAddressFamilyException&) = default;
  InvalidAddressFamilyException& operator=(InvalidAddressFamilyException&&) =
      default;
};

}  // folly
