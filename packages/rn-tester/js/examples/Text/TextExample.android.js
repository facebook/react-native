/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {RNTesterModule} from '../../types/RNTesterTypes';

import TextLegend from '../../components/TextLegend';
import TextAdjustsDynamicLayoutExample from './TextAdjustsDynamicLayoutExample';
import TextInlineViewsExample from './TextInlineViewsExample';

const TextInlineView = require('../../components/TextInlineView');
const React = require('react');
const {LayoutAnimation, StyleSheet, Text, View} = require('react-native');

class Entity extends React.Component<{|children: React.Node|}> {
  render(): React.Node {
    return (
      <Text style={{fontWeight: 'bold', color: '#527fe4'}}>
        {this.props.children}
      </Text>
    );
  }
}
class AttributeToggler extends React.Component<{...}, $FlowFixMeState> {
  state: {fontSize: number, fontWeight: 'bold' | 'normal'} = {
    fontWeight: 'bold',
    fontSize: 15,
  };

  toggleWeight = () => {
    this.setState({
      fontWeight: this.state.fontWeight === 'bold' ? 'normal' : 'bold',
    });
  };

  increaseSize = () => {
    this.setState({
      fontSize: this.state.fontSize + 1,
    });
  };

  render(): React.Node {
    const curStyle = {
      fontWeight: this.state.fontWeight,
      fontSize: this.state.fontSize,
    };
    return (
      <View>
        <Text style={curStyle}>
          Tap the controls below to change attributes.
        </Text>
        <Text>
          <Text>
            See how it will even work on{' '}
            <Text style={curStyle}>this nested text</Text>
          </Text>
        </Text>
        <Text>
          <Text onPress={this.toggleWeight}>Toggle Weight</Text>
          {' (with highlight onPress)'}
        </Text>
        <Text onPress={this.increaseSize} suppressHighlighting={true}>
          Increase Size (suppressHighlighting true)
        </Text>
      </View>
    );
  }
}

type AdjustingFontSizeProps = $ReadOnly<{||}>;

type AdjustingFontSizeState = {|
  dynamicText: string,
  shouldRender: boolean,
|};

class AdjustingFontSize extends React.Component<
  AdjustingFontSizeProps,
  AdjustingFontSizeState,
> {
  state: AdjustingFontSizeState = {
    dynamicText: '',
    shouldRender: true,
  };

  reset = () => {
    LayoutAnimation.easeInEaseOut();
    this.setState({
      shouldRender: false,
    });
    setTimeout(() => {
      LayoutAnimation.easeInEaseOut();
      this.setState({
        dynamicText: '',
        shouldRender: true,
      });
    }, 300);
  };

  addText = () => {
    this.setState({
      dynamicText:
        this.state.dynamicText +
        (Math.floor((Math.random() * 10) % 2) ? ' foo' : ' bar'),
    });
  };

  removeText = () => {
    this.setState({
      dynamicText: this.state.dynamicText.slice(
        0,
        this.state.dynamicText.length - 4,
      ),
    });
  };

  render(): React.Node {
    if (!this.state.shouldRender) {
      return <View />;
    }
    return (
      <View>
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={{fontSize: 36, marginVertical: 6}}>
          Truncated text is baaaaad.
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          style={{fontSize: 40, marginVertical: 6}}>
          Shrinking to fit available space is much better!
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={1}
          style={{fontSize: 30, marginVertical: 6}}>
          {'Add text to me to watch me shrink!' + ' ' + this.state.dynamicText}
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={4}
          android_hyphenationFrequency="normal"
          style={{fontSize: 20, marginVertical: 6}}>
          {'Multiline text component shrinking is supported, watch as this reeeeaaaally loooooong teeeeeeext grooooows and then shriiiinks as you add text to me! ioahsdia soady auydoa aoisyd aosdy ' +
            ' ' +
            this.state.dynamicText}
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          style={{fontSize: 20, marginVertical: 6, maxHeight: 50}}>
          {'Text limited by height, watch as this reeeeaaaally loooooong teeeeeeext grooooows and then shriiiinks as you add text to me! ioahsdia soady auydoa aoisyd aosdy ' +
            ' ' +
            this.state.dynamicText}
        </Text>

        <Text
          adjustsFontSizeToFit={true}
          numberOfLines={1}
          style={{marginVertical: 6}}>
          <Text style={{fontSize: 14}}>
            {'Differently sized nested elements will shrink together. '}
          </Text>
          <Text style={{fontSize: 20}}>
            {'LARGE TEXT! ' + this.state.dynamicText}
          </Text>
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginTop: 5,
            marginVertical: 6,
          }}>
          <Text style={{backgroundColor: '#ffaaaa'}} onPress={this.reset}>
            Reset
          </Text>
          <Text style={{backgroundColor: '#aaaaff'}} onPress={this.removeText}>
            Remove Text
          </Text>
          <Text style={{backgroundColor: '#aaffaa'}} onPress={this.addText}>
            Add Text
          </Text>
        </View>
      </View>
    );
  }
}

