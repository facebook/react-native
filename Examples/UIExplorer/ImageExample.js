/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ImageExample
 */
'use strict';

var React = require('react-native');
var {
  Image,
  StyleSheet,
  Text,
  View,
  ix,
} = React;

var ImageCapInsetsExample = require('./ImageCapInsetsExample');

exports.framework = 'React';
exports.title = '<Image>';
exports.description = 'Base component for displaying different types of images.';

exports.examples = [
  {
    title: 'Plain Network Image',
    description: 'If the `source` prop `uri` property is prefixed with ' +
    '"http", then it will be downloaded from the network.',
    render: function() {
      return (
        <Image
          source={{uri: 'http://facebook.github.io/react/img/logo_og.png'}}
          style={styles.base}
        />
      );
    },
  },
  {
    title: 'Plain Static Image',
    description: 'Static assets must be referenced with the `ix` wrapper and ' +
      'located in the app bundle.',
    render: function() {
      return (
        <View style={styles.horizontal}>
          <Image source={ix('uie_thumb_normal')} style={styles.icon} />
          <Image source={ix('uie_thumb_selected')} style={styles.icon} />
          <Image source={ix('uie_comment_normal')} style={styles.icon} />
          <Image source={ix('uie_comment_highlighted')} style={styles.icon} />
        </View>
      );
    },
  },
  {
    title: 'Border Color',
    render: function() {
      return (
        <View style={styles.horizontal}>
          <Image
            source={smallImage}
            style={[
              styles.base,
              styles.background,
              {borderWidth: 3, borderColor: '#f099f0'}
            ]}
          />
        </View>
      );
    },
  },
  {
    title: 'Border Width',
    render: function() {
      return (
        <View style={styles.horizontal}>
          <Image
            source={smallImage}
            style={[
              styles.base,
              styles.background,
              {borderWidth: 5, borderColor: '#f099f0'}
            ]}
          />
        </View>
      );
    },
  },
  {
    title: 'Border Radius',
    render: function() {
      return (
        <View style={styles.horizontal}>
          <Image
            style={[styles.base, styles.background, {borderRadius: 5}]}
            source={smallImage}
          />
          <Image
            style={[
              styles.base,
              styles.background,
              styles.leftMargin,
              {borderRadius: 19}
            ]}
            source={smallImage}
          />
        </View>
      );
    },
  },
  {
    title: 'Background Color',
    render: function() {
      return (
        <View style={styles.horizontal}>
          <Image source={smallImage} style={styles.base} />
          <Image
            style={[
              styles.base,
              styles.leftMargin,
              {backgroundColor: 'rgba(0, 0, 100, 0.25)'}
            ]}
            source={smallImage}
          />
          <Image
            style={[styles.base, styles.leftMargin, {backgroundColor: 'red'}]}
            source={smallImage}
          />
          <Image
            style={[styles.base, styles.leftMargin, {backgroundColor: 'black'}]}
            source={smallImage}
          />
        </View>
      );
    },
  },
  {
    title: 'Opacity',
    render: function() {
      return (
        <View style={styles.horizontal}>
          <Image
            style={[styles.base, {opacity: 1}]}
            source={fullImage}
          />
          <Image
            style={[styles.base, styles.leftMargin, {opacity: 0.8}]}
            source={fullImage}
          />
          <Image
            style={[styles.base, styles.leftMargin, {opacity: 0.6}]}
            source={fullImage}
          />
          <Image
            style={[styles.base, styles.leftMargin, {opacity: 0.4}]}
            source={fullImage}
          />
          <Image
            style={[styles.base, styles.leftMargin, {opacity: 0.2}]}
            source={fullImage}
          />
          <Image
            style={[styles.base, styles.leftMargin, {opacity: 0}]}
            source={fullImage}
          />
        </View>
      );
    },
  },
  {
    title: 'Nesting',
    render: function() {
      return (
        <Image
          style={{width: 60, height: 60, backgroundColor: 'transparent'}}
          source={fullImage}>
          <Text style={styles.nestedText}>
            React
          </Text>
        </Image>
      );
    },
  },
  {
    title: 'Tint Color',
    description: 'The `tintColor` style prop changes all the non-alpha ' +
      'pixels to the tint color.',
    render: function() {
      return (
        <View style={styles.horizontal}>
          <Image
            source={ix('uie_thumb_normal')}
            style={[styles.icon, {tintColor: 'blue' }]}
          />
          <Image
            source={ix('uie_thumb_normal')}
            style={[styles.icon, styles.leftMargin, {tintColor: 'green' }]}
          />
          <Image
            source={ix('uie_thumb_normal')}
            style={[styles.icon, styles.leftMargin, {tintColor: 'red' }]}
          />
          <Image
            source={ix('uie_thumb_normal')}
            style={[styles.icon, styles.leftMargin, {tintColor: 'black' }]}
          />
        </View>
      );
    },
  },
  {
    title: 'Resize Mode',
    description: 'The `resizeMode` style prop controls how the image is ' +
      'rendered within the frame.',
    render: function() {
      return (
        <View style={styles.horizontal}>
          <View>
            <Text style={[styles.resizeModeText]}>
              Contain
            </Text>
            <Image
              style={[
                styles.resizeMode,
                {resizeMode: Image.resizeMode.contain}
              ]}
              source={fullImage}
            />
          </View>
          <View style={styles.leftMargin}>
            <Text style={[styles.resizeModeText]}>
              Cover
            </Text>
            <Image
              style={[
                styles.resizeMode,
                {resizeMode: Image.resizeMode.cover}
              ]}
              source={fullImage}
            />
          </View>
          <View style={styles.leftMargin}>
            <Text style={[styles.resizeModeText]}>
              Stretch
            </Text>
            <Image
              style={[
                styles.resizeMode,
                {resizeMode: Image.resizeMode.stretch}
              ]}
              source={fullImage}
            />
          </View>
        </View>
      );
    },
  },
  {
    title: 'Cap Insets',
    description:
      'When the image is resized, the corners of the size specified ' +
      'by capInsets will stay a fixed size, but the center content and ' +
      'borders of the image will be stretched. This is useful for creating ' +
      'resizable rounded buttons, shadows, and other resizable assets.',
    render: function() {
      return <ImageCapInsetsExample />;
    },
  },
];

var fullImage = {uri: 'http://facebook.github.io/react/img/logo_og.png'};
var smallImage = {uri: 'http://facebook.github.io/react/img/logo_small.png'};

var styles = StyleSheet.create({
  base: {
    width: 38,
    height: 38,
  },
  leftMargin: {
    marginLeft: 10,
  },
  background: {
    backgroundColor: '#222222'
  },
  nestedText: {
    marginLeft: 12,
    marginTop: 20,
    backgroundColor: 'transparent',
    color: 'white'
  },
  resizeMode: {
    width: 90,
    height: 60,
    borderWidth: 0.5,
    borderColor: 'black'
  },
  resizeModeText: {
    fontSize: 11,
    marginBottom: 3,
  },
  icon: {
    width: 15,
    height: 15,
  },
  horizontal: {
    flexDirection: 'row',
  }
});
