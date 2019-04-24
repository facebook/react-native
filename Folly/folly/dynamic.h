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

/**
 * This is a runtime dynamically typed value.  It holds types from a
 * specific predetermined set of types (ints, bools, arrays, etc).  In
 * particular, it can be used as a convenient in-memory representation
 * for complete json objects.
 *
 * In general you can try to use these objects as if they were the
 * type they represent (although in some cases with a slightly less
 * complete interface than the raw type), and it'll just throw a
 * TypeError if it is used in an illegal way.
 *
 * Some examples:
 *
 *   dynamic twelve = 12;
 *   dynamic str = "string";
 *   dynamic map = dynamic::object;
 *   map[str] = twelve;
 *   map[str + "another_str"] = dynamic::array("array", "of", 4, "elements");
 *   map.insert("null_element", nullptr);
 *   ++map[str];
 *   assert(map[str] == 13);
 *
 *   // Building a complex object with a sub array inline:
 *   dynamic d = dynamic::object
 *     ("key", "value")
 *     ("key2", dynamic::array("a", "array"))
 *     ;
 *
 * Also see folly/json.h for the serialization and deserialization
 * functions for JSON.
 *
 * Additional documentation is in folly/docs/Dynamic.md.
 *
 * @author Jordan DeLong <delong.j@fb.com>
 */

#pragma once

#include <cstdint>
#include <memory>
#include <ostream>
#include <string>
#include <type_traits>
#include <utility>
#include <vector>

#include <boost/operators.hpp>

#include <folly/Range.h>
#include <folly/Traits.h>
#include <folly/container/F14Map.h>
#include <folly/json_pointer.h>

namespace folly {

//////////////////////////////////////////////////////////////////////

struct dynamic;
struct TypeError;

//////////////////////////////////////////////////////////////////////

struct dynamic : private boost::operators<dynamic> {
  enum Type {
    NULLT,
    ARRAY,
    BOOL,
    DOUBLE,
    INT64,
    OBJECT,
    STRING,
  };
  template <class T, class Enable = void>
  struct NumericTypeHelper;

  /*
   * We support direct iteration of arrays, and indirect iteration of objects.
   * See begin(), end(), keys(), values(), and items() for more.
   *
   * Array iterators dereference as the elements in the array.
   * Object key iterators dereference as the keys in the object.
   * Object value iterators dereference as the values in the object.
   * Object item iterators dereference as pairs of (key, value).
   */
 private:
  typedef std::vector<dynamic> Array;

  /*
   * Violating spec, std::vector<bool>::const_reference is not bool in libcpp:
   * http://howardhinnant.github.io/onvectorbool.html
   *
   * This is used to add a public ctor which is only enabled under libcpp taking
   * std::vector<bool>::const_reference without using the preprocessor.
   */
  struct VectorBoolConstRefFake : std::false_type {};
  using VectorBoolConstRefCtorType = std::conditional_t<
      std::is_same<std::vector<bool>::const_reference, bool>::value,
      VectorBoolConstRefFake,
      std::vector<bool>::const_reference>;

 public:
  typedef Array::iterator iterator;
  typedef Array::const_iterator const_iterator;
  typedef dynamic value_type;

  struct const_key_iterator;
  struct const_value_iterator;
  struct const_item_iterator;

  struct value_iterator;
  struct item_iterator;

  /*
   * Creation routines for making dynamic objects and arrays.  Objects
   * are maps from key to value (so named due to json-related origins
   * here).
   *
   * Example:
   *
   *   // Make a fairly complex dynamic:
   *   dynamic d = dynamic::object("key", "value1")
   *                              ("key2", dynamic::array("value",
   *                                                      "with",
   *                                                      4,
   *                                                      "words"));
   *
   *   // Build an object in a few steps:
   *   dynamic d = dynamic::object;
   *   d["key"] = 12;
   *   d["something_else"] = dynamic::array(1, 2, 3, nullptr);
   */
 private:
  struct EmptyArrayTag {};
  struct ObjectMaker;

 public:
  static void array(EmptyArrayTag);
  template <class... Args>
  static dynamic array(Args&&... args);

  static ObjectMaker object();
  static ObjectMaker object(dynamic, dynamic);

