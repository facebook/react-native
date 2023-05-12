/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import * as React from 'react';
import {useContext, useState} from 'react';
import {
  Button,
  Platform,
  Text,
  TextInput,
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type {TextStyle} from 'react-native/Libraries/StyleSheet/StyleSheet';

import RNTesterButton from '../../components/RNTesterButton';
import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import {set} from '../../../../react-native/Libraries/Settings/Settings.ios';
import {T} from '../../../../react-native/sdks/hermes/tools/hermes-parser/js/flow-api-translator/__tests__/flowDefToTSDef/fixtures/export/declare/named/specifiers/spec';

const styles = StyleSheet.create({
  normalTextInput: {
    height: 50,
    width: 200,
    backgroundColor: 'white',
    padding: 0,
    fontSize: 14,
    marginTop: 10,
    borderWidth: 1,
  },
  wrapper: {
    height: '100%',
    width: '100%',
    backgroundColor: 'lightgray',
  },
  default: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#0f0f0f',
    flex: 1,
    fontSize: 13,
    padding: 4,
  },
  multiline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#0f0f0f',
    flex: 1,
    fontSize: 13,
    height: 50,
    padding: 4,
    marginBottom: 4,
  },
  singleLine: {
    fontSize: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  label: {
    width: 115,
    textAlign: 'right',
    marginRight: 10,
    paddingTop: 2,
    fontSize: 12,
  },
  inputContainer: {
    flex: 1,
  },
  rewriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainder: {
    textAlign: 'right',
    width: 24,
  },
  hashtag: {
    color: 'blue',
    fontWeight: 'bold',
  },
  eventLabel: {
    margin: 3,
    fontSize: 12,
  },
  focusedUncontrolled: {
    margin: -2,
    borderWidth: 2,
    borderColor: '#0a0a0a',
    flex: 1,
    fontSize: 13,
    padding: 4,
  },
  screenshotArea: {
    position: 'absolute',
    top: -5,
    left: 120,
    right: -5,
    bottom: -5,
  },
});

class WithLabel extends React.Component<$FlowFixMeProps> {
  render(): React.Node {
    return (
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{this.props.label}</Text>
        <View style={styles.inputContainer}>{this.props.children}</View>
      </View>
    );
  }
}

class RewriteExample extends React.Component<$FlowFixMeProps, any> {
  constructor(props: any | void) {
    super(props);
    this.state = {text: ''};
  }
  render(): React.Node {
    const limit = 20;
    const remainder = limit - this.state.text.length;
    const remainderColor = remainder > 5 ? 'blue' : 'red';
    return (
      <View style={styles.rewriteContainer}>
        <TextInput
          testID="rewrite_sp_underscore_input"
          autoCorrect={false}
          multiline={false}
          maxLength={limit}
          onChangeText={text => {
            text = text.replace(/ /g, '_');
            this.setState({text});
          }}
          style={styles.default}
          value={this.state.text}
        />
        <Text style={[styles.remainder, {color: remainderColor}]}>
          {remainder}
        </Text>
      </View>
    );
  }
}

class RewriteExampleInvalidCharacters extends React.Component<
  $FlowFixMeProps,
  any,
> {
  constructor(props: any | void) {
    super(props);
    this.state = {text: ''};
  }
  render(): React.Node {
    return (
      <View style={styles.rewriteContainer}>
        <TextInput
          testID="rewrite_no_sp_input"
          autoCorrect={false}
          multiline={false}
          onChangeText={text => {
            this.setState({text: text.replace(/\s/g, '')});
          }}
          style={styles.default}
          value={this.state.text}
        />
      </View>
    );
  }
}

class RewriteInvalidCharactersAndClearExample extends React.Component<
  $FlowFixMeProps,
  any,
> {
  inputRef: ?React.ElementRef<typeof TextInput> = null;

  constructor(props: any | void) {
    super(props);
    this.state = {text: ''};
  }
  render(): React.Node {
    return (
      <View style={styles.rewriteContainer}>
        <TextInput
          testID="rewrite_clear_input"
          autoCorrect={false}
          ref={ref => {
            this.inputRef = ref;
          }}
          multiline={true}
          onChangeText={text => {
            this.setState({text: text.replace(/ /g, '')});
          }}
          style={styles.default}
          value={this.state.text}
        />
        <Button
          testID="rewrite_clear_button"
          onPress={() => {
            if (this.inputRef != null) {
              this.inputRef.clear();
            }
          }}
          title="Clear"
        />
      </View>
    );
  }
}

