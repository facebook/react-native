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

#include <folly/dynamic.h>

#include <folly/portability/GTest.h>

#include <boost/next_prior.hpp>

using folly::dynamic;

// This test runs without any external dependencies, including json.
// This means that if there's a test failure, there's no way to print
// a useful runtime representation of the folly::dynamic.  We will
// live with this in order to test dependencies.  This method is
// normally provided by json.cpp.
void dynamic::print_as_pseudo_json(std::ostream& out) const {
  out << "<folly::dynamic object of type " << type_ << ">";
}

TEST(Dynamic, Default) {
  dynamic obj;
  EXPECT_TRUE(obj.isNull());
}

TEST(Dynamic, ObjectBasics) {
  dynamic obj = dynamic::object("a", false);
  EXPECT_EQ(obj.at("a"), false);
  EXPECT_EQ(obj.size(), 1);
  obj.insert("a", true);
  EXPECT_EQ(obj.size(), 1);
  EXPECT_EQ(obj.at("a"), true);
  obj.at("a") = nullptr;
  EXPECT_EQ(obj.size(), 1);
  EXPECT_TRUE(obj.at("a") == nullptr);

  dynamic newObject = dynamic::object;

  newObject["z"] = 12;
  EXPECT_EQ(newObject.size(), 1);
  newObject["a"] = true;
  EXPECT_EQ(newObject.size(), 2);

  EXPECT_EQ(*newObject.keys().begin(), newObject.items().begin()->first);
  EXPECT_EQ(*newObject.values().begin(), newObject.items().begin()->second);
  std::vector<std::pair<std::string, dynamic>> found;
  found.emplace_back(newObject.keys().begin()->asString(),
                     *newObject.values().begin());

  EXPECT_EQ(*boost::next(newObject.keys().begin()),
            boost::next(newObject.items().begin())->first);
  EXPECT_EQ(*boost::next(newObject.values().begin()),
            boost::next(newObject.items().begin())->second);
  found.emplace_back(boost::next(newObject.keys().begin())->asString(),
                     *boost::next(newObject.values().begin()));

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

  // We don't allow objects as keys in objects.
  EXPECT_ANY_THROW(newObject[d3] = 12);

  // Merge two objects
  dynamic origMergeObj1 = folly::dynamic::object();
  dynamic mergeObj1 = origMergeObj1 = folly::dynamic::object
    ("key1", "value1")
    ("key2", "value2");
  dynamic mergeObj2 = folly::dynamic::object
    ("key2", "value3")
    ("key3", "value4");

  // Merged object where we prefer the values in mergeObj2
  dynamic combinedPreferObj2 = folly::dynamic::object
    ("key1", "value1")
    ("key2", "value3")
    ("key3", "value4");

  // Merged object where we prefer the values in mergeObj1
  dynamic combinedPreferObj1 = folly::dynamic::object
    ("key1", "value1")
    ("key2", "value2")
    ("key3", "value4");

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

TEST(Dynamic, ObjectErase) {
  dynamic obj = dynamic::object("key1", "val")
                               ("key2", "val2");
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
  auto ret = obj.erase(boost::next(obj.items().begin()), obj.items().end());
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

  arr.erase(boost::next(arr.begin()), boost::prior(arr.end()));
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

  dynamic obj =
    dynamic::object("a", "b")
                   ("c", dynamic::array("d", "e", "f"));
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
    LOG(ERROR) << "operator < returned "
               << static_cast<int>(foo)
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
}

TEST(Dynamic, ObjectForwarding) {
  // Make sure dynamic::object can be constructed the same way as any
  // dynamic.
  dynamic d = dynamic::object("asd", dynamic::array("foo", "bar"));
  dynamic d2 = dynamic::object("key2", dynamic::array("value", "words"))
                              ("key", "value1");
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
  const dynamic ds[] = { dynamic::array(1, 2, 3),
                         dynamic::object("a", true),
                         24,
                         26.5,
                         true,
                         "hello", };
  const dynamic dd[] = { dynamic::array(5, 6),
                         dynamic::object("t", "T")(1, 7),
                         9000,
                         3.14159,
                         false,
                         "world", };
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
  EXPECT_EQ(ds, tmp);
  // lvalue - rvalue
  EXPECT_EQ(ds, d1.getDefault("key1", "ayy"));
  EXPECT_EQ(ds, d1.getDefault("key1", "ayy"));
  EXPECT_EQ(ds, d1.getDefault("not-a-key", std::move(tmp)));
  EXPECT_NE(ds, tmp);
  // rvalue - lvalue
  tmp = s;
  EXPECT_EQ(ds, std::move(d1).getDefault("key1", ayy));
  EXPECT_NE(ds, d1["key1"]);
  EXPECT_EQ(ds, std::move(d2).getDefault("not-a-key", tmp));
  EXPECT_EQ(dynamic(dynamic::object("key2", s)), d2);
  EXPECT_EQ(ds, tmp);
  // rvalue - rvalue
  EXPECT_EQ(ds, std::move(d3).getDefault("key3", std::move(tmp)));
  EXPECT_NE(ds, d3["key3"]);
  EXPECT_EQ(ds, tmp);
  EXPECT_EQ(ds, std::move(d4).getDefault("not-a-key", std::move(tmp)));
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

  EXPECT_EQ(true, cbool.getBool());
  dbool.getBool() = false;
  EXPECT_FALSE(dbool.getBool());
  EXPECT_EQ(true, std::move(mbool).getBool());
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
