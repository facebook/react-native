/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule FlipViewWindows
 * @flow
 */
'use strict';

var React = require('React');
var ReactElement = require('ReactElement');
var ReactPropTypes = require('ReactPropTypes');
var UIManager = require('UIManager');
var View = require('View');

var requireNativeComponent = require('requireNativeComponent');

var FLIPVIEW_REF = 'flipView';

type Event = Object;

/**
 * Container that allows to flip left and right between child views. Each
 * child view of the `FlipViewWindows` will be treated as a separate page
 * and will be stretched to fill the `FlipViewWindows`.
 *
 * It is important all children are `<View>`s and not composite components.
 * You can set style properties like `padding` or `backgroundColor` for each
 * child.
 *
 * Example:
 *
 * ```
 * render: function() {
 *   return (
 *     <FlipViewWindows
 *       style={styles.flipView}
 *       alwaysAnimate={false}
 *       initialPage={0}>
 *       <View style={styles.pageStyle}>
 *         <Text>First page</Text>
 *       </View>
 *       <View style={styles.pageStyle}>
 *         <Text>Second page</Text>
 *       </View>
 *     </FlipViewWindows>
 *   );
 * }
 *
 * ...
 *
 * var styles = {
 *   ...
 *   pageStyle: {
 *     alignItems: 'center',
 *     padding: 20,
 *   }
 * }
 * ```
 */
var FlipViewWindows = React.createClass({

  propTypes: {
    ...View.propTypes,
    /**
     * Index of initial page that should be selected. Use `setPage` method to
     * update the page, and `onPageSelected` to monitor page changes
     */
    initialPage: ReactPropTypes.number,

    /**
     * Indicates whether `setPage` calls should be animated.
     */
    alwaysAnimate: ReactPropTypes.bool,
    
    /**
     * This callback when FlipView selection is changed (when user swipes between
     * pages). The `event.nativeEvent` object passed to this callback will have
     * following fields:
     *  - position - index of page that has been selected
     */
    onSelectionChange: ReactPropTypes.func,
  },

  componentDidMount: function() {
    if (this.props.initialPage) {
      this.setPage(this.props.initialPage);
    }
  },
  
  getInnerViewNode: function(): ReactComponent {
    return this.refs[FLIPVIEW_REF].getInnerViewNode();
  },

  _childrenWithOverridenStyle: function(): Array {
    // Override styles so that each page will fill the parent. Native component
    // will handle positioning of elements, so it's not important to offset
    // them correctly.
    return React.Children.map(this.props.children, function(child) {
      if (!child) {
        return null;
      }
      var newProps = {
        ...child.props,
        style: [child.props.style, {
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          width: undefined,
          height: undefined,
        }],
        collapsable: false,
      };
      if (child.type &&
          child.type.displayName &&
          (child.type.displayName !== 'RCTView') &&
          (child.type.displayName !== 'View')) {
        console.warn('Each FlipView child must be a <View>. Was ' + child.type.displayName);
      }
      return ReactElement.createElement(child.type, newProps);
    });
  },

  _onSelectionChange: function(e: Event) {
    if (this.props.onSelectionChange) {
      this.props.onSelectionChange(e);
    }
  },

  /**
   * A helper function to switch to a specific page in the FlipView.
   */
  setPage: function(selectedPage: number) {
    UIManager.dispatchViewManagerCommand(
      React.findNodeHandle(this),
      UIManager.WindowsFlipView.Commands.setPage,
      [selectedPage],
    );
  },

  render: function() {
    return (
      <NativeWindowsFlipView
        ref={FLIPVIEW_REF}
        style={this.props.style}
        alwaysAnimate={this.props.alwaysAnimate}
        onSelectionChange={this._onSelectionChange}
        selectedIndex={this.props.selectedIndex}
        children={this._childrenWithOverridenStyle()}
      />
    );
  },
});

var NativeWindowsFlipView = requireNativeComponent('WindowsFlipView', FlipViewWindows);

module.exports = FlipViewWindows;
