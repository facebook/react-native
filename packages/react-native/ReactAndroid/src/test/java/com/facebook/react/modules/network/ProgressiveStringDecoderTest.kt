/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.network

import java.nio.charset.Charset
import java.nio.charset.StandardCharsets
import kotlin.math.min
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ProgressiveStringDecoderTest {

  private val TEST_DATA_1_BYTE =
      """Lorem ipsum dolor sit amet, ea ius viris laoreet gloriatur, ea enim illud mel. Ea eligendi erroribus inciderint sea, id nemore sensibus contentiones qui. Eos et nulla abhorreant, noluisse adipiscing reprehendunt an sit. Harum iriure meliore ne nec, clita semper voluptaria at sea. Ius civibus vituperata reprehendunt ut.

    Sed nisl postea maiorum ex, mea eros verterem ea. Ne usu brute debitis appareat. Ad quem reprimique dissentias duo. Sit an labitur eleifend, illud zril audiam nam ex, epicuri luptatum ne usu. Lorem mundi utinam vix ea.

    Te eam nominati qualisque. Ut praesent consetetur pro. Soleat vivendum vim ea. Altera dolores eam in. Eum at praesent complectitur. Nec ea inani definitiones, tantas vivendum mei an, mea an ubique omnium latine. Has mundi ocurreret ei, nam ea iuvaret gloriatur.

    Ad omnes malorum vim, no latine facilisi mel, dicant salutandi conclusionemque ei est. Nam cu partem alterum minimum. Et quo iriure deleniti accommodare, ad impetus perfecto liberavisse pri. Instructior necessitatibus ut mel, ex cum sumo atqui comprehensam, ei nullam oporteat sed. Ius meliore placerat cu.

    Eum in ferri nobis, eam eu verear facilisis referrentur. Veniam epicuri referrentur at nam. Vel congue diceret fabulas te, ei fabellas temporibus mei. Nemore corrumpit quo ex, et vis soluta reprehendunt. Et eos eripuit atomorum.

    Eum no novum tantas decore. Indoctum definiebas intellegam ut vel. Cu per ipsum graeco, in nam dico dolore, usu id ludus consulatu. Vis an clita commune, cu quot quaeque cum. In eos semper aperiri. Ne mea probo inermis, no vis audiam volutpat.

    Cu quaeque scaevola vis. Civibus commune scriptorem vim an, vim ea vocent petentium consequuntur, meis propriae invidunt eam ex. Pro et ponderum recusabo sapientem. Vel legere possim ornatus ne, saepe commodo scaevola an quo. An scaevola repudiandae sed. Eam ei veri nemore.

    Ullum deleniti cum at. An has soleat docendi, epicuri erroribus inciderint pro ea. Noluisse invidunt splendide quo in, eam odio invenire ea. Eu hinc definiebas scripserit duo, has cu equidem ponderum expetenda, eum vulputate intellegat id. Pri eu natum semper pertinax, ei vel inani aliquip habemus, sit an facer dicam. Et graeci abhorreant contentiones duo, et summo partiendo conclusionemque per.

    Sed ei etiam iudico abhorreant. Pri an regione fastidii, clita discere eu nec. Torquatos percipitur inciderint eos in, id per prompta blandit. Sit et epicuri deleniti. Per labores corpora no.

    Quodsi melius facilis pri ei, has adhuc recusabo reprimique ut. Laoreet definitionem cum cu, amet nonumes ut vis, qui ut sonet ancillae. Vim no doctus efficiantur, ancillae indoctum ex sea, vel eu fabulas volumus argumentum. Ex eum aeque commune placerat, nam choro tamquam luptatum et. Ne sea vero idque liberavisse"""

  private val TEST_DATA_2_BYTES =
      """Лорем ипсум долор сит амет, доминг дисцере ад вих, велит игнота ратионибус мел цу. Не вирис малорум яуаеяуе хас, еу либрис доцтус хис. Моллис садипсцинг ан цум, семпер молестие репрехендунт усу те. Цасе аетерно оффендит ан еос. При ан толлит опортере оцурререт, ан яуот мутат трацтатос вих.

    Нец фалли харум ратионибус еа. Магна адмодум ат нам, яуи еа рецусабо мандамус, аццусам цонсеяуунтур цу хис. Импедит цотидиеяуе улламцорпер еа мел, усу ет долорес аргументум. Веро торяуатос ех нам, цибо либерависсе ест еи. Вис долор омниум сплендиде ад, велит рецусабо цонсететур иус цу.

    Еи дуо меис атоморум сигниферумяуе, аугуе аццусам мел ет. Ут ностро легендос хонестатис пер, ут яуас мовет сеа. Меа цу продессет аппеллантур. Вис еа яуод оффендит, дебет видерер ет нам.

    Еам еа дебитис иудицабит, не хас иллуд цивибус. Усу ет алии уллум утамур. Поссит цонституто те яуи, хас ет лаудем аудире, нам еи епицури салутанди. Лудус делицатиссими цум еу, либер адиписцинг еи нец. Ид ерипуит лобортис антиопам хис, санцтус елигенди неглегентур сед ут, вел сентентиае инструцтиор еи. Ан про унум яуалисяуе.

    Ат еррор алтера сит, пер еу яуот номинави. Пертинах репудиаре цум еу. Еа фуиссет антиопам вим, пробатус реферрентур ут иус. Еум ад модус утрояуе диспутандо.

    Ехерци бландит ут меа. Солет импедит сед ад. Дуо порро тимеам аудире не, алии ерант номинави цу нец, сит ферри веритус адиписци те. Те меи синт адверсариум, ад феугаит инвидунт луцилиус сед, дицунт нумяуам нам те. Еум дицант елеифенд цонсецтетуер ет, суммо вереар епицуреи не про. Не лудус сцрипта опортере вим, еи дуо идяуе алияуам сигниферумяуе. Цум еу лабитур инвенире, про ессе губергрен темпорибус еи, ад хис минимум пертинах.

    Дуо ад вери евертитур интеллегат, демоцритум еффициенди дуо ет. Нец но доценди демоцритум сцрипторем, витуперата цонституам нецесситатибус ут вим. Яуи виде санцтус мандамус ан, нонумес принципес вел ат, ех дуо инани нулла. Петентиум маиестатис еам ин, те ерант дебитис еурипидис вис. Но вел антиопам цотидиеяуе еффициантур, сеа еи нибх нонумы инцидеринт.

    Одио омнес но яуо, популо ноструд иус ад. Инани хонестатис но вис. Хис еу лудус партем персиус, пурто малис витуперата при ан, еи елаборарет ассуеверит вим. Цу бруте утинам тинцидунт вих, цум ад дицтас лобортис лаборамус. Нец хабемус рецусабо ат, ех фацилис денияуе ест. При те велит алияуам аццусамус, юсто утамур антиопам но нам.

    Про не еррем иудицо мелиоре, еи цибо ерудити санцтус хас. Яуод еяуидем еу вис, вих яуидам легимус ад, ид сеа солум легере мандамус. Аеяуе детрахит ех иус, суас вертерем еум цу. Еи вим алиа ехерци пхаедрум, хас не лаборес цоррумпит. Ат граеци сцрипта вим.

    Иус ат менандри персеяуерис. Про модус дицта еу, ин граеци доценди фиерент при, еи хас аугуе мандамус дефинитионем. Ет путент интерпретарис сит, перицула сентентиае ат ест. При ут сумо видит волуптатибус, нобис деленити еа."""

  private val TEST_DATA_3_BYTES =
      """案のづよド捕毎エオ文疑ろめた今宮レ秋像とが供持属ょー真場中ホサヒ不箱らご著質ーぼンろ保6年読さ系蔵べるル緩参フシセタ鮮県フずッ歳民ナセ楽飲匹恒桜ぱ。要電ネソメ嘉負向ス援中ぜく界党フネ属平ぎ象越容レ書95争効99争効7翌テ売約わこよッ紙点発事9入そさ補綱のラず他亭匠ぞ。

    天レ供内ソ愛7読でぽせ回書ほごしな浅月企設潟せぐり裂個ホヌヤ局題制エ柏央ざぽ。外くにさ下格か終所あ硬当ワ着少選とけリへ康件終にぎ季規らおず給測トユテ考毎サトス事版にーご文8忙チ深暮タヲムラ度6応しぞぎぐ装速て続際ぞ発准揮包孤てい。制はたちき合南む乙甲ゅさと捕4球任条こでン頭広セスモウ月夜エス面陽ヨネ力京ウリ紙聞ト印2火映ラ基頭スフ点愛伎協ねド。

    属と共代みむもず以監すい者新ス田政家ヱス使校音刑トホ則上ゅぐ一未ヌ意40芸標んは学必強ゅ帝歯没牧具もか。58新イシレ正米ニユ負皇っぐせの必容キソタコ公3容ーつぶべ年然検ざ整賞ニチ注興ぐ放約えあ野夜磨やゃフよ。柳ソシアテ申1科ル舗紀深むぜ競供とび室全ハネ測高エラク権暮ヲクオト館暮ヌ黒杯クリぴぽ火竹ねる種4帰替やあい北問クルゃン登壌粉つどべ。"""

  private val TEST_DATA_4_BYTES =
      """\uD800\uDE55\uD800\uDE55\uD800\uDE55 \uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55
    \uD800\uDE55\uD800\uDE55\uD800\uDE55 \uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80
    \uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80
    \uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE55\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80\uD800\uDE80
    \uD800\uDE80\uD800\uDE80\uD800\uDE80"""

  @Test
  fun testUTF8SingleByteSymbols() {
    chunkString(TEST_DATA_1_BYTE, StandardCharsets.UTF_8, 64)
  }

  @Test
  fun testUTF8twoBytesSymbols() {
    chunkString(TEST_DATA_2_BYTES, StandardCharsets.UTF_8, 63)
  }

  @Test
  fun testUTF8ThreeBytesSymbols() {
    chunkString(TEST_DATA_3_BYTES, StandardCharsets.UTF_8, 64)
  }

  @Test
  fun testUTF8FourBytesSymbols() {
    chunkString(TEST_DATA_4_BYTES, StandardCharsets.UTF_8, 111)
  }

  @Test
  fun testUTF16LEStandard() {
    chunkString(TEST_DATA_3_BYTES, StandardCharsets.UTF_16LE, 47)
  }

  @Test
  fun testUTF16LESurrogates() {
    // 4 bytes UTF-8 symbols are encoded as two 2 byte surrogate symbols in UTF-16
    chunkString(TEST_DATA_4_BYTES, StandardCharsets.UTF_16LE, 47)
  }

  @Test
  fun testUTF16BEStandard() {
    chunkString(TEST_DATA_3_BYTES, StandardCharsets.UTF_16BE, 47)
  }

  @Test
  fun testUTF16BESurrogates() {
    // 4 bytes UTF-8 symbols are encoded as two 2 byte surrogate symbols in UTF-16
    chunkString(TEST_DATA_4_BYTES, StandardCharsets.UTF_16BE, 47)
  }

  @Test
  fun testUTF32() {
    // UTF-32 data symbols always 4 bytes
    chunkString(TEST_DATA_4_BYTES, Charset.forName("UTF-32"), 65)
  }

  private fun chunkString(originalString: String, charset: Charset, chunkSize: Int) {
    val data = originalString.toByteArray(charset)
    val builder = StringBuilder()
    val collector = ProgressiveStringDecoder(charset)
    val buffer = ByteArray(chunkSize)
    var i = 0
    while (i < data.size) {
      val bytesRead = min(chunkSize, data.size - i)
      System.arraycopy(data, i, buffer, 0, bytesRead)
      builder.append(collector.decodeNext(buffer, bytesRead))
      i += chunkSize
    }
    val actualString = builder.toString()
    assertThat(actualString).isEqualTo(originalString)
  }
}