type ExampleRef = {current: null | {focus(): void, ...}};

class BlurOnSubmitExample extends React.Component<{...}> {
  ref1: ExampleRef = React.createRef();
  ref2: ExampleRef = React.createRef();
  ref3: ExampleRef = React.createRef();
  ref4: ExampleRef = React.createRef();
  ref5: ExampleRef = React.createRef();

  render(): React.Node {
    return (
      <View>
        <TextInput
          ref={this.ref1}
          style={styles.singleLine}
          placeholder="blurOnSubmit = false"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => this.ref2.current?.focus()}
        />
        <TextInput
          ref={this.ref2}
          style={styles.singleLine}
          keyboardType="email-address"
          placeholder="blurOnSubmit = false"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => this.ref3.current?.focus()}
        />
        <TextInput
          ref={this.ref3}
          style={styles.singleLine}
          keyboardType="url"
          placeholder="blurOnSubmit = false"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => this.ref4.current?.focus()}
        />
        <TextInput
          ref={this.ref4}
          style={styles.singleLine}
          keyboardType="numeric"
          placeholder="blurOnSubmit = false"
          blurOnSubmit={false}
          onSubmitEditing={() => this.ref5.current?.focus()}
        />
        <TextInput
          ref={this.ref5}
          style={styles.singleLine}
          keyboardType="numbers-and-punctuation"
          placeholder="blurOnSubmit = true"
          returnKeyType="done"
        />
      </View>
    );
  }
}

class SubmitBehaviorExample extends React.Component<{...}> {
  ref1: ExampleRef = React.createRef();
  ref2: ExampleRef = React.createRef();
  ref3: ExampleRef = React.createRef();
  ref4: ExampleRef = React.createRef();
  ref5: ExampleRef = React.createRef();
  ref6: ExampleRef = React.createRef();
  ref7: ExampleRef = React.createRef();
  ref8: ExampleRef = React.createRef();
  ref9: ExampleRef = React.createRef();
  ref10: ExampleRef = React.createRef();
  ref11: ExampleRef = React.createRef();

  render(): React.Node {
    return (
      <View>
        <TextInput
          ref={this.ref1}
          placeholder="single line submit"
          submitBehavior="submit"
          onSubmitEditing={() => this.ref2.current?.focus()}
        />
        <TextInput
          ref={this.ref2}
          placeholder="single line blurAndSubmit"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={() => this.ref3.current?.focus()}
        />
        <TextInput
          ref={this.ref3}
          placeholder="single line default"
          onSubmitEditing={() => this.ref4.current?.focus()}
        />
        <TextInput
          ref={this.ref4}
          blurOnSubmit
          placeholder="single line blurOnSubmit true"
          onSubmitEditing={() => this.ref5.current?.focus()}
        />
        <TextInput
          ref={this.ref5}
          blurOnSubmit={false}
          placeholder="single line blurOnSubmit false"
          onSubmitEditing={() => this.ref6.current?.focus()}
        />
        <TextInput
          ref={this.ref6}
          multiline
          placeholder="multiline submit"
          submitBehavior="submit"
          onSubmitEditing={() => this.ref7.current?.focus()}
        />
        <TextInput
          ref={this.ref7}
          multiline
          placeholder="multiline blurAndSubmit"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={() => this.ref8.current?.focus()}
        />
        <TextInput
          ref={this.ref8}
          multiline
          blurOnSubmit
          placeholder="multiline blurOnSubmit true"
          onSubmitEditing={() => this.ref9.current?.focus()}
        />
        <TextInput
          ref={this.ref9}
          multiline
          blurOnSubmit={false}
          placeholder="multiline blurOnSubmit false"
        />
        <TextInput
          ref={this.ref10}
          multiline
          placeholder="multiline newline"
          submitBehavior="newline"
        />
        <TextInput ref={this.ref11} multiline placeholder="multiline default" />
      </View>
    );
  }
}

class TextEventsExample extends React.Component<{...}, $FlowFixMeState> {
  state:
    | any
    | {
        curText: string,
        prev2Text: string,
        prev3Text: string,
        prevText: string,
      } = {
    curText: '<No Event>',
    prevText: '<No Event>',
    prev2Text: '<No Event>',
    prev3Text: '<No Event>',
  };

