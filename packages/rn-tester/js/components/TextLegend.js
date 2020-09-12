/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');

const {Text, View} = require('react-native');
import {Picker} from 'react-native';

class TextLegend extends React.Component<*, *> {
  state: {|
    alignment: $TEMPORARY$string<'left'>,
    fontSize: number,
    language: $TEMPORARY$string<'english'>,
    textMetrics: Array<any>,
  |} = {
    textMetrics: [],
    language: 'english',
    alignment: 'left',
    fontSize: 50,
  };

  render(): React.Node {
    const PANGRAMS = {
      arabic:
        'صِف خَلقَ خَودِ كَمِثلِ الشَمسِ إِذ بَزَغَت — يَحظى الضَجيعُ بِها نَجلاءَ مِعطارِ',
      chinese: 'Innovation in China 中国智造，慧及全球 0123456789',
      english: 'The quick brown fox jumps over the lazy dog.',
      emoji: '🙏🏾🚗💩😍🤯👩🏽‍🔧🇨🇦💯',
      german: 'Falsches Üben von Xylophonmusik quält jeden größeren Zwerg',
      greek: 'Ταχίστη αλώπηξ βαφής ψημένη γη, δρασκελίζει υπέρ νωθρού κυνός',
      hebrew: 'דג סקרן שט בים מאוכזב ולפתע מצא חברה',
      hindi:
        'ऋषियों को सताने वाले दुष्ट राक्षसों के राजा रावण का सर्वनाश करने वाले विष्णुवतार भगवान श्रीराम, अयोध्या के महाराज दशरथ के बड़े सपुत्र थे।',
      igbo:
        'Nne, nna, wepụ he’l’ụjọ dum n’ime ọzụzụ ụmụ, vufesi obi nye Chukwu, ṅụrịanụ, gbakọọnụ kpaa, kwee ya ka o guzoshie ike; ọ ghaghị ito, nwapụta ezi agwa',
      irish:
        'D’fhuascail Íosa Úrmhac na hÓighe Beannaithe pór Éava agus Ádhaimh',
      japanese:
        '色は匂へど 散りぬるを 我が世誰ぞ 常ならむ 有為の奥山 今日越えて 浅き夢見じ 酔ひもせず',
      korean:
        '키스의 고유조건은 입술끼리 만나야 하고 특별한 기술은 필요치 않다',
      norwegian:
        'Vår sære Zulu fra badeøya spilte jo whist og quickstep i min taxi.',
      polish: 'Jeżu klątw, spłódź Finom część gry hańb!',
      romanian: 'Muzicologă în bej vând whisky și tequila, preț fix.',
      russian: 'Эх, чужак, общий съём цен шляп (юфть) – вдрызг!',
      swedish: 'Yxskaftbud, ge vår WC-zonmö IQ-hjälp.',
      thai:
        'เป็นมนุษย์สุดประเสริฐเลิศคุณค่า กว่าบรรดาฝูงสัตว์เดรัจฉาน จงฝ่าฟันพัฒนาวิชาการ อย่าล้างผลาญฤๅเข่นฆ่าบีฑาใคร ไม่ถือโทษโกรธแช่งซัดฮึดฮัดด่า หัดอภัยเหมือนกีฬาอัชฌาสัย ปฏิบัติประพฤติกฎกำหนดใจ พูดจาให้จ๊ะๆ จ๋าๆ น่าฟังเอยฯ',
    };
    return (
      <View>
        <Text
          onPress={() =>
            this.setState(prevState => ({fontSize: prevState.fontSize + 3}))
          }>
          Increase size
        </Text>
        <Text
          onPress={() =>
            this.setState(prevState => ({fontSize: prevState.fontSize - 3}))
          }>
          Decrease size
        </Text>
        <Picker
          selectedValue={this.state.language}
          onValueChange={itemValue => this.setState({language: itemValue})}>
          {Object.keys(PANGRAMS).map(x => (
            <Picker.Item
              label={x[0].toUpperCase() + x.substring(1)}
              key={x}
              value={x}
            />
          ))}
        </Picker>
        <View>
          {this.state.textMetrics.map(
            ({
              x,
              y,
              width,
              height,
              capHeight,
              ascender,
              descender,
              xHeight,
            }) => {
              return [
                <View
                  key="baseline view"
                  style={{
                    top: y + ascender,
                    height: 1,
                    left: 0,
                    right: 0,
                    position: 'absolute',
                    backgroundColor: 'red',
                  }}
                />,
                <Text
                  key="baseline text"
                  style={{
                    top: y + ascender,
                    right: 0,
                    position: 'absolute',
                    color: 'red',
                  }}>
                  Baseline
                </Text>,
                <View
                  key="capheight view"
                  style={{
                    top: y + ascender - capHeight,
                    height: 1,
                    left: 0,
                    right: 0,
                    position: 'absolute',
                    backgroundColor: 'green',
                  }}
                />,
                <Text
                  key="capheight text"
                  style={{
                    top: y + ascender - capHeight,
                    right: 0,
                    position: 'absolute',
                    color: 'green',
                  }}>
                  Capheight
                </Text>,
                <View
                  key="xheight view"
                  style={{
                    top: y + ascender - xHeight,
                    height: 1,
                    left: 0,
                    right: 0,
                    position: 'absolute',
                    backgroundColor: 'blue',
                  }}
                />,
                <Text
                  key="xheight text"
                  style={{
                    top: y + ascender - xHeight,
                    right: 0,
                    position: 'absolute',
                    color: 'blue',
                  }}>
                  X-height
                </Text>,
                <View
                  key="descender view"
                  style={{
                    top: y + ascender + descender,
                    height: 1,
                    left: 0,
                    right: 0,
                    position: 'absolute',
                    backgroundColor: 'orange',
                  }}
                />,
                <Text
                  key="descender text"
                  style={{
                    top: y + ascender + descender,
                    right: 0,
                    position: 'absolute',
                    color: 'orange',
                  }}>
                  Descender
                </Text>,
                <View
                  key="end of text view"
                  style={{
                    top: y,
                    height: height,
                    width: 1,
                    left: x + width,
                    position: 'absolute',
                    backgroundColor: 'brown',
                  }}
                />,
                <Text
                  key="end of text text"
                  style={{
                    top: y,
                    left: x + width + 5,
                    position: 'absolute',
                    color: 'brown',
                  }}>
                  End of text
                </Text>,
                <View
                  key="start of text view"
                  style={{
                    top: y,
                    height: height,
                    width: 1,
                    left: x,
                    position: 'absolute',
                    backgroundColor: 'brown',
                  }}
                />,
                <Text
                  key="start of text text"
                  style={{
                    top: y,
                    left: x + 5,
                    position: 'absolute',
                    color: 'brown',
                  }}>
                  Start of text
                </Text>,
              ];
            },
          )}
          <Text
            onTextLayout={event => {
              this.setState({textMetrics: event.nativeEvent.lines});
            }}
            style={{
              fontSize: this.state.fontSize,
              textAlign: this.state.alignment,
            }}>
            {PANGRAMS[this.state.language]}
          </Text>
        </View>
        <Picker
          selectedValue={this.state.alignment}
          onValueChange={itemValue => this.setState({alignment: itemValue})}>
          <Picker.Item label="Left align" value="left" />
          <Picker.Item label="Center align" value="center" />
          <Picker.Item label="Right align" value="right" />
        </Picker>
      </View>
    );
  }
}
module.exports = TextLegend;
