/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 * @providesModule UIExplorerNavigationReducer
 */
'use strict';

// $FlowFixMe : This is a platform-forked component, and flow seems to only run on iOS?
const UIExplorerList = require('./UIExplorerList');

export type UIExplorerNavigationState = {
  openExample: ?string,
};

function UIExplorerNavigationReducer(
  state: ?UIExplorerNavigationState,
  action: any
): UIExplorerNavigationState {

  if (
    // Default value is to see example list
    !state ||

    // Handle the explicit list action
    action.type === 'UIExplorerListAction' ||

    // Handle requests to go back to the list when an example is open
    (state.openExample && action.type === 'UIExplorerBackAction')
  ) {
    return {
      // A null openExample will cause the views to display the UIExplorer example list
      openExample: null,
    };
  }

  if (action.type === 'UIExplorerExampleAction') {

    // Make sure we see the module before returning the new state
    const ExampleModule = UIExplorerList.Modules[action.openExample];

    if (ExampleModule) {
      return {
        openExample: action.openExample,
      };
    }
  }

  return state;
}

module.exports = UIExplorerNavigationReducer;