  updateText = (text: string) => {
    this.setState(state => {
      return {
        curText: text,
        prevText: state.curText,
        prev2Text: state.prevText,
        prev3Text: state.prev2Text,
      };
    });
  };

  render(): React.Node {
    return (
      <View>
        <TextInput
          autoCapitalize="none"
          placeholder="Enter text to see events"
          autoCorrect={false}
          multiline
          onFocus={() => this.updateText('onFocus')}
          onBlur={() => this.updateText('onBlur')}
          onChange={event =>
            this.updateText('onChange text: ' + event.nativeEvent.text)
          }
          onContentSizeChange={event =>
            this.updateText(
              'onContentSizeChange size: ' +
                JSON.stringify(event.nativeEvent.contentSize),
            )
          }
          onEndEditing={event =>
            this.updateText('onEndEditing text: ' + event.nativeEvent.text)
          }
          onSubmitEditing={event =>
            this.updateText('onSubmitEditing text: ' + event.nativeEvent.text)
          }
          onKeyPress={event =>
            this.updateText('onKeyPress key: ' + event.nativeEvent.key)
          }
          style={styles.singleLine}
        />
        <Text style={styles.eventLabel}>
          {this.state.curText}
          {'\n'}
          (prev: {this.state.prevText}){'\n'}
          (prev2: {this.state.prev2Text}){'\n'}
          (prev3: {this.state.prev3Text})
        </Text>
      </View>
    );
  }
}

class TokenizedTextExample extends React.Component<
  $FlowFixMeProps,
  $FlowFixMeState,
> {
  constructor(props: any | void) {
    super(props);
    this.state = {text: 'Hello #World'};
  }
  render(): React.Node {
    //define delimiter
    let delimiter = /\s+/;

    //split string
    let _text = this.state.text;
    let token,
      index,
      parts = [];
    while (_text) {
      delimiter.lastIndex = 0;
      token = delimiter.exec(_text);
      if (token === null) {
        break;
      }
      index = token.index;
      if (token[0].length === 0) {
        index = 1;
      }
      parts.push(_text.slice(0, index));
      parts.push(token[0]);
      index = index + token[0].length;
      _text = _text.slice(index);
    }
    parts.push(_text);

    //highlight hashtags
    parts = parts.map(text => {
      if (/^#/.test(text)) {
        return (
          <Text testID="hashtag" key={text} style={styles.hashtag}>
            {text}
          </Text>
        );
      } else {
        return text;
      }
    });

    return (
      <View style={{flexDirection: 'row'}}>
        <TextInput
          testID="text-input"
          multiline={true}
          style={styles.multiline}
          onChangeText={text => {
            this.setState({text});
          }}>
          <Text>{parts}</Text>
        </TextInput>
      </View>
    );
  }
}

type SelectionExampleState = {
  selection: $ReadOnly<{|
    start: number,
    end: number,
  |}>,
  value: string,
  ...
};

class SelectionExample extends React.Component<
  $FlowFixMeProps,
  SelectionExampleState,
> {
  _textInput: React.ElementRef<typeof TextInput> | null = null;

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  constructor(props) {
    super(props);
    this.state = {
      selection: {start: 0, end: 0},
      value: props.value,
    };
  }

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  onSelectionChange({nativeEvent: {selection}}) {
    this.setState({selection});
  }

  getRandomPosition(): number {
    const length = this.state.value.length;
    return Math.round(Math.random() * length);
  }

  select(start: number, end: number) {
    this._textInput?.focus();
    this.setState({selection: {start, end}});
    if (this.props.imperative) {
      this._textInput?.setSelection(start, end);
    }
  }

  selectRandom() {
    const positions = [
      this.getRandomPosition(),
      this.getRandomPosition(),
    ].sort();
    this.select(...positions);
  }

  placeAt(position: number) {
    this.select(position, position);
  }

  placeAtRandom() {
    this.placeAt(this.getRandomPosition());
  }

  render(): React.Node {
    const length = this.state.value.length;

    return (
      <View>
        <View style={{flexDirection: 'row'}}>
          <TextInput
            testID={`${this.props.testID}-text-input`}
            multiline={this.props.multiline}
            onChangeText={value => this.setState({value})}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            onSelectionChange={this.onSelectionChange.bind(this)}
            ref={textInput => (this._textInput = textInput)}
            selection={this.props.imperative ? undefined : this.state.selection}
            style={this.props.style}
            value={this.state.value}
          />
        </View>
        <View>
          <Text testID={`${this.props.testID}-selection`}>
            selection ={' '}
            {`{start:${this.state.selection.start},end:${this.state.selection.end}}`}
          </Text>
          <Text
            testID={`${this.props.testID}-cursor-start`}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            onPress={this.placeAt.bind(this, 0)}>
            Place at Start (0, 0)
          </Text>
          <Text
            testID={`${this.props.testID}-cursor-end`}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            onPress={this.placeAt.bind(this, length)}>
            Place at End ({length}, {length})
          </Text>
          {/* $FlowFixMe[method-unbinding] added when improving typing for this
           * parameters */}
          <Text onPress={this.placeAtRandom.bind(this)}>Place at Random</Text>
          <Text
            testID={`${this.props.testID}-select-all`}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            onPress={this.select.bind(this, 0, length)}>
            Select All
          </Text>
          {/* $FlowFixMe[method-unbinding] added when improving typing for this
           * parameters */}
          <Text onPress={this.selectRandom.bind(this)}>Select Random</Text>
        </View>
      </View>
    );
  }
}

