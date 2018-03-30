/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "CoreClasses.h"

namespace facebook {
namespace jni {

/**
 * JavaClass which represents a reference to a java.util.Iterator instance.  It
 * provides begin()/end() methods to provide C++-style iteration over the
 * underlying collection.  The class has a template parameter for the element
 * type, which defaults to jobject.  For example:
 *
 * alias_ref<JIterator<jstring>::javaobject> my_iter = ...;
 *
 * In the simplest case, it can be used just as alias_ref<JIterator<>::javaobject>,
 * for example in a method declaration.
 */
template <typename E = jobject>
struct JIterator : JavaClass<JIterator<E>> {
  constexpr static auto kJavaDescriptor = "Ljava/util/Iterator;";

  struct Iterator;

  /**
   * To iterate:
   *
   * for (const auto& element : *jiter) { ... }
   *
   * The JIterator iterator value_type is local_ref<E>, containing a reference
   * to an element instance.
   *
   * If the Iterator returns objects whch are not convertible to the given
   * element type, iteration will throw a java ClassCastException.
   *
   * For example, to convert an iterator over a collection of java strings to
   * an std::vector of std::strings:
   *
   * std::vector<std::string> vs;
   * for (const auto& elem : *jiter) {
   *    vs.push_back(elem->toStdString());
   * }
   *
   * Or if you prefer using std algorithms:
   *
   * std::vector<std::string> vs;
   * std::transform(jiter->begin(), jiter->end(), std::back_inserter(vs),
   *                [](const local_ref<jstring>& elem) { return elem->toStdString(); });
   *
   * The iterator is a InputIterator.
   */
  Iterator begin() const;
  Iterator end() const;
};

/**
 * Similar to JIterator, except this represents any object which implements the
 * java.lang.Iterable interface. It will create the Java Iterator as a part of
 * begin().
 */
template <typename E = jobject>
struct JIterable : JavaClass<JIterable<E>> {
  constexpr static auto kJavaDescriptor = "Ljava/lang/Iterable;";

  struct Iterator;

  Iterator begin() const;
  Iterator end() const;
};

/**
 * JavaClass types which represent Collection, List, and Set are also provided.
 * These preserve the Java class heirarchy.
 */
template <typename E = jobject>
struct JCollection : JavaClass<JCollection<E>, JIterable<E>> {
  constexpr static auto kJavaDescriptor = "Ljava/util/Collection;";

  /**
   * Returns the number of elements in the collection.
   */
  size_t size() const;
};

template <typename E = jobject>
struct JList : JavaClass<JList<E>, JCollection<E>> {
  constexpr static auto kJavaDescriptor = "Ljava/util/List;";
};

template <typename E = jobject>
struct JSet : JavaClass<JSet<E>, JCollection<E>> {
  constexpr static auto kJavaDescriptor = "Ljava/util/Set;";
};

/**
 * JavaClass which represents a reference to a java.util.Map instance.  It adds
 * wrappers around Java methods, including begin()/end() methods to provide
 * C++-style iteration over the Java Map.  The class has template parameters
 * for the key and value types, which default to jobject.  For example:
 *
 * alias_ref<JMap<jstring, MyJClass::javaobject>::javaobject> my_map = ...;
 *
 * In the simplest case, it can be used just as alias_ref<JMap<>::javaobject>,
 * for example in a method declaration.
 */
template <typename K = jobject, typename V = jobject>
struct JMap : JavaClass<JMap<K,V>> {
  constexpr static auto kJavaDescriptor = "Ljava/util/Map;";

  struct Iterator;

  /**
   * Returns the number of pairs in the map.
   */
  size_t size() const;

  /**
   * To iterate over the Map:
   *
   * for (const auto& entry : *jmap) { ... }
   *
   * The JMap iterator value_type is std::pair<local_ref<K>, local_ref<V>>
   * containing references to key and value instances.
   *
   * If the Map contains objects whch are not convertible to the given key and
   * value types, iteration will throw a java ClassCastException.
   *
   * The iterator is a InputIterator.
   */
  Iterator begin() const;
  Iterator end() const;
};

}
}

#include "Iterator-inl.h"
