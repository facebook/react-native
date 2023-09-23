package com.facebook.react.views.text.fragments

/**
 * Interface for a list of [TextFragment]s
 */
internal interface TextFragmentList {
  fun getFragment(index: Int): TextFragment

  val count: Int
}