function TextLinkifyExample(props: {}): React.Node {
  return (
    <>
      <Text dataDetectorType="phoneNumber">Phone number: 123-123-1234</Text>
      <Text dataDetectorType="link">Link: https://www.facebook.com</Text>
      <Text dataDetectorType="email">Email: employee@facebook.com</Text>
      <Text dataDetectorType="none">
        Phone number: 123-123-1234 Link: https://www.facebook.com Email:
        employee@facebook.com
      </Text>
      <Text dataDetectorType="all">
        Phone number: 123-123-1234 Link: https://www.facebook.com Email:
        employee@facebook.com
      </Text>
    </>
  );
}

function TextTransformExample(props: {}): React.Node {
  return (
    <>
      <Text style={{textTransform: 'uppercase'}}>
        This text should be uppercased.
      </Text>
      <Text style={{textTransform: 'lowercase'}}>
        This TEXT SHOULD be lowercased.
      </Text>
      <Text style={{textTransform: 'capitalize'}}>
        This text should be CAPITALIZED.
      </Text>
      <Text>
        Capitalize a date:
        <Text style={{textTransform: 'capitalize'}}>
          the 9th of november, 1998
        </Text>
      </Text>
      <Text>
        Capitalize a 2 digit date:
        <Text style={{textTransform: 'capitalize'}}>the 25th of december</Text>
      </Text>
      <Text style={{textTransform: 'capitalize'}}>
        Mixed: <Text style={{textTransform: 'uppercase'}}>uppercase </Text>
        <Text style={{textTransform: 'lowercase'}}>LoWeRcAsE </Text>
        <Text style={{textTransform: 'capitalize'}}>capitalize each word</Text>
      </Text>
      <Text>
        Should be "ABC":
        <Text style={{textTransform: 'uppercase'}}>
          a<Text>b</Text>c
        </Text>
      </Text>
      <Text>
        Should be "AbC":
        <Text style={{textTransform: 'uppercase'}}>
          a<Text style={{textTransform: 'none'}}>b</Text>c
        </Text>
      </Text>
      <Text style={{textTransform: 'none'}}>
        {
          '.aa\tbb\t\tcc  dd EE \r\nZZ I like to eat apples. \n中文éé 我喜欢吃苹果。awdawd   '
        }
      </Text>
      <Text style={{textTransform: 'uppercase'}}>
        {
          '.aa\tbb\t\tcc  dd EE \r\nZZ I like to eat apples. \n中文éé 我喜欢吃苹果。awdawd   '
        }
      </Text>
      <Text style={{textTransform: 'lowercase'}}>
        {
          '.aa\tbb\t\tcc  dd EE \r\nZZ I like to eat apples. \n中文éé 我喜欢吃苹果。awdawd   '
        }
      </Text>
      <Text style={{textTransform: 'capitalize'}}>
        {
          '.aa\tbb\t\tcc  dd EE \r\nZZ I like to eat apples. \n中文éé 我喜欢吃苹果。awdawd   '
        }
      </Text>
      <Text
        style={{
          textTransform: 'uppercase',
          fontSize: 16,
          color: 'turquoise',
          backgroundColor: 'blue',
          lineHeight: 32,
          letterSpacing: 2,
          alignSelf: 'flex-start',
        }}>
        Works with other text styles
      </Text>
    </>
  );
}

function IncludeFontPaddingExample(props: {}): React.Node {
  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginBottom: 10,
        }}>
        <View style={{alignItems: 'center'}}>
          <Text style={styles.includeFontPaddingText}>Ey</Text>
          <Text>Default</Text>
        </View>
        <View style={{alignItems: 'center'}}>
          <Text
            style={[
              styles.includeFontPaddingText,
              {includeFontPadding: false, marginLeft: 10},
            ]}>
            Ey
          </Text>
          <Text>includeFontPadding: false</Text>
        </View>
      </View>
      <Text>
        By default Android will put extra space above text to allow for
        upper-case accents or other ascenders. With some fonts, this can make
        text look slightly misaligned when centered vertically.
      </Text>
    </>
  );
}

function FontVariantsExample(props: {}): React.Node {
  return (
    <>
      <Text style={{fontVariant: ['small-caps']}}>Small Caps{'\n'}</Text>
      <Text
        style={{
          fontFamily: 'Roboto',
          fontVariant: ['oldstyle-nums'],
        }}>
        Old Style nums 0123456789{'\n'}
      </Text>
      <Text
        style={{
          fontFamily: 'Roboto',
          fontVariant: ['lining-nums'],
        }}>
        Lining nums 0123456789{'\n'}
      </Text>
      <Text style={{fontVariant: ['tabular-nums']}}>
        Tabular nums{'\n'}
        1111{'\n'}
        2222{'\n'}
      </Text>
      <Text style={{fontVariant: ['proportional-nums']}}>
        Proportional nums{'\n'}
        1111{'\n'}
        2222{'\n'}
      </Text>
    </>
  );
}

