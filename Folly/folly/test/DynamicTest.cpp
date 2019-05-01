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

#include <folly/dynamic.h>

#include <folly/Range.h>
#include <folly/json.h>
#include <folly/portability/GTest.h>

#include <iterator>

using folly::dynamic;
using folly::StringPiece;

TEST(Dynamic, Default) {
  dynamic obj;
  EXPECT_TRUE(obj.isNull());
}

TEST(Dynamic, ObjectBasics) {
  dynamic obj = dynamic::object("a", false);
  EXPECT_EQ(obj.at("a"), false);
  EXPECT_EQ(obj.size(), 1);
  obj.insert("a", true);

  dynamic key{"a"};
  folly::StringPiece sp{"a"};
  std::string s{"a"};

  EXPECT_EQ(obj.size(), 1);
  EXPECT_EQ(obj.at("a"), true);
  EXPECT_EQ(obj.at(sp), true);
  EXPECT_EQ(obj.at(key), true);

  obj.at(sp) = nullptr;
  EXPECT_EQ(obj.size(), 1);
  EXPECT_TRUE(obj.at(s) == nullptr);

  obj["a"] = 12;
  EXPECT_EQ(obj[sp], 12);
  obj[key] = "foo";
  EXPECT_EQ(obj["a"], "foo");
  (void)obj["b"];
  EXPECT_EQ(obj.size(), 2);

  obj.erase("a");
  EXPECT_TRUE(obj.find(sp) == obj.items().end());
  obj.erase("b");
  EXPECT_EQ(obj.size(), 0);

  dynamic newObject = dynamic::object;

  newObject["z"] = 12;
  EXPECT_EQ(newObject.size(), 1);
  newObject["a"] = true;
  EXPECT_EQ(newObject.size(), 2);

  EXPECT_EQ(*newObject.keys().begin(), newObject.items().begin()->first);
  EXPECT_EQ(*newObject.values().begin(), newObject.items().begin()->second);
  std::vector<std::pair<std::string, dynamic>> found;
  found.emplace_back(
      newObject.keys().begin()->asString(), *newObject.values().begin());

  EXPECT_EQ(
      *std::next(newObject.keys().begin()),
      std::next(newObject.items().begin())->first);
  EXPECT_EQ(
      *std::next(newObject.values().begin()),
      std::next(newObject.items().begin())->second);
  found.emplace_back(
      std::next(newObject.keys().begin())->asString(),
      *std::next(newObject.values().begin()));

  std::sort(found.begin(), found.end());

  EXPECT_EQ("a", found[0].first);
  EXPECT_TRUE(found[0].second.asBool());

  EXPECT_EQ("z", found[1].first);
  EXPECT_EQ(12, found[1].second.asInt());

  dynamic obj2 = dynamic::object;
  EXPECT_TRUE(obj2.isObject());

  dynamic d3 = nullptr;
  EXPECT_TRUE(d3 == nullptr);
  d3 = dynamic::object;
  EXPECT_TRUE(d3.isObject());
  d3["foo"] = dynamic::array(1, 2, 3);
  EXPECT_EQ(d3.count("foo"), 1);

  d3[123] = 321;
  EXPECT_EQ(d3.at(123), 321);

  d3["123"] = 42;
  EXPECT_EQ(d3.at("123"), 42);
  EXPECT_EQ(d3.at(123), 321);

  dynamic objInsert = folly::dynamic::object();
  dynamic objA = folly::dynamic::object("1", "2");
  dynamic objB = folly::dynamic::object("1", "2");

  objInsert.insert("1", std::move(objA));
  objInsert.insert("1", std::move(objB));

  EXPECT_EQ(objInsert.find("1")->second.size(), 1);

  // Looking up objects as keys
  // clang-format off
  dynamic objDefinedInOneOrder = folly::dynamic::object
    ("bar", "987")
    ("baz", folly::dynamic::array(1, 2, 3))
    ("foo2", folly::dynamic::object("1", "2"));
  dynamic sameObjInDifferentOrder = folly::dynamic::object
    ("bar", "987")
    ("foo2", folly::dynamic::object("1", "2"))
    ("baz", folly::dynamic::array(1, 2, 3));
  // clang-format on

  newObject[objDefinedInOneOrder] = 12;
  EXPECT_EQ(newObject.at(objDefinedInOneOrder).getInt(), 12);
  EXPECT_EQ(newObject.at(sameObjInDifferentOrder).getInt(), 12);

  // Merge two objects
  dynamic origMergeObj1 = folly::dynamic::object();
  // clang-format off
  dynamic mergeObj1 = origMergeObj1 = folly::dynamic::object
    ("key1", "value1")
    ("key2", "value2");
  dynamic mergeObj2 = folly::dynamic::object
    ("key2", "value3")
    ("key3", "value4");
  // clang-format on

  // Merged object where we prefer the values in mergeObj2
  // clang-format off
  dynamic combinedPreferObj2 = folly::dynamic::object
    ("key1", "value1")
    ("key2", "value3")
    ("key3", "value4");
  // clang-format on

  // Merged object where we prefer the values in mergeObj1
  // clang-format off
  dynamic combinedPreferObj1 = folly::dynamic::object
    ("key1", "value1")
    ("key2", "value2")
    ("key3", "value4");
  // clang-format on

  auto newMergeObj = dynamic::merge(mergeObj1, mergeObj2);
  EXPECT_EQ(newMergeObj, combinedPreferObj2);
  EXPECT_EQ(mergeObj1, origMergeObj1); // mergeObj1 should be unchanged

  mergeObj1.update(mergeObj2);
  EXPECT_EQ(mergeObj1, combinedPreferObj2);
  dynamic arr = dynamic::array(1, 2, 3, 4, 5, 6);
  EXPECT_THROW(mergeObj1.update(arr), std::exception);

  mergeObj1 = origMergeObj1; // reset it
  mergeObj1.update_missing(mergeObj2);
  EXPECT_EQ(mergeObj1, combinedPreferObj1);
}

