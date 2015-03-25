/**
 * To lower the risk of breaking things on iOS, we are stubbing out the
 * BackStack for now. See Backstack.android.js
 *
 * @providesModule Backstack
 */

'use strict';

var Backstack = {
  pushNavigation: () => {},
  resetToBefore: () => {},
  removeComponentHistory: () => {},
};

module.exports = Backstack;
