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
#define FOLLY_URI_H_

#include <folly/String.h>
#include <vector>

namespace folly {

/**
 * Class representing a URI.
 *
 * Consider http://www.facebook.com/foo/bar?key=foo#anchor
 *
 * The URI is broken down into its parts: scheme ("http"), authority
 * (ie. host and port, in most cases: "www.facebook.com"), path
 * ("/foo/bar"), query ("key=foo") and fragment ("anchor").  The scheme is
 * lower-cased.
 *
 * If this Uri represents a URL, note that, to prevent ambiguity, the component
 * parts are NOT percent-decoded; you should do this yourself with
 * uriUnescape() (for the authority and path) and uriUnescape(...,
 * UriEscapeMode::QUERY) (for the query, but probably only after splitting at
 * '&' to identify the individual parameters).
 */
class Uri {
 public:
  /**
   * Parse a Uri from a string.  Throws std::invalid_argument on parse error.
   */
  explicit Uri(StringPiece str);

  const fbstring& scheme() const { return scheme_; }
  const fbstring& username() const { return username_; }
  const fbstring& password() const { return password_; }
  /**
   * Get host part of URI. If host is an IPv6 address, square brackets will be
   * returned, for example: "[::1]".
   */
  const fbstring& host() const { return host_; }
  /**
   * Get host part of URI. If host is an IPv6 address, square brackets will not
   * be returned, for exmaple "::1"; otherwise it returns the same thing as
   * host().
   *
   * hostname() is what one needs to call if passing the host to any other tool
   * or API that connects to that host/port; e.g. getaddrinfo() only understands
   * IPv6 host without square brackets
   */
  fbstring hostname() const;
  uint16_t port() const { return port_; }
  const fbstring& path() const { return path_; }
  const fbstring& query() const { return query_; }
  const fbstring& fragment() const { return fragment_; }

  fbstring authority() const;

  template <class String>
  String toString() const;

  std::string str() const { return toString<std::string>(); }
  fbstring fbstr() const { return toString<fbstring>(); }

  void setPort(uint16_t port) {
    hasAuthority_ = true;
    port_ = port;
  }

  /**
   * Get query parameters as key-value pairs.
   * e.g. for URI containing query string:  key1=foo&key2=&key3&=bar&=bar=
   * In returned list, there are 3 entries:
   *     "key1" => "foo"
   *     "key2" => ""
   *     "key3" => ""
   * Parts "=bar" and "=bar=" are ignored, as they are not valid query
   * parameters. "=bar" is missing parameter name, while "=bar=" has more than
   * one equal signs, we don't know which one is the delimiter for key and
   * value.
   *
   * Note, this method is not thread safe, it might update internal state, but
   * only the first call to this method update the state. After the first call
   * is finished, subsequent calls to this method are thread safe.
   *
   * @return  query parameter key-value pairs in a vector, each element is a
   *          pair of which the first element is parameter name and the second
   *          one is parameter value
   */
  const std::vector<std::pair<fbstring, fbstring>>& getQueryParams();

 private:
  fbstring scheme_;
  fbstring username_;
  fbstring password_;
  fbstring host_;
  bool hasAuthority_;
  uint16_t port_;
  fbstring path_;
  fbstring query_;
  fbstring fragment_;
  std::vector<std::pair<fbstring, fbstring>> queryParams_;
};

}  // namespace folly

#include <folly/Uri-inl.h>