namespace {

struct StaticStrings {
  static constexpr auto kA = "a";
  static constexpr const char* kB = "b";
  static const folly::StringPiece kFoo;
  static const std::string kBar;
};
/* static */ const folly::StringPiece StaticStrings::kFoo{"foo"};
/* static */ const std::string StaticStrings::kBar{"bar"};

} // namespace

TEST(Dynamic, ObjectHeterogeneousAccess) {
  dynamic empty;
  dynamic foo{"foo"};
  const char* a = "a";
  StringPiece sp{"a"};
  std::string str{"a"};
  dynamic bar{"bar"};
  const char* b = "b";

  dynamic obj = dynamic::object("a", 123)(empty, 456)(foo, 789);

  // at()
  EXPECT_EQ(obj.at(empty), 456);
  EXPECT_EQ(obj.at(nullptr), 456);
  EXPECT_EQ(obj.at(foo), 789);

  EXPECT_EQ(obj.at(a), 123);
  EXPECT_EQ(obj.at(StaticStrings::kA), 123);
  EXPECT_EQ(obj.at("a"), 123);

  EXPECT_EQ(obj.at(sp), 123);
  EXPECT_EQ(obj.at(StringPiece{"a"}), 123);
  EXPECT_EQ(obj.at(StaticStrings::kFoo), 789);

  EXPECT_EQ(obj.at(std::string{"a"}), 123);
  EXPECT_EQ(obj.at(str), 123);

  EXPECT_THROW(obj.at(b), std::out_of_range);
  EXPECT_THROW(obj.at(StringPiece{b}), std::out_of_range);
  EXPECT_THROW(obj.at(StaticStrings::kBar), std::out_of_range);

  // get_ptr()
  EXPECT_NE(obj.get_ptr(empty), nullptr);
  EXPECT_EQ(*obj.get_ptr(empty), 456);
  EXPECT_NE(obj.get_ptr(nullptr), nullptr);
  EXPECT_EQ(*obj.get_ptr(nullptr), 456);
  EXPECT_NE(obj.get_ptr(foo), nullptr);
  EXPECT_EQ(*obj.get_ptr(foo), 789);

  EXPECT_NE(obj.get_ptr(a), nullptr);
  EXPECT_EQ(*obj.get_ptr(a), 123);
  EXPECT_NE(obj.get_ptr(StaticStrings::kA), nullptr);
  EXPECT_EQ(*obj.get_ptr(StaticStrings::kA), 123);
  EXPECT_NE(obj.get_ptr("a"), nullptr);
  EXPECT_EQ(*obj.get_ptr("a"), 123);

  EXPECT_NE(obj.get_ptr(sp), nullptr);
  EXPECT_EQ(*obj.get_ptr(sp), 123);
  EXPECT_NE(obj.get_ptr(StringPiece{"a"}), nullptr);
  EXPECT_EQ(*obj.get_ptr(StringPiece{"a"}), 123);
  EXPECT_NE(obj.get_ptr(StaticStrings::kFoo), nullptr);
  EXPECT_EQ(*obj.get_ptr(StaticStrings::kFoo), 789);

  EXPECT_NE(obj.get_ptr(std::string{"a"}), nullptr);
  EXPECT_EQ(*obj.get_ptr(std::string{"a"}), 123);
  EXPECT_NE(obj.get_ptr(str), nullptr);
  EXPECT_EQ(*obj.get_ptr(str), 123);

  EXPECT_EQ(obj.get_ptr(b), nullptr);
  EXPECT_EQ(obj.get_ptr(StringPiece{b}), nullptr);
  EXPECT_EQ(obj.get_ptr(StaticStrings::kBar), nullptr);

  // find()
  EXPECT_EQ(obj.find(empty)->second, 456);
  EXPECT_EQ(obj.find(nullptr)->second, 456);
  EXPECT_EQ(obj.find(foo)->second, 789);

  EXPECT_EQ(obj.find(a)->second, 123);
  EXPECT_EQ(obj.find(StaticStrings::kA)->second, 123);
  EXPECT_EQ(obj.find("a")->second, 123);

  EXPECT_EQ(obj.find(sp)->second, 123);
  EXPECT_EQ(obj.find(StringPiece{"a"})->second, 123);
  EXPECT_EQ(obj.find(StaticStrings::kFoo)->second, 789);

  EXPECT_EQ(obj.find(std::string{"a"})->second, 123);
  EXPECT_EQ(obj.find(str)->second, 123);

  EXPECT_TRUE(obj.find(b) == obj.items().end());
  EXPECT_TRUE(obj.find(StringPiece{b}) == obj.items().end());
  EXPECT_TRUE(obj.find(StaticStrings::kBar) == obj.items().end());

  // count()
  EXPECT_EQ(obj.count(empty), 1);
  EXPECT_EQ(obj.count(nullptr), 1);
  EXPECT_EQ(obj.count(foo), 1);

  EXPECT_EQ(obj.count(a), 1);
  EXPECT_EQ(obj.count(StaticStrings::kA), 1);
  EXPECT_EQ(obj.count("a"), 1);

  EXPECT_EQ(obj.count(sp), 1);
  EXPECT_EQ(obj.count(StringPiece{"a"}), 1);
  EXPECT_EQ(obj.count(StaticStrings::kFoo), 1);

  EXPECT_EQ(obj.count(std::string{"a"}), 1);
  EXPECT_EQ(obj.count(str), 1);

  EXPECT_EQ(obj.count(b), 0);
  EXPECT_EQ(obj.count(StringPiece{b}), 0);
  EXPECT_EQ(obj.count(StaticStrings::kBar), 0);

  // operator[]
  EXPECT_EQ(obj[empty], 456);
  EXPECT_EQ(obj[nullptr], 456);
  EXPECT_EQ(obj[foo], 789);

  EXPECT_EQ(obj[a], 123);
  EXPECT_EQ(obj[StaticStrings::kA], 123);
  EXPECT_EQ(obj["a"], 123);

  EXPECT_EQ(obj[sp], 123);
  EXPECT_EQ(obj[StringPiece{"a"}], 123);
  EXPECT_EQ(obj[StaticStrings::kFoo], 789);

  EXPECT_EQ(obj[std::string{"a"}], 123);
  EXPECT_EQ(obj[str], 123);

  EXPECT_EQ(obj[b], nullptr);
  obj[b] = 42;
  EXPECT_EQ(obj[StringPiece{b}], 42);
  obj[StaticStrings::kBar] = 43;
  EXPECT_EQ(obj["bar"], 43);

  // erase() + dynamic&&
  EXPECT_EQ(obj.erase(StaticStrings::kB), /* num elements erased */ 1);

  dynamic obj2 = obj;
  dynamic obj3 = obj;
  dynamic obj4 = obj;
  EXPECT_EQ(std::move(obj).find(StaticStrings::kFoo)->second, 789);
  EXPECT_EQ(std::move(obj2).at(StaticStrings::kA), 123);
  EXPECT_EQ(std::move(obj3)[nullptr], 456);
  EXPECT_EQ(std::move(obj4).erase(StaticStrings::kBar), 1);
}

