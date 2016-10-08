/**
 * @generated SignedSource<<4425c6f5a34b56ee4707e090f43fd075>>
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !! This file is a check-in of a static_upstream project!      !!
 * !!                                                            !!
 * !! You should not modify this file directly. Instead:         !!
 * !! 1) Use `fjs use-upstream` to temporarily replace this with !!
 * !!    the latest version from upstream.                       !!
 * !! 2) Make your changes, test them, etc.                      !!
 * !! 3) Use `fjs push-upstream` to copy your changes back to    !!
 * !!    static_upstream.                                        !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Module that provides a function for creating a unique identifier.
 * The returned value does not conform to the GUID standard, but should
 * be globally unique in the context of the browser.
 *
 * @providesModule guid
 *
 */

/*jshint bitwise: false*/

function guid() {
  return 'f' + (Math.random() * (1 << 30)).toString(16).replace('.', '');
}

module.exports = guid;
