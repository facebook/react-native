/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ix
 */
'use strict';

/**
 * This function is used to mark string literals that are image paths. The
 * return value is a blob of data that core image components understand how to
 * render.
 *
 * The arguments to ix() must be string literals so that they can be parsed
 * statically.
 *
 * @param  string        Image path to render
 * @return object        Data blob to be used by core UI components
 */
function ix(path) {
  return {
    uri: path,
    isStatic: true,
  };
}

module.exports = ix;