  /**
   * Default constructor, initializes with nullptr.
   */
  dynamic();

  /*
   * String compatibility constructors.
   */
  /* implicit */ dynamic(std::nullptr_t);
  /* implicit */ dynamic(StringPiece val);
  /* implicit */ dynamic(char const* val);
  /* implicit */ dynamic(std::string val);

  /*
   * This is part of the plumbing for array() and object(), above.
   * Used to create a new array or object dynamic.
   */
  /* implicit */ dynamic(void (*)(EmptyArrayTag));
  /* implicit */ dynamic(ObjectMaker (*)());
  /* implicit */ dynamic(ObjectMaker const&) = delete;
  /* implicit */ dynamic(ObjectMaker&&);

  /*
   * Constructors for integral and float types.
   * Other types are SFINAEd out with NumericTypeHelper.
   */
  template <class T, class NumericType = typename NumericTypeHelper<T>::type>
  /* implicit */ dynamic(T t);

  /*
   * If v is vector<bool>, v[idx] is a proxy object implicitly convertible to
   * bool. Calling a function f(dynamic) with f(v[idx]) would require a double
   * implicit conversion (reference -> bool -> dynamic) which is not allowed,
   * hence we explicitly accept the reference proxy.
   */
  /* implicit */ dynamic(std::vector<bool>::reference val);
  /* implicit */ dynamic(VectorBoolConstRefCtorType val);

  /*
   * Create a dynamic that is an array of the values from the supplied
   * iterator range.
   */
  template <class Iterator>
  explicit dynamic(Iterator first, Iterator last);

  dynamic(dynamic const&);
  dynamic(dynamic&&) noexcept;
  ~dynamic() noexcept;

  /*
   * "Deep" equality comparison.  This will compare all the way down
   * an object or array, and is potentially expensive.
   */
  bool operator==(dynamic const& o) const;

  /*
   * For all types except object this returns the natural ordering on
   * those types.  For objects, we throw TypeError.
   */
  bool operator<(dynamic const& o) const;

  /*
   * General operators.
   *
   * These throw TypeError when used with types or type combinations
   * that don't support them.
   *
   * These functions may also throw if you use 64-bit integers with
   * doubles when the integers are too big to fit in a double.
   */
  dynamic& operator+=(dynamic const&);
  dynamic& operator-=(dynamic const&);
  dynamic& operator*=(dynamic const&);
  dynamic& operator/=(dynamic const&);
  dynamic& operator%=(dynamic const&);
  dynamic& operator|=(dynamic const&);
  dynamic& operator&=(dynamic const&);
  dynamic& operator^=(dynamic const&);
  dynamic& operator++();
  dynamic& operator--();

  /*
   * Assignment from other dynamics.  Because of the implicit conversion
   * to dynamic from its potential types, you can use this to change the
   * type pretty intuitively.
   *
   * Basic guarantee only.
   */
  dynamic& operator=(dynamic const&);
  dynamic& operator=(dynamic&&) noexcept;

  /*
   * For simple dynamics (not arrays or objects), this prints the
   * value to an std::ostream in the expected way.  Respects the
   * formatting manipulators that have been sent to the stream
   * already.
   *
   * If the dynamic holds an object or array, this prints them in a
   * format very similar to JSON.  (It will in fact actually be JSON
   * as long as the dynamic validly represents a JSON object---i.e. it
   * can't have non-string keys.)
   */
  friend std::ostream& operator<<(std::ostream&, dynamic const&);

  /*
   * Returns true if this dynamic is of the specified type.
   */
  bool isString() const;
  bool isObject() const;
  bool isBool() const;
  bool isNull() const;
  bool isArray() const;
  bool isDouble() const;
  bool isInt() const;

  /*
   * Returns: isInt() || isDouble().
   */
  bool isNumber() const;

  /*
   * Returns the type of this dynamic.
   */
  Type type() const;

  /*
   * Returns the type of this dynamic as a printable string.
   */
  const char* typeName() const;

  /*
   * Extract a value while trying to convert to the specified type.
   * Throws exceptions if we cannot convert from the real type to the
   * requested type.
   *
   * Note you can only use this to access integral types or strings,
   * since arrays and objects are generally best dealt with as a
   * dynamic.
   */
  std::string asString() const;
  double asDouble() const;
  int64_t asInt() const;
  bool asBool() const;

