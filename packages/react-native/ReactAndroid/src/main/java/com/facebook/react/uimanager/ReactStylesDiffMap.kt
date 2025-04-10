package com.facebook.react.uimanager

import com.facebook.infer.annotation.Nullsafe
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap

/**
 * Wrapper for [ReadableMap] used for styles. Provides accessor methods with default values.
 * Null values represent resetting properties to default.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ReactStylesDiffMap(props: ReadableMap) {

  @JvmField
  public val mBackingMap: ReadableMap = props

  public fun toMap(): Map<String, Any?> = mBackingMap.toHashMap()

  public fun hasKey(name: String): Boolean = mBackingMap.hasKey(name)

  public fun isNull(name: String): Boolean = mBackingMap.isNull(name)

  public fun getBoolean(name: String, default: Boolean): Boolean {
    return if (mBackingMap.isNull(name)) default else mBackingMap.getBoolean(name)
  }

  public fun getDouble(name: String, default: Double): Double {
    return if (mBackingMap.isNull(name)) default else mBackingMap.getDouble(name)
  }

  public fun getFloat(name: String, default: Float): Float {
    return if (mBackingMap.isNull(name)) default else mBackingMap.getDouble(name).toFloat()
  }

  public fun getInt(name: String, default: Int): Int {
    return if (mBackingMap.isNull(name)) default else mBackingMap.getInt(name)
  }

  public fun getString(name: String): String? = mBackingMap.getString(name)

  public fun getArray(name: String): ReadableArray? = mBackingMap.getArray(name)

  public fun getMap(name: String): ReadableMap? = mBackingMap.getMap(name)

  public fun getDynamic(name: String): Dynamic = mBackingMap.getDynamic(name)

  override fun toString(): String = "{ ${javaClass.simpleName}: $mBackingMap }"
}