function EllipsizeModeExample(props: {}): React.Node {
  return (
    <>
      <Text numberOfLines={1} style={styles.wrappedText}>
        This very long text should be truncated with dots in the end.
      </Text>
      <Text ellipsizeMode="middle" numberOfLines={1} style={styles.wrappedText}>
        This very long text should be truncated with dots in the middle.
      </Text>
      <Text ellipsizeMode="head" numberOfLines={1} style={styles.wrappedText}>
        This very long text should be truncated with dots in the beginning.
      </Text>
      <Text ellipsizeMode="clip" numberOfLines={1} style={styles.wrappedText}>
        This very long text should be clipped and this will not be visible.
      </Text>
    </>
  );
}

function FontFamilyExample(props: {}): React.Node {
  return (
    <>
      <Text style={{fontFamily: 'sans-serif'}}>Sans-Serif</Text>
      <Text style={{fontFamily: 'sans-serif', fontWeight: 'bold'}}>
        Sans-Serif Bold
      </Text>
      <Text style={{fontFamily: 'serif'}}>Serif</Text>
      <Text style={{fontFamily: 'serif', fontWeight: 'bold'}}>Serif Bold</Text>
      <Text style={{fontFamily: 'monospace'}}>Monospace</Text>
      <Text style={{fontFamily: 'monospace', fontWeight: 'bold'}}>
        Monospace Bold (After 5.0)
      </Text>
      <Text style={{fontFamily: 'Unknown Font Family'}}>
        Unknown Font Family
      </Text>
    </>
  );
}

function TextShadowExample(props: {}): React.Node {
  return (
    <>
      <Text
        style={{
          fontSize: 20,
          textShadowOffset: {width: 2, height: 2},
          textShadowRadius: 1,
          textShadowColor: '#00cccc',
        }}>
        Demo text shadow
      </Text>
    </>
  );
}

function AllowFontScalingExample(props: {}): React.Node {
  return (
    <>
      <Text>
        By default, text will respect Text Size accessibility setting on
        Android. It means that all font sizes will be increased or decreased
        depending on the value of the Text Size setting in the OS's Settings
        app.
      </Text>
      <Text style={{marginTop: 10}}>
        You can disable scaling for your Text component by passing {'"'}
        allowFontScaling={'{'}false{'}"'} prop.
      </Text>
      <Text allowFontScaling={false} style={{marginTop: 20, fontSize: 15}}>
        This text will not scale.{' '}
        <Text style={{fontSize: 15}}>
          This text also won't scale because it inherits "allowFontScaling" from
          its parent.
        </Text>
      </Text>
    </>
  );
}

function NumberOfLinesExample(props: {}): React.Node {
  return (
    <>
      <Text numberOfLines={1} style={styles.wrappedText}>
        Maximum of one line no matter now much I write here. If I keep writing
        it{"'"}ll just truncate after one line
      </Text>
      <Text style={[{fontSize: 31}, styles.wrappedText]} numberOfLines={1}>
        Maximum of one line no matter now much I write here. If I keep writing
        it{"'"}ll just truncate after one line
      </Text>
      <Text numberOfLines={2} style={[{marginTop: 20}, styles.wrappedText]}>
        Maximum of two lines no matter now much I write here. If I keep writing
        it{"'"}ll just truncate after two lines
      </Text>
      <Text style={[{marginTop: 20}, styles.wrappedText]}>
        No maximum lines specified no matter now much I write here. If I keep
        writing it{"'"}ll just keep going and going
      </Text>
    </>
  );
}

function HyphenationExample(props: {}): React.Node {
  return (
    <>
      <Text android_hyphenationFrequency="normal" style={styles.wrappedText}>
        <Text style={{color: 'red'}}>Normal: </Text>
        WillHaveAHyphenWhenBreakingForNewLine
      </Text>
      <Text android_hyphenationFrequency="none" style={styles.wrappedText}>
        <Text style={{color: 'red'}}>None: </Text>
        WillNotHaveAHyphenWhenBreakingForNewLine
      </Text>
      <Text android_hyphenationFrequency="full" style={styles.wrappedText}>
        <Text style={{color: 'red'}}>Full: </Text>
        WillHaveAHyphenWhenBreakingForNewLine
      </Text>
    </>
  );
}