TEST(Dynamic, CastFromVectorOfBooleans) {
  std::vector<bool> b;
  b.push_back(true);
  b.push_back(false);
  dynamic obj = dynamic::object("a", b[0])("b", b[1]);
  EXPECT_EQ(obj.at("a"), true);
  EXPECT_EQ(obj.at("b"), false);
}

TEST(Dynamic, CastFromConstVectorOfBooleans) {
  const std::vector<bool> b = {true, false};
  dynamic obj = dynamic::object("a", b[0])("b", b[1]);
  EXPECT_EQ(obj.at("a"), true);
  EXPECT_EQ(obj.at("b"), false);
}

TEST(Dynamic, ObjectErase) {
  dynamic obj = dynamic::object("key1", "val")("key2", "val2");
  EXPECT_EQ(obj.count("key1"), 1);
  EXPECT_EQ(obj.count("key2"), 1);
  EXPECT_EQ(obj.erase("key1"), 1);
  EXPECT_EQ(obj.count("key1"), 0);
  EXPECT_EQ(obj.count("key2"), 1);
  EXPECT_EQ(obj.erase("key1"), 0);
  obj["key1"] = 12;
  EXPECT_EQ(obj.count("key1"), 1);
  EXPECT_EQ(obj.count("key2"), 1);
  auto it = obj.find("key2");
  obj.erase(it);
  EXPECT_EQ(obj.count("key1"), 1);
  EXPECT_EQ(obj.count("key2"), 0);

  obj["asd"] = 42.0;
  obj["foo"] = 42.0;
  EXPECT_EQ(obj.size(), 3);
  auto ret = obj.erase(std::next(obj.items().begin()), obj.items().end());
  EXPECT_TRUE(ret == obj.items().end());
  EXPECT_EQ(obj.size(), 1);
  obj.erase(obj.items().begin());
  EXPECT_TRUE(obj.empty());
}

TEST(Dynamic, ArrayErase) {
  dynamic arr = dynamic::array(1, 2, 3, 4, 5, 6);

  EXPECT_THROW(arr.erase(1), std::exception);
  EXPECT_EQ(arr.size(), 6);
  EXPECT_EQ(arr[0], 1);
  arr.erase(arr.begin());
  EXPECT_EQ(arr.size(), 5);

  arr.erase(std::next(arr.begin()), std::prev(arr.end()));
  EXPECT_EQ(arr.size(), 2);
  EXPECT_EQ(arr[0], 2);
  EXPECT_EQ(arr[1], 6);
}

TEST(Dynamic, StringBasics) {
  dynamic str = "hello world";
  EXPECT_EQ(11, str.size());
  EXPECT_FALSE(str.empty());
  str = "";
  EXPECT_TRUE(str.empty());
}

TEST(Dynamic, ArrayBasics) {
  dynamic array = dynamic::array(1, 2, 3);
  EXPECT_EQ(array.size(), 3);
  EXPECT_EQ(array.at(0), 1);
  EXPECT_EQ(array.at(1), 2);
  EXPECT_EQ(array.at(2), 3);

  EXPECT_ANY_THROW(array.at(-1));
  EXPECT_ANY_THROW(array.at(3));

  array.push_back("foo");
  EXPECT_EQ(array.size(), 4);

  array.resize(12, "something");
  EXPECT_EQ(array.size(), 12);
  EXPECT_EQ(array[11], "something");
}

TEST(Dynamic, DeepCopy) {
  dynamic val = dynamic::array("foo", "bar", dynamic::array("foo1", "bar1"));
  EXPECT_EQ(val.at(2).at(0), "foo1");
  EXPECT_EQ(val.at(2).at(1), "bar1");
  dynamic val2 = val;
  EXPECT_EQ(val2.at(2).at(0), "foo1");
  EXPECT_EQ(val2.at(2).at(1), "bar1");
  EXPECT_EQ(val.at(2).at(0), "foo1");
  EXPECT_EQ(val.at(2).at(1), "bar1");
  val2.at(2).at(0) = "foo3";
  val2.at(2).at(1) = "bar3";
  EXPECT_EQ(val.at(2).at(0), "foo1");
  EXPECT_EQ(val.at(2).at(1), "bar1");
  EXPECT_EQ(val2.at(2).at(0), "foo3");
  EXPECT_EQ(val2.at(2).at(1), "bar3");

  dynamic obj = dynamic::object("a", "b")("c", dynamic::array("d", "e", "f"));
  EXPECT_EQ(obj.at("a"), "b");
  dynamic obj2 = obj;
  obj2.at("a") = dynamic::array(1, 2, 3);
  EXPECT_EQ(obj.at("a"), "b");
  dynamic expected = dynamic::array(1, 2, 3);
  EXPECT_EQ(obj2.at("a"), expected);
}

