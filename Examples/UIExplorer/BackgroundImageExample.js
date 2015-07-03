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
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  View
} = React;

var {width, height} = require('Dimensions').get('window');

var styles = StyleSheet.create({
  box: {
    width: width - 40,
    height: 100,
  },
  bg1: {
    backgroundColor: '#eee',
  },
  bg2: {
    backgroundColor: '#eee',
    backgroundRepeat: 'repeat-x',
  },
  bg3: {
    backgroundColor: '#eee',
    backgroundRepeat: 'repeat-y',
  },
  bg4: {
    backgroundColor: '#eee',
    backgroundRepeat: 'no-repeat',
  },
  bg5: {
    backgroundColor: '#eee',
    backgroundSize: {width: 16, height: 16},
  },
  bg6: {
    backgroundColor: '#eee',
    backgroundPosition: {x: 20, y: 20},
  },
  bg7: {
    borderWidth: 10,
    borderColor: 'brown',
  },
  bg8: {
    borderWidth: 10,
    borderLeftWidth: 20,
    borderColor: 'brown',
  },
  bgBase64: {
    backgroundImage: 'data:image/png;charset=utf-8;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAEmUExURQAAAKi2tqe3t39/f6i2tqm2tq23t7CwsKq2tqm2tqi3t6i2tqqqqv///6e3t6i3t7+/v6i3t6m3t6m3t6i2tqqzs6i3t6e3t6i2tqa2tqi3t6q1tay4uKi5uam3t6m2tqi3t6q4uKm3t6i1tai2tqq3t6m2tqi3t6i2tqm3t6m3t6m2tqm3t6Wysqi4uKm2tqe3t6i4uKi3t6i3t6i2tqm2tqm3t6e1tai3t6i3t7Kysqi2tqq4uKy0tKm3t6m2tqi3t6W0tKm3t6e0tKa1tai3t6m1tai3t6i3t6m3t5+/v6i2tqm3t6i2tqm3t6i2tqi2tqq4uKi3t6i3t6i3t6m2tqa0tKq0tKi3t6m2tqi3t6m3t6q1tam3t6q3t6O2tqi0tKm3t+PG1XkAAABhdFJOUwA1IAKCuxkNaV9HkwMBT44EMqTIpRv1QMkuiy0oLGu/fEh6O6lO06hq65J3/RRT9FJzlquU324mw+MKikUftoyaEa8pNL1l5IfLCO2qptHs/jb5eZnlNxhVsMDKQtw5Dj48l0d6AAAA8klEQVQ4y2NgoDZglyagQJaFgAJFVgIKODWZ8StgSdTFr0AkURC/AotEA/wKLBMN8cozBSQaASke7LJcggyBiYlAf5qJYleQEC3OnZior2diLYDDgrhEMBDGLhsvyScFUeDPERaO7AomTm1+kahYsUQkEBQqbKylJMcIViCjoG6aiAWIyXNzwU0REI3hkIp0h0pJhARHSLJjcYYtRN4VVygxCwlJAOV97Fywy/Ny2DOIJyb6MTA6OGJXwMbA4JyY6MvAYMWOMy68vBM98MemZ6IbfgVOiTb4FfAnmuNXoKHDjl+BqhqBZK+sQkABGx/VczMAIYMw06u3NvkAAAAASUVORK5CYII=',
  },
});

exports.title = 'BackgroundImage';
exports.description = 'Background Image';
exports.examples = [
  {
    title: 'BackgroundImage',
    description: 'Base64 BackgroundImage, repeat, backgroundColor',
    render() {
      return <View style={[styles.box, styles.bg1, styles.bgBase64]} />;
    }
  },
  {
    title: 'backgroundRepeat',
    description: 'repeat-x',
    render() {
      return <View style={[styles.box, styles.bg2, styles.bgBase64]} />;
    }
  },
  {
    title: 'backgroundRepeat',
    description: 'repeat-y',
    render() {
      return <View style={[styles.box, styles.bg3, styles.bgBase64]} />;
    }
  },
  {
    title: 'backgroundRepeat',
    description: 'no-repeat',
    render() {
      return <View style={[styles.box, styles.bg4, styles.bgBase64]} />;
    }
  },
  {
    title: 'backgroundSize',
    description: 'backgroundSize',
    render() {
      return <View style={[styles.box, styles.bg5, styles.bgBase64]} />;
    }
  },
  {
    title: 'backgroundPosition',
    description: 'backgroundPosition',
    render() {
      return <View style={[styles.box, styles.bg6, styles.bgBase64]} />;
    }
  },
  {
    title: 'With Same-Width Borders',
    description: 'Same-Width borders',
    render() {
      return <View style={[styles.box, styles.bg7, styles.bgBase64]} />;
    }
  },
  {
    title: 'With Custom-Width Borders',
    description: 'Custom-Width borders',
    render() {
      return <View style={[styles.box, styles.bg8, styles.bgBase64]} />;
    }
  },
];