function FontWeightExample(props: {}): React.Node {
  return (
    <>
      <Text style={{fontWeight: 'bold'}}>Move fast and be bold</Text>
      <Text style={{fontWeight: 'normal'}}>Move fast and be normal</Text>
      <Text style={{fontWeight: '900'}}>FONT WEIGHT 900</Text>
      <Text style={{fontWeight: '800'}}>FONT WEIGHT 800</Text>
      <Text style={{fontWeight: '700'}}>FONT WEIGHT 700</Text>
      <Text style={{fontWeight: '600'}}>FONT WEIGHT 600</Text>
      <Text style={{fontWeight: '500'}}>FONT WEIGHT 500</Text>
      <Text style={{fontWeight: '400'}}>FONT WEIGHT 400</Text>
      <Text style={{fontWeight: '300'}}>FONT WEIGHT 300</Text>
      <Text style={{fontWeight: '200'}}>FONT WEIGHT 200</Text>
      <Text style={{fontWeight: '100'}}>FONT WEIGHT 100</Text>
      <Text style={{fontWeight: 900}}>FONT WEIGHT 900</Text>
      <Text style={{fontWeight: 800}}>FONT WEIGHT 800</Text>
      <Text style={{fontWeight: 700}}>FONT WEIGHT 700</Text>
      <Text style={{fontWeight: 600}}>FONT WEIGHT 600</Text>
      <Text style={{fontWeight: 500}}>FONT WEIGHT 500</Text>
      <Text style={{fontWeight: 400}}>FONT WEIGHT 400</Text>
      <Text style={{fontWeight: 300}}>FONT WEIGHT 300</Text>
      <Text style={{fontWeight: 200}}>FONT WEIGHT 200</Text>
      <Text style={{fontWeight: 100}}>FONT WEIGHT 100</Text>
    </>
  );
}

function BackgroundColorExample(props: {}): React.Node {
  return (
    <>
      <Text style={{backgroundColor: '#ffaaaa'}}>
        Red background,
        <Text style={{backgroundColor: '#aaaaff'}}>
          {' '}
          blue background,
          <Text>
            {' '}
            inherited blue background,
            <Text style={{backgroundColor: '#aaffaa'}}>
              {' '}
              nested green background.
            </Text>
          </Text>
        </Text>
      </Text>
      <Text style={{backgroundColor: 'rgba(100, 100, 100, 0.3)'}}>
        Same alpha as background,
        <Text>
          Inherited alpha from background,
          <Text style={{backgroundColor: 'rgba(100, 100, 100, 0.3)'}}>
            Reapply alpha
          </Text>
        </Text>
      </Text>
    </>
  );
}

function ContainerBackgroundColorExample(props: {}): React.Node {
  return (
    <>
      <View style={{flexDirection: 'row', height: 85}}>
        <View style={{backgroundColor: '#ffaaaa', width: 150}} />
        <View style={{backgroundColor: '#aaaaff', width: 150}} />
      </View>
      <Text style={[styles.backgroundColorText, {top: -80}]}>
        Default containerBackgroundColor (inherited) + backgroundColor wash
      </Text>
      <Text
        style={[
          styles.backgroundColorText,
          {top: -70, backgroundColor: 'transparent'},
        ]}>
        {"containerBackgroundColor: 'transparent' + backgroundColor wash"}
      </Text>
    </>
  );
}

function TextDecorationExample(props: {}): React.Node {
  return (
    <>
      <Text style={{textDecorationLine: 'underline'}}>Solid underline</Text>
      <Text style={{textDecorationLine: 'none'}}>None textDecoration</Text>
      <Text
        style={{
          textDecorationLine: 'line-through',
          textDecorationStyle: 'solid',
        }}>
        Solid line-through
      </Text>
      <Text style={{textDecorationLine: 'underline line-through'}}>
        Both underline and line-through
      </Text>
      <Text>
        Mixed text with{' '}
        <Text style={{textDecorationLine: 'underline'}}>underline</Text> and{' '}
        <Text style={{textDecorationLine: 'line-through'}}>line-through</Text>{' '}
        text nodes
      </Text>
    </>
  );
}