TEST(Dynamic, ArrayReassignment) {
  dynamic o = 1;
  dynamic d1 = dynamic::array(o);
  EXPECT_EQ(dynamic::ARRAY, d1.type());

  d1 = dynamic::array(o);
  EXPECT_EQ(dynamic::ARRAY, d1.type());
}

TEST(Dynamic, Operator) {
  bool caught = false;
  try {
    dynamic d1 = dynamic::object;
    dynamic d2 = dynamic::object;
    auto foo = d1 < d2;
    LOG(ERROR) << "operator < returned " << static_cast<int>(foo)
               << " instead of throwing";
  } catch (std::exception const&) {
    caught = true;
  }
  EXPECT_TRUE(caught);

  dynamic foo = "asd";
  dynamic bar = "bar";
  dynamic sum = foo + bar;
  EXPECT_EQ(sum, "asdbar");

  dynamic some = 12;
  dynamic nums = 4;
  dynamic math = some / nums;
  EXPECT_EQ(math, 3);
}

TEST(Dynamic, Conversions) {
  dynamic str = "12.0";
  EXPECT_EQ(str.asDouble(), 12.0);
  EXPECT_ANY_THROW(str.asInt());
  EXPECT_ANY_THROW(str.asBool());

  str = "12";
  EXPECT_EQ(str.asInt(), 12);
  EXPECT_EQ(str.asDouble(), 12.0);
  str = "0";
  EXPECT_EQ(str.asBool(), false);
  EXPECT_EQ(str.asInt(), 0);
  EXPECT_EQ(str.asDouble(), 0);
  EXPECT_EQ(str.asString(), "0");

  dynamic num = 12;
  EXPECT_EQ("12", num.asString());
  EXPECT_EQ(12.0, num.asDouble());
}

TEST(Dynamic, GetSetDefaultTest) {
  dynamic d1 = dynamic::object("foo", "bar");
  EXPECT_EQ(d1.getDefault("foo", "baz"), "bar");
  EXPECT_EQ(d1.getDefault("quux", "baz"), "baz");

  dynamic d2 = dynamic::object("foo", "bar");
  EXPECT_EQ(d2.setDefault("foo", "quux"), "bar");
  d2.setDefault("bar", dynamic::array).push_back(42);
  EXPECT_EQ(d2["bar"][0], 42);

  dynamic d3 = dynamic::object, empty = dynamic::object;
  EXPECT_EQ(d3.getDefault("foo"), empty);
  d3.setDefault("foo")["bar"] = "baz";
  EXPECT_EQ(d3["foo"]["bar"], "baz");

  // we do not allow getDefault/setDefault on arrays
  dynamic d4 = dynamic::array;
  EXPECT_ANY_THROW(d4.getDefault("foo", "bar"));
  EXPECT_ANY_THROW(d4.setDefault("foo", "bar"));

  // Using dynamic keys
  dynamic k10{10}, k20{20}, kTrue{true};
  dynamic d5 = dynamic::object(k10, "foo");
  EXPECT_EQ(d5.setDefault(k10, "bar"), "foo");
  EXPECT_EQ(d5.setDefault(k20, "bar"), "bar");
  EXPECT_EQ(d5.setDefault(kTrue, "baz"), "baz");
  EXPECT_EQ(d5.setDefault(StaticStrings::kA, "foo"), "foo");
  EXPECT_EQ(d5.setDefault(StaticStrings::kB, "foo"), "foo");
  EXPECT_EQ(d5.setDefault(StaticStrings::kFoo, "bar"), "bar");
  EXPECT_EQ(d5.setDefault(StaticStrings::kBar, "foo"), "foo");
}

TEST(Dynamic, ObjectForwarding) {
  // Make sure dynamic::object can be constructed the same way as any
  // dynamic.
  dynamic d = dynamic::object("asd", dynamic::array("foo", "bar"));
  // clang-format off
  dynamic d2 = dynamic::object("key2", dynamic::array("value", "words"))
                              ("key", "value1");
  // clang-format on
}

TEST(Dynamic, GetPtr) {
  dynamic array = dynamic::array(1, 2, "three");
  EXPECT_TRUE(array.get_ptr(0));
  EXPECT_FALSE(array.get_ptr(-1));
  EXPECT_FALSE(array.get_ptr(3));
  EXPECT_EQ(dynamic("three"), *array.get_ptr(2));
  const dynamic& carray = array;
  EXPECT_EQ(dynamic("three"), *carray.get_ptr(2));

  dynamic object = dynamic::object("one", 1)("two", 2);
  EXPECT_TRUE(object.get_ptr("one"));
  EXPECT_FALSE(object.get_ptr("three"));
  EXPECT_EQ(dynamic(2), *object.get_ptr("two"));
  *object.get_ptr("one") = 11;
  EXPECT_EQ(dynamic(11), *object.get_ptr("one"));
  const dynamic& cobject = object;
  EXPECT_EQ(dynamic(2), *cobject.get_ptr("two"));
}

