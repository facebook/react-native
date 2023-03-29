/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import {Text, View, StyleSheet} from 'react-native';
import RNTOption from './RNTOption';

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
  igbo: 'Nne, nna, wepụ he’l’ụjọ dum n’ime ọzụzụ ụmụ, vufesi obi nye Chukwu, ṅụrịanụ, gbakọọnụ kpaa, kwee ya ka o guzoshie ike; ọ ghaghị ito, nwapụta ezi agwa',
  irish: 'D’fhuascail Íosa Úrmhac na hÓighe Beannaithe pór Éava agus Ádhaimh',
  japanese:
    '色は匂へど 散りぬるを 我が世誰ぞ 常ならむ 有為の奥山 今日越えて 浅き夢見じ 酔ひもせず',
  korean: '키스의 고유조건은 입술끼리 만나야 하고 특별한 기술은 필요치 않다',
  norwegian:
    'Vår sære Zulu fra badeøya spilte jo whist og quickstep i min taxi.',
  polish: 'Jeżu klątw, spłódź Finom część gry hańb!',
  romanian: 'Muzicologă în bej vând whisky și tequila, preț fix.',
  russian: 'Эх, чужак, общий съём цен шляп (юфть) – вдрызг!',
  swedish: 'Yxskaftbud, ge vår WC-zonmö IQ-hjälp.',
  thai: 'เป็นมนุษย์สุดประเสริฐเลิศคุณค่า กว่าบรรดาฝูงสัตว์เดรัจฉาน จงฝ่าฟันพัฒนาวิชาการ อย่าล้างผลาญฤๅเข่นฆ่าบีฑาใคร ไม่ถือโทษโกรธแช่งซัดฮึดฮัดด่า หัดอภัยเหมือนกีฬาอัชฌาสัย ปฏิบัติประพฤติกฎกำหนดใจ พูดจาให้จ๊ะๆ จ๋าๆ น่าฟังเอยฯ',
};

export default function TextLegend(): React.Node {
  const [language, setLanguage] = React.useState('english');
  const [alignment, setAlignment] = React.useState('left');
  // $FlowFixMe[missing-empty-array-annot]
  const [textMetrics, setTextMetrics] = React.useState([]);
  const [fontSize, setFontSize] = React.useState(50);
  return (
    <View>
      <Text onPress={() => setFontSize(fontSize + 3)}>Increase size</Text>
      <Text onPress={() => setFontSize(fontSize - 3)}>Decrease size</Text>
      <View style={styles.block}>
        <Text style={styles.title}>Language</Text>
        <View style={styles.row}>
          {Object.keys(PANGRAMS).map(lang => (
            <RNTOption
              label={lang[0].toUpperCase() + lang.substring(1)}
              key={lang}
              onPress={() => setLanguage(lang)}
              selected={lang === language}
              style={styles.option}
            />
          ))}
        </View>
      </View>
      <View>
        {textMetrics.map(
          ({x, y, width, height, capHeight, ascender, descender, xHeight}) => {
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
            setTextMetrics(event.nativeEvent.lines);
          }}
          style={{
            fontSize: fontSize,
            textAlign: alignment,
          }}>
          {PANGRAMS[language]}
        </Text>
      </View>
      <View style={styles.row}>
        <Text>Alignment:</Text>
        <RNTOption
          label="Left Align"
          key="left_align"
          onPress={() => setAlignment('left')}
          selected={alignment === 'left'}
          style={styles.option}
        />
        <RNTOption
          label="Center Align"
          key="center_align"
          onPress={() => setAlignment('center')}
          selected={alignment === 'center'}
          style={styles.option}
        />
        <RNTOption
          label="Right Align"
          key="right_align"
          onPress={() => setAlignment('right')}
          selected={alignment === 'right'}
          style={styles.option}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: 6,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
  },
  block: {
    borderColor: 'rgba(0,0,0, 0.1)',
    borderBottomWidth: 1,
    padding: 6,
  },
  option: {
    margin: 4,
  },
});