function NestedExample(props: {}): React.Node {
  return (
    <>
      <Text onPress={() => console.log('1st')}>
        (Normal text,
        <Text style={{color: 'red', fontWeight: 'bold'}}>
          (R)red
          <Text style={{color: 'green', fontWeight: 'normal'}}>
            (G)green
            <Text style={{color: 'blue', fontWeight: 'bold'}}>
              (B)blue
              <Text style={{color: 'cyan', fontWeight: 'normal'}}>
                (C)cyan
                <Text style={{color: 'magenta', fontWeight: 'bold'}}>
                  (M)magenta
                  <Text style={{color: 'yellow', fontWeight: 'normal'}}>
                    (Y)yellow
                    <Text style={{color: 'black', fontWeight: 'bold'}}>
                      (K)black
                    </Text>
                  </Text>
                </Text>
              </Text>
            </Text>
          </Text>
        </Text>
        <Text style={{fontWeight: 'bold'}} onPress={() => console.log('2nd')}>
          (and bold
          <Text
            style={{fontStyle: 'italic', fontSize: 11, color: '#527fe4'}}
            onPress={() => console.log('3rd')}>
            (and tiny bold italic blue
            <Text
              style={{fontWeight: 'normal', fontStyle: 'normal'}}
              onPress={() => console.log('4th')}>
              (and tiny normal blue)
            </Text>
            )
          </Text>
          )
        </Text>
        )
      </Text>
      <Text style={{fontFamily: 'serif'}} onPress={() => console.log('1st')}>
        (Serif
        <Text
          style={{fontStyle: 'italic', fontWeight: 'bold'}}
          onPress={() => console.log('2nd')}>
          (Serif Bold Italic
          <Text
            style={{
              fontFamily: 'monospace',
              fontStyle: 'normal',
              fontWeight: 'normal',
            }}
            onPress={() => console.log('3rd')}>
            (Monospace Normal
            <Text
              style={{fontFamily: 'sans-serif', fontWeight: 'bold'}}
              onPress={() => console.log('4th')}>
              (Sans-Serif Bold
              <Text
                style={{fontWeight: 'normal'}}
                onPress={() => console.log('5th')}>
                (and Sans-Serif Normal)
              </Text>
              )
            </Text>
            )
          </Text>
          )
        </Text>
        )
      </Text>
      <Text style={{fontSize: 12}}>
        <Entity>Entity Name</Entity>
      </Text>
      <Text style={{fontSize: 8}}>
        Nested text with size 8, <Text style={{fontSize: 23}}>size 23, </Text>
        and size 8 again
      </Text>
      <Text style={{color: 'red'}}>
        Nested text with red color,{' '}
        <Text style={{color: 'blue'}}>blue color, </Text>
        and red color again
      </Text>
    </>
  );
}

function TextAlignExample(props: {}): React.Node {
  return (
    <>
      <Text>auto (default) - english LTR</Text>
      <Text>أحب اللغة العربية auto (default) - arabic RTL</Text>
      <Text style={{textAlign: 'left'}}>
        left left left left left left left left left left left left left left
        left
      </Text>
      <Text style={{textAlign: 'center'}}>
        center center center center center center center center center center
        center
      </Text>
      <Text style={{textAlign: 'right'}}>
        right right right right right right right right right right right right
        right
      </Text>
      <Text style={{textAlign: 'justify'}}>
        justify (works when api level >= 26 otherwise fallbacks to "left"): this
        text component{"'"}s contents are laid out with "textAlign: justify" and
        as you can see all of the lines except the last one span the available
        width of the parent container.
      </Text>
    </>
  );
}

function UnicodeExample(props: {}): React.Node {
  return (
    <>
      <View>
        <View style={{flexDirection: 'row'}}>
          <Text style={{backgroundColor: 'red'}}>
            星际争霸是世界上最好的游戏。
          </Text>
        </View>
        <View>
          <Text style={{backgroundColor: 'red'}}>
            星际争霸是世界上最好的游戏。
          </Text>
        </View>
        <View style={{alignItems: 'center'}}>
          <Text style={{backgroundColor: 'red'}}>
            星际争霸是世界上最好的游戏。
          </Text>
        </View>
        <View>
          <Text style={{backgroundColor: 'red'}}>
            星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。
          </Text>
        </View>
      </View>
    </>
  );
}

function AndroidMaterialDesignFonts(props: {}): React.Node {
  return (
    <>
      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
        <View style={{flex: 1}}>
          <Text style={{fontFamily: 'sans-serif'}}>Roboto Regular</Text>
          <Text style={{fontFamily: 'sans-serif', fontStyle: 'italic'}}>
            Roboto Italic
          </Text>
          <Text style={{fontFamily: 'sans-serif', fontWeight: 'bold'}}>
            Roboto Bold
          </Text>
          <Text
            style={{
              fontFamily: 'sans-serif',
              fontStyle: 'italic',
              fontWeight: 'bold',
            }}>
            Roboto Bold Italic
          </Text>
          <Text style={{fontFamily: 'sans-serif-light'}}>Roboto Light</Text>
          <Text style={{fontFamily: 'sans-serif-light', fontStyle: 'italic'}}>
            Roboto Light Italic
          </Text>
          <Text style={{fontFamily: 'sans-serif-thin'}}>
            Roboto Thin (After 4.2)
          </Text>
          <Text style={{fontFamily: 'sans-serif-thin', fontStyle: 'italic'}}>
            Roboto Thin Italic (After 4.2)
          </Text>
          <Text style={{fontFamily: 'sans-serif-condensed'}}>
            Roboto Condensed
          </Text>
          <Text
            style={{
              fontFamily: 'sans-serif-condensed',
              fontStyle: 'italic',
            }}>
            Roboto Condensed Italic
          </Text>
          <Text
            style={{
              fontFamily: 'sans-serif-condensed',
              fontWeight: 'bold',
            }}>
            Roboto Condensed Bold
          </Text>
          <Text
            style={{
              fontFamily: 'sans-serif-condensed',
              fontStyle: 'italic',
              fontWeight: 'bold',
            }}>
            Roboto Condensed Bold Italic
          </Text>
          <Text style={{fontFamily: 'sans-serif-medium'}}>
            Roboto Medium (After 5.0)
          </Text>
          <Text style={{fontFamily: 'sans-serif-medium', fontStyle: 'italic'}}>
            Roboto Medium Italic (After 5.0)
          </Text>
        </View>
      </View>
    </>
  );
}