TEST(Dynamic, Assignment) {
  const dynamic ds[] = {
      dynamic::array(1, 2, 3),
      dynamic::object("a", true),
      24,
      26.5,
      true,
      "hello",
  };
  const dynamic dd[] = {
      dynamic::array(5, 6),
      dynamic::object("t", "T")(1, 7),
      9000,
      3.14159,
      false,
      "world",
  };
  for (const auto& source : ds) {
    for (const auto& dest : dd) {
      dynamic tmp(dest);
      EXPECT_EQ(tmp, dest);
      tmp = source;
      EXPECT_EQ(tmp, source);
    }
  }
}

std::string make_long_string() {
  return std::string(100, 'a');
}

TEST(Dynamic, GetDefault) {
  const auto s = make_long_string();
  dynamic kDynamicKey{10};
  dynamic ds(s);
  dynamic tmp(s);
  dynamic d1 = dynamic::object("key1", s);
  dynamic d2 = dynamic::object("key2", s);
  dynamic d3 = dynamic::object("key3", s);
  dynamic d4 = dynamic::object("key4", s);
  // lvalue - lvalue
  dynamic ayy("ayy");
  EXPECT_EQ(ds, d1.getDefault("key1", ayy));
  EXPECT_EQ(ds, d1.getDefault("key1", ayy));
  EXPECT_EQ(ds, d1.getDefault("not-a-key", tmp));
  EXPECT_EQ(ds, d1.getDefault(StaticStrings::kA, tmp));
  EXPECT_EQ(ds, d1.getDefault(StaticStrings::kB, tmp));
  EXPECT_EQ(ds, d1.getDefault(StaticStrings::kFoo, tmp));
  EXPECT_EQ(ds, d1.getDefault(StaticStrings::kBar, tmp));
  EXPECT_EQ(ds, d1.getDefault(kDynamicKey, tmp));
  EXPECT_EQ(ds, tmp);
  // lvalue - rvalue
  EXPECT_EQ(ds, d1.getDefault("key1", "ayy"));
  EXPECT_EQ(ds, d1.getDefault("key1", "ayy"));
  EXPECT_EQ(ds, d1.getDefault("not-a-key", std::move(tmp)));
  EXPECT_NE(ds, tmp);
  tmp = s;
  EXPECT_EQ(ds, d1.getDefault(StaticStrings::kA, std::move(tmp)));
  EXPECT_NE(ds, tmp);
  tmp = s;
  EXPECT_EQ(ds, d1.getDefault(StaticStrings::kB, std::move(tmp)));
  EXPECT_NE(ds, tmp);
  tmp = s;
  EXPECT_EQ(ds, d1.getDefault(StaticStrings::kFoo, std::move(tmp)));
  EXPECT_NE(ds, tmp);
  tmp = s;
  EXPECT_EQ(ds, d1.getDefault(StaticStrings::kBar, std::move(tmp)));
  EXPECT_NE(ds, tmp);
  tmp = s;
  EXPECT_EQ(ds, d1.getDefault(kDynamicKey, std::move(tmp)));
  EXPECT_NE(ds, tmp);
  // rvalue - lvalue
  tmp = s;
  EXPECT_EQ(ds, std::move(d1).getDefault("key1", ayy));
  EXPECT_NE(ds, d1["key1"]);
  EXPECT_EQ(ds, std::move(d2).getDefault("not-a-key", tmp));
  EXPECT_EQ(dynamic(dynamic::object("key2", s)), d2);
  EXPECT_EQ(ds, tmp);
  EXPECT_EQ(ds, std::move(d2).getDefault(StaticStrings::kA, tmp));
  EXPECT_EQ(dynamic(dynamic::object("key2", s)), d2);
  EXPECT_EQ(ds, tmp);
  EXPECT_EQ(ds, std::move(d2).getDefault(StaticStrings::kB, tmp));
  EXPECT_EQ(dynamic(dynamic::object("key2", s)), d2);
  EXPECT_EQ(ds, tmp);
  EXPECT_EQ(ds, std::move(d2).getDefault(StaticStrings::kFoo, tmp));
  EXPECT_EQ(dynamic(dynamic::object("key2", s)), d2);
  EXPECT_EQ(ds, tmp);
  EXPECT_EQ(ds, std::move(d2).getDefault(StaticStrings::kBar, tmp));
  EXPECT_EQ(dynamic(dynamic::object("key2", s)), d2);
  EXPECT_EQ(ds, tmp);
  EXPECT_EQ(ds, std::move(d2).getDefault(kDynamicKey, tmp));
  EXPECT_EQ(dynamic(dynamic::object("key2", s)), d2);
  EXPECT_EQ(ds, tmp);
  // rvalue - rvalue
  EXPECT_EQ(ds, std::move(d3).getDefault("key3", std::move(tmp)));
  EXPECT_NE(ds, d3["key3"]);
  EXPECT_EQ(ds, tmp);
  EXPECT_EQ(ds, std::move(d4).getDefault("not-a-key", std::move(tmp)));
  EXPECT_EQ(dynamic(dynamic::object("key4", s)), d4);
  EXPECT_NE(ds, tmp);
  tmp = s;
  EXPECT_EQ(ds, std::move(d4).getDefault(StaticStrings::kA, std::move(tmp)));
  EXPECT_EQ(dynamic(dynamic::object("key4", s)), d4);
  EXPECT_NE(ds, tmp);
  tmp = s;
  EXPECT_EQ(ds, std::move(d4).getDefault(StaticStrings::kB, std::move(tmp)));
  EXPECT_EQ(dynamic(dynamic::object("key4", s)), d4);
  EXPECT_NE(ds, tmp);
  tmp = s;
  EXPECT_EQ(ds, std::move(d4).getDefault(StaticStrings::kFoo, std::move(tmp)));
  EXPECT_EQ(dynamic(dynamic::object("key4", s)), d4);
  EXPECT_NE(ds, tmp);
  tmp = s;
  EXPECT_EQ(ds, std::move(d4).getDefault(StaticStrings::kBar, std::move(tmp)));
  EXPECT_EQ(dynamic(dynamic::object("key4", s)), d4);
  EXPECT_NE(ds, tmp);
  tmp = s;
  EXPECT_EQ(ds, std::move(d4).getDefault(kDynamicKey, std::move(tmp)));
  EXPECT_EQ(dynamic(dynamic::object("key4", s)), d4);
  EXPECT_NE(ds, tmp);
}

