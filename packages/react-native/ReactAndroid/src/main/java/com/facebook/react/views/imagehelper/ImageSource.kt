/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.imagehelper

import android.content.Context
import android.net.Uri
import java.util.Objects

/** Class describing an image source (network URI or resource) and size. */
public open class ImageSource
@JvmOverloads
constructor(
    context: Context,
    /** Get the source of this image, as it was passed to the constructor. */
    public val source: String?,
    width: Double = 0.0,
    height: Double = 0.0
) {

  /** Get the URI for this image - can be either a parsed network URI or a resource URI. */
  public open val uri: Uri = computeUri(context)
  /** Get the area of this image. */
  public val size: Double = width * height
  /** Get whether this image source represents an Android resource or a network URI. */
  public open val isResource: Boolean
    get() = _isResource

  private var _isResource: Boolean = false

  override fun equals(other: Any?): Boolean {
    if (this === other) {
      return true
    }

    if (other == null || javaClass != other.javaClass) {
      return false
    }

    val that = other as ImageSource
    return java.lang.Double.compare(that.size, size) == 0 &&
        isResource == that.isResource &&
        uri == that.uri &&
        source == that.source
  }

  override fun hashCode(): Int = Objects.hash(uri, source, size, isResource)

  private fun computeUri(context: Context): Uri =
      try {
        val uri = Uri.parse(source)
        // Verify scheme is set, so that relative uri (used by static resources) are not handled.
        if (uri.scheme == null) computeLocalUri(context) else uri
      } catch (e: NullPointerException) {
        computeLocalUri(context)
      }

  private fun computeLocalUri(context: Context): Uri {
    _isResource = true
    return ResourceDrawableIdHelper.instance.getResourceDrawableUri(context, source)
  }

  public companion object {
    private const val TRANSPARENT_BITMAP_URI =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

    @JvmStatic
    public fun getTransparentBitmapImageSource(context: Context): ImageSource =
        ImageSource(context, TRANSPARENT_BITMAP_URI)
  }
}
