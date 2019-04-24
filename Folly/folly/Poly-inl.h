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

namespace folly {
namespace detail {

template <class I>
inline PolyVal<I>::PolyVal(PolyVal&& that) noexcept {
  that.vptr_->ops_(Op::eMove, &that, static_cast<Data*>(this));
  vptr_ = std::exchange(that.vptr_, vtable<I>());
}

template <class I>
inline PolyVal<I>::PolyVal(PolyOrNonesuch const& that) {
  that.vptr_->ops_(
      Op::eCopy, const_cast<Data*>(that._data_()), PolyAccess::data(*this));
  vptr_ = that.vptr_;
}

template <class I>
inline PolyVal<I>::~PolyVal() {
  vptr_->ops_(Op::eNuke, this, nullptr);
}

template <class I>
inline Poly<I>& PolyVal<I>::operator=(PolyVal that) noexcept {
  vptr_->ops_(Op::eNuke, _data_(), nullptr);
  that.vptr_->ops_(Op::eMove, that._data_(), _data_());
  vptr_ = std::exchange(that.vptr_, vtable<I>());
  return static_cast<Poly<I>&>(*this);
}

template <class I>
template <class T, std::enable_if_t<ModelsInterface<T, I>::value, int>>
inline PolyVal<I>::PolyVal(T&& t) {
  using U = std::decay_t<T>;
  static_assert(
      std::is_copy_constructible<U>::value || !Copyable::value,
      "This Poly<> requires copyability, and the source object is not "
      "copyable");
  // The static and dynamic types should match; otherwise, this will slice.
  assert(typeid(t) == typeid(_t<std::decay<T>>) ||
       !"Dynamic and static exception types don't match. Object would "
        "be sliced when storing in Poly.");
  if (inSitu<U>()) {
    ::new (static_cast<void*>(&_data_()->buff_)) U(static_cast<T&&>(t));
  } else {
    _data_()->pobj_ = new U(static_cast<T&&>(t));
  }
  vptr_ = vtableFor<I, U>();
}

template <class I>
template <class I2, std::enable_if_t<ValueCompatible<I, I2>::value, int>>
inline PolyVal<I>::PolyVal(Poly<I2> that) {
  static_assert(
      !Copyable::value || std::is_copy_constructible<Poly<I2>>::value,
      "This Poly<> requires copyability, and the source object is not "
      "copyable");
  auto* that_vptr = PolyAccess::vtable(that);
  if (that_vptr->state_ != State::eEmpty) {
    that_vptr->ops_(Op::eMove, PolyAccess::data(that), _data_());
    vptr_ = &select<I>(*std::exchange(that_vptr, vtable<std::decay_t<I2>>()));
  }
}

template <class I>
template <class T, std::enable_if_t<ModelsInterface<T, I>::value, int>>
inline Poly<I>& PolyVal<I>::operator=(T&& t) {
  *this = PolyVal(static_cast<T&&>(t));
  return static_cast<Poly<I>&>(*this);
}

template <class I>
template <class I2, std::enable_if_t<ValueCompatible<I, I2>::value, int>>
inline Poly<I>& PolyVal<I>::operator=(Poly<I2> that) {
  *this = PolyVal(std::move(that));
  return static_cast<Poly<I>&>(*this);
}

template <class I>
inline void PolyVal<I>::swap(Poly<I>& that) noexcept {
  switch (vptr_->state_) {
    case State::eEmpty:
      *this = std::move(that);
      break;
    case State::eOnHeap:
      if (State::eOnHeap == that.vptr_->state_) {
        std::swap(_data_()->pobj_, that._data_()->pobj_);
        std::swap(vptr_, that.vptr_);
        return;
      }
      FOLLY_FALLTHROUGH;
    case State::eInSitu:
      std::swap(
          *this, static_cast<PolyVal<I>&>(that)); // NOTE: qualified, not ADL
  }
}

template <class I>
inline AddCvrefOf<PolyRoot<I>, I>& PolyRef<I>::_polyRoot_() const noexcept {
  return const_cast<AddCvrefOf<PolyRoot<I>, I>&>(
      static_cast<PolyRoot<I> const&>(*this));
}

template <class I>
constexpr RefType PolyRef<I>::refType() noexcept {
  using J = std::remove_reference_t<I>;
  return std::is_rvalue_reference<I>::value
      ? RefType::eRvalue
      : std::is_const<J>::value ? RefType::eConstLvalue : RefType::eLvalue;
}

template <class I>
template <class That, class I2>
inline PolyRef<I>::PolyRef(That&& that, Type<I2>) {
  auto* that_vptr = PolyAccess::vtable(PolyAccess::root(that));
  detail::State const that_state = that_vptr->state_;
  if (that_state == State::eEmpty) {
    throw BadPolyAccess();
  }
  auto* that_data = PolyAccess::data(PolyAccess::root(that));
  _data_()->pobj_ = that_state == State::eInSitu
      ? const_cast<void*>(static_cast<void const*>(&that_data->buff_))
      : that_data->pobj_;
  this->vptr_ = &select<std::decay_t<I>>(
      *static_cast<VTable<std::decay_t<I2>> const*>(that_vptr->ops_(
          Op::eRefr, nullptr, reinterpret_cast<void*>(refType()))));
}

template <class I>
inline PolyRef<I>::PolyRef(PolyRef const& that) noexcept {
  _data_()->pobj_ = that._data_()->pobj_;
  this->vptr_ = that.vptr_;
}

template <class I>
inline Poly<I>& PolyRef<I>::operator=(PolyRef const& that) noexcept {
  _data_()->pobj_ = that._data_()->pobj_;
  this->vptr_ = that.vptr_;
  return static_cast<Poly<I>&>(*this);
}

template <class I>
template <class T, std::enable_if_t<ModelsInterface<T, I>::value, int>>
inline PolyRef<I>::PolyRef(T&& t) noexcept {
  _data_()->pobj_ =
      const_cast<void*>(static_cast<void const*>(std::addressof(t)));
  this->vptr_ = vtableFor<std::decay_t<I>, AddCvrefOf<std::decay_t<T>, I>>();
}

template <class I>
template <
    class I2,
    std::enable_if_t<ReferenceCompatible<I, I2, I2&&>::value, int>>
inline PolyRef<I>::PolyRef(Poly<I2>&& that) noexcept(
    std::is_reference<I2>::value)
    : PolyRef{that, Type<I2>{}} {
  static_assert(
      Disjunction<std::is_reference<I2>, std::is_rvalue_reference<I>>::value,
      "Attempting to construct a Poly that is a reference to a temporary. "
      "This is probably a mistake.");
}

template <class I>
template <class T, std::enable_if_t<ModelsInterface<T, I>::value, int>>
inline Poly<I>& PolyRef<I>::operator=(T&& t) noexcept {
  *this = PolyRef(static_cast<T&&>(t));
  return static_cast<Poly<I>&>(*this);
}

template <class I>
template <
    class I2,
    std::enable_if_t<ReferenceCompatible<I, I2, I2&&>::value, int>>
inline Poly<I>& PolyRef<I>::operator=(Poly<I2>&& that) noexcept(
    std::is_reference<I2>::value) {
  *this = PolyRef(std::move(that));
  return static_cast<Poly<I>&>(*this);
}

template <class I>
template <
    class I2,
    std::enable_if_t<ReferenceCompatible<I, I2, I2&>::value, int>>
inline Poly<I>& PolyRef<I>::operator=(Poly<I2>& that) noexcept(
    std::is_reference<I2>::value) {
  *this = PolyRef(that);
  return static_cast<Poly<I>&>(*this);
}

template <class I>
template <
    class I2,
    std::enable_if_t<ReferenceCompatible<I, I2, I2 const&>::value, int>>
inline Poly<I>& PolyRef<I>::operator=(Poly<I2> const& that) noexcept(
    std::is_reference<I2>::value) {
  *this = PolyRef(that);
  return static_cast<Poly<I>&>(*this);
}

template <class I>
inline void PolyRef<I>::swap(Poly<I>& that) noexcept {
  std::swap(_data_()->pobj_, that._data_()->pobj_);
  std::swap(this->vptr_, that.vptr_);
}

template <class I>
inline AddCvrefOf<PolyImpl<I>, I>& PolyRef<I>::get() const noexcept {
  return const_cast<AddCvrefOf<PolyImpl<I>, I>&>(
      static_cast<PolyImpl<I> const&>(*this));
}

} // namespace detail
} // namespace folly
