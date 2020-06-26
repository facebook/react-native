/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const React = require('react');

const {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  ImageBackground,
} = require('react-native');

const base64Icon =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABLCAQAAACSR7JhAAADtUlEQVR4Ac3YA2Bj6QLH0XPT1Fzbtm29tW3btm3bfLZtv7e2ObZnms7d8Uw098tuetPzrxv8wiISrtVudrG2JXQZ4VOv+qUfmqCGGl1mqLhoA52oZlb0mrjsnhKpgeUNEs91Z0pd1kvihA3ULGVHiQO2narKSHKkEMulm9VgUyE60s1aWoMQUbpZOWE+kaqs4eLEjdIlZTcFZB0ndc1+lhB1lZrIuk5P2aib1NBpZaL+JaOGIt0ls47SKzLC7CqrlGF6RZ09HGoNy1lYl2aRSWL5GuzqWU1KafRdoRp0iOQEiDzgZPnG6DbldcomadViflnl/cL93tOoVbsOLVM2jylvdWjXolWX1hmfZbGR/wjypDjFLSZIRov09BgYmtUqPQPlQrPapecLgTIy0jMgPKtTeob2zWtrGH3xvjUkPCtNg/tm1rjwrMa+mdUkPd3hWbH0jArPGiU9ufCsNNWFZ40wpwn+62/66R2RUtoso1OB34tnLOcy7YB1fUdc9e0q3yru8PGM773vXsuZ5YIZX+5xmHwHGVvlrGPN6ZSiP1smOsMMde40wKv2VmwPPVXNut4sVpUreZiLBHi0qln/VQeI/LTMYXpsJtFiclUN+5HVZazim+Ky+7sAvxWnvjXrJFneVtLWLyPJu9K3cXLWeOlbMTlrIelbMDlrLenrjEQOtIF+fuI9xRp9ZBFp6+b6WT8RrxEpdK64BuvHgDk+vUy+b5hYk6zfyfs051gRoNO1usU12WWRWL73/MMEy9pMi9qIrR4ZpV16Rrvduxazmy1FSvuFXRkqTnE7m2kdb5U8xGjLw/spRr1uTov4uOgQE+0N/DvFrG/Jt7i/FzwxbA9kDanhf2w+t4V97G8lrT7wc08aA2QNUkuTfW/KimT01wdlfK4yEw030VfT0RtZbzjeMprNq8m8tnSTASrTLti64oBNdpmMQm0eEwvfPwRbUBywG5TzjPCsdwk3IeAXjQblLCoXnDVeoAz6SfJNk5TTzytCNZk/POtTSV40NwOFWzw86wNJRpubpXsn60NJFlHeqlYRbslqZm2jnEZ3qcSKgm0kTli3zZVS7y/iivZTweYXJ26Y+RTbV1zh3hYkgyFGSTKPfRVbRqWWVReaxYeSLarYv1Qqsmh1s95S7G+eEWK0f3jYKTbV6bOwepjfhtafsvUsqrQvrGC8YhmnO9cSCk3yuY984F1vesdHYhWJ5FvASlacshUsajFt2mUM9pqzvKGcyNJW0arTKN1GGGzQlH0tXwLDgQTurS8eIQAAAABJRU5ErkJggg==';

const ImageCapInsetsExample = require('./ImageCapInsetsExample');
const IMAGE_PREFETCH_URL =
  'https://www.facebook.com/favicon.ico?r=1&t=' + Date.now();
const prefetchTask = Image.prefetch(IMAGE_PREFETCH_URL);

type ImageSource = $ReadOnly<{|
  uri: string,
|}>;

type NetworkImageCallbackExampleState = {|
  events: Array<string>,
  startLoadPrefetched: boolean,
  mountTime: number,
|};

type NetworkImageCallbackExampleProps = $ReadOnly<{|
  source: ImageSource,
  prefetchedSource: ImageSource,
|}>;

class NetworkImageCallbackExample extends React.Component<
  NetworkImageCallbackExampleProps,
  NetworkImageCallbackExampleState,