  /*
   * Extract the value stored in this dynamic without type conversion.
   *
   * These will throw a TypeError if the dynamic has a different type.
   */
  const std::string& getString() const&;
  double getDouble() const&;
  int64_t getInt() const&;
  bool getBool() const&;
  std::string& getString() &;
  double& getDouble() &;
  int64_t& getInt() &;
  bool& getBool() &;
  std::string&& getString() &&;
  double getDouble() &&;
  int64_t getInt() &&;
  bool getBool() &&;

  /*
   * It is occasionally useful to access a string's internal pointer
   * directly, without the type conversion of `asString()`.
   *
   * These will throw a TypeError if the dynamic is not a string.
   */
  const char* data() const&;
  const char* data() && = delete;
  const char* c_str() const&;
  const char* c_str() && = delete;
  StringPiece stringPiece() const;

  /*
   * Returns: true if this dynamic is null, an empty array, an empty
   * object, or an empty string.
   */
  bool empty() const;

  /*
   * If this is an array or an object, returns the number of elements
   * contained.  If it is a string, returns the length.  Otherwise
   * throws TypeError.
   */
  std::size_t size() const;

  /*
   * You can iterate over the values of the array.  Calling these on
   * non-arrays will throw a TypeError.
   */
  const_iterator begin() const;
  const_iterator end() const;
  iterator begin();
  iterator end();

 private:
  /*
   * Helper object returned by keys(), values(), and items().
   */
  template <class T>
  struct IterableProxy;

  /*
   * Helper for heterogeneous lookup and mutation on objects: at(), find(),
   * count(), erase(), operator[]
   */
  template <typename K, typename T>
  using IfIsNonStringDynamicConvertible = std::enable_if_t<
      !std::is_convertible<K, StringPiece>::value &&
          std::is_convertible<K, dynamic>::value,
      T>;

 public:
  /*
   * You can iterate over the keys, values, or items (std::pair of key and
   * value) in an object.  Calling these on non-objects will throw a TypeError.
   */
  IterableProxy<const_key_iterator> keys() const;
  IterableProxy<const_value_iterator> values() const;
  IterableProxy<const_item_iterator> items() const;
  IterableProxy<value_iterator> values();
  IterableProxy<item_iterator> items();

  /*
   * AssociativeContainer-style find interface for objects.  Throws if
   * this is not an object.
   *
   * Returns: items().end() if the key is not present, or a
   * const_item_iterator pointing to the item.
   */
  template <typename K>
  IfIsNonStringDynamicConvertible<K, const_item_iterator> find(K&&) const;
  template <typename K>
  IfIsNonStringDynamicConvertible<K, item_iterator> find(K&&);

  const_item_iterator find(StringPiece) const;
  item_iterator find(StringPiece);

  /*
   * If this is an object, returns whether it contains a field with
   * the given name.  Otherwise throws TypeError.
   */
  template <typename K>
  IfIsNonStringDynamicConvertible<K, std::size_t> count(K&&) const;

  std::size_t count(StringPiece) const;

  /*
   * For objects or arrays, provides access to sub-fields by index or
   * field name.
   *
   * Using these with dynamic objects that are not arrays or objects
   * will throw a TypeError.  Using an index that is out of range or
   * object-element that's not present throws std::out_of_range.
   */
 private:
  dynamic const& atImpl(dynamic const&) const&;

 public:
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic const&> at(K&&) const&;
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic&> at(K&&) &;
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic&&> at(K&&) &&;

  dynamic const& at(StringPiece) const&;
  dynamic& at(StringPiece) &;
  dynamic&& at(StringPiece) &&;

  /*
   * Locate element using JSON pointer, per RFC 6901. Returns nullptr if
   * element could not be located. Throws if pointer does not match the
   * shape of the document, e.g. uses string to index in array.
   */
  const dynamic* get_ptr(json_pointer const&) const&;
  dynamic* get_ptr(json_pointer const&) &;
  const dynamic* get_ptr(json_pointer const&) const&& = delete;
  dynamic* get_ptr(json_pointer const&) && = delete;