TEST(Dynamic, GetString) {
  const dynamic c(make_long_string());
  dynamic d(make_long_string());
  dynamic m(make_long_string());

  auto s = make_long_string();

  EXPECT_EQ(s, c.getString());
  EXPECT_EQ(s, c.getString());

  d.getString() += " hello";
  EXPECT_EQ(s + " hello", d.getString());
  EXPECT_EQ(s + " hello", d.getString());

  EXPECT_EQ(s, std::move(m).getString());
  EXPECT_EQ(s, m.getString());
  auto moved = std::move(m).getString();
  EXPECT_EQ(s, moved);
  EXPECT_NE(dynamic(s), m);
}

TEST(Dynamic, GetSmallThings) {
  const dynamic cint(5);
  const dynamic cdouble(5.0);
  const dynamic cbool(true);
  dynamic dint(5);
  dynamic ddouble(5.0);
  dynamic dbool(true);
  dynamic mint(5);
  dynamic mdouble(5.0);
  dynamic mbool(true);

  EXPECT_EQ(5, cint.getInt());
  dint.getInt() = 6;
  EXPECT_EQ(6, dint.getInt());
  EXPECT_EQ(5, std::move(mint).getInt());

  EXPECT_EQ(5.0, cdouble.getDouble());
  ddouble.getDouble() = 6.0;
  EXPECT_EQ(6.0, ddouble.getDouble());
  EXPECT_EQ(5.0, std::move(mdouble).getDouble());

  EXPECT_TRUE(cbool.getBool());
  dbool.getBool() = false;
  EXPECT_FALSE(dbool.getBool());
  EXPECT_TRUE(std::move(mbool).getBool());
}

TEST(Dynamic, At) {
  const dynamic cd = dynamic::object("key1", make_long_string());
  dynamic dd = dynamic::object("key1", make_long_string());
  dynamic md = dynamic::object("key1", make_long_string());

  dynamic ds(make_long_string());
  EXPECT_EQ(ds, cd.at("key1"));
  EXPECT_EQ(ds, cd.at("key1"));

  dd.at("key1").getString() += " hello";
  EXPECT_EQ(dynamic(make_long_string() + " hello"), dd.at("key1"));
  EXPECT_EQ(dynamic(make_long_string() + " hello"), dd.at("key1"));

  EXPECT_EQ(ds, std::move(md).at("key1")); // move available, but not performed
  EXPECT_EQ(ds, md.at("key1"));
  dynamic moved = std::move(md).at("key1"); // move performed
  EXPECT_EQ(ds, moved);
  EXPECT_NE(ds, md.at("key1"));
}

TEST(Dynamic, Brackets) {
  const dynamic cd = dynamic::object("key1", make_long_string());
  dynamic dd = dynamic::object("key1", make_long_string());
  dynamic md = dynamic::object("key1", make_long_string());

  dynamic ds(make_long_string());
  EXPECT_EQ(ds, cd["key1"]);
  EXPECT_EQ(ds, cd["key1"]);

  dd["key1"].getString() += " hello";
  EXPECT_EQ(dynamic(make_long_string() + " hello"), dd["key1"]);
  EXPECT_EQ(dynamic(make_long_string() + " hello"), dd["key1"]);

  EXPECT_EQ(ds, std::move(md)["key1"]); // move available, but not performed
  EXPECT_EQ(ds, md["key1"]);
  dynamic moved = std::move(md)["key1"]; // move performed
  EXPECT_EQ(ds, moved);
  EXPECT_NE(ds, md["key1"]);
}

TEST(Dynamic, PrintNull) {
  std::stringstream ss;
  ss << folly::dynamic(nullptr);
  EXPECT_EQ("null", ss.str());
}

TEST(Dynamic, WriteThroughArrayIterators) {
  dynamic const cint(0);
  dynamic d = dynamic::array(cint, cint, cint);
  size_t size = d.size();

  for (auto& val : d) {
    EXPECT_EQ(val, cint);
  }
  EXPECT_EQ(d.size(), size);

  dynamic ds(make_long_string());
  for (auto& val : d) {
    val = ds; // assign through reference
  }

  ds = "short string";
  dynamic ds2(make_long_string());

  for (auto& val : d) {
    EXPECT_EQ(val, ds2);
  }
  EXPECT_EQ(d.size(), size);
}

TEST(Dynamic, MoveOutOfArrayIterators) {
  dynamic ds(make_long_string());
  dynamic d = dynamic::array(ds, ds, ds);
  size_t size = d.size();

  for (auto& val : d) {
    EXPECT_EQ(val, ds);
  }
  EXPECT_EQ(d.size(), size);

  for (auto& val : d) {
    dynamic waste = std::move(val); // force moving out
    EXPECT_EQ(waste, ds);
  }

  for (auto& val : d) {
    EXPECT_NE(val, ds);
  }
  EXPECT_EQ(d.size(), size);
}

