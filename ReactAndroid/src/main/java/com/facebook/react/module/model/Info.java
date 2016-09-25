// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.module.model;

/**
 * Interface for static information about native modules.
 */
public interface Info {

  String name();

  boolean canOverrideExistingModule();

  boolean supportsWebWorkers();

  boolean needsEagerInit();
}
