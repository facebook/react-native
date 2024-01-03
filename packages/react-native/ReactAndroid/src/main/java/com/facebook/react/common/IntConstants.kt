package com.facebook.react.common

/**
 * General-purpose integer constants
 */
internal object IntConstants {
  /**
   * Some types have built-in support for representing a "missing" or "unset" value, for example
   * NaN in the case of floating point numbers or null in the case of object references. Integers
   * don't have such a special value. When an integer represent an inherently non-negative value,
   * we use a special negative value to mark it as "unset".
   */
  const val UNSET: Int = -1
}
