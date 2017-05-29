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
 * @providesModule IncrementalExample
 * @flow
 */
'use strict';

const React = require('react-native');
const {
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} = React;

const Incremental = require('Incremental');
const IncrementalGroup = require('IncrementalGroup');
const IncrementalPresenter = require('IncrementalPresenter');

const performanceNow = require('performanceNow');

InteractionManager.setDeadline(50);

const NUM_ITEMS = 20;

class SlowWidget extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      ctorTimestamp: performanceNow(),
      renderTime: 0,
    };
  }
  render() {
    this.state.renderTime === 0 && burnCPU(10);
    return (
      <View style={styles.widgetContainer}>
        <Text style={styles.widgetText}>
          {`${this.state.renderTime || '?'} ms`}
        </Text>
      </View>
    );
  }
  componentDidMount() {
    const renderTime = performanceNow() - this.state.ctorTimestamp;
    this.setState({renderTime});
  }
}

let imHandle;
function startInteraction() {
  imHandle = InteractionManager.createInteractionHandle();
}
function stopInteraction() {
  InteractionManager.clearInteractionHandle(imHandle);
}

function Block(props: Object) {
  const Group = props.stream ? IncrementalGroup : IncrementalPresenter;
  return (
    <Group name={'b_' + props.idx}>
      <TouchableOpacity
        onPressIn={startInteraction}
        onPressOut={stopInteraction}>
        <View style={styles.block}>
          <Text>
            {props.idx + ': ' + (props.stream ? 'Streaming' : 'Presented')}
          </Text>
          {props.children}
        </View>
      </TouchableOpacity>
    </Group>
  );
}

const Row = (props: Object) => <View style={styles.row} {...props} />;

class IncrementalExample extends React.Component {
  constructor(props: mixed, context: mixed) {
    super(props, context);
    this.start = performanceNow();
  }
  render(): ReactElement {
    return (
      <IncrementalGroup
        name="root"
        onDone={() => console.log('onDone elapsed: ', performanceNow() - this.start)}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.headerText}>
            Press and hold on a row to pause rendering.
          </Text>
          {Array(8).fill().map((_, blockIdx) => {
            return (
              <Block key={blockIdx} idx={blockIdx} stream={blockIdx < 2}>
                {Array(4).fill().map((_, rowIdx) => (
                  <Row key={rowIdx}>
                    {Array(14).fill().map((_, widgetIdx) => (
                      <Incremental key={widgetIdx} name={'w_' + widgetIdx}>
                        <SlowWidget idx={widgetIdx} />
                      </Incremental>
                    ))}
                  </Row>
                ))}
              </Block>
            );
          })}
        </ScrollView>
      </IncrementalGroup>
    );
  }
}
IncrementalExample.title = '<Incremental*>';
IncrementalExample.description = 'Enables incremental rendering of complex components.';

function burnCPU(milliseconds) {
  const start = performanceNow();
  while (performanceNow() < (start + milliseconds)) {}
}

var styles = StyleSheet.create({
  scrollView: {
    margin: 10,
    backgroundColor: 'white',
    flex: 1,
  },
  headerText: {
    fontSize: 20,
    margin: 10,
  },
  block: {
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#a52a2a',
    padding: 14,
    margin: 5,
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
  },
  widgetContainer: {
    backgroundColor: '#dddddd',
    padding: 2,
    margin: 2,
  },
  widgetText: {
    color: 'black',
    fontSize: 4,
  },
});

module.exports = IncrementalExample;





/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Incremental
 * @flow
 */
'use strict';

