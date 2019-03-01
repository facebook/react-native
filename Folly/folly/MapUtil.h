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

#pragma once

#include <folly/Conv.h>
#include <folly/Optional.h>

namespace folly {

/**
 * Given a map and a key, return the value corresponding to the key in the map,
 * or a given default value if the key doesn't exist in the map.
 */
template <class Map>
typename Map::mapped_type get_default(
    const Map& map, const typename Map::key_type& key,
    const typename Map::mapped_type& dflt =
    typename Map::mapped_type()) {
  auto pos = map.find(key);
  return (pos != map.end() ? pos->second : dflt);
}

/**
 * Give a map and a key, return the value corresponding to the key in the map,
 * or a given default value if the key doesn't exist in the map.
 */
template <
    class Map,
    typename Func,
    typename = typename std::enable_if<std::is_convertible<
        typename std::result_of<Func()>::type,
        typename Map::mapped_type>::value>::type>
typename Map::mapped_type
get_default(const Map& map, const typename Map::key_type& key, Func&& dflt) {
  auto pos = map.find(key);
  return pos != map.end() ? pos->second : dflt();
}

/**
 * Given a map and a key, return the value corresponding to the key in the map,
 * or throw an exception of the specified type.
 */
template <class E = std::out_of_range, class Map>
const typename Map::mapped_type& get_or_throw(
    const Map& map,
    const typename Map::key_type& key,
    const std::string& exceptionStrPrefix = std::string()) {
  auto pos = map.find(key);
  if (pos != map.end()) {
    return pos->second;
  }
  throw E(folly::to<std::string>(exceptionStrPrefix, key));
}

template <class E = std::out_of_range, class Map>
typename Map::mapped_type& get_or_throw(
    Map& map,
    const typename Map::key_type& key,
    const std::string& exceptionStrPrefix = std::string()) {
  auto pos = map.find(key);
  if (pos != map.end()) {
    return pos->second;
  }
  throw E(folly::to<std::string>(exceptionStrPrefix, key));
}

/**
 * Given a map and a key, return a Optional<V> if the key exists and None if the
 * key does not exist in the map.
 */
template <class Map>
folly::Optional<typename Map::mapped_type> get_optional(
    const Map& map, const typename Map::key_type& key) {
  auto pos = map.find(key);
  if (pos != map.end()) {
    return folly::Optional<typename Map::mapped_type>(pos->second);
  } else {
    return folly::none;
  }
}

/**
 * Given a map and a key, return a reference to the value corresponding to the
 * key in the map, or the given default reference if the key doesn't exist in
 * the map.
 */
template <class Map>
const typename Map::mapped_type& get_ref_default(
    const Map& map, const typename Map::key_type& key,
    const typename Map::mapped_type& dflt) {
  auto pos = map.find(key);
  return (pos != map.end() ? pos->second : dflt);
}

/**
 * Given a map and a key, return a reference to the value corresponding to the
 * key in the map, or the given default reference if the key doesn't exist in
 * the map.
 */
template <
    class Map,
    typename Func,
    typename = typename std::enable_if<std::is_convertible<
        typename std::result_of<Func()>::type,
        const typename Map::mapped_type&>::value>::type,
    typename = typename std::enable_if<
        std::is_reference<typename std::result_of<Func()>::type>::value>::type>
const typename Map::mapped_type& get_ref_default(
    const Map& map,
    const typename Map::key_type& key,
    Func&& dflt) {
  auto pos = map.find(key);
  return (pos != map.end() ? pos->second : dflt());
}

/**
 * Given a map and a key, return a pointer to the value corresponding to the
 * key in the map, or nullptr if the key doesn't exist in the map.
 */
template <class Map>
const typename Map::mapped_type* get_ptr(
    const Map& map, const typename Map::key_type& key) {
  auto pos = map.find(key);
  return (pos != map.end() ? &pos->second : nullptr);
}

/**
 * Non-const overload of the above.
 */
template <class Map>
typename Map::mapped_type* get_ptr(
    Map& map, const typename Map::key_type& key) {
  auto pos = map.find(key);
  return (pos != map.end() ? &pos->second : nullptr);
}

}  // namespace folly
