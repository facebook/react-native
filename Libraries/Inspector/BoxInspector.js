/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('React');
const StyleSheet = require('StyleSheet');
const Text = require('Text');
const View = require('View');
const resolveBoxStyle = require('resolveBoxStyle');

const blank = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

class BoxInspector extends React.Component<$FlowFixMeProps> {
  render() {
    const frame = this.props.frame;
    const style = this.props.style;
    const margin = (style && resolveBoxStyle('margin', style)) || blank;
    const padding = (style && resolveBoxStyle('padding', style)) || blank;
    return (
      <BoxContainer title="margin" titleStyle={styles.marginLabel} box={margin}>
        <BoxContainer title="padding" box={padding}>
          <View>
            <Text style={styles.innerText}>
              ({(frame.left || 0).toFixed(1)}, {(frame.top || 0).toFixed(1)})
            </Text>
            <Text style={styles.innerText}>
              {(frame.width || 0).toFixed(1)} &times;{' '}
              {(frame.height || 0).toFixed(1)}
            </Text>
          </View>
        </BoxContainer>
      </BoxContainer>
    );
  }
}

class BoxContainer extends React.Component<$FlowFixMeProps> {
  render() {
    const box = this.props.box;
    return (
      <View style={styles.box}>
        <View style={styles.row}>
          {}
          <Text style={[this.props.titleStyle, styles.label]}>
            {this.props.title}
          </Text>
          <Text style={styles.boxText}>{box.top}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.boxText}>{box.left}</Text>
          {this.props.children}
          <Text style={styles.boxText}>{box.right}</Text>
        </View>
        <Text style={styles.boxText}>{box.bottom}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  marginLabel: {
    width: 60,
  },
  label: {
    fontSize: 10,
    color: 'rgb(255,100,0)',
    marginLeft: 5,
    flex: 1,
    textAlign: 'left',
    top: -3,
  },
  buffer: {
    fontSize: 10,
    color: 'yellow',
    flex: 1,
    textAlign: 'center',
  },
  innerText: {
    color: 'yellow',
    fontSize: 12,
    textAlign: 'center',
    width: 70,
  },
  box: {
    borderWidth: 1,
    borderColor: 'grey',
  },
  boxText: {
    color: 'white',
    fontSize: 12,
    marginHorizontal: 3,
    marginVertical: 2,
    textAlign: 'center',
  },
});

module.exports = BoxInspector;
