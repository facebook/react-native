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
 * @providesModule UIExplorerStatePersister
 */
'use strict';

const AsyncStorage = require('AsyncStorage');
const React = require('React');

export type PassProps<State> = {
  state: State,
  setState: (stateLamda: (state: State) => State) => void,
};

/**
 * A simple container for persisting some state and passing it into the wrapped component as
 * `props.persister.state`. Update it with `props.persister.setState`. The component is initially
 * rendered using `getInitialState` in the spec and is then re-rendered with the persisted data
 * once it's fetched.
 *
 * This is currently tied to UIExplorer because it's generally not good to use AsyncStorage like
 * this in real apps with user data, but we could maybe pull it out for other internal settings-type
 * usage.
 */
function createContainer<Props: Object, State>(
  Component: ReactClass<Props & {persister: PassProps<State>}>,
  spec: {
    cacheKeySuffix: (props: Props) => string,
    getInitialState: (props: Props) => State,
    version?: string,
  },
): ReactClass<Props> {
  return class ComponentWithPersistedState extends React.Component {
    props: Props;
    static displayName = `UIExplorerStatePersister(${Component.displayName || Component.name})`;
    state = {value: spec.getInitialState(this.props)};
    _cacheKey = `UIExplorer:${spec.version || 'v1'}:${spec.cacheKeySuffix(this.props)}`;
    componentDidMount() {
      AsyncStorage.getItem(this._cacheKey, (err, value) => {
        if (!err && value) {
          this.setState({value: JSON.parse(value)});
        }
      });
    }
    _passSetState = (stateLamda: (state: State) => State): void => {
      this.setState((state) => {
        const value = stateLamda(state.value);
        AsyncStorage.setItem(this._cacheKey, JSON.stringify(value));
        return {value};
      });
    };
    render(): React.Element<*> {
      return (
        <Component
          {...this.props}
          persister={{
            state: this.state.value,
            setState: this._passSetState,
          }}
        />
      );
    }
  };
}

const UIExplorerStatePersister = {
  createContainer,
};

module.exports = UIExplorerStatePersister;
