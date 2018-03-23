/*
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {
namespace jni {

namespace detail {

template <typename E>
struct IteratorHelper : public JavaClass<IteratorHelper<E>> {
  constexpr static auto kJavaDescriptor = "Lcom/facebook/jni/IteratorHelper;";

  typedef local_ref<E> value_type;
  typedef ptrdiff_t difference_type;
  typedef value_type* pointer;
  typedef value_type& reference;
  typedef std::forward_iterator_tag iterator_category;

  typedef JavaClass<IteratorHelper<E>> JavaBase_;

  bool hasNext() const {
    static auto hasNextMethod =
      JavaBase_::javaClassStatic()->template getMethod<jboolean()>("hasNext");
    return hasNextMethod(JavaBase_::self());
  }

  value_type next() {
    static auto elementField =
      JavaBase_::javaClassStatic()->template getField<jobject>("mElement");
    return dynamic_ref_cast<E>(JavaBase_::getFieldValue(elementField));
  }

  static void reset(value_type& v) {
    v.reset();
  }
};

template <typename K, typename V>
struct MapIteratorHelper : public JavaClass<MapIteratorHelper<K,V>> {
  constexpr static auto kJavaDescriptor = "Lcom/facebook/jni/MapIteratorHelper;";

  typedef std::pair<local_ref<K>, local_ref<V>> value_type;

  typedef JavaClass<MapIteratorHelper<K,V>> JavaBase_;

  bool hasNext() const {
    static auto hasNextMethod =
      JavaBase_::javaClassStatic()->template getMethod<jboolean()>("hasNext");
    return hasNextMethod(JavaBase_::self());
  }

  value_type next() {
    static auto keyField = JavaBase_::javaClassStatic()->template getField<jobject>("mKey");
    static auto valueField = JavaBase_::javaClassStatic()->template getField<jobject>("mValue");
    return std::make_pair(dynamic_ref_cast<K>(JavaBase_::getFieldValue(keyField)),
                          dynamic_ref_cast<V>(JavaBase_::getFieldValue(valueField)));
  }

  static void reset(value_type& v) {
    v.first.reset();
    v.second.reset();
  }
};

template <typename T>
class Iterator {
 public:
  typedef typename T::value_type value_type;
  typedef ptrdiff_t difference_type;
  typedef value_type* pointer;
  typedef value_type& reference;
  typedef std::input_iterator_tag iterator_category;

  // begin ctor
  Iterator(global_ref<typename T::javaobject>&& helper)
      : helper_(std::move(helper))
      , i_(-1) {
    ++(*this);
  }

  // end ctor
  Iterator()
      : i_(-1) {}

  bool operator==(const Iterator& it) const { return i_ == it.i_; }
  bool operator!=(const Iterator& it) const { return !(*this == it); }
  const value_type& operator*() const { assert(i_ != -1); return entry_; }
  const value_type* operator->() const { assert(i_ != -1); return &entry_; }
  Iterator& operator++() {  // preincrement
    bool hasNext = helper_->hasNext();
    if (hasNext) {
      ++i_;
      entry_ = helper_->next();
    } else {
      i_ = -1;
      helper_->reset(entry_);
    }
    return *this;
  }
  Iterator operator++(int) {  // postincrement
    Iterator ret;
    ret.i_ = i_;
    ret.entry_ = std::move(entry_);
    ++(*this);
    return ret;
  }

  global_ref<typename T::javaobject> helper_;
  // set to -1 at end
  std::ptrdiff_t i_;
  value_type entry_;
};

}

template <typename E>
struct JIterator<E>::Iterator : public detail::Iterator<detail::IteratorHelper<E>> {
  using detail::Iterator<detail::IteratorHelper<E>>::Iterator;
};

template <typename E>
typename JIterator<E>::Iterator JIterator<E>::begin() const {
  static auto ctor = detail::IteratorHelper<E>::javaClassStatic()->
    template getConstructor<typename detail::IteratorHelper<E>::javaobject(
                              typename JIterator<E>::javaobject)>();
  return Iterator(
    make_global(
      detail::IteratorHelper<E>::javaClassStatic()->newObject(ctor, this->self())));
}

template <typename E>
typename JIterator<E>::Iterator JIterator<E>::end() const {
  return Iterator();
}

template <typename E>
struct JIterable<E>::Iterator : public detail::Iterator<detail::IteratorHelper<E>> {
  using detail::Iterator<detail::IteratorHelper<E>>::Iterator;
};

template <typename E>
typename JIterable<E>::Iterator JIterable<E>::begin() const {
  static auto ctor = detail::IteratorHelper<E>::javaClassStatic()->
    template getConstructor<typename detail::IteratorHelper<E>::javaobject(
                              typename JIterable<E>::javaobject)>();
  return Iterator(
    make_global(
      detail::IteratorHelper<E>::javaClassStatic()->newObject(ctor, this->self())));
}

template <typename E>
typename JIterable<E>::Iterator JIterable<E>::end() const {
  return Iterator();
}

template <typename E>
size_t JCollection<E>::size() const {
  static auto sizeMethod =
    JCollection<E>::javaClassStatic()->template getMethod<jint()>("size");
  return sizeMethod(this->self());
}

template <typename K, typename V>
struct JMap<K,V>::Iterator : public detail::Iterator<detail::MapIteratorHelper<K,V>> {
  using detail::Iterator<detail::MapIteratorHelper<K,V>>::Iterator;
};

template <typename K, typename V>
size_t JMap<K,V>::size() const {
  static auto sizeMethod =
    JMap<K,V>::javaClassStatic()->template getMethod<jint()>("size");
  return sizeMethod(this->self());
}

template <typename K, typename V>
typename JMap<K,V>::Iterator JMap<K,V>::begin() const {
  static auto ctor = detail::MapIteratorHelper<K,V>::javaClassStatic()->
    template getConstructor<typename detail::MapIteratorHelper<K,V>::javaobject(
                              typename JMap<K,V>::javaobject)>();
  return Iterator(
    make_global(
      detail::MapIteratorHelper<K,V>::javaClassStatic()->newObject(ctor, this->self())));
}

template <typename K, typename V>
typename JMap<K,V>::Iterator JMap<K,V>::end() const {
  return Iterator();
}

}
}