const InteractionManager = require('InteractionManager');
const React = require('React');

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
 * recursively by wrapping pieces of them and their decendents in
 * `<Incremental>` components, and wrapping those in `<IncrementalGroup>`
 * components, e.g. via `<IncrementalPresenter>` (similar to an
 * `asyncTransactionContainer`) so the group will be presented to the user as
 * one unit, rather than popping in sequentially.
 *
 * `<Incremental>` only affects initial render - setState and other render
 * updates are unaffected.
 *
 * The chunks are rendered sequentially using the `InteractionManager` queue,
 * which means that rendering will pause if it's interrupted by an interaction,
 * such as an animation or gesture.
 *
 * Note there is some overhead, so you don't want to slice things up too much.
 * a target of 100-200ms of total work per event loop on old/slow devices might
 * be a reasonable place to start.
 *
 * Below is an example that will incrementally render all the parts of row one
 * first, then present them together, then repeat the process for row two:
 *
 *   render: function() {
 *     return (
 *       <ScrollView>
 *         {[0,1,2,3,4,5,6,7,8].map((rowIdx) => (
 *           <IncrementalPresenter key={rowIdx}>
 *             <Row>
 *               {[0,1,2,3].map((widgetIdx) => (
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
 */
export type Props = {
 /**
  * Called when all the decendents have finished rendering and mounting
  * recursively.
  */
 onDone?: () => void;
 /**
  * Tags instances and associated tasks for easier debugging.
  */
 name: string;
 children: any;
};
class Incremental extends React.Component {
  props: Props;
  state: State;
  context: Context;
  _incrementId: number;

  constructor(props: Props, context: Context) {
    super(props, context);
    this.state = {
      doIncrementalRender: false,
    };
  }

  getName(): string {
    var ctx = this.context.incrementalGroup || {};
    return ctx.groupId + ':' + this._incrementId + '-' + this.props.name;
  }

  componentWillMount() {
    var ctx = this.context.incrementalGroup;
    if (!ctx) {
      return;
    }
    this._incrementId = ++(ctx.incrementalCount);
    InteractionManager.runAfterInteractions({
      name: 'Incremental:' + this.getName(),
      gen: () => new Promise(resolve => {
        DEBUG && console.log('set doIncrementalRender for ' + this.getName());
        this.setState({doIncrementalRender: true}, resolve);
      }),
    }).then(() => {
      this.props.onDone && this.props.onDone();
    });
  }

  render(): ?ReactElement {
    if (!this.context.incrementalGroup || this.state.doIncrementalRender) {
      DEBUG && console.log('render ' + this.getName());
      return this.props.children;
    }
    return null;
  }

  componentDidMount() {
    if (!this.context.incrementalGroup) {
      this.props.onDone && this.props.onDone();
    }
  }
}
Incremental.defaultProps = {
  name: '',
};
Incremental.contextTypes = {
  incrementalGroup: React.PropTypes.object,
};

type State = {
  doIncrementalRender: boolean;
};

export type Context = {
  incrementalGroup: {
    groupId: string;
    incrementalCount: number;
  };
};

module.exports = Incremental;



/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule IncrementalGroup
 * @flow
 */
'use strict';

const Incremental = require('Incremental');
const React = require('React');

let _groupCounter = -1;
const DEBUG = false;

import type {Props, Context} from 'Incremental';

/**
 * WARNING: EXPERIMENTAL. Breaking changes will probably happen a lot and will
 * not be reliably announced.  The whole thing might be deleted, who knows? Use
 * at your own risk.
 *
 * `<Incremental>` components must be wrapped in an `<IncrementalGroup>` (e.g.
 * via `<IncrementalPresenter>`) in order to provide the incremental group
 * context, otherwise they will do nothing.
 */
class IncrementalGroup extends React.Component {
  props: Props;
  context: Context;
  _groupInc: string;
  componentWillMount() {
    this._groupInc = `g${++_groupCounter}-`;
    DEBUG && console.log(
      'create IncrementalGroup with id ' + this.getGroupId()
    );
  }

  getGroupId(): string {
    const ctx = this.context.incrementalGroup;
    const prefix = ctx ? ctx.groupId + ':' : '';
    return prefix + this._groupInc + this.props.name;
  }

  getChildContext(): Context {
    return {
      incrementalGroup: {
        groupId: this.getGroupId(),
        incrementalCount: -1,
      },
    };
  }

  render(): ReactElement {
    return (
      <Incremental
        onDone={this.props.onDone}
        children={this.props.children}
      />
    );
  }
}
IncrementalGroup.contextTypes = {
  incrementalGroup: React.PropTypes.object,
};
IncrementalGroup.childContextTypes = IncrementalGroup.contextTypes;

module.exports = IncrementalGroup;




/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule IncrementalPresenter
 * @flow
 */
'use strict';

const IncrementalGroup = require('IncrementalGroup');
const React = require('React');
const View = require('View');

import type {Context} from 'Incremental';

/**
 * WARNING: EXPERIMENTAL. Breaking changes will probably happen a lot and will
 * not be reliably announced.  The whole thing might be deleted, who knows? Use
 * at your own risk.
 *
 * `<IncrementalPresenter>` can be used to group sets of `<Incremental>` renders
 * such that they are initially invisible and removed from layout until all
 * decendents have finished rendering, at which point they are drawn all at once
 * so the UI doesn't jump around during the incremental rendering process.
 */
type Props = {
 name: string;
 onDone: () => void;
 style: mixed;
 children: any;
}
class IncrementalPresenter extends React.Component {
  props: Props;
  context: Context;
  _isDone: boolean;
  constructor(props: Props, context: Context) {
    super(props, context);
    this._isDone = false;
    (this: any).onDone = this.onDone.bind(this);
  }
  onDone() {
    this._isDone = true;
    if (this.context.incrementalGroup) {
      // Avoid expensive re-renders and use setNativeProps
      this.refs.view.setNativeProps(
        {style: [this.props.style, {opacity: 1, position: 'relative'}]}
      );
    }
    this.props.onDone && this.props.onDone();
  }
  render() {
    if (this.context.incrementalGroup && !this._isDone) {
      var style = [this.props.style, {opacity: 0, position: 'absolute'}];
    } else {
      var style = this.props.style;
    }
    return (
      <IncrementalGroup onDone={this.onDone} name={this.props.name}>
        <View
          children={this.props.children}
          ref="view"
          style={style}
        />
      </IncrementalGroup>
    );
  }
}
IncrementalPresenter.propTypes = {
  name: React.PropTypes.string,
  onDone: React.PropTypes.func,
  style: View.propTypes.style,
};
IncrementalPresenter.contextTypes = {
  incrementalGroup: React.PropTypes.object,
};

module.exports = IncrementalPresenter;
