/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.imagehelper

import android.content.Context
import android.content.res.Resources
import android.graphics.drawable.Drawable
import android.net.Uri
import androidx.core.content.res.ResourcesCompat
import javax.annotation.concurrent.ThreadSafe
import org.xmlpull.v1.XmlPullParser

/** Helper class for obtaining information about local images. */
@ThreadSafe
public class ResourceDrawableIdHelper private constructor() {
  private val resourceDrawableIdMap: MutableMap<String, Int> = HashMap()

  @Synchronized
  public fun clear() {
    resourceDrawableIdMap.clear()
  }

  public fun getResourceDrawableId(context: Context, name: String?): Int {
    if (name.isNullOrEmpty()) {
      return 0
    }
    val normalizedName = name.lowercase().replace("-", "_")

    // name could be a resource id.
    try {
      return normalizedName.toInt()
    } catch (e: NumberFormatException) {
      // Do nothing.
    }

    synchronized(this) {
      return resourceDrawableIdMap.get(normalizedName) ?: addDrawableId(context, normalizedName)
    }
  }

  private fun addDrawableId(context: Context, normalizedName: String): Int {
    val newId = context.resources.getIdentifier(normalizedName, "drawable", context.packageName)
    resourceDrawableIdMap[normalizedName] = newId
    return newId
  }

  public fun getResourceDrawable(context: Context, name: String?): Drawable? {
    val resId = getResourceDrawableId(context, name)
    return if (resId > 0) ResourcesCompat.getDrawable(context.resources, resId, null) else null
  }

  public fun getResourceDrawableUri(context: Context, name: String?): Uri {
    val resId = getResourceDrawableId(context, name)
    return if (resId > 0) {
      Uri.Builder().scheme(LOCAL_RESOURCE_SCHEME).path(resId.toString()).build()
    } else {
      Uri.EMPTY
    }
  }

  public fun isVectorDrawable(context: Context, name: String): Boolean {
    return getOpeningXmlTag(context, name) == "vector"
  }

  /**
   * If the provided resource name is a valid drawable resource and is an XML file, returns the root
   * XML tag. Skips over the versioning/encoding header. Non-XML files and malformed XML files
   * return null.
   *
   * For example, a vector drawable file would return "vector".
   */
  private fun getOpeningXmlTag(context: Context, name: String): String? {
    val resId = getResourceDrawableId(context, name).takeIf { it > 0 } ?: return null
    return try {
      val xmlParser = context.resources.getXml(resId)
      xmlParser.use {
        var parentTag: String? = null
        var eventType = xmlParser.eventType
        while (eventType != XmlPullParser.END_DOCUMENT) {
          if (eventType == XmlPullParser.START_TAG) {
            parentTag = xmlParser.name
            break
          }
          eventType = xmlParser.next()
        }
        parentTag
      }
    } catch (e: Resources.NotFoundException) {
      // Drawable image is not an XML file
      null
    }
  }

  public companion object {
    private const val LOCAL_RESOURCE_SCHEME = "res"
    private val resourceDrawableIdHelper: ResourceDrawableIdHelper = ResourceDrawableIdHelper()
    @JvmStatic
    public val instance: ResourceDrawableIdHelper
      get() = resourceDrawableIdHelper

    /**
     * We're just re-adding this to reduce a breaking change for libraries in React Native 0.75.
     *
     * @deprecated Use instance instead
     */
    @Deprecated("Use .instance instead, this API is for backward compat", ReplaceWith("instance"))
    @JvmName(
        "DEPRECATED\$getInstance") // We intentionally don't want to expose this accessor to Java.
    public fun getInstance(): ResourceDrawableIdHelper = instance
  }
}