> {
  state = {
    events: [],
    startLoadPrefetched: false,
    mountTime: Date.now(),
  };

  UNSAFE_componentWillMount() {
    this.setState({mountTime: Date.now()});
  }

  _loadEventFired = (event: string) => {
    this.setState(state => ({
      events: [...state.events, event],
    }));
  };

  render() {
    const {mountTime} = this.state;
    return (
      <View>
        <Image
          source={this.props.source}
          style={[styles.base, {overflow: 'visible'}]}
          onLoadStart={() =>
            this._loadEventFired(`✔ onLoadStart (+${Date.now() - mountTime}ms)`)
          }
          onProgress={event => {
            const {loaded, total} = event.nativeEvent;
            const percent = Math.round((loaded / total) * 100);
            this._loadEventFired(
              `✔ onProgress ${percent}% (+${Date.now() - mountTime}ms)`,
            );
          }}
          onLoad={event => {
            if (event.nativeEvent.source) {
              const url = event.nativeEvent.source.uri;
              this._loadEventFired(
                `✔ onLoad (+${Date.now() - mountTime}ms) for URL ${url}`,
              );
            } else {
              this._loadEventFired(`✔ onLoad (+${Date.now() - mountTime}ms)`);
            }
          }}
          onLoadEnd={() => {
            this._loadEventFired(`✔ onLoadEnd (+${Date.now() - mountTime}ms)`);
            this.setState({startLoadPrefetched: true}, () => {
              prefetchTask.then(
                () => {
                  this._loadEventFired(
                    `✔ Prefetch OK (+${Date.now() - mountTime}ms)`,
                  );
                  Image.queryCache([IMAGE_PREFETCH_URL]).then(map => {
                    const result = map[IMAGE_PREFETCH_URL];
                    if (result) {
                      this._loadEventFired(
                        `✔ queryCache "${result}" (+${Date.now() -
                          mountTime}ms)`,
                      );
                    } else {
                      this._loadEventFired(
                        `✘ queryCache (+${Date.now() - mountTime}ms)`,
                      );
                    }
                  });
                },
                error => {
                  this._loadEventFired(
                    `✘ Prefetch failed (+${Date.now() - mountTime}ms)`,
                  );
                },
              );
            });
          }}
        />
        {this.state.startLoadPrefetched ? (
          <Image
            source={this.props.prefetchedSource}
            style={[styles.base, {overflow: 'visible'}]}
            onLoadStart={() =>
              this._loadEventFired(
                `✔ (prefetched) onLoadStart (+${Date.now() - mountTime}ms)`,
              )
            }
            onLoad={event => {
              // Currently this image source feature is only available on iOS.
              if (event.nativeEvent.source) {
                const url = event.nativeEvent.source.uri;
                this._loadEventFired(
                  `✔ (prefetched) onLoad (+${Date.now() -
                    mountTime}ms) for URL ${url}`,
                );
              } else {
                this._loadEventFired(
                  `✔ (prefetched) onLoad (+${Date.now() - mountTime}ms)`,
                );
              }
            }}
            onLoadEnd={() =>
              this._loadEventFired(
                `✔ (prefetched) onLoadEnd (+${Date.now() - mountTime}ms)`,
              )
            }
          />
        ) : null}
        <Text style={{marginTop: 20}}>{this.state.events.join('\n')}</Text>
      </View>
    );
  }
}

type NetworkImageExampleState = {|
  error: ?string,
  loading: boolean,
  progress: $ReadOnlyArray<number>,
|};

type NetworkImageExampleProps = $ReadOnly<{|
  source: ImageSource,
|}>;

class NetworkImageExample extends React.Component<
  NetworkImageExampleProps,
  NetworkImageExampleState,
> {
  state = {
    error: null,
    loading: false,
    progress: [],
  };

  render() {
    return this.state.error != null ? (
      <Text>{this.state.error}</Text>
    ) : (
      <>
        <Image
          source={this.props.source}
          style={[styles.base, {overflow: 'visible'}]}
          onLoadStart={e => this.setState({loading: true})}
          onError={e =>
            this.setState({error: e.nativeEvent.error, loading: false})
          }
          onProgress={e => {
            const {loaded, total} = e.nativeEvent;
            this.setState(prevState => ({
              progress: [
                ...prevState.progress,
                Math.round((100 * loaded) / total),
              ],
            }));
          }}
          onLoad={() => this.setState({loading: false, error: null})}
        />
        <Text>
          {this.state.progress.map(progress => `${progress}%`).join('\n')}
        </Text>
      </>
    );
  }
}