function UncontrolledExample() {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <TextInput
      defaultValue="Hello World!"
      testID="uncontrolled-textinput"
      style={isFocused ? styles.focusedUncontrolled : styles.default}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
}

const TextStylesExample = React.memo(() => {
  const theme = useContext(RNTesterThemeContext);

  return (
    <TextStylesContainer
      examples={[
        {
          name: 'backgroundColor',
          textStyles: [
            {backgroundColor: theme.SystemBackgroundColor},
            {backgroundColor: 'red'},
            {backgroundColor: 'orange'},
            {backgroundColor: 'yellow'},
            {backgroundColor: 'green'},
            {backgroundColor: 'blue'},
          ],
        },
        {
          name: 'color',
          textStyles: [
            {color: theme.LabelColor},
            {color: 'red'},
            {color: 'orange'},
            {color: 'yellow'},
            {color: 'green'},
            {color: 'blue'},
          ],
        },
        {
          name: 'fontFamily',
          textStyles: [
            {fontFamily: 'sans-serif'},
            {fontFamily: 'serif'},
            {fontFamily: 'monospace'},
          ],
        },
        {
          name: 'fontSize',
          textStyles: [
            {fontSize: 8},
            {fontSize: 10},
            {fontSize: 12},
            {fontSize: 14},
            {fontSize: 16},
            {fontSize: 18},
          ],
        },
        {
          name: 'fontStyle',
          textStyles: [{fontStyle: 'normal'}, {fontStyle: 'italic'}],
        },
        {
          name: 'fontWeight',
          textStyles: [
            {fontWeight: 'normal'},
            {fontWeight: 'bold'},
            {fontWeight: '200'},
            {fontWeight: '400'},
            {fontWeight: '600'},
            {fontWeight: '800'},
          ],
        },
        {
          name: 'letterSpacing',
          textStyles: [
            {letterSpacing: 0},
            {letterSpacing: 1},
            {letterSpacing: 2},
            {letterSpacing: 3},
            {letterSpacing: 4},
            {letterSpacing: 5},
          ],
        },
        {
          name: 'lineHeight',
          multiline: true,
          textStyles: [
            {lineHeight: 4},
            {lineHeight: 8},
            {lineHeight: 16},
            {lineHeight: 24},
          ],
        },
        {
          name: 'textDecorationLine',
          textStyles: [
            {textDecorationLine: 'none'},
            {textDecorationLine: 'underline'},
            {textDecorationLine: 'line-through'},
            {textDecorationLine: 'underline line-through'},
          ],
        },
        {
          name: 'textShadow',
          textStyles: [
            {
              textShadowColor: 'black',
              textShadowOffset: {width: 0, height: 0},
              textShadowRadius: 0,
            },
            {
              textShadowColor: 'black',
              textShadowOffset: {width: 0, height: 0},
              textShadowRadius: 5,
            },
            {
              textShadowColor: 'red',
              textShadowOffset: {width: 0, height: 0},
              textShadowRadius: 5,
            },
            {
              textShadowColor: 'blue',
              textShadowOffset: {width: 0, height: -5},
              textShadowRadius: 5,
            },
            {
              textShadowColor: 'green',
              textShadowOffset: {width: 0, height: 5},
              textShadowRadius: 5,
            },
            {
              textShadowColor: 'orange',
              textShadowOffset: {width: 10, height: 0},
              textShadowRadius: 5,
            },
          ],
        },
      ]}
    />
  );
});