TEST(Dynamic, WriteThroughObjectIterators) {
  dynamic const cint(0);
  dynamic d = dynamic::object("key1", cint)("key2", cint);
  size_t size = d.size();

  for (auto& val : d.items()) {
    EXPECT_EQ(val.second, cint);
  }
  EXPECT_EQ(d.size(), size);

  dynamic ds(make_long_string());
  for (auto& val : d.items()) {
    val.second = ds; // assign through reference
  }

  ds = "short string";
  dynamic ds2(make_long_string());
  for (auto& val : d.items()) {
    EXPECT_EQ(val.second, ds2);
  }
  EXPECT_EQ(d.size(), size);
}

TEST(Dynamic, MoveOutOfObjectIterators) {
  dynamic ds(make_long_string());
  dynamic d = dynamic::object("key1", ds)("key2", ds);
  size_t size = d.size();

  for (auto& val : d.items()) {
    EXPECT_EQ(val.second, ds);
  }
  EXPECT_EQ(d.size(), size);

  for (auto& val : d.items()) {
    dynamic waste = std::move(val.second); // force moving out
    EXPECT_EQ(waste, ds);
  }

  for (auto& val : d.items()) {
    EXPECT_NE(val.second, ds);
  }
  EXPECT_EQ(d.size(), size);
}

TEST(Dynamic, ArrayIteratorInterop) {
  dynamic d = dynamic::array(0, 1, 2);
  dynamic const& cdref = d;

  auto it = d.begin();
  auto cit = cdref.begin();

  EXPECT_EQ(it, cit);
  EXPECT_EQ(cit, d.begin());
  EXPECT_EQ(it, cdref.begin());

  // Erase using non-const iterator
  it = d.erase(it);
  cit = cdref.begin();
  EXPECT_EQ(*it, 1);
  EXPECT_EQ(cit, it);

  // Assign from non-const to const, preserve equality
  decltype(cit) cit2 = it;
  EXPECT_EQ(cit, cit2);
}

TEST(Dynamic, ObjectIteratorInterop) {
  dynamic ds = make_long_string();
  dynamic d = dynamic::object(0, ds)(1, ds)(2, ds);
  dynamic const& cdref = d;

  auto it = d.find(0);
  auto cit = cdref.find(0);
  EXPECT_NE(it, cdref.items().end());
  EXPECT_NE(cit, cdref.items().end());
  EXPECT_EQ(it, cit);

  ++cit;
  // Erase using non-const iterator
  auto it2 = d.erase(it);
  EXPECT_EQ(cit, it2);

  // Assign from non-const to const, preserve equality
  decltype(cit) cit2 = it2;
  EXPECT_EQ(cit, cit2);
}

TEST(Dynamic, MergePatchWithNonObject) {
  dynamic target = dynamic::object("a", "b")("c", "d");

  dynamic patch = dynamic::array(1, 2, 3);
  target.merge_patch(patch);

  EXPECT_TRUE(target.isArray());
}

TEST(Dynamic, MergePatchReplaceInFlatObject) {
  dynamic target = dynamic::object("a", "b")("c", "d");
  dynamic patch = dynamic::object("a", "z");

  target.merge_patch(patch);

  EXPECT_EQ("z", target["a"].getString());
  EXPECT_EQ("d", target["c"].getString());
}

TEST(Dynamic, MergePatchAddInFlatObject) {
  dynamic target = dynamic::object("a", "b")("c", "d");
  dynamic patch = dynamic::object("e", "f");
  target.merge_patch(patch);

  EXPECT_EQ("b", target["a"].getString());
  EXPECT_EQ("d", target["c"].getString());
  EXPECT_EQ("f", target["e"].getString());
}

TEST(Dynamic, MergePatchReplaceInNestedObject) {
  dynamic target = dynamic::object("a", dynamic::object("d", 10))("b", "c");
  dynamic patch = dynamic::object("a", dynamic::object("d", 100));
  target.merge_patch(patch);

  EXPECT_EQ(100, target["a"]["d"].getInt());
  EXPECT_EQ("c", target["b"].getString());
}

TEST(Dynamic, MergePatchAddInNestedObject) {
  dynamic target = dynamic::object("a", dynamic::object("d", 10))("b", "c");
  dynamic patch = dynamic::object("a", dynamic::object("e", "f"));

  target.merge_patch(patch);

  EXPECT_EQ(10, target["a"]["d"].getInt());
  EXPECT_EQ("f", target["a"]["e"].getString());
  EXPECT_EQ("c", target["b"].getString());
}

TEST(Dynamic, MergeNestePatch) {
  dynamic target = dynamic::object("a", dynamic::object("d", 10))("b", "c");
  dynamic patch = dynamic::object(
      "a", dynamic::object("d", dynamic::array(1, 2, 3)))("b", 100);
  target.merge_patch(patch);

  EXPECT_EQ(100, target["b"].getInt());
  {
    auto ary = patch["a"]["d"];
    ASSERT_TRUE(ary.isArray());
    EXPECT_EQ(1, ary[0].getInt());
    EXPECT_EQ(2, ary[1].getInt());
    EXPECT_EQ(3, ary[2].getInt());
  }
}

TEST(Dynamic, MergePatchRemoveInFlatObject) {
  dynamic target = dynamic::object("a", "b")("c", "d");
  dynamic patch = dynamic::object("c", nullptr);
  target.merge_patch(patch);

  EXPECT_EQ("b", target["a"].getString());
  EXPECT_EQ(0, target.count("c"));
}

TEST(Dynamic, MergePatchRemoveInNestedObject) {
  dynamic target =
      dynamic::object("a", dynamic::object("d", 10)("e", "f"))("b", "c");
  dynamic patch = dynamic::object("a", dynamic::object("e", nullptr));
  target.merge_patch(patch);

  EXPECT_EQ(10, target["a"]["d"].getInt());
  EXPECT_EQ(0, target["a"].count("e"));
  EXPECT_EQ("c", target["b"].getString());
}