  /*
   * Like 'at', above, except it returns either a pointer to the contained
   * object or nullptr if it wasn't found. This allows a key to be tested for
   * containment and retrieved in one operation. Example:
   *
   *   if (auto* found = d.get_ptr(key))
   *     // use *found;
   *
   * Using these with dynamic objects that are not arrays or objects
   * will throw a TypeError.
   */
 private:
  const dynamic* get_ptrImpl(dynamic const&) const&;

 public:
  template <typename K>
  IfIsNonStringDynamicConvertible<K, const dynamic*> get_ptr(K&&) const&;
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic*> get_ptr(K&&) &;
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic*> get_ptr(K&&) && = delete;

  const dynamic* get_ptr(StringPiece) const&;
  dynamic* get_ptr(StringPiece) &;
  dynamic* get_ptr(StringPiece) && = delete;

  /*
   * This works for access to both objects and arrays.
   *
   * In the case of an array, the index must be an integer, and this
   * will throw std::out_of_range if it is less than zero or greater
   * than size().
   *
   * In the case of an object, the non-const overload inserts a null
   * value if the key isn't present.  The const overload will throw
   * std::out_of_range if the key is not present.
   *
   * These functions do not invalidate iterators except when a null value
   * is inserted into an object as described above.
   */
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic&> operator[](K&&) &;
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic const&> operator[](K&&) const&;
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic&&> operator[](K&&) &&;

  dynamic& operator[](StringPiece) &;
  dynamic const& operator[](StringPiece) const&;
  dynamic&& operator[](StringPiece) &&;

  /*
   * Only defined for objects, throws TypeError otherwise.
   *
   * getDefault will return the value associated with the supplied key, the
   * supplied default otherwise. setDefault will set the key to the supplied
   * default if it is not yet set, otherwise leaving it. setDefault returns
   * a reference to the existing value if present, the new value otherwise.
   */
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic> getDefault(
      K&& k,
      const dynamic& v = dynamic::object) const&;
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic> getDefault(K&& k, dynamic&& v)
      const&;
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic> getDefault(
      K&& k,
      const dynamic& v = dynamic::object) &&;
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic> getDefault(K&& k, dynamic&& v) &&;

  dynamic getDefault(StringPiece k, const dynamic& v = dynamic::object) const&;
  dynamic getDefault(StringPiece k, dynamic&& v) const&;
  dynamic getDefault(StringPiece k, const dynamic& v = dynamic::object) &&;
  dynamic getDefault(StringPiece k, dynamic&& v) &&;

  template <typename K, typename V>
  IfIsNonStringDynamicConvertible<K, dynamic&> setDefault(K&& k, V&& v);
  template <typename V>
  dynamic& setDefault(StringPiece k, V&& v);
  // MSVC 2015 Update 3 needs these extra overloads because if V were a
  // defaulted template parameter, it causes MSVC to consider v an rvalue
  // reference rather than a universal reference, resulting in it not being
  // able to find the correct overload to construct a dynamic with.
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic&> setDefault(K&& k, dynamic&& v);
  template <typename K>
  IfIsNonStringDynamicConvertible<K, dynamic&> setDefault(
      K&& k,
      const dynamic& v = dynamic::object);

  dynamic& setDefault(StringPiece k, dynamic&& v);
  dynamic& setDefault(StringPiece k, const dynamic& v = dynamic::object);

  /*
   * Resizes an array so it has at n elements, using the supplied
   * default to fill new elements.  Throws TypeError if this dynamic
   * is not an array.
   *
   * May invalidate iterators.
   *
   * Post: size() == n
   */
  void resize(std::size_t n, dynamic const& = nullptr);

  /*
   * Inserts the supplied key-value pair to an object, or throws if
   * it's not an object. If the key already exists, insert will overwrite the
   * value, i.e., similar to insert_or_assign.
   *
   * Invalidates iterators.
   */
  template <class K, class V>
  void insert(K&&, V&& val);

