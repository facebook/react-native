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

#include <memory>

#include <folly/portability/GTest.h>

class Base {
 public:
  virtual ~Base() { }
  virtual int foo() const { return 1; }
};

class Derived : public Base {
 public:
  int foo() const final { return 2; }
};

// A compiler that supports final will likely inline the call to p->foo()
// in fooDerived (but not in fooBase) as it knows that Derived::foo() can
// no longer be overridden.
int fooBase(const Base* p) { return p->foo() + 1; }
int fooDerived(const Derived* p) { return p->foo() + 1; }

TEST(Portability, Final) {
  std::unique_ptr<Derived> p(new Derived);
  EXPECT_EQ(3, fooBase(p.get()));
  EXPECT_EQ(3, fooDerived(p.get()));
}