function CustomFontsExample(props: {}): React.Node {
  return (
    <>
      <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
        <View style={{flex: 1}}>
          <Text style={{fontFamily: 'notoserif'}}>NotoSerif Regular</Text>
          <Text
            style={{
              fontFamily: 'notoserif',
              fontStyle: 'italic',
              fontWeight: 'bold',
            }}>
            NotoSerif Bold Italic
          </Text>
          <Text style={{fontFamily: 'notoserif', fontStyle: 'italic'}}>
            NotoSerif Italic (Missing Font file)
          </Text>
          <Text
            style={{
              fontFamily: 'Rubik',
              fontWeight: 'normal',
            }}>
            Rubik Regular
          </Text>
          <Text
            style={{
              fontFamily: 'Rubik',
              fontWeight: '300',
            }}>
            Rubik Light
          </Text>
          <Text
            style={{
              fontFamily: 'Rubik',
              fontWeight: '700',
            }}>
            Rubik Bold
          </Text>
          <Text
            style={{
              fontFamily: 'Rubik',
              fontWeight: '500',
            }}>
            Rubik Medium
          </Text>
          <Text
            style={{
              fontFamily: 'Rubik',
              fontStyle: 'italic',
              fontWeight: '500',
            }}>
            Rubik Medium Italic
          </Text>
        </View>
      </View>
    </>
  );
}

function LineHeightExample(props: {}): React.Node {
  return (
    <>
      <Text style={[{lineHeight: 35}, styles.wrappedText]}>
        Holisticly formulate inexpensive ideas before best-of-breed benefits.{' '}
        <Text style={{fontSize: 20}}>Continually</Text> expedite magnetic
        potentialities rather than client-focused interfaces.
      </Text>
    </>
  );
}

function LetterSpacingExample(props: {}): React.Node {
  return (
    <>
      <View>
        <Text style={{letterSpacing: 0}}>letterSpacing = 0</Text>
        <Text style={{letterSpacing: 2, marginTop: 5}}>letterSpacing = 2</Text>
        <Text style={{letterSpacing: 9, marginTop: 5}}>letterSpacing = 9</Text>
        <View style={{flexDirection: 'row'}}>
          <Text
            style={{
              fontSize: 12,
              letterSpacing: 2,
              backgroundColor: 'fuchsia',
              marginTop: 5,
            }}>
            With size and background color
          </Text>
        </View>
        <Text style={{letterSpacing: -1, marginTop: 5}}>
          letterSpacing = -1
        </Text>
        <Text
          style={{
            letterSpacing: 3,
            backgroundColor: '#dddddd',
            marginTop: 5,
          }}>
          [letterSpacing = 3]
          <Text style={{letterSpacing: 0, backgroundColor: '#bbbbbb'}}>
            [Nested letterSpacing = 0]
          </Text>
          <Text style={{letterSpacing: 6, backgroundColor: '#eeeeee'}}>
            [Nested letterSpacing = 6]
          </Text>
        </Text>
      </View>
    </>
  );
}

function TextBaseLineLayoutExample(props: {}): React.Node {
  const texts = [];
  for (let i = 9; i >= 0; i--) {
    texts.push(
      <Text
        key={i}
        style={{fontSize: 8 + i * 5, maxWidth: 20, backgroundColor: '#eee'}}>
        {i}
      </Text>,
    );
  }

  const marker = (
    <View style={{width: 20, height: 20, backgroundColor: 'gray'}} />
  );
  const subtitleStyle = {fontSize: 16, marginTop: 8, fontWeight: 'bold'};

  return (
    <View>
      <Text style={subtitleStyle}>{'Nested <Text/>s:'}</Text>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        {marker}
        <Text>{texts}</Text>
        {marker}
      </View>

      <Text style={subtitleStyle}>{'Array of <Text/>s in <View>:'}</Text>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        {marker}
        {texts}
        {marker}
      </View>

      <Text style={subtitleStyle}>{'Interleaving <View> and <Text>:'}</Text>
      <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
        {marker}
        <Text selectable={true}>
          Some text.
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              backgroundColor: '#eee',
            }}>
            {marker}
            <Text>Text inside View.</Text>
            {marker}
          </View>
        </Text>
        {marker}
      </View>
    </View>
  );
}