type TextStylesContainerProps = {
  examples: $ReadOnlyArray<{
    name: string,
    textStyles: $ReadOnlyArray<TextStyle>,
    multiline?: boolean,
  }>,
};

function TextStylesContainer({examples}: TextStylesContainerProps) {
  const [offset, setOffset] = useState(0);

  const MAX_CYCLES = 6;

  return (
    <View>
      <RNTesterButton
        testID="cycle-styles"
        textTestID="cycle-styles-label"
        onPress={() => setOffset((offset + 1) % MAX_CYCLES)}>
        Cycle {offset + 1}/{MAX_CYCLES}
      </RNTesterButton>
      <View>
        <View testID="styles-screenshot-area" style={styles.screenshotArea} />
        {examples.map(({name, multiline, textStyles}) => (
          <WithLabel label={name} key={name}>
            {multiline ? (
              <MultilineStyledTextInput
                name={name}
                textStyles={textStyles}
                styleOffset={offset}
              />
            ) : (
              <StyledTextInput
                name={name}
                textStyles={textStyles}
                styleOffset={offset}
              />
            )}
          </WithLabel>
        ))}
      </View>
    </View>
  );
}

type StyledTextInputProps = {
  name: string,
  textStyles: $ReadOnlyArray<TextStyle>,
  styleOffset: number,
};

function StyledTextInput({
  name,
  textStyles,
  styleOffset,
}: StyledTextInputProps) {
  return (
    <TextInput
      style={[
        styles.default,
        textStyles[(0 + styleOffset) % textStyles.length],
      ]}
      testID={`style-${name}`}>
      <Text>He</Text>
      <Text style={textStyles[(1 + styleOffset) % textStyles.length]}>ll</Text>
      <Text style={textStyles[(2 + styleOffset) % textStyles.length]}>
        o,
        <Text style={textStyles[(0 + styleOffset) % textStyles.length]}> </Text>
      </Text>
      <Text style={textStyles[(3 + styleOffset) % textStyles.length]}>Wo</Text>
      <Text style={textStyles[(4 + styleOffset) % textStyles.length]}>rl</Text>
      <Text style={textStyles[(5 + styleOffset) % textStyles.length]}>d!</Text>
    </TextInput>
  );
}

function MultilineStyledTextInput({
  name,
  textStyles,
  styleOffset,
}: StyledTextInputProps) {
  return (
    <TextInput
      multiline={true}
      style={[
        styles.default,
        textStyles[(0 + styleOffset) % textStyles.length],
      ]}
      testID={`style-${name}`}>
      <Text>Hel{'\n'}</Text>
      <Text style={textStyles[(1 + styleOffset) % textStyles.length]}>
        lo {'\n'}
      </Text>
      <Text style={textStyles[(2 + styleOffset) % textStyles.length]}>
        Wor{'\n'}
      </Text>
      <Text style={textStyles[(3 + styleOffset) % textStyles.length]}>ld!</Text>
    </TextInput>
  );
}

