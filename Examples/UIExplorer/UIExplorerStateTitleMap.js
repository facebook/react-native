/**
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
 */
'use strict';

// $FlowFixMe : This is a platform-forked component, and flow seems to only run on iOS?
const UIExplorerList = require('./UIExplorerList');

import type {NavigationState} from 'NavigationStateUtils';

function StateTitleMap(state: NavigationState): string {
  if (UIExplorerList.Modules[state.key]) {
    return UIExplorerList.Modules[state.key].title
  }
  if (state.key === 'AppList') {
    return 'UIExplorer';
  }
  return 'Unknown';
}

module.exports = StateTitleMap;
