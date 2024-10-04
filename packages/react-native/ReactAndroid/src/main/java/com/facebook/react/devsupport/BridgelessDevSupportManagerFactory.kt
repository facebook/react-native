package com.facebook.react.devsupport

import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.runtime.ReactHostImpl

public fun interface BridgelessDevSupportManagerFactory {
  public fun create(
    reactHost: ReactHostImpl
  ): DevSupportManager
}
