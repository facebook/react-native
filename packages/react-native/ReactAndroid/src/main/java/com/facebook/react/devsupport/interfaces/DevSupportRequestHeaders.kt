/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces

import java.util.concurrent.ConcurrentHashMap

/**
 * Thread-safe singleton for registering custom HTTP headers that will be applied to all React
 * Native dev-support network traffic (bundle fetches, packager status checks, inspector
 * connections, HMR WebSocket upgrades).
 *
 * Headers are stored globally and survive across React Host re-creations, so they can be set before
 * the first app load.
 */
public object DevSupportRequestHeaders {

  private val headers = ConcurrentHashMap<String, String>()

  /** Adds (or replaces) a custom request header. */
  @JvmStatic
  public fun addRequestHeader(name: String, value: String) {
    headers[name] = value
  }

  /** Removes a previously added custom request header. */
  @JvmStatic
  public fun removeRequestHeader(name: String) {
    headers.remove(name)
  }

  /** Returns a snapshot of all currently registered headers. */
  @JvmStatic public fun allHeaders(): Map<String, String> = HashMap(headers)
}
