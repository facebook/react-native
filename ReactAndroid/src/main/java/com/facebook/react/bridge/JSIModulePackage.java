package com.facebook.react.bridge;

import java.util.List;

/**
 * Interface used to initialize JSI Modules into the JSI Bridge.
 */
public interface JSIModulePackage {

  /**
   * @return a {@link List< JSIModuleSpec >} that contain the list of JSI Modules.
   */
  List<JSIModuleSpec> getJSIModules(ReactApplicationContext reactApplicationContext, JavaScriptContextHolder jsContext);

}