type ImageSizeExampleState = {|
  width: number,
  height: number,
|};

type ImageSizeExampleProps = $ReadOnly<{|
  source: ImageSource,
|}>;

class ImageSizeExample extends React.Component<
  ImageSizeExampleProps,
  ImageSizeExampleState,
> {
  state = {
    width: 0,
    height: 0,
  };

  componentDidMount() {
    Image.getSize(this.props.source.uri, (width, height) => {
      this.setState({width, height});
    });
  }

  render() {
    return (
      <View style={{flexDirection: 'row'}}>
        <Image
          style={{
            width: 60,
            height: 60,
            backgroundColor: 'transparent',
            marginRight: 10,
          }}
          source={this.props.source}
        />
        <Text>
          Actual dimensions:{'\n'}
          Width: {this.state.width}, Height: {this.state.height}
        </Text>
      </View>
    );
  }
}

type MultipleSourcesExampleState = {|
  width: number,
  height: number,
|};

type MultipleSourcesExampleProps = $ReadOnly<{||}>;

class MultipleSourcesExample extends React.Component<
  MultipleSourcesExampleProps,
  MultipleSourcesExampleState,
> {
  state = {
    width: 30,
    height: 30,
  };

  increaseImageSize = () => {
    if (this.state.width >= 100) {
      return;
    }
    this.setState({
      width: this.state.width + 10,
      height: this.state.height + 10,
    });
  };

  increaseImageSize = () => {
    if (this.state.width >= 100) {
      return;
    }
    this.setState({
      width: this.state.width + 10,
      height: this.state.height + 10,
    });
  };

  decreaseImageSize = () => {
    if (this.state.width <= 10) {
      return;
    }
    this.setState({
      width: this.state.width - 10,
      height: this.state.height - 10,
    });
  };

  render() {
    return (
      <View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text style={styles.touchableText} onPress={this.decreaseImageSize}>
            Decrease image size
          </Text>
          <Text style={styles.touchableText} onPress={this.increaseImageSize}>
            Increase image size
          </Text>
        </View>
        <Text>
          Container image size: {this.state.width}x{this.state.height}{' '}
        </Text>
        <View style={{height: this.state.height, width: this.state.width}}>
          <Image
            style={{flex: 1}}
            source={[
              {
                uri: 'https://www.facebook.com/favicon.ico',
                width: 38,
                height: 38,
              },
              {
                uri: 'https://www.facebook.com/favicon.ico',
                width: 76,
                height: 76,
              },
              {
                uri: 'https://www.facebook.com/ads/pics/successstories.png',
                width: 400,
                height: 400,
              },
            ]}
          />
        </View>
      </View>
    );
  }
}

const fullImage = {
  uri: 'https://www.facebook.com/ads/pics/successstories.png',
};
const smallImage = {
  uri: 'https://www.facebook.com/favicon.ico',
};

const styles = StyleSheet.create({
  base: {
    width: 38,
    height: 38,
  },
  leftMargin: {
    marginLeft: 10,
  },
  background: {
    backgroundColor: '#222222',
  },
  sectionText: {
    marginVertical: 6,
  },
  nestedText: {
    marginLeft: 12,
    marginTop: 20,
    backgroundColor: 'transparent',
    color: 'white',
  },
  resizeMode: {
    width: 90,
    height: 60,
    borderWidth: 0.5,
    borderColor: 'black',
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
  },
  gif: {
    flex: 1,
    height: 200,
  },
  base64: {
    flex: 1,
    height: 50,
    resizeMode: 'contain',
  },
  touchableText: {
    fontWeight: '500',
    color: 'blue',
  },
});

exports.displayName = (undefined: ?string);
exports.framework = 'React';
exports.title = '<Image>';
exports.description =
  'Base component for displaying different types of images.';

