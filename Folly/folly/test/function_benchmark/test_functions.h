/*
 * Copyright 2011-present Facebook, Inc.
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
#include <functional>
#include <string>

#include <folly/Function.h>

class Exception : public std::exception {
 public:
  explicit Exception(const std::string& value) : value_(value) {}
  ~Exception() noexcept override {}

  const char* what() const noexcept override {
    return value_.c_str();
  }

 private:
  std::string value_;
};

void doNothing();

std::exception_ptr returnExceptionPtr();
void exceptionPtrReturnParam(std::exception_ptr* excReturn);
std::string returnString();
std::string returnStringNoExcept() noexcept;
int returnCode(int value);
int returnCodeNoExcept(int value) noexcept;
void invoke(std::function<void()>);
void invoke(folly::Function<void()>);

class TestClass {
 public:
  void doNothing();
};

class VirtualClass {
 public:
  virtual ~VirtualClass();
  virtual void doNothing();
};

class LargeClass {
 public:
  LargeClass();
  void operator()() const; // do nothing
 private:
  // Avoid small object optimization.
  char data[1024];
};
