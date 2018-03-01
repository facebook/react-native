package com.facebook.react.bridge;

/**
 * Interface to listen to bridge events.
 */
public interface BridgeListener {

  /**
   * Called right after the RN Bridge is initialized
   * @param catalystInstance {@link CatalystInstance} bridge
   */
  void onBridgeStarted(ReactApplicationContext reactApplicationContext, CatalystInstance catalystInstance);

}
