/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule Incremental
 * @flow
 */
'use strict';

const InteractionManager = require('InteractionManager');
const React = require('React');

const PropTypes = require('prop-types');

const infoLog = require('infoLog');

const DEBUG = false;

/**
 * WARNING: EXPERIMENTAL. Breaking changes will probably happen a lot and will
 * not be reliably announced.  The whole thing might be deleted, who knows? Use
 * at your own risk.
 *
 * React Native helps make apps smooth by doing all the heavy lifting off the
 * main thread, in JavaScript.  That works great a lot of the time, except that
 * heavy operations like rendering may block the JS thread from responding
 * quickly to events like taps, making the app feel sluggish.
 *
 * `<Incremental>` solves this by slicing up rendering into chunks that are
 * spread across multiple event loops. Expensive components can be sliced up
 * recursively by wrapping pieces of them and their descendants in
 * `<Incremental>` components. `<IncrementalGroup>` can be used to make sure
 * everything in the group is rendered recursively before calling `onDone` and
 * moving on to another sibling group (e.g. render one row at a time, even if
 * rendering the top level row component produces more `<Incremental>` chunks).
 * `<IncrementalPresenter>` is a type of `<IncrementalGroup>` that keeps it's
 * children invisible and out of the layout tree until all rendering completes
 * recursively. This means the group will be presented to the user as one unit,
 * rather than pieces popping in sequentially.
 *
 * `<Incremental>` only affects initial render - `setState` and other render
 * updates are unaffected.
 *
 * The chunks are rendered sequentially using the `InteractionManager` queue,
 * which means that rendering will pause if it's interrupted by an interaction,
 * such as an animation or gesture.
 *
 * Note there is some overhead, so you don't want to slice things up too much.
 * A target of 100-200ms of total work per event loop on old/slow devices might
 * be a reasonable place to start.
 *
 * Below is an example that will incrementally render all the parts of `Row` one
 * first, then present them together, then repeat the process for `Row` two, and
 * so on:
 *
 *   render: function() {
 *     return (
 *       <ScrollView>
 *         {Array(10).fill().map((rowIdx) => (
 *           <IncrementalPresenter key={rowIdx}>
 *             <Row>
 *               {Array(20).fill().map((widgetIdx) => (
 *                 <Incremental key={widgetIdx}>
 *                   <SlowWidget />
 *                 </Incremental>
 *               ))}
 *             </Row>
 *           </IncrementalPresenter>
 *         ))}
 *       </ScrollView>
 *     );
 *   };
 *
 * If SlowWidget takes 30ms to render, then without `Incremental`, this would
 * block the JS thread for at least `10 * 20 * 30ms = 6000ms`, but with
 * `Incremental` it will probably not block for more than 50-100ms at a time,
 * allowing user interactions to take place which might even unmount this
 * component, saving us from ever doing the remaining rendering work.
 */
export type Props = {
 /**
  * Called when all the descendants have finished rendering and mounting
  * recursively.
  */
 onDone?: () => void,
 /**
  * Tags instances and associated tasks for easier debugging.
  */
 name: string,
 children?: any,
};
type DefaultProps = {
  name: string,
};
type State = {
  doIncrementalRender: boolean,
};
class Incremental extends React.Component<Props, State> {
  props: Props;
  state: State;
  context: Context;
  _incrementId: number;
  _mounted: boolean;
  _rendered: boolean;

  static defaultProps = {
    name: '',
  };

  static contextTypes = {
    incrementalGroup: PropTypes.object,
    incrementalGroupEnabled: PropTypes.bool,
  };

  constructor(props: Props, context: Context) {
    super(props, context);
    this._mounted = false;
    this.state = {
      doIncrementalRender: false,
    };
  }

  getName(): string {
    const ctx = this.context.incrementalGroup || {};
    return ctx.groupId + ':' + this._incrementId + '-' + this.props.name;
  }

  UNSAFE_componentWillMount() {
    const ctx = this.context.incrementalGroup;
    if (!ctx) {
      return;
    }
    this._incrementId = ++(ctx.incrementalCount);
    InteractionManager.runAfterInteractions({
      name: 'Incremental:' + this.getName(),
      gen: () => new Promise(resolve => {
        if (!this._mounted || this._rendered) {
          resolve();
          return;
        }
        DEBUG && infoLog('set doIncrementalRender for ' + this.getName());
        this.setState({doIncrementalRender: true}, resolve);
      }),
    }).then(() => {
      DEBUG && infoLog('call onDone for ' + this.getName());
      this._mounted && this.props.onDone && this.props.onDone();
    }).catch((ex) => {
      ex.message = `Incremental render failed for ${this.getName()}: ${ex.message}`;
      throw ex;
    }).done();
  }

  render(): React.Node {
    if (this._rendered || // Make sure that once we render once, we stay rendered even if incrementalGroupEnabled gets flipped.
        !this.context.incrementalGroupEnabled ||
        this.state.doIncrementalRender) {
      DEBUG && infoLog('render ' + this.getName());
      this._rendered = true;
      return this.props.children;
    }
    return null;
  }

  componentDidMount() {
    this._mounted = true;
    if (!this.context.incrementalGroup) {
      this.props.onDone && this.props.onDone();
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }
}

export type Context = {
  incrementalGroupEnabled: boolean,
  incrementalGroup: ?{
    groupId: string,
    incrementalCount: number,
  },
};

module.exports = Incremental;
