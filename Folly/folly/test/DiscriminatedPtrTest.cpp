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

#include <folly/DiscriminatedPtr.h>

#include <folly/portability/GTest.h>

using namespace folly;

TEST(DiscriminatedPtr, Basic) {
  struct Foo { };
  struct Bar { };
  typedef DiscriminatedPtr<void, int, Foo, Bar> Ptr;

  int a = 10;
  Ptr p;
  EXPECT_TRUE(p.empty());
  EXPECT_FALSE(p.hasType<void>());
  EXPECT_FALSE(p.hasType<int>());
  EXPECT_FALSE(p.hasType<Foo>());
  EXPECT_FALSE(p.hasType<Bar>());

  p.set(&a);
  EXPECT_FALSE(p.empty());
  EXPECT_FALSE(p.hasType<void>());
  EXPECT_TRUE(p.hasType<int>());
  EXPECT_FALSE(p.hasType<Foo>());
  EXPECT_FALSE(p.hasType<Bar>());

  EXPECT_EQ(&a, p.get_nothrow<int>());
  EXPECT_EQ(&a, static_cast<const Ptr&>(p).get_nothrow<int>());
  EXPECT_EQ(&a, p.get<int>());
  EXPECT_EQ(&a, static_cast<const Ptr&>(p).get<int>());
  EXPECT_EQ(static_cast<void*>(nullptr), p.get_nothrow<void>());
  EXPECT_THROW({p.get<void>();}, std::invalid_argument);

  Foo foo;
  p.set(&foo);
  EXPECT_FALSE(p.empty());
  EXPECT_FALSE(p.hasType<void>());
  EXPECT_FALSE(p.hasType<int>());
  EXPECT_TRUE(p.hasType<Foo>());
  EXPECT_FALSE(p.hasType<Bar>());

  EXPECT_EQ(static_cast<int*>(nullptr), p.get_nothrow<int>());

  p.clear();
  EXPECT_TRUE(p.empty());
  EXPECT_FALSE(p.hasType<void>());
  EXPECT_FALSE(p.hasType<int>());
  EXPECT_FALSE(p.hasType<Foo>());
  EXPECT_FALSE(p.hasType<Bar>());
}

TEST(DiscriminatedPtr, Apply) {
  struct Foo { };
  struct Visitor {
    std::string operator()(int* /* ptr */) { return "int"; }
    std::string operator()(const int* /* ptr */) { return "const int"; }
    std::string operator()(Foo* /* ptr */) { return "Foo"; }
    std::string operator()(const Foo* /* ptr */) { return "const Foo"; }
  };

  typedef DiscriminatedPtr<int, Foo> Ptr;
  Ptr p;

  int a = 0;
  p.set(&a);
  EXPECT_EQ("int", p.apply(Visitor()));
  EXPECT_EQ("const int", static_cast<const Ptr&>(p).apply(Visitor()));

  Foo foo;
  p.set(&foo);
  EXPECT_EQ("Foo", p.apply(Visitor()));
  EXPECT_EQ("const Foo", static_cast<const Ptr&>(p).apply(Visitor()));

  p.clear();
  EXPECT_THROW({p.apply(Visitor());}, std::invalid_argument);
}

TEST(DiscriminatedPtr, ApplyVoid) {
  struct Foo { };
  struct Visitor {
    void operator()(int* /* ptr */) { result = "int"; }
    void operator()(const int* /* ptr */) { result = "const int"; }
    void operator()(Foo* /* ptr */) { result = "Foo"; }
    void operator()(const Foo* /* ptr */) { result = "const Foo"; }

    std::string result;
  };

  typedef DiscriminatedPtr<int, Foo> Ptr;
  Ptr p;
  Visitor v;

  int a = 0;
  p.set(&a);
  p.apply(v);
  EXPECT_EQ("int", v.result);
  static_cast<const Ptr&>(p).apply(v);
  EXPECT_EQ("const int", v.result);

  Foo foo;
  p.set(&foo);
  p.apply(v);
  EXPECT_EQ("Foo", v.result);
  static_cast<const Ptr&>(p).apply(v);
  EXPECT_EQ("const Foo", v.result);

  p.clear();
  EXPECT_THROW({p.apply(v);}, std::invalid_argument);
}
