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

#include <functional>
#include <iterator>
#include <memory>
#include <tuple>
#include <type_traits>
#include <utility>

#include <folly/Utility.h>
#include <folly/lang/RValueReferenceWrapper.h>

namespace folly {

/**
 * Argument tuple for variadic emplace/constructor calls. Stores arguments by
 * (decayed) value. Restores original argument types with reference qualifiers
 * and adornments at unpack time to emulate perfect forwarding.
 *
 * Uses inheritance instead of a type alias to std::tuple so that emplace
 * iterators with implicit unpacking disabled can distinguish between
 * emplace_args and std::tuple parameters.
 *
 * @seealso folly::make_emplace_args
 * @seealso folly::get_emplace_arg
 */
template <typename... Args>
struct emplace_args : public std::tuple<std::decay_t<Args>...> {
  using storage_type = std::tuple<std::decay_t<Args>...>;
  using storage_type::storage_type;
};

/**
 * Pack arguments in a tuple for assignment to a folly::emplace_iterator,
 * folly::front_emplace_iterator, or folly::back_emplace_iterator. The
 * iterator's operator= will unpack the tuple and pass the unpacked arguments
 * to the container's emplace function, which in turn forwards the arguments to
 * the (multi-argument) constructor of the target class.
 *
 * Argument tuples generated with folly::make_emplace_args will be unpacked
 * before being passed to the container's emplace function, even for iterators
 * where implicit_unpack is set to false (so they will not implicitly unpack
 * std::pair or std::tuple arguments to operator=).
 *
 * Arguments are copied (lvalues) or moved (rvalues). To avoid copies and moves,
 * wrap references using std::ref(), std::cref(), and folly::rref(). Beware of
 * dangling references, especially references to temporary objects created with
 * folly::rref().
 *
 * Note that an argument pack created with folly::make_emplace_args is different
 * from an argument pack created with std::make_pair or std::make_tuple.
 * Specifically, passing a std::pair&& or std::tuple&& to an emplace iterator's
 * operator= will pass rvalue references to all fields of that tuple to the
 * container's emplace function, while passing an emplace_args&& to operator=
 * will cast those field references to the exact argument types as passed to
 * folly::make_emplace_args previously. If all arguments have been wrapped by
 * std::reference_wrappers or folly::rvalue_reference_wrappers, the result will
 * be the same as if the container's emplace function had been called directly
 * (perfect forwarding), with no temporary copies of the arguments.
 *
 * @seealso folly::rref
 *
 * @example
 *   class Widget { Widget(int, int); };
 *   std::vector<Widget> makeWidgets(const std::vector<int>& in) {
 *     std::vector<Widget> out;
 *     std::transform(
 *         in.begin(),
 *         in.end(),
 *         folly::back_emplacer(out),
 *         [](int i) { return folly::make_emplace_args(i, i); });
 *     return out;
 *   }
 */
template <typename... Args>
emplace_args<Args...> make_emplace_args(Args&&... args) noexcept(
    noexcept(emplace_args<Args...>(std::forward<Args>(args)...))) {
  return emplace_args<Args...>(std::forward<Args>(args)...);
}

namespace detail {
template <typename Arg>
decltype(auto) unwrap_emplace_arg(Arg&& arg) noexcept {
  return std::forward<Arg>(arg);
}
template <typename Arg>
decltype(auto) unwrap_emplace_arg(std::reference_wrapper<Arg> arg) noexcept {
  return arg.get();
}
template <typename Arg>
decltype(auto) unwrap_emplace_arg(
    folly::rvalue_reference_wrapper<Arg> arg) noexcept {
  return std::move(arg).get();
}
} // namespace detail

/**
 * Getter function for unpacking a single emplace argument.
 *
 * Calling get_emplace_arg on an emplace_args rvalue reference results in
 * perfect forwarding of the original input types. A special case are
 * std::reference_wrapper and folly::rvalue_reference_wrapper objects within
 * folly::emplace_args. These are also unwrapped so that the bare reference is
 * returned.
 *
 * std::get is not a customization point in the standard library, so the
 * cleanest solution was to define our own getter function.
 */
template <size_t I, typename... Args>
decltype(auto) get_emplace_arg(emplace_args<Args...>&& args) noexcept {
  using Out = std::tuple<Args...>;
  return detail::unwrap_emplace_arg(
      std::forward<std::tuple_element_t<I, Out>>(std::get<I>(args)));
}
template <size_t I, typename... Args>
decltype(auto) get_emplace_arg(emplace_args<Args...>& args) noexcept {
  return detail::unwrap_emplace_arg(std::get<I>(args));
}
template <size_t I, typename... Args>
decltype(auto) get_emplace_arg(const emplace_args<Args...>& args) noexcept {
  return detail::unwrap_emplace_arg(std::get<I>(args));
}
template <size_t I, typename Args>
decltype(auto) get_emplace_arg(Args&& args) noexcept {
  return std::get<I>(std::move(args));
}
template <size_t I, typename Args>
decltype(auto) get_emplace_arg(Args& args) noexcept {
  return std::get<I>(args);
}
template <size_t I, typename Args>
decltype(auto) get_emplace_arg(const Args& args) noexcept {
  return std::get<I>(args);
}

namespace detail {
/**
 * Emplace implementation class for folly::emplace_iterator.
 */
template <typename Container>
struct Emplace {
  Emplace(Container& c, typename Container::iterator i)
      : container(std::addressof(c)), iter(std::move(i)) {}
  template <typename... Args>
  void emplace(Args&&... args) {
    iter = container->emplace(iter, std::forward<Args>(args)...);
    ++iter;
  }
  Container* container;
  typename Container::iterator iter;
};

/**
 * Emplace implementation class for folly::hint_emplace_iterator.
 */
template <typename Container>
struct EmplaceHint {
  EmplaceHint(Container& c, typename Container::iterator i)
      : container(std::addressof(c)), iter(std::move(i)) {}
  template <typename... Args>
  void emplace(Args&&... args) {
    iter = container->emplace_hint(iter, std::forward<Args>(args)...);
    ++iter;
  }
  Container* container;
  typename Container::iterator iter;
};

/**
 * Emplace implementation class for folly::front_emplace_iterator.
 */
template <typename Container>
struct EmplaceFront {
  explicit EmplaceFront(Container& c) : container(std::addressof(c)) {}
  template <typename... Args>
  void emplace(Args&&... args) {
    container->emplace_front(std::forward<Args>(args)...);
  }
  Container* container;
};

/**
 * Emplace implementation class for folly::back_emplace_iterator.
 */
template <typename Container>
struct EmplaceBack {
  explicit EmplaceBack(Container& c) : container(std::addressof(c)) {}
  template <typename... Args>
  void emplace(Args&&... args) {
    container->emplace_back(std::forward<Args>(args)...);
  }
  Container* container;
};

/**
 * Generic base class and implementation of all emplace iterator classes.
 *
 * Uses the curiously recurring template pattern (CRTP) to cast `this*` to
 * `Derived*`; i.e., to implement covariant return types in a generic manner.
 */
template <typename Derived, typename EmplaceImpl, bool implicit_unpack>
class emplace_iterator_base;

/**
 * Partial specialization of emplace_iterator_base with implicit unpacking
 * disabled.
 */
template <typename Derived, typename EmplaceImpl>
class emplace_iterator_base<Derived, EmplaceImpl, false>
    : protected EmplaceImpl /* protected implementation inheritance */ {
 public:
  // Iterator traits.
  using iterator_category = std::output_iterator_tag;
  using value_type = void;
  using difference_type = void;
  using pointer = void;
  using reference = void;
  using container_type =
      std::remove_reference_t<decltype(*EmplaceImpl::container)>;

  using EmplaceImpl::EmplaceImpl;

  /**
   * Canonical output operator. Forwards single argument straight to container's
   * emplace function.
   */
  template <typename T>
  Derived& operator=(T&& arg) {
    this->emplace(std::forward<T>(arg));
    return static_cast<Derived&>(*this);
  }

  /**
   * Special output operator for packed arguments. Unpacks args and performs
   * variadic call to container's emplace function.
   */
  template <typename... Args>
  Derived& operator=(emplace_args<Args...>& args) {
    return unpackAndEmplace(args, index_sequence_for<Args...>{});
  }
  template <typename... Args>
  Derived& operator=(const emplace_args<Args...>& args) {
    return unpackAndEmplace(args, index_sequence_for<Args...>{});
  }
  template <typename... Args>
  Derived& operator=(emplace_args<Args...>&& args) {
    return unpackAndEmplace(std::move(args), index_sequence_for<Args...>{});
  }

  // No-ops.
  Derived& operator*() {
    return static_cast<Derived&>(*this);
  }
  Derived& operator++() {
    return static_cast<Derived&>(*this);
  }
  Derived& operator++(int) {
    return static_cast<Derived&>(*this);
  }

  // We need all of these explicit defaults because the custom operator=
  // overloads disable implicit generation of these functions.
  emplace_iterator_base(const emplace_iterator_base&) = default;
  emplace_iterator_base(emplace_iterator_base&&) noexcept = default;
  emplace_iterator_base& operator=(emplace_iterator_base&) = default;
  emplace_iterator_base& operator=(const emplace_iterator_base&) = default;
  emplace_iterator_base& operator=(emplace_iterator_base&&) noexcept = default;

 protected:
  template <typename Args, std::size_t... I>
  Derived& unpackAndEmplace(Args& args, index_sequence<I...>) {
    this->emplace(get_emplace_arg<I>(args)...);
    return static_cast<Derived&>(*this);
  }
  template <typename Args, std::size_t... I>
  Derived& unpackAndEmplace(const Args& args, index_sequence<I...>) {
    this->emplace(get_emplace_arg<I>(args)...);
    return static_cast<Derived&>(*this);
  }
  template <typename Args, std::size_t... I>
  Derived& unpackAndEmplace(Args&& args, index_sequence<I...>) {
    this->emplace(get_emplace_arg<I>(std::move(args))...);
    return static_cast<Derived&>(*this);
  }
};

/**
 * Partial specialization of emplace_iterator_base with implicit unpacking
 * enabled.
 *
 * Uses inheritance rather than SFINAE. operator= requires a single argument,
 * which makes it very tricky to use std::enable_if or similar.
 */
template <typename Derived, typename EmplaceImpl>
class emplace_iterator_base<Derived, EmplaceImpl, true>
    : public emplace_iterator_base<Derived, EmplaceImpl, false> {
 private:
  using Base = emplace_iterator_base<Derived, EmplaceImpl, false>;

 public:
  using Base::Base;
  using Base::operator=;

  /**
   * Special output operator for arguments packed into a std::pair. Unpacks
   * the pair and performs variadic call to container's emplace function.
   */
  template <typename... Args>
  Derived& operator=(std::pair<Args...>& args) {
    return this->unpackAndEmplace(args, index_sequence_for<Args...>{});
  }
  template <typename... Args>
  Derived& operator=(const std::pair<Args...>& args) {
    return this->unpackAndEmplace(args, index_sequence_for<Args...>{});
  }
  template <typename... Args>
  Derived& operator=(std::pair<Args...>&& args) {
    return this->unpackAndEmplace(
        std::move(args), index_sequence_for<Args...>{});
  }

  /**
   * Special output operator for arguments packed into a std::tuple. Unpacks
   * the tuple and performs variadic call to container's emplace function.
   */
  template <typename... Args>
  Derived& operator=(std::tuple<Args...>& args) {
    return this->unpackAndEmplace(args, index_sequence_for<Args...>{});
  }
  template <typename... Args>
  Derived& operator=(const std::tuple<Args...>& args) {
    return this->unpackAndEmplace(args, index_sequence_for<Args...>{});
  }
  template <typename... Args>
  Derived& operator=(std::tuple<Args...>&& args) {
    return this->unpackAndEmplace(
        std::move(args), index_sequence_for<Args...>{});
  }

  // We need all of these explicit defaults because the custom operator=
  // overloads disable implicit generation of these functions.
  emplace_iterator_base(const emplace_iterator_base&) = default;
  emplace_iterator_base(emplace_iterator_base&&) noexcept = default;
  emplace_iterator_base& operator=(emplace_iterator_base&) = default;
  emplace_iterator_base& operator=(const emplace_iterator_base&) = default;
  emplace_iterator_base& operator=(emplace_iterator_base&&) noexcept = default;
};

/**
 * Concrete instantiation of emplace_iterator_base. All emplace iterator
 * classes; folly::emplace_iterator, folly::hint_emplace_iterator,
 * folly::front_emplace_iterator, and folly::back_emplace_iterator; are just
 * type aliases of this class.
 *
 * It is not possible to alias emplace_iterator_base directly, because type
 * aliases cannot be used for CRTP.
 */
template <
    template <typename> class EmplaceImplT,
    typename Container,
    bool implicit_unpack>
class emplace_iterator_impl
    : public emplace_iterator_base<
          emplace_iterator_impl<EmplaceImplT, Container, implicit_unpack>,
          EmplaceImplT<Container>,
          implicit_unpack> {
 private:
  using Base = emplace_iterator_base<
      emplace_iterator_impl,
      EmplaceImplT<Container>,
      implicit_unpack>;

 public:
  using Base::Base;
  using Base::operator=;

  // We need all of these explicit defaults because the custom operator=
  // overloads disable implicit generation of these functions.
  emplace_iterator_impl(const emplace_iterator_impl&) = default;
  emplace_iterator_impl(emplace_iterator_impl&&) noexcept = default;
  emplace_iterator_impl& operator=(emplace_iterator_impl&) = default;
  emplace_iterator_impl& operator=(const emplace_iterator_impl&) = default;
  emplace_iterator_impl& operator=(emplace_iterator_impl&&) noexcept = default;
};
} // namespace detail

/**
 * Behaves just like std::insert_iterator except that it calls emplace()
 * instead of insert(). Uses perfect forwarding.
 */
template <typename Container, bool implicit_unpack = true>
using emplace_iterator =
    detail::emplace_iterator_impl<detail::Emplace, Container, implicit_unpack>;

/**
 * Behaves just like std::insert_iterator except that it calls emplace_hint()
 * instead of insert(). Uses perfect forwarding.
 */
template <typename Container, bool implicit_unpack = true>
using hint_emplace_iterator = detail::
    emplace_iterator_impl<detail::EmplaceHint, Container, implicit_unpack>;

/**
 * Behaves just like std::front_insert_iterator except that it calls
 * emplace_front() instead of insert(). Uses perfect forwarding.
 */
template <typename Container, bool implicit_unpack = true>
using front_emplace_iterator = detail::
    emplace_iterator_impl<detail::EmplaceFront, Container, implicit_unpack>;

/**
 * Behaves just like std::back_insert_iterator except that it calls
 * emplace_back() instead of insert(). Uses perfect forwarding.
 */
template <typename Container, bool implicit_unpack = true>
using back_emplace_iterator = detail::
    emplace_iterator_impl<detail::EmplaceBack, Container, implicit_unpack>;

/**
 * Convenience function to construct a folly::emplace_iterator, analogous to
 * std::inserter().
 *
 * Setting implicit_unpack to false will disable implicit unpacking of
 * single std::pair and std::tuple arguments to the iterator's operator=. That
 * may be desirable in case of constructors that expect a std::pair or
 * std::tuple argument.
 */
template <bool implicit_unpack = true, typename Container>
emplace_iterator<Container, implicit_unpack> emplacer(
    Container& c,
    typename Container::iterator i) {
  return emplace_iterator<Container, implicit_unpack>(c, std::move(i));
}

/**
 * Convenience function to construct a folly::hint_emplace_iterator, analogous
 * to std::inserter().
 *
 * Setting implicit_unpack to false will disable implicit unpacking of
 * single std::pair and std::tuple arguments to the iterator's operator=. That
 * may be desirable in case of constructors that expect a std::pair or
 * std::tuple argument.
 */
template <bool implicit_unpack = true, typename Container>
hint_emplace_iterator<Container, implicit_unpack> hint_emplacer(
    Container& c,
    typename Container::iterator i) {
  return hint_emplace_iterator<Container, implicit_unpack>(c, std::move(i));
}

/**
 * Convenience function to construct a folly::front_emplace_iterator, analogous
 * to std::front_inserter().
 *
 * Setting implicit_unpack to false will disable implicit unpacking of
 * single std::pair and std::tuple arguments to the iterator's operator=. That
 * may be desirable in case of constructors that expect a std::pair or
 * std::tuple argument.
 */
template <bool implicit_unpack = true, typename Container>
front_emplace_iterator<Container, implicit_unpack> front_emplacer(
    Container& c) {
  return front_emplace_iterator<Container, implicit_unpack>(c);
}

/**
 * Convenience function to construct a folly::back_emplace_iterator, analogous
 * to std::back_inserter().
 *
 * Setting implicit_unpack to false will disable implicit unpacking of
 * single std::pair and std::tuple arguments to the iterator's operator=. That
 * may be desirable in case of constructors that expect a std::pair or
 * std::tuple argument.
 */
template <bool implicit_unpack = true, typename Container>
back_emplace_iterator<Container, implicit_unpack> back_emplacer(Container& c) {
  return back_emplace_iterator<Container, implicit_unpack>(c);
}
} // namespace folly
