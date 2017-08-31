/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule RNTesterStatePersister
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
 * This is currently tied to RNTester because it's generally not good to use AsyncStorage like
 * this in real apps with user data, but we could maybe pull it out for other internal settings-type
 * usage.
 */
function createContainer<Props: Object, State>(
  Component: React.ComponentType<Props & {persister: PassProps<State>}>,
  spec: {
    cacheKeySuffix: (props: Props) => string,
    getInitialState: (props: Props) => State,
    version?: string,
  },
): React.ComponentType<Props> {
  return class ComponentWithPersistedState extends React.Component<Props, $FlowFixMeState> {
    /* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This comment
     * suppresses an error when upgrading Flow's support for React. To see the
     * error delete this comment and run Flow. */
    static displayName = `RNTesterStatePersister(${Component.displayName || Component.name})`;
    state = {value: spec.getInitialState(this.props)};
    _cacheKey = `RNTester:${spec.version || 'v1'}:${spec.cacheKeySuffix(this.props)}`;
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
    render(): React.Node {
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

const RNTesterStatePersister = {
  createContainer,
};

module.exports = RNTesterStatePersister;
