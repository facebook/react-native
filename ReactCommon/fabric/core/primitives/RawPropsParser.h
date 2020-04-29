<<<<<<< HEAD
/**
=======
/*
>>>>>>> fb/0.62-stable
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/map.h>
#include <better/small_vector.h>
#include <react/core/Props.h>
#include <react/core/RawProps.h>
#include <react/core/RawPropsKey.h>
#include <react/core/RawPropsKeyMap.h>
#include <react/core/RawPropsPrimitives.h>
#include <react/core/RawValue.h>

namespace facebook {
namespace react {

/*
 * Specialized (to a particular type of Props) parser that provides the most
 * efficient access to `RawProps` content.
 */
class RawPropsParser final {
 public:
  /*
   * Default constructor.
   * To be used by `ConcreteComponentDescriptor` only.
   */
  RawPropsParser() = default;

  /*
   * To be used by `ConcreteComponentDescriptor` only.
   */
  template <typename PropsT>
<<<<<<< HEAD
  void prepare() {
=======
  void prepare() noexcept {
>>>>>>> fb/0.62-stable
    static_assert(
        std::is_base_of<Props, PropsT>::value,
        "PropsT must be a descendant of Props");
    RawProps emptyRawProps{};
    emptyRawProps.parse(*this);
    PropsT({}, emptyRawProps);
    postPrepare();
  }

 private:
  friend class ComponentDescriptor;
  template <class ShadowNodeT>
  friend class ConcreteComponentDescriptor;
  friend class RawProps;

  /*
   * To be used by `RawProps` only.
   */
<<<<<<< HEAD
  void preparse(RawProps const &rawProps) const;
=======
  void preparse(RawProps const &rawProps) const noexcept;
>>>>>>> fb/0.62-stable

  /*
   * Non-generic part of `prepare`.
   */
<<<<<<< HEAD
  void postPrepare();
=======
  void postPrepare() noexcept;
>>>>>>> fb/0.62-stable

  /*
   * To be used by `RawProps` only.
   */
<<<<<<< HEAD
  RawValue const *at(RawProps const &rawProps, RawPropsKey const &key) const;
=======
  RawValue const *at(RawProps const &rawProps, RawPropsKey const &key) const
      noexcept;
>>>>>>> fb/0.62-stable

  mutable better::small_vector<RawPropsKey, kNumberOfPropsPerComponentSoftCap>
      keys_{};
  mutable RawPropsKeyMap nameToIndex_{};
  mutable int size_{0};
  mutable bool ready_{false};
};

} // namespace react
} // namespace facebook