const examples = [
  {
    title: 'Dynamic Font Size Adjustment',
    name: 'ajustingFontSize',
    render(): React.Node {
      return <AdjustingFontSize />;
    },
  },
  {
    title: 'Font Size Adjustment with Dynamic Layout',
    name: 'textAdjustsDynamicLayout',
    render(): React.Node {
      return <TextAdjustsDynamicLayoutExample />;
    },
  },
  {
    title: 'Wrap',
    name: 'wrap',
    render(): React.Node {
      return (
        <Text style={styles.wrappedText}>
          The text should wrap if it goes on multiple lines. See, this is going
          to the next line.
        </Text>
      );
    },
  },
  {
    title: 'Hyphenation',
    name: 'hyphenation',
    render(): React.Node {
      return <HyphenationExample />;
    },
  },
  {
    title: 'Padding',
    name: 'padding',
    render(): React.Node {
      return (
        <Text style={{padding: 10}}>
          This text is indented by 10px padding on all sides.
        </Text>
      );
    },
  },
  {
    title: 'Text metrics legend',
    name: 'textMetricLegend',
    render(): React.Node {
      return <TextLegend />;
    },
  },
  {
    title: 'Font Family',
    name: 'fontFamily',
    render(): React.Node {
      return <FontFamilyExample />;
    },
  },
  {
    title: 'Android Material Design Fonts',
    name: 'androidMaterialDesignFonts',
    render(): React.Node {
      return <AndroidMaterialDesignFonts />;
    },
  },
  {
    title: 'Custom Fonts',
    name: 'customFonts',
    render(): React.Node {
      return <CustomFontsExample />;
    },
  },
  {
    title: 'Font Size',
    name: 'fontSize',
    render(): React.Node {
      return (
        <>
          <Text style={{fontSize: 23}}>Size 23</Text>
          <Text style={{fontSize: 8}}>Size 8</Text>
        </>
      );
    },
  },
  {
    title: 'Color',
    name: 'color',
    render(): React.Node {
      return (
        <>
          <Text style={{color: 'red'}}>Red color</Text>
          <Text style={{color: 'blue'}}>Blue color</Text>
        </>
      );
    },
  },
  {
    title: 'Font Weight',
    name: 'fontWeight',
    render(): React.Node {
      return <FontWeightExample />;
    },
  },
  {
    title: 'Font Style',
    name: 'fontStyle',
    render(): React.Node {
      return (
        <>
          <Text style={{fontStyle: 'italic'}}>Move fast and be italic</Text>
          <Text style={{fontStyle: 'normal'}}>Move fast and be normal</Text>
        </>
      );
    },
  },
  {
    title: 'Font Style and Weight',
    name: 'fontStyleAndWeight',
    render(): React.Node {
      return (
        <Text style={{fontStyle: 'italic', fontWeight: 'bold'}}>
          Move fast and be both bold and italic
        </Text>
      );
    },
  },
  {
    title: 'Text Decoration',
    name: 'textDecoration',
    render(): React.Node {
      return <TextDecorationExample />;
    },
  },
  {
    title: 'Nested',
    name: 'nested',
    render(): React.Node {
      return <NestedExample />;
    },
  },
  {
    title: 'Text Align',
    name: 'textAlign',
    render(): React.Node {
      return <TextAlignExample />;
    },
  },
  {
    title: 'Unicode',
    name: 'unicode',
    render(): React.Node {
      return <UnicodeExample />;
    },
  },
  {
    title: 'Spaces',
    name: 'spaces',
    render(): React.Node {
      return (
        <Text>
          A {'generated'} {'string'} and some &nbsp;&nbsp;&nbsp; spaces
        </Text>
      );
    },
  },
  {
    title: 'Line Height',
    name: 'lineHeight',
    render(): React.Node {
      return <LineHeightExample />;
    },
  },
  {
    title: 'Letter Spacing',
    name: 'letterSpacing',
    render(): React.Node {
      return <LetterSpacingExample />;
    },
  },
  {
    title: 'Empty Text',
    name: 'emptyText',
    render(): React.Node {
      return <Text />;
    },
  },
  {
    title: 'Toggling Attributes',
    name: 'togglingAttributes',
    render(): React.Node {
      return <AttributeToggler />;
    },
  },
  {
    title: 'backgroundColor attribute',
    name: 'backgroundColorAttribute',
    render(): React.Node {
      return <BackgroundColorExample />;
    },
  },
  {
    title: 'containerBackgroundColor attribute',
    name: 'containerBackgroundColorAttribute',
    render(): React.Node {
      return <ContainerBackgroundColorExample />;
    },
  },
  {
    title: 'numberOfLines attribute',
    name: 'numberOfLines',
    render(): React.Node {
      return <NumberOfLinesExample />;
    },
  },
  {
    title: 'allowFontScaling attribute',
    name: 'allowFontScaling',
    render(): React.Node {
      return <AllowFontScalingExample />;
    },
  },
  {
    title: 'selectable attribute',
    name: 'selectable',
    render(): React.Node {
      return (
        <Text selectable>
          This text is selectable if you click-and-hold, and will offer the
          native Android selection menus.
        </Text>
      );
    },
  },
  {
    title: 'selectionColor attribute',
    name: 'selectionColor',
    render(): React.Node {
      return (
        <Text selectable selectionColor="orange">
          This text will have a orange highlight on selection.
        </Text>
      );
    },
  },
  {
    title: 'Inline views',
    name: 'inlineViewsBasic',
    render(): React.Node {
      return <TextInlineView.Basic />;
    },
  },
  {
    title: 'Inline views with multiple nested texts',
    name: 'inlineViewsMultiple',
    render(): React.Node {
      return <TextInlineView.NestedTexts />;
    },
  },
  {
    title: 'Inline image/view clipped by <Text>',
    name: 'inlineViewsClipped',
    render(): React.Node {
      return <TextInlineView.ClippedByText />;
    },
  },
  {
    title: 'Relayout inline image',
    name: 'relayoutInlineImage',
    render(): React.Node {
      return <TextInlineView.ChangeImageSize />;
    },
  },
  {
    title: 'Relayout inline view',
    name: 'relayoutInlineView',
    render(): React.Node {
      return <TextInlineView.ChangeViewSize />;
    },
  },
  {
    title: 'Relayout nested inline view',
    name: 'relayoutNestedInlineView',
    render(): React.Node {
      return <TextInlineView.ChangeInnerViewSize />;
    },
  },
  {
    title: 'Text shadow',
    name: 'textShadow',
    render(): React.Node {
      return <TextShadowExample />;
    },
  },
  {
    title: 'Ellipsize mode',
    name: 'ellipsizeMode',
    render(): React.Node {
      return <EllipsizeModeExample />;
    },
  },
  {
    title: 'Font variants',
    name: 'fontVariants',
    render(): React.Node {
      return <FontVariantsExample />;
    },
  },
  {
    title: 'Include Font Padding',
    name: 'includeFontPadding',
    render(): React.Node {
      return <IncludeFontPaddingExample />;
    },
  },
  {
    title: 'Text Transform',
    name: 'textTransform',
    render(): React.Node {
      return <TextTransformExample />;
    },
  },
  {
    title: 'Substring Emoji (should only see "test")',
    name: 'substringEmoji',
    render(): React.Node {
      return <Text>{'test🙃'.substring(0, 5)}</Text>;
    },
  },

  {
    title: 'Text linkify',
    name: 'textLinkify',
    render(): React.Node {
      return <TextLinkifyExample />;
    },
  },
  {
    title: "Text `alignItems: 'baseline'` style",
    name: 'alignItemsBaseline',
    render(): React.Node {
      return <TextBaseLineLayoutExample />;
    },
  },
  {
    title: 'Selectable Text',
    name: 'selectableText',
    render(): React.Node {
      return (
        <View>
          <Text style={{userSelect: 'auto'}}>Text element is selectable</Text>
        </View>
      );
    },
  },
  {
    title: 'Text alignment',
    name: 'textAlignment',
    render(): React.Node {
      return (
        <View>
          <Text style={{textAlignVertical: 'top', borderWidth: 1, height: 75}}>
            Text element aligned to the top via textAlignVertical
          </Text>
          <Text style={{verticalAlign: 'top', borderWidth: 1, height: 75}}>
            Text element aligned to the top via verticalAlign
          </Text>
          <Text
            style={{textAlignVertical: 'center', borderWidth: 1, height: 75}}>
            Text element aligned to the middle via textAlignVertical
          </Text>
          <Text style={{verticalAlign: 'middle', borderWidth: 1, height: 75}}>
            Text element aligned to the middle via verticalAlign
          </Text>
        </View>
      );
    },
  },
  {
    title: 'Clipping',
    name: 'clipping',
    render: function (): React.Node {
      return (
        <View>
          <Text
            testID="text-clipping"
            style={{
              borderRadius: 50,
              padding: 0,
              borderColor: 'red',
              borderWidth: 5,
              overflow: 'hidden',
              fontSize: 16,
            }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Text>
        </View>
      );
    },
  },
  TextInlineViewsExample,
];

const styles = StyleSheet.create({
  backgroundColorText: {
    left: 5,
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
  },
  includeFontPaddingText: {
    fontSize: 120,
    fontFamily: 'sans-serif',
    backgroundColor: '#EEEEEE',
    color: '#000000',
    textAlignVertical: 'center',
    alignSelf: 'center',
  },
  wrappedText: {
    maxWidth: 300,
  },
});

module.exports = ({
  title: 'Text',
  documentationURL: 'https://reactnative.dev/docs/text',
  category: 'Basic',
  description: 'Base component for rendering styled text.',
  displayName: 'TextExample',
  examples,
}: RNTesterModule);