function LineHeightExample() {
  const LINE_HEIGHT = 10;
  const HEIGHT = 72;
  const STEP = 5;
  const [lineHeight, setLineHeight] = React.useState(LINE_HEIGHT);
  const [height, setHeight] = React.useState(HEIGHT);
  const [font, setFont] = React.useState(10);
  const [padding, setPadding] = React.useState(0);
  const [yoga, setYoga] = React.useState(false);
  const [borderWidth, setBorderWidth] = React.useState(1);
  const increase = prev => {
    if (prev + STEP > 150) return 150;
    return prev + STEP;
  };
  const decrease = prev => {
    if (prev - STEP <= 0) return 0;
    return prev - STEP;
  };
  const increaseLineHeight = () => {
    if (increase(lineHeight) > height) {
      setLineHeight(height);
      console.log(
        'we are not increasing the lineHeight which stays at: ' + lineHeight,
      );
    } else {
      setLineHeight(increase);
    }
  };
  const changeState = prev => !prev;
  const enableYoga = () => setYoga(changeState);
  const yogaStyles = yoga ? {display: 'flex', flexDirection: 'row'} : {};
  const textInputStyles = {
    height,
    minWidth: 120,
    lineHeight,
    borderWidth: 1,
    fontSize: font,
    paddingTop: padding,
    borderWidth,
  };
  const resetState = () => {
    setLineHeight(LINE_HEIGHT);
    setHeight(HEIGHT);
    setFont(10);
    setPadding(0);
    setYoga(false);
    setBorderWidth(1);
  };
  return (
    <View style={{height: 200}}>
      <Text>lineHeight is {lineHeight}</Text>
      <Text>height is {height}</Text>
      <View style={[yogaStyles, yogaStyles]}>
        <TextInput placeholder="my place" style={textInputStyles} value="Dad" />
        <TextInput
          style={[styles.normalTextInput, {borderWidth, paddingTop: padding}]}
          placeholder="Second Input"
        />
      </View>
      <Button onPress={increaseLineHeight} title="increase line height" />
      <Button
        onPress={() => setLineHeight(decrease)}
        title="decrease line height"
      />
      <Button onPress={() => setHeight(increase)} title="increase height" />
      <Button onPress={() => setHeight(decrease)} title="decrease height" />
      <Button onPress={() => setFont(increase)} title="increase font" />
      <Button onPress={() => setFont(decrease)} title="decrease font" />
      <Button
        title="increase padding top"
        onPress={() => setPadding(increase)}
      />
      <Button
        title="decrease padding top"
        onPress={() => setPadding(prev => prev - STEP)}
      />
      <Button
        title={`${yoga ? 'disable' : 'enable'} yoga`}
        onPress={() => setYoga(changeState)}
      />
      <Button
        title="increase border width"
        onPress={() => setBorderWidth(increase)}
      />
      <Button
        title="decrease border width"
        onPress={() => setBorderWidth(decrease)}
      />
      <Button title="reset state" onPress={resetState} />
    </View>
  );
}

function LineHeightExamples() {
  const textInputStyles = {
    fontSize: 10,
    borderWidth: 1,
  };

  const container = {marginTop: 20};
  return (
    <ScrollView>
      <View style={container}>
        <Text>lineHeight 10, height 8</Text>
        <TextInput
          style={[textInputStyles, {lineHeight: 10, height: 8}]}
          placeholder="Second Input"
          value="Test Value"
        />
      </View>
      <View style={container}>
        <Text>lineHeight 10, height 10</Text>
        <TextInput
          style={[textInputStyles, {lineHeight: 10, height: 10}]}
          placeholder="Second Input"
          value="Test Value"
        />
      </View>
      <View style={container}>
        <Text>lineHeight 10, height 12</Text>
        <TextInput
          style={[textInputStyles, {lineHeight: 10, height: 12}]}
          placeholder="Second Input"
          value="Test Value"
        />
      </View>
      <View style={container}>
        <Text>lineHeight 10, height 80</Text>
        <TextInput
          style={[textInputStyles, {lineHeight: 10, height: 80}]}
          placeholder="Second Input"
          value="Test Value"
        />
      </View>
      <View style={container}>
        <Text>lineHeight 40, height 80</Text>
        <TextInput
          style={[textInputStyles, {lineHeight: 40, height: 80}]}
          placeholder="Second Input"
          value="Test Value"
        />
      </View>
      <View style={container}>
        <Text>lineHeight 80, height 80</Text>
        <TextInput
          style={[textInputStyles, {lineHeight: 80, height: 80}]}
          placeholder="Second Input"
          value="Test Value"
        />
      </View>
      <View style={container}>
        <Text>fontSize 25, lineHeight 10, height 80</Text>
        <TextInput
          style={[textInputStyles, {fontSize: 25, lineHeight: 10, height: 80}]}
          placeholder="Second Input"
          value="Test Value"
        />
      </View>
      <View style={container}>
        <Text>fontSize 25, lineHeight 10, height 180</Text>
        <TextInput
          style={[textInputStyles, {fontSize: 25, lineHeight: 10, height: 180}]}
          placeholder="Second Input"
          value="Test Value"
        />
      </View>
      <View style={container}>
        <Text>fontSize 15, lineHeight 10, height 200</Text>
        <TextInput
          style={[textInputStyles, {fontSize: 15, lineHeight: 10, height: 200}]}
          placeholder="Second Input"
          value="Test Value"
        />
      </View>
    </ScrollView>
  );
}

module.exports = ([
  {
    title: 'Auto-focus',
    render: function (): React.Node {
      return <LineHeightExamples />;
    },
  },
]: Array<RNTesterModuleExample>);
