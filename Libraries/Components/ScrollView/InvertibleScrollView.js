/**
 * @providesModule InvertibleScrollView
 * @flow weak
 */
'use strict';

let React = require('react-native');
let {
  PropTypes,
  ScrollView,
  StyleSheet,
  View,
} = React;

function cloneReferencedElement(element, config, ...children) {
  let cloneRef = config.ref;
  let originalRef = element.ref;
  if (originalRef == null || cloneRef == null) {
    return React.cloneElement(element, config, ...children);
  }

  if (typeof originalRef !== 'function') {
    if (__DEV__) {
      console.warn(
        'Cloning an element with a ref that will be overwritten because it ' +
        'is not a function. Use a composable callback-style ref instead. ' +
        'Ignoring ref: ' + originalRef,
      );
    }
    return React.cloneElement(element, config, ...children);
  }

  return React.cloneElement(element, {
    ...config,
    ref(component) {
      cloneRef(component);
      originalRef(component);
    },
  }, ...children);
}

let ScrollableMixin = {
  getInnerViewNode(): any {
    return this.getScrollResponder().getInnerViewNode();
  },

  scrollTo(destY?: number, destX?: number) {
    this.getScrollResponder().scrollTo(destY, destX);
  },

  scrollWithoutAnimationTo(destY?: number, destX?: number) {
    this.getScrollResponder().scrollWithoutAnimationTo(destY, destX);
  },
};

type DefaultProps = {
  renderScrollComponent: (props: Object) => ReactElement;
};

let InvertibleScrollView = React.createClass({
  mixins: [ScrollableMixin],

  _scrollComponent: (null: any),

  propTypes: {
    ...ScrollView.propTypes,
    inverted: PropTypes.bool,
    renderScrollComponent: PropTypes.func.isRequired,
  },

  getDefaultProps(): DefaultProps {
    return {
      renderScrollComponent: props => <ScrollView {...props} />,
    };
  },

  getScrollResponder(): ReactComponent {
    return this._scrollComponent.getScrollResponder();
  },

  setNativeProps(props: Object) {
    this._scrollComponent.setNativeProps(props);
  },

  render() {
    var {
      inverted,
      renderScrollComponent,
      ...props,
    } = this.props;

    if (inverted) {
      if (this.props.horizontal) {
        props.style = [styles.horizontallyInverted, props.style];
        props.children = this._renderInvertedChildren(props.children, styles.horizontallyInverted);
      } else {
        props.style = [styles.verticallyInverted, props.style];
        props.children = this._renderInvertedChildren(props.children, styles.verticallyInverted);
      }
    }

    return cloneReferencedElement(renderScrollComponent(props), {
      ref: component => { this._scrollComponent = component; },
    });
  },

  _renderInvertedChildren(children, inversionStyle) {
    return React.Children.map(children, child => {
      return child ? <View style={inversionStyle}>{child}</View> : child;
    });
  },
});

let styles = StyleSheet.create({
  verticallyInverted: {
    transform: [
      { scaleY: -1 },
    ],
  },
  horizontallyInverted: {
    transform: [
      { scaleX: -1 },
    ],
  },
});

module.exports = InvertibleScrollView;