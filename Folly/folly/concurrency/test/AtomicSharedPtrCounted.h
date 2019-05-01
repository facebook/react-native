/*
 * Copyright 2017-present Facebook, Inc.
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

struct counted_shared_tag {};
template <template <typename> class Atom = std::atomic>
struct intrusive_shared_count {
  intrusive_shared_count() {
    counts.store(0);
  }
  void add_ref(uint64_t count = 1) {
    counts.fetch_add(count);
  }

  uint64_t release_ref(uint64_t count = 1) {
    return counts.fetch_sub(count);
  }
  Atom<uint64_t> counts;
};

template <template <typename> class Atom = std::atomic>
struct counted_ptr_base {
 protected:
  static intrusive_shared_count<Atom>* getRef(void* pt) {
    char* p = (char*)pt;
    p -= sizeof(intrusive_shared_count<Atom>);
    return (intrusive_shared_count<Atom>*)p;
  }
};

// basically shared_ptr, but only supports make_counted, and provides
// access to add_ref / release_ref with a count.  Alias not supported.
template <typename T, template <typename> class Atom = std::atomic>
class counted_ptr : public counted_ptr_base<Atom> {
 public:
  T* p_;
  counted_ptr() : p_(nullptr) {}
  counted_ptr(counted_shared_tag, T* p) : p_(p) {
    if (p_) {
      counted_ptr_base<Atom>::getRef(p_)->add_ref();
    }
  }

  counted_ptr(const counted_ptr& o) : p_(o.p_) {
    if (p_) {
      counted_ptr_base<Atom>::getRef(p_)->add_ref();
    }
  }
  counted_ptr& operator=(const counted_ptr& o) {
    if (p_ && counted_ptr_base<Atom>::getRef(p_)->release_ref() == 1) {
      p_->~T();
      free(counted_ptr_base<Atom>::getRef(p_));
    }
    p_ = o.p_;
    if (p_) {
      counted_ptr_base<Atom>::getRef(p_)->add_ref();
    }
    return *this;
  }
  explicit counted_ptr(T* p) : p_(p) {
    CHECK(!p);
  }
  ~counted_ptr() {
    if (p_ && counted_ptr_base<Atom>::getRef(p_)->release_ref() == 1) {
      p_->~T();
      free(counted_ptr_base<Atom>::getRef(p_));
    }
  }
  typename std::add_lvalue_reference<T>::type operator*() const {
    return *p_;
  }

  T* get() const {
    return p_;
  }
  T* operator->() const {
    return p_;
  }
  explicit operator bool() const {
    return p_ == nullptr ? false : true;
  }
  bool operator==(const counted_ptr<T, Atom>& p) const {
    return get() == p.get();
  }
};

template <
    template <typename> class Atom = std::atomic,
    typename T,
    typename... Args>
counted_ptr<T, Atom> make_counted(Args&&... args) {
  char* mem = (char*)malloc(sizeof(T) + sizeof(intrusive_shared_count<Atom>));
  if (!mem) {
    throw std::bad_alloc();
  }
  new (mem) intrusive_shared_count<Atom>();
  T* ptr = (T*)(mem + sizeof(intrusive_shared_count<Atom>));
  new (ptr) T(std::forward<Args>(args)...);
  return counted_ptr<T, Atom>(counted_shared_tag(), ptr);
}

template <template <typename> class Atom = std::atomic>
class counted_ptr_internals : public counted_ptr_base<Atom> {
 public:
  template <typename T, typename... Args>
  static counted_ptr<T, Atom> make_ptr(Args&&... args) {
    return make_counted<Atom, T>(std::forward<Args...>(args...));
  }
  template <typename T>
  using CountedPtr = counted_ptr<T, Atom>;
  typedef void counted_base;

  template <typename T>
  static counted_base* get_counted_base(const counted_ptr<T, Atom>& bar) {
    return bar.p_;
  }

  template <typename T>
  static T* get_shared_ptr(counted_base* base) {
    return (T*)base;
  }

  template <typename T>
  static T* release_ptr(counted_ptr<T, Atom>& p) {
    auto res = p.p_;
    p.p_ = nullptr;
    return res;
  }

  template <typename T>
  static counted_ptr<T, Atom> get_shared_ptr_from_counted_base(
      counted_base* base,
      bool inc = true) {
    auto res = counted_ptr<T, Atom>(counted_shared_tag(), (T*)(base));
    if (!inc) {
      release_shared<T>(base, 1);
    }
    return res;
  }

  static void inc_shared_count(counted_base* base, int64_t count) {
    counted_ptr_base<Atom>::getRef(base)->add_ref(count);
  }

  template <typename T>
  static void release_shared(counted_base* base, uint64_t count) {
    if (count == counted_ptr_base<Atom>::getRef(base)->release_ref(count)) {
      ((T*)base)->~T();
      free(counted_ptr_base<Atom>::getRef(base));
    }
  }
};
