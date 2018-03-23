package com.facebook.react.bridge;

import java.util.List;

/**
 * Interface used to initialize JSI Modules into the JSI Bridge.
 */
public interface JSIModulesProvider {

  /**
   * @return a {@link List<JSIModuleHolder>} that contain the list of JSI Modules.
   */
  List<JSIModuleHolder> getJSIModules(ReactApplicationContext reactApplicationContext, JavaScriptContextHolder jsContext);

}
