/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <vector>

#import <Foundation/Foundation.h>

#import <FBLazyVector/FBLazyVector.h>
#import <folly/Optional.h>

namespace facebook {
namespace react {
  template<typename T>
  using LazyVector = FB::LazyVector<T, id>;
}}

template<typename ContainerT>
NSArray *RCTConvertVecToArray(const ContainerT &vec, id (^convertor)(typename ContainerT::value_type element))
{
  NSMutableArray *array = [NSMutableArray new];
  for (size_t i = 0, size = vec.size(); i < size; ++i) {
    id object = convertor(vec[i]);
    array[i] = object ?: (id)kCFNull;
  }
  return array;
}
template<typename ContainerT>
NSArray *RCTConvertVecToArray(const ContainerT &vec)
{
  return RCTConvertVecToArray(vec, ^id(typename ContainerT::value_type element) { return element; });
}

template<typename ContainerT>
NSArray *RCTConvertOptionalVecToArray(const folly::Optional<ContainerT> &vec, id (^convertor)(typename ContainerT::value_type element))
{
  return vec.hasValue() ? RCTConvertVecToArray(vec.value(), convertor) : nil;
}

template<typename ContainerT>
NSArray *RCTConvertOptionalVecToArray(const folly::Optional<ContainerT> &vec)
{
  return vec.hasValue() ? RCTConvertVecToArray(vec.value(), ^id(typename ContainerT::value_type element) { return element; }) : nil;
}

bool RCTBridgingToBool(id value);
folly::Optional<bool> RCTBridgingToOptionalBool(id value);
NSString *RCTBridgingToString(id value);
folly::Optional<double> RCTBridgingToOptionalDouble(id value);
double RCTBridgingToDouble(id value);
NSArray *RCTBridgingToArray(id value);

template<typename T>
facebook::react::LazyVector<T> RCTBridgingToVec(id value, T (^ctor)(id element))
{
  NSArray *array = RCTBridgingToArray(value);
  typedef typename facebook::react::LazyVector<T>::size_type _size_t;
  _size_t size = static_cast<_size_t>(array.count);
  return facebook::react::LazyVector<T>::fromUnsafeRawValue(array, size, ctor);
}

template<typename T>
folly::Optional<facebook::react::LazyVector<T>> RCTBridgingToOptionalVec(id value, T (^ctor)(id element))
{
  if (value == nil || value == (id)kCFNull) {
    return folly::none;
  } else {
    return RCTBridgingToVec(value, ctor);
  }
}
