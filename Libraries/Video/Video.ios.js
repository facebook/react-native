var React = require('React');
var NativeModules = require('NativeModules');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');
var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var PropTypes = require('ReactPropTypes');
var StyleSheetPropType = require('StyleSheetPropType');
var VideoResizeMode = require('./VideoResizeMode');
var VideoStylePropTypes = require('./VideoStylePropTypes');
var NativeMethodsMixin = require('NativeMethodsMixin');
var flattenStyle = require('flattenStyle');
var merge = require('merge');

var Video = React.createClass({
  propTypes: {
    source: PropTypes.string,
    style: StyleSheetPropType(VideoStylePropTypes),
  },

  mixins: [NativeMethodsMixin],

  viewConfig: {
    uiViewClassName: 'UIView',
    validAttributes: ReactIOSViewAttributes.UIView
  },

  render: function() {
    var style = flattenStyle([styles.base, this.props.style]);
    var source = this.props.source;

    var resizeMode;
    var contentModes = NativeModules.VideoManager;
    if (style.resizeMode === VideoResizeMode.stretch) {
      resizeMode = contentModes.ScaleToFill;
    } else if (style.resizeMode === VideoResizeMode.contain) {
      resizeMode = contentModes.ScaleAspectFit;
    } else {
      resizeMode = contentModes.ScaleAspectFill;
    }

    var nativeProps = merge(this.props, {
      style,
      resizeMode,
      src: source,
    });

    return <RCTVideo {... nativeProps} />
  },
});

var RCTVideo = createReactIOSNativeComponentClass({
  validAttributes: merge(ReactIOSViewAttributes.UIView, {src: true, resizeMode: true}),
  uiViewClassName: 'RCTVideo',
});

var styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

module.exports = Video;