TEST(Dynamic, MergePatchRemoveNonExistent) {
  dynamic target = dynamic::object("a", "b")("c", "d");
  dynamic patch = dynamic::object("e", nullptr);
  target.merge_patch(patch);

  EXPECT_EQ("b", target["a"].getString());
  EXPECT_EQ("d", target["c"].getString());
  EXPECT_EQ(2, target.size());
}

TEST(Dynamic, MergeDiffFlatObjects) {
  dynamic source = dynamic::object("a", 0)("b", 1)("c", 2);
  dynamic target = dynamic::object("a", 1)("b", 2);
  auto patch = dynamic::merge_diff(source, target);

  EXPECT_EQ(3, patch.size());
  EXPECT_EQ(1, patch["a"].getInt());
  EXPECT_EQ(2, patch["b"].getInt());
  EXPECT_TRUE(patch["c"].isNull());

  source.merge_patch(patch);
  EXPECT_EQ(source, target);
}

TEST(Dynamic, MergeDiffNestedObjects) {
  dynamic source = dynamic::object("a", dynamic::object("b", 1)("c", 2))(
      "d", dynamic::array(1, 2, 3));
  dynamic target = dynamic::object("a", dynamic::object("b", 2))(
      "d", dynamic::array(2, 3, 4));

  auto patch = dynamic::merge_diff(source, target);

  EXPECT_EQ(2, patch.size());
  EXPECT_EQ(2, patch["a"].size());

  EXPECT_EQ(2, patch["a"]["b"].getInt());
  EXPECT_TRUE(patch["a"]["c"].isNull());

  EXPECT_TRUE(patch["d"].isArray());
  EXPECT_EQ(3, patch["d"].size());
  EXPECT_EQ(2, patch["d"][0].getInt());
  EXPECT_EQ(3, patch["d"][1].getInt());
  EXPECT_EQ(4, patch["d"][2].getInt());

  source.merge_patch(patch);
  EXPECT_EQ(source, target);
}

using folly::json_pointer;

TEST(Dynamic, JSONPointer) {
  dynamic target = dynamic::object;
  dynamic ary = dynamic::array("bar", "baz", dynamic::array("bletch", "xyzzy"));
  target["foo"] = ary;
  target[""] = 0;
  target["a/b"] = 1;
  target["c%d"] = 2;
  target["e^f"] = 3;
  target["g|h"] = 4;
  target["i\\j"] = 5;
  target["k\"l"] = 6;
  target[" "] = 7;
  target["m~n"] = 8;
  target["xyz"] = dynamic::object;
  target["xyz"][""] = dynamic::object("nested", "abc");
  target["xyz"]["def"] = dynamic::array(1, 2, 3);
  target["long_array"] = dynamic::array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
  target["-"] = dynamic::object("x", "y");

  EXPECT_EQ(target, *target.get_ptr(json_pointer::parse("")));
  EXPECT_EQ(ary, *(target.get_ptr(json_pointer::parse("/foo"))));
  EXPECT_EQ("bar", target.get_ptr(json_pointer::parse("/foo/0"))->getString());
  EXPECT_EQ(0, target.get_ptr(json_pointer::parse("/"))->getInt());
  EXPECT_EQ(1, target.get_ptr(json_pointer::parse("/a~1b"))->getInt());
  EXPECT_EQ(2, target.get_ptr(json_pointer::parse("/c%d"))->getInt());
  EXPECT_EQ(3, target.get_ptr(json_pointer::parse("/e^f"))->getInt());
  EXPECT_EQ(4, target.get_ptr(json_pointer::parse("/g|h"))->getInt());
  EXPECT_EQ(5, target.get_ptr(json_pointer::parse("/i\\j"))->getInt());
  EXPECT_EQ(6, target.get_ptr(json_pointer::parse("/k\"l"))->getInt());
  EXPECT_EQ(7, target.get_ptr(json_pointer::parse("/ "))->getInt());
  EXPECT_EQ(8, target.get_ptr(json_pointer::parse("/m~0n"))->getInt());
  // empty key in path
  EXPECT_EQ(
      "abc", target.get_ptr(json_pointer::parse("/xyz//nested"))->getString());
  EXPECT_EQ(3, target.get_ptr(json_pointer::parse("/xyz/def/2"))->getInt());
  EXPECT_EQ("baz", ary.get_ptr(json_pointer::parse("/1"))->getString());
  EXPECT_EQ("bletch", ary.get_ptr(json_pointer::parse("/2/0"))->getString());
  // double-digit index
  EXPECT_EQ(
      12, target.get_ptr(json_pointer::parse("/long_array/11"))->getInt());
  // allow '-' to index in objects
  EXPECT_EQ("y", target.get_ptr(json_pointer::parse("/-/x"))->getString());

  // invalid JSON pointers formatting when accessing array
  EXPECT_THROW(
      target.get_ptr(json_pointer::parse("/foo/01")), std::invalid_argument);

  // non-existent keys/indexes
  EXPECT_EQ(nullptr, ary.get_ptr(json_pointer::parse("/3")));
  EXPECT_EQ(nullptr, target.get_ptr(json_pointer::parse("/unknown_key")));
  // intermediate key not found
  EXPECT_EQ(nullptr, target.get_ptr(json_pointer::parse("/foox/test")));
  // Intermediate key is '-'
  EXPECT_EQ(nullptr, target.get_ptr(json_pointer::parse("/foo/-/key")));

  // invalid path in object (key in array)
  EXPECT_THROW(
      target.get_ptr(json_pointer::parse("/foo/1/bar")), folly::TypeError);

  // Allow "-" index in the array
  EXPECT_EQ(nullptr, target.get_ptr(json_pointer::parse("/foo/-")));
}