  /*
   * These functions merge two folly dynamic objects.
   * The "update" and "update_missing" functions extend the object by
   *  inserting the key/value pairs of mergeObj into the current object.
   *  For update, if key is duplicated between the two objects, it
   *  will overwrite with the value of the object being inserted (mergeObj).
   *  For "update_missing", it will prefer the value in the original object
   *
   * The "merge" function creates a new object consisting of the key/value
   * pairs of both mergeObj1 and mergeObj2
   * If the key is duplicated between the two objects,
   *  it will prefer value in the second object (mergeObj2)
   */
  void update(const dynamic& mergeObj);
  void update_missing(const dynamic& other);
  static dynamic merge(const dynamic& mergeObj1, const dynamic& mergeObj2);

  /*
   * Implement recursive version of RFC7386: JSON merge patch. This modifies
   * the current object.
   */
  void merge_patch(const dynamic& patch);

  /*
   * Computes JSON merge patch (RFC7386) needed to mutate from source to target
   */
  static dynamic merge_diff(const dynamic& source, const dynamic& target);

  /*
   * Erase an element from a dynamic object, by key.
   *
   * Invalidates iterators to the element being erased.
   *
   * Returns the number of elements erased (i.e. 1 or 0).
   */
  template <typename K>
  IfIsNonStringDynamicConvertible<K, std::size_t> erase(K&&);

  std::size_t erase(StringPiece);

  /*
   * Erase an element from a dynamic object or array, using an
   * iterator or an iterator range.
   *
   * In arrays, invalidates iterators to elements after the element
   * being erased.  In objects, invalidates iterators to the elements
   * being erased.
   *
   * Returns a new iterator to the first element beyond any elements
   * removed, or end() if there are none.  (The iteration order does
   * not change.)
   */
  iterator erase(const_iterator it);
  iterator erase(const_iterator first, const_iterator last);

  const_key_iterator erase(const_key_iterator it);
  const_key_iterator erase(const_key_iterator first, const_key_iterator last);

  value_iterator erase(const_value_iterator it);
  value_iterator erase(const_value_iterator first, const_value_iterator last);

  item_iterator erase(const_item_iterator it);
  item_iterator erase(const_item_iterator first, const_item_iterator last);
  /*
   * Append elements to an array.  If this is not an array, throws
   * TypeError.
   *
   * Invalidates iterators.
   */
  void push_back(dynamic const&);
  void push_back(dynamic&&);

  /*
   * Remove an element from the back of an array.  If this is not an array,
   * throws TypeError.
   *
   * Does not invalidate iterators.
   */
  void pop_back();

  /*
   * Get a hash code.  This function is called by a std::hash<>
   * specialization, also.
   *
   * Throws TypeError if this is an object, array, or null.
   */
  std::size_t hash() const;

 private:
  friend struct TypeError;
  struct ObjectImpl;
  template <class T>
  struct TypeInfo;
  template <class T>
  struct CompareOp;
  template <class T>
  struct GetAddrImpl;
  template <class T>
  struct PrintImpl;

  explicit dynamic(Array&& array);

  template <class T>
  T const& get() const;
  template <class T>
  T& get();
  // clang-format off
  template <class T>
  T* get_nothrow() & noexcept;
  // clang-format on
  template <class T>
  T const* get_nothrow() const& noexcept;
  // clang-format off
  template <class T>
  T* get_nothrow() && noexcept = delete;
  // clang-format on
  template <class T>
  T* getAddress() noexcept;
  template <class T>
  T const* getAddress() const noexcept;

  template <class T>
  T asImpl() const;

  static char const* typeName(Type);
  void destroy() noexcept;
  void print(std::ostream&) const;
  void print_as_pseudo_json(std::ostream&) const; // see json.cpp

 private:
  Type type_;
  union Data {
    explicit Data() : nul(nullptr) {}
    ~Data() {}

    std::nullptr_t nul;
    Array array;
    bool boolean;
    double doubl;
    int64_t integer;
    std::string string;

    /*
     * Objects are placement new'd here.  We have to use a char buffer
     * because we don't know the type here (F14NodeMap<> with
     * dynamic would be parameterizing a std:: template with an
     * incomplete type right now).  (Note that in contrast we know it
     * is ok to do this with fbvector because we own it.)
     */
    std::aligned_storage<
        sizeof(F14NodeMap<int, int>),
        alignof(F14NodeMap<int, int>)>::type objectBuffer;
  } u_;
};

//////////////////////////////////////////////////////////////////////

} // namespace folly

#include <folly/dynamic-inl.h>