exports.examples = [
  {
    title: 'Plain Network Image',
    description: ('If the `source` prop `uri` property is prefixed with ' +
      '"http", then it will be downloaded from the network.': string),
    render: function(): React.Node {
      return <Image source={fullImage} style={styles.base} />;
    },
  },
  {
    title: 'Plain Static Image',
    description: ('Static assets should be placed in the source code tree, and ' +
      'required in the same way as JavaScript modules.': string),
    render: function(): React.Node {
      return (
        <View style={styles.horizontal}>
          <Image
            source={require('../../assets/uie_thumb_normal.png')}
            style={styles.icon}
          />
          <Image
            source={require('../../assets/uie_thumb_selected.png')}
            style={styles.icon}
          />
          <Image
            source={require('../../assets/uie_comment_normal.png')}
            style={styles.icon}
          />
          <Image
            source={require('../../assets/uie_comment_highlighted.png')}
            style={styles.icon}
          />
        </View>
      );
    },
  },
  {
    title: 'Image Loading Events',
    render: function(): React.Node {
      return (
        <NetworkImageCallbackExample
          source={{
            uri: 'https://www.facebook.com/favicon.ico?r=1&t=' + Date.now(),
          }}
          prefetchedSource={{uri: IMAGE_PREFETCH_URL}}
        />
      );
    },
  },
  {
    title: 'Error Handler',
    render: function(): React.Node {
      return (
        <NetworkImageExample
          source={{
            uri: 'https://www.facebook.com/favicon_TYPO.ico',
          }}
        />
      );
    },
  },
  {
    title: 'Image Download Progress',
    render: function(): React.Node {
      return (
        <NetworkImageExample
          source={{
            uri: 'https://www.facebook.com/favicon.ico?r=1',
          }}
        />
      );
    },
  },
  {
    title: 'defaultSource',
    description: 'Show a placeholder image when a network image is loading',
    render: function(): React.Node {
      return (
        <Image
          defaultSource={require('../../assets/bunny.png')}
          source={{
            uri: 'https://origami.design/public/images/bird-logo.png',
          }}
          style={styles.base}
        />
      );
    },
    platform: 'ios',
  },
  {
    title: 'Cache Policy',
    description: ('First image has never been loaded before and is instructed not to load unless in cache.' +
      'Placeholder image from above will stay. Second image is the same but forced to load regardless of' +
      ' local cache state.': string),
    render: function(): React.Node {
      return (
        <View style={styles.horizontal}>
          <Image
            defaultSource={require('../../assets/bunny.png')}
            source={{
              uri: smallImage.uri + '?cacheBust=notinCache' + Date.now(),
              cache: 'only-if-cached',
            }}
            style={styles.base}
          />
          <Image
            defaultSource={require('../../assets/bunny.png')}
            source={{
              uri: smallImage.uri + '?cacheBust=notinCache' + Date.now(),
              cache: 'reload',
            }}
            style={styles.base}
          />
        </View>
      );
    },
    platform: 'ios',
  },
  {
    title: 'Border Color',
    render: function(): React.Node {
      return (
        <View style={styles.horizontal}>
          <Image
            source={smallImage}
            style={[
              styles.base,
              styles.background,
              {borderWidth: 3, borderColor: '#f099f0'},
            ]}
          />
        </View>
      );
    },
  },
  {
    title: 'Border Width',
    render: function(): React.Node {
      return (
        <View style={styles.horizontal}>
          <Image
            source={smallImage}
            style={[
              styles.base,
              styles.background,
              {borderWidth: 5, borderColor: '#f099f0'},
            ]}
          />
        </View>
      );
    },
  },
  {
    title: 'Border Radius',
    render: function(): React.Node {
      return (
        <View style={styles.horizontal}>
          <Image style={[styles.base, {borderRadius: 5}]} source={fullImage} />
          <Image
            style={[styles.base, styles.leftMargin, {borderRadius: 19}]}
            source={fullImage}
          />
          <Image
            style={[styles.base, styles.leftMargin, {borderTopLeftRadius: 20}]}
            source={fullImage}
          />
          <Image
            style={[
              styles.base,
              styles.leftMargin,
              {
                borderWidth: 10,
                borderTopLeftRadius: 10,
                borderBottomRightRadius: 20,
                borderColor: 'green',
              },
            ]}
            source={fullImage}
          />
          <Image
            style={[
              styles.base,
              styles.leftMargin,
              {
                borderWidth: 5,
                borderTopLeftRadius: 10,
                borderTopRightRadius: 20,
                borderBottomRightRadius: 30,
                borderBottomLeftRadius: 40,
                borderColor: 'red',
              },
            ]}
            source={fullImage}
          />
        </View>
      );
    },
  },
  {
    title: 'Background Color',
    render: function(): React.Node {
      return (
        <View style={styles.horizontal}>
          <Image source={smallImage} style={styles.base} />
          <Image
            style={[
              styles.base,
              styles.leftMargin,
              {backgroundColor: 'rgba(0, 0, 100, 0.25)'},
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
    render: function(): React.Node {
      return (
        <View style={styles.horizontal}>
          <Image style={[styles.base, {opacity: 1}]} source={fullImage} />
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
    title: 'Nesting content inside <Image> component',
    render: function(): React.Node {
      return (
        <View style={{width: 60, height: 60}}>
          <Image
            style={{...StyleSheet.absoluteFillObject}}
            source={fullImage}
          />
          <Text style={styles.nestedText}>React</Text>
        </View>
      );
    },
  },
  {
    title: 'Nesting content inside <ImageBackground> component',
    render: function(): React.Node {
      return (
        <ImageBackground
          style={{width: 60, height: 60, backgroundColor: 'transparent'}}
          source={fullImage}>
          <Text style={styles.nestedText}>React</Text>
        </ImageBackground>
      );
    },
  },
  {
    title: 'Tint Color',
    description: ('The `tintColor` style prop changes all the non-alpha ' +
      'pixels to the tint color.': string),
    render: function(): React.Node {
      return (
        <View>
          <View style={styles.horizontal}>
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[styles.icon, {borderRadius: 5, tintColor: '#5ac8fa'}]}
            />
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[
                styles.icon,
                styles.leftMargin,
                {borderRadius: 5, tintColor: '#4cd964'},
              ]}
            />
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[
                styles.icon,
                styles.leftMargin,
                {borderRadius: 5, tintColor: '#ff2d55'},
              ]}
            />
            <Image
              source={require('../../assets/uie_thumb_normal.png')}
              style={[
                styles.icon,
                styles.leftMargin,
                {borderRadius: 5, tintColor: '#8e8e93'},
              ]}
            />
          </View>
          <Text style={styles.sectionText}>
            It also works with downloaded images:
          </Text>
          <View style={styles.horizontal}>
            <Image
              source={smallImage}
              style={[styles.base, {borderRadius: 5, tintColor: '#5ac8fa'}]}
            />
            <Image
              source={smallImage}
              style={[
                styles.base,
                styles.leftMargin,
                {borderRadius: 5, tintColor: '#4cd964'},
              ]}
            />
            <Image
              source={smallImage}
              style={[
                styles.base,
                styles.leftMargin,
                {borderRadius: 5, tintColor: '#ff2d55'},
              ]}
            />
            <Image
              source={smallImage}
              style={[
                styles.base,
                styles.leftMargin,
                {borderRadius: 5, tintColor: '#8e8e93'},
              ]}
            />
          </View>
        </View>
      );
    },
  },
  {
    title: 'Resize Mode',
    description: ('The `resizeMode` style prop controls how the image is ' +
      'rendered within the frame.': string),
    render: function(): React.Node {
      return (
        <View>
          {[smallImage, fullImage].map((image, index) => {
            return (
              <View key={index}>
                <View style={styles.horizontal}>
                  <View>
                    <Text style={[styles.resizeModeText]}>Contain</Text>
                    <Image
                      style={styles.resizeMode}
                      resizeMode="contain"
                      source={image}
                    />
                  </View>
                  {/* $FlowFixMe(>=0.115.0 site=react_native_fb) This comment
                   * suppresses an error found when Flow v0.115 was deployed.
                   * To see the error, delete this comment and run Flow. */}
                  <View style={styles.leftMargin}>
                    <Text style={[styles.resizeModeText]}>Cover</Text>
                    <Image
                      style={styles.resizeMode}
                      resizeMode="cover"
                      source={image}
                    />
                  </View>
                </View>
                <View style={styles.horizontal}>
                  <View>
                    <Text style={[styles.resizeModeText]}>Stretch</Text>
                    <Image
                      style={styles.resizeMode}
                      resizeMode="stretch"
                      source={image}
                    />
                  </View>
                  {/* $FlowFixMe(>=0.115.0 site=react_native_fb) This comment
                   * suppresses an error found when Flow v0.115 was deployed.
                   * To see the error, delete this comment and run Flow. */}
                  <View style={styles.leftMargin}>
                    <Text style={[styles.resizeModeText]}>Repeat</Text>
                    <Image
                      style={styles.resizeMode}
                      resizeMode="repeat"
                      source={image}
                    />
                  </View>
                  {/* $FlowFixMe(>=0.115.0 site=react_native_fb) This comment
                   * suppresses an error found when Flow v0.115 was deployed.
                   * To see the error, delete this comment and run Flow. */}
                  <View style={styles.leftMargin}>
                    <Text style={[styles.resizeModeText]}>Center</Text>
                    <Image
                      style={styles.resizeMode}
                      resizeMode="center"
                      source={image}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      );
    },
  },
  {
    title: 'Animated GIF',
    render: function(): React.Node {
      return (
        <Image
          style={styles.gif}
          source={require('../../assets/tumblr_mfqekpMktw1rn90umo1_500.gif')}
        />
      );
    },
    platform: 'ios',
  },
  {
    title: 'Base64 image',
    render: function(): React.Node {
      return (
        <Image style={styles.base64} source={{uri: base64Icon, scale: 3}} />
      );
    },
    platform: 'ios',
  },
  {
    title: 'Cap Insets',
    description: ('When the image is resized, the corners of the size specified ' +
      'by capInsets will stay a fixed size, but the center content and ' +
      'borders of the image will be stretched. This is useful for creating ' +
      'resizable rounded buttons, shadows, and other resizable assets.': string),
    render: function(): React.Node {
      return <ImageCapInsetsExample />;
    },
    platform: 'ios',
  },
  {
    title: 'Image Size',
    render: function(): React.Node {
      /* $FlowFixMe(>=0.115.0 site=react_native_fb) This comment suppresses an
       * error found when Flow v0.115 was deployed. To see the error, delete
       * this comment and run Flow. */
      return <ImageSizeExample source={fullImage} />;
    },
  },
  {
    title: 'MultipleSourcesExample',
    description: ('The `source` prop allows passing in an array of uris, so that native to choose which image ' +
      'to diplay based on the size of the of the target image': string),
    render: function(): React.Node {
      return <MultipleSourcesExample />;
    },
  },
  {
    title: 'Legacy local image',
    description: ('Images shipped with the native bundle, but not managed ' +
      'by the JS packager': string),
    render: function(): React.Node {
      return <Image source={{uri: 'legacy_image', width: 120, height: 120}} />;
    },
  },
  {
    title: 'Bundled images',
    description: 'Images shipped in a separate native bundle',
    render: function(): React.Node {
      return (
        <View style={{flexDirection: 'row'}}>
          <Image
            source={{
              uri: 'ImageInBundle',
              bundle: 'RNTesterBundle',
              width: 100,
              height: 100,
            }}
            style={{borderColor: 'yellow', borderWidth: 4}}
          />
          <Image
            source={{
              uri: 'ImageInAssetCatalog',
              bundle: 'RNTesterBundle',
              width: 100,
              height: 100,
            }}
            style={{marginLeft: 10, borderColor: 'blue', borderWidth: 4}}
          />
        </View>
      );
    },
    platform: 'ios',
  },
  {
    title: 'Blur Radius',
    render: function(): React.Node {
      return (
        <View style={styles.horizontal}>
          <Image style={[styles.base]} source={fullImage} blurRadius={0} />
          <Image
            style={[styles.base, styles.leftMargin]}
            source={fullImage}
            blurRadius={5}
          />
          <Image
            style={[styles.base, styles.leftMargin]}
            source={fullImage}
            blurRadius={10}
          />
          <Image
            style={[styles.base, styles.leftMargin]}
            source={fullImage}
            blurRadius={15}
          />
          <Image
            style={[styles.base, styles.leftMargin]}
            source={fullImage}
            blurRadius={20}
          />
          <Image
            style={[styles.base, styles.leftMargin]}
            source={fullImage}
            blurRadius={25}
          />
        </View>
      );
    },
  },
];
