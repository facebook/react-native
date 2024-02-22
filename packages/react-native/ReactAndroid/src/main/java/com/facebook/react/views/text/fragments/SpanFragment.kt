package com.facebook.react.views.text.fragments

import com.facebook.react.views.text.SpanAttributeProps

internal interface SpanFragment : StringFragment {
  val subFragmentList: StringFragmentList

  val spanAttributeProps: SpanAttributeProps
}
