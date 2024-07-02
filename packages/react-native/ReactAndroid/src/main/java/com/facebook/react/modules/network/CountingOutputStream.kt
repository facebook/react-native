/*
 * Copyright (C) 2007 The Guava Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.facebook.react.modules.network

import java.io.FilterOutputStream
import java.io.IOException
import java.io.OutputStream

/**
 * An OutputStream that counts the number of bytes written.
 *
 * @author Chris Nokleberg
 * @since 1.0
 */
internal open class CountingOutputStream
/**
 * Constructs a new `FilterOutputStream` with `out` as its target stream.
 *
 * @param out the target stream that this stream writes to.
 */
(out: OutputStream?) : FilterOutputStream(out) {

  /** Returns the number of bytes written. */
  var count: Long = 0
    private set

  @Throws(IOException::class)
  override fun write(b: ByteArray, off: Int, len: Int) {
    out.write(b, off, len)
    count += len.toLong()
  }

  @Throws(IOException::class)
  override fun write(b: Int) {
    out.write(b)
    count++
  }

  // Overriding close() because FilterOutputStream's close() method pre-JDK8 has bad behavior:
  // it silently ignores any exception thrown by flush(). Instead, just close the delegate stream.
  // It should flush itself if necessary.
  @Throws(IOException::class)
  override fun close() {
    out.close()
  }
}
