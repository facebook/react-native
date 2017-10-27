---
id: version-0.37-text
title: text
original_id: text
---
<a id="content"></a><h1><a class="anchor" name="text"></a>Text <a class="hash-link" href="docs/text.html#text">#</a></h1><div><div><p>A React component for displaying text.</p><p><code>Text</code> supports nesting, styling, and touch handling.</p><p>In the following example, the nested title and body text will inherit the <code>fontFamily</code> from
<code>styles.baseText</code>, but the title provides its own additional styles.  The title and body will
stack on top of each other on account of the literal newlines:</p><div class="web-player"><div class="prism language-javascript">import React<span class="token punctuation">,</span> <span class="token punctuation">{</span> Component <span class="token punctuation">}</span> from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span> AppRegistry<span class="token punctuation">,</span> Text<span class="token punctuation">,</span> StyleSheet <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

class <span class="token class-name">TextInANest</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>
      titleText<span class="token punctuation">:</span> <span class="token string">"Bird's Nest"</span><span class="token punctuation">,</span>
      bodyText<span class="token punctuation">:</span> <span class="token string">'This is not really a bird nest.'</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>baseText<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>titleText<span class="token punctuation">}</span> onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onPressTitle<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>titleText<span class="token punctuation">}</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">5</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>bodyText<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

const styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  baseText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontFamily<span class="token punctuation">:</span> <span class="token string">'Cochin'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  titleText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment" spellcheck="true">
// App registration and rendering
</span>AppRegistry<span class="token punctuation">.</span><span class="token function">registerComponent<span class="token punctuation">(</span></span><span class="token string">'TextInANest'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> TextInANest<span class="token punctuation">)</span><span class="token punctuation">;</span></div><iframe style="margin-top:4px;" width="880" height="420" data-src="//cdn.rawgit.com/dabbott/react-native-web-player/gh-v1.2.4/index.html#code=import%20React%2C%20%7B%20Component%20%7D%20from%20'react'%3B%0Aimport%20%7B%20AppRegistry%2C%20Text%2C%20StyleSheet%20%7D%20from%20'react-native'%3B%0A%0Aclass%20TextInANest%20extends%20Component%20%7B%0A%20%20constructor(props)%20%7B%0A%20%20%20%20super(props)%3B%0A%20%20%20%20this.state%20%3D%20%7B%0A%20%20%20%20%20%20titleText%3A%20%22Bird's%20Nest%22%2C%0A%20%20%20%20%20%20bodyText%3A%20'This%20is%20not%20really%20a%20bird%20nest.'%0A%20%20%20%20%7D%3B%0A%20%20%7D%0A%0A%20%20render()%20%7B%0A%20%20%20%20return%20(%0A%20%20%20%20%20%20%3CText%20style%3D%7Bstyles.baseText%7D%3E%0A%20%20%20%20%20%20%20%20%3CText%20style%3D%7Bstyles.titleText%7D%20onPress%3D%7Bthis.onPressTitle%7D%3E%0A%20%20%20%20%20%20%20%20%20%20%7Bthis.state.titleText%7D%7B'%5Cn'%7D%7B'%5Cn'%7D%0A%20%20%20%20%20%20%20%20%3C%2FText%3E%0A%20%20%20%20%20%20%20%20%3CText%20numberOfLines%3D%7B5%7D%3E%0A%20%20%20%20%20%20%20%20%20%20%7Bthis.state.bodyText%7D%0A%20%20%20%20%20%20%20%20%3C%2FText%3E%0A%20%20%20%20%20%20%3C%2FText%3E%0A%20%20%20%20)%3B%0A%20%20%7D%0A%7D%0A%0Aconst%20styles%20%3D%20StyleSheet.create(%7B%0A%20%20baseText%3A%20%7B%0A%20%20%20%20fontFamily%3A%20'Cochin'%2C%0A%20%20%7D%2C%0A%20%20titleText%3A%20%7B%0A%20%20%20%20fontSize%3A%2020%2C%0A%20%20%20%20fontWeight%3A%20'bold'%2C%0A%20%20%7D%2C%0A%7D)%3B%0A%0A%2F%2F%20App%20registration%20and%20rendering%0AAppRegistry.registerComponent('TextInANest'%2C%20()%20%3D%3E%20TextInANest)%3B" frameborder="0"></iframe></div></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/text.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="accessible"></a>accessible <span class="propType">bool</span> <a class="hash-link" href="docs/text.html#accessible">#</a></h4><div><p>When set to <code>true</code>, indicates that the view is an accessibility element. The default value
for a <code>Text</code> element is <code>true</code>.</p><p>See the
<a href="/react-native/docs/accessibility.html#accessible-ios-android" target="">Accessibility guide</a>
for more information.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="ellipsizemode"></a>ellipsizeMode <span class="propType">enum('head', 'middle', 'tail', 'clip')</span> <a class="hash-link" href="docs/text.html#ellipsizemode">#</a></h4><div><p>This can be one of the following values:</p><ul><li><code>head</code> - The line is displayed so that the end fits in the container and the missing text
at the beginning of the line is indicated by an ellipsis glyph. e.g., "...wxyz"</li><li><code>middle</code> - The line is displayed so that the beginning and end fit in the container and the
missing text in the middle is indicated by an ellipsis glyph. "ab...yz"</li><li><code>tail</code> - The line is displayed so that the beginning fits in the container and the
missing text at the end of the line is indicated by an ellipsis glyph. e.g., "abcd..."</li><li><code>clip</code> - Lines are not drawn past the edge of the text container.</li></ul><p>The default is <code>tail</code>.</p><p><code>numberOfLines</code> must be set in conjunction with this prop.</p><blockquote><p><code>clip</code> is working only for iOS</p></blockquote></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="numberoflines"></a>numberOfLines <span class="propType">number</span> <a class="hash-link" href="docs/text.html#numberoflines">#</a></h4><div><p>Used to truncate the text with an ellipsis after computing the text
layout, including line wrapping, such that the total number of lines
does not exceed this number.</p><p>This prop is commonly used with <code>ellipsizeMode</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onlayout"></a>onLayout <span class="propType">function</span> <a class="hash-link" href="docs/text.html#onlayout">#</a></h4><div><p>Invoked on mount and layout changes with</p><p>  <code>{nativeEvent: {layout: {x, y, width, height}}}</code></p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onlongpress"></a>onLongPress <span class="propType">function</span> <a class="hash-link" href="docs/text.html#onlongpress">#</a></h4><div><p>This function is called on long press.</p><p>e.g., `onLongPress={this.increaseSize}&gt;``</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onpress"></a>onPress <span class="propType">function</span> <a class="hash-link" href="docs/text.html#onpress">#</a></h4><div><p>This function is called on press.</p><p>e.g., `onPress={() =&gt; console.log('1st')}``</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="style"></a>style <span class="propType">style</span> <a class="hash-link" href="docs/text.html#style">#</a></h4><div class="compactProps"><div class="prop"><h6 class="propTitle"><a href="docs/view.html#style">View#style...</a></h6></div><div class="prop"><h6 class="propTitle">color <span class="propType"><a href="docs/colors.html">color</a></span> </h6></div><div class="prop"><h6 class="propTitle">fontFamily <span class="propType">string</span> </h6></div><div class="prop"><h6 class="propTitle">fontSize <span class="propType">number</span> </h6></div><div class="prop"><h6 class="propTitle">fontStyle <span class="propType">enum('normal', 'italic')</span> </h6></div><div class="prop"><h6 class="propTitle">fontWeight <span class="propType">enum('normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900')</span> <div><p>Specifies font weight. The values 'normal' and 'bold' are supported for
most fonts. Not all fonts have a variant for each of the numeric values,
in that case the closest one is chosen.</p></div></h6></div><div class="prop"><h6 class="propTitle">lineHeight <span class="propType">number</span> </h6></div><div class="prop"><h6 class="propTitle">textAlign <span class="propType">enum('auto', 'left', 'right', 'center', 'justify')</span> <div><p>Specifies text alignment. The value 'justify' is only supported on iOS and
fallbacks to <code>left</code> on Android.</p></div></h6></div><div class="prop"><h6 class="propTitle">textDecorationLine <span class="propType">enum('none', 'underline', 'line-through', 'underline line-through')</span> </h6></div><div class="prop"><h6 class="propTitle">textShadowColor <span class="propType"><a href="docs/colors.html">color</a></span> </h6></div><div class="prop"><h6 class="propTitle">textShadowOffset <span class="propType">{width: number, height: number}</span> </h6></div><div class="prop"><h6 class="propTitle">textShadowRadius <span class="propType">number</span> </h6></div><div class="prop"><h6 class="propTitle"><span class="platform">android</span>textAlignVertical <span class="propType">enum('auto', 'top', 'bottom', 'center')</span> </h6></div><div class="prop"><h6 class="propTitle"><span class="platform">ios</span>fontVariant <span class="propType"><span>[enum('small-caps', 'oldstyle-nums', 'lining-nums', 'tabular-nums', 'proportional-nums')]</span></span> </h6></div><div class="prop"><h6 class="propTitle"><span class="platform">ios</span>letterSpacing <span class="propType">number</span> </h6></div><div class="prop"><h6 class="propTitle"><span class="platform">ios</span>textDecorationColor <span class="propType"><a href="docs/colors.html">color</a></span> </h6></div><div class="prop"><h6 class="propTitle"><span class="platform">ios</span>textDecorationStyle <span class="propType">enum('solid', 'double', 'dotted', 'dashed')</span> </h6></div><div class="prop"><h6 class="propTitle"><span class="platform">ios</span>writingDirection <span class="propType">enum('auto', 'ltr', 'rtl')</span> </h6></div></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="testid"></a>testID <span class="propType">string</span> <a class="hash-link" href="docs/text.html#testid">#</a></h4><div><p>Used to locate this view in end-to-end tests.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="selectable"></a><span class="platform">android</span>selectable <span class="propType">bool</span> <a class="hash-link" href="docs/text.html#selectable">#</a></h4><div><p>Lets the user select text, to use the native copy and paste functionality.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="adjustsfontsizetofit"></a><span class="platform">ios</span>adjustsFontSizeToFit <span class="propType">bool</span> <a class="hash-link" href="docs/text.html#adjustsfontsizetofit">#</a></h4><div><p>Specifies whether font should be scaled down automatically to fit given style constraints.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="allowfontscaling"></a><span class="platform">ios</span>allowFontScaling <span class="propType">bool</span> <a class="hash-link" href="docs/text.html#allowfontscaling">#</a></h4><div><p>Specifies whether fonts should scale to respect Text Size accessibility setting on iOS. The
default is <code>true</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="minimumfontscale"></a><span class="platform">ios</span>minimumFontScale <span class="propType">number</span> <a class="hash-link" href="docs/text.html#minimumfontscale">#</a></h4><div><p>Specifies smallest possible scale a font can reach when adjustsFontSizeToFit is enabled. (values 0.01-1.0).</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="suppresshighlighting"></a><span class="platform">ios</span>suppressHighlighting <span class="propType">bool</span> <a class="hash-link" href="docs/text.html#suppresshighlighting">#</a></h4><div><p>When <code>true</code>, no visual change is made when text is pressed down. By
default, a gray oval highlights the text on press down.</p></div></div></div></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Text/Text.js">edit the content above on GitHub</a> and send us a pull request!</p><div><h1><a class="anchor" name="description"></a>Description <a class="hash-link" href="docs/text.html#description">#</a></h1><div><h2><a class="anchor" name="nested-text"></a>Nested Text <a class="hash-link" href="docs/text.html#nested-text">#</a></h2><p>Both iOS and Android allow you to display formatted text by annotating ranges of a string with specific formatting like bold or colored text (<code>NSAttributedString</code> on iOS, <code>SpannableString</code> on Android). In practice, this is very tedious. For React Native, we decided to use web paradigm for this where you can nest text to achieve the same effect.</p><div class="web-player"><div class="prism language-javascript">import React<span class="token punctuation">,</span> <span class="token punctuation">{</span> Component <span class="token punctuation">}</span> from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span> AppRegistry<span class="token punctuation">,</span> Text <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

class <span class="token class-name">BoldAndBeautiful</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        I am bold
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>color<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          and red
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

AppRegistry<span class="token punctuation">.</span><span class="token function">registerComponent<span class="token punctuation">(</span></span><span class="token string">'BoldAndBeautiful'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> BoldAndBeautiful<span class="token punctuation">)</span><span class="token punctuation">;</span></div><iframe style="margin-top:4px;" width="880" height="420" data-src="//cdn.rawgit.com/dabbott/react-native-web-player/gh-v1.2.4/index.html#code=import%20React%2C%20%7B%20Component%20%7D%20from%20'react'%3B%0Aimport%20%7B%20AppRegistry%2C%20Text%20%7D%20from%20'react-native'%3B%0A%0Aclass%20BoldAndBeautiful%20extends%20Component%20%7B%0A%20%20render()%20%7B%0A%20%20%20%20return%20(%0A%20%20%20%20%20%20%3CText%20style%3D%7B%7BfontWeight%3A%20'bold'%7D%7D%3E%0A%20%20%20%20%20%20%20%20I%20am%20bold%0A%20%20%20%20%20%20%20%20%3CText%20style%3D%7B%7Bcolor%3A%20'red'%7D%7D%3E%0A%20%20%20%20%20%20%20%20%20%20and%20red%0A%20%20%20%20%20%20%20%20%3C%2FText%3E%0A%20%20%20%20%20%20%3C%2FText%3E%0A%20%20%20%20)%3B%0A%20%20%7D%0A%7D%0A%0AAppRegistry.registerComponent('BoldAndBeautiful'%2C%20()%20%3D%3E%20BoldAndBeautiful)%3B" frameborder="0"></iframe></div><p>Behind the scenes, React Native converts this to a flat <code>NSAttributedString</code> or <code>SpannableString</code> that contains the following information:</p><div class="prism language-javascript"><span class="token string">"I am bold and red"</span>
<span class="token number">0</span><span class="token operator">-</span><span class="token number">9</span><span class="token punctuation">:</span> bold
<span class="token number">9</span><span class="token operator">-</span><span class="token number">17</span><span class="token punctuation">:</span> bold<span class="token punctuation">,</span> red</div><h2><a class="anchor" name="nested-views-ios-only"></a>Nested Views (iOS Only) <a class="hash-link" href="docs/text.html#nested-views-ios-only">#</a></h2><p>On iOS, you can nest views within your Text component. Here's an example:</p><div class="web-player"><div class="prism language-javascript">import React<span class="token punctuation">,</span> <span class="token punctuation">{</span> Component <span class="token punctuation">}</span> from <span class="token string">'react'</span><span class="token punctuation">;</span>
import <span class="token punctuation">{</span> AppRegistry<span class="token punctuation">,</span> Text<span class="token punctuation">,</span> View <span class="token punctuation">}</span> from <span class="token string">'react-native'</span><span class="token punctuation">;</span>

class <span class="token class-name">BlueIsCool</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;Text<span class="token operator">&gt;</span>
        There is a blue square
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>width<span class="token punctuation">:</span> <span class="token number">50</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token number">50</span><span class="token punctuation">,</span> backgroundColor<span class="token punctuation">:</span> <span class="token string">'steelblue'</span><span class="token punctuation">}</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        <span class="token keyword">in</span> between my text<span class="token punctuation">.</span>
      &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

AppRegistry<span class="token punctuation">.</span><span class="token function">registerComponent<span class="token punctuation">(</span></span><span class="token string">'BlueIsCool'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> BlueIsCool<span class="token punctuation">)</span><span class="token punctuation">;</span></div><iframe style="margin-top:4px;" width="880" height="420" data-src="//cdn.rawgit.com/dabbott/react-native-web-player/gh-v1.2.4/index.html#code=import%20React%2C%20%7B%20Component%20%7D%20from%20'react'%3B%0Aimport%20%7B%20AppRegistry%2C%20Text%2C%20View%20%7D%20from%20'react-native'%3B%0A%0Aclass%20BlueIsCool%20extends%20Component%20%7B%0A%20%20render()%20%7B%0A%20%20%20%20return%20(%0A%20%20%20%20%20%20%3CText%3E%0A%20%20%20%20%20%20%20%20There%20is%20a%20blue%20square%0A%20%20%20%20%20%20%20%20%3CView%20style%3D%7B%7Bwidth%3A%2050%2C%20height%3A%2050%2C%20backgroundColor%3A%20'steelblue'%7D%7D%20%2F%3E%0A%20%20%20%20%20%20%20%20in%20between%20my%20text.%0A%20%20%20%20%20%20%3C%2FText%3E%0A%20%20%20%20)%3B%0A%20%20%7D%0A%7D%0A%0AAppRegistry.registerComponent('BlueIsCool'%2C%20()%20%3D%3E%20BlueIsCool)%3B" frameborder="0"></iframe></div><blockquote><p>In order to use this feature, you must give the view a <code>width</code> and a <code>height</code>.</p></blockquote><h2><a class="anchor" name="containers"></a>Containers <a class="hash-link" href="docs/text.html#containers">#</a></h2><p>The <code>&lt;Text&gt;</code> element is special relative to layout: everything inside is no longer using the flexbox layout but using text layout. This means that elements inside of a <code>&lt;Text&gt;</code> are no longer rectangles, but wrap when they see the end of the line.</p><div class="prism language-javascript">&lt;Text<span class="token operator">&gt;</span>
  &lt;Text<span class="token operator">&gt;</span>First part and &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
  &lt;Text<span class="token operator">&gt;</span>second part&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span><span class="token comment" spellcheck="true">
// Text container: all the text flows as if it was one
</span><span class="token comment" spellcheck="true">// |First part |
</span><span class="token comment" spellcheck="true">// |and second |
</span><span class="token comment" spellcheck="true">// |part       |
</span>
&lt;View<span class="token operator">&gt;</span>
  &lt;Text<span class="token operator">&gt;</span>First part and &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
  &lt;Text<span class="token operator">&gt;</span>second part&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
&lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span><span class="token comment" spellcheck="true">
// View container: each text is its own block
</span><span class="token comment" spellcheck="true">// |First part |
</span><span class="token comment" spellcheck="true">// |and        |
</span><span class="token comment" spellcheck="true">// |second part|</span></div><h2><a class="anchor" name="limited-style-inheritance"></a>Limited Style Inheritance <a class="hash-link" href="docs/text.html#limited-style-inheritance">#</a></h2><p>On the web, the usual way to set a font family and size for the entire document is to write:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">/* CSS, *not* React Native */</span>
html <span class="token punctuation">{</span>
  font<span class="token operator">-</span>family<span class="token punctuation">:</span> <span class="token string">'lucida grande'</span><span class="token punctuation">,</span> tahoma<span class="token punctuation">,</span> verdana<span class="token punctuation">,</span> arial<span class="token punctuation">,</span> sans<span class="token operator">-</span>serif<span class="token punctuation">;</span>
  font<span class="token operator">-</span>size<span class="token punctuation">:</span> 11px<span class="token punctuation">;</span>
  color<span class="token punctuation">:</span> #<span class="token number">141823</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span></div><p>When the browser is trying to render a text node, it's going to go all the way up to the root element of the tree and find an element with a <code>font-size</code> attribute. An unexpected property of this system is that <strong>any</strong> node can have <code>font-size</code> attribute, including a <code>&lt;div&gt;</code>. This was designed for convenience, even though not really semantically correct.</p><p>In React Native, we are more strict about it: <strong>you must wrap all the text nodes inside of a <code>&lt;Text&gt;</code> component</strong>; you cannot have a text node directly under a <code>&lt;View&gt;</code>.</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// BAD: will raise exception, can't have a text node as child of a &lt;View&gt;
</span>&lt;View<span class="token operator">&gt;</span>
  Some text
&lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
<span class="token comment" spellcheck="true">
// GOOD
</span>&lt;View<span class="token operator">&gt;</span>
  &lt;Text<span class="token operator">&gt;</span>
    Some text
  &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
&lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span></div><p>You also lose the ability to set up a default font for an entire subtree. The recommended way to use consistent fonts and sizes across your application is to create a component <code>MyAppText</code> that includes them and use this component across your app. You can also use this component to make more specific components like <code>MyAppHeaderText</code> for other kinds of text.</p><div class="prism language-javascript">&lt;View<span class="token operator">&gt;</span>
  &lt;MyAppText<span class="token operator">&gt;</span>Text styled <span class="token keyword">with</span> the default font <span class="token keyword">for</span> the entire application&lt;<span class="token operator">/</span>MyAppText<span class="token operator">&gt;</span>
  &lt;MyAppHeaderText<span class="token operator">&gt;</span>Text styled as a header&lt;<span class="token operator">/</span>MyAppHeaderText<span class="token operator">&gt;</span>
&lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span></div><p>Assuming that <code>MyAppText</code> is a component that simply renders out its children into a <code>Text</code> component with styling, then <code>MyAppHeaderText</code> can be defined as follows:</p><div class="prism language-javascript">class <span class="token class-name">MyAppHeaderText</span> extends <span class="token class-name">Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    &lt;MyAppText<span class="token operator">&gt;</span>
      &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>children<span class="token punctuation">}</span>
      &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
    &lt;<span class="token operator">/</span>MyAppText<span class="token operator">&gt;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span></div><p>Composing <code>MyAppText</code> in this way ensures that we get the styles from a top-level component, but leaves us the ability to add / override them in specific use cases.</p><p>React Native still has the concept of style inheritance, but limited to text subtrees. In this case, the second part will be both bold and red.</p><div class="prism language-javascript">&lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
  I am bold
  &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>color<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
    and red
  &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span></div><p>We believe that this more constrained way to style text will yield better apps:</p><ul><li><p>(Developer) React components are designed with strong isolation in mind: You should be able to drop a component anywhere in your application, trusting that as long as the props are the same, it will look and behave the same way. Text properties that could inherit from outside of the props would break this isolation.</p></li><li><p>(Implementor) The implementation of React Native is also simplified. We do not need to have a <code>fontFamily</code> field on every single element, and we do not need to potentially traverse the tree up to the root every time we display a text node. The style inheritance is only encoded inside of the native Text component and doesn't leak to other components or the system itself.</p></li></ul></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/Text.md">edit the content above on GitHub</a> and send us a pull request!</p></div><div><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/text.html#examples">#</a></h3><div><table width="100%"><tbody><tr><td><h4><a class="anchor" name="ios"></a>IOS <a class="hash-link" href="docs/text.html#ios">#</a></h4></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/TextExample.ios.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Image<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  LayoutAnimation<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

class <span class="token class-name">Entity</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'500'</span><span class="token punctuation">,</span> color<span class="token punctuation">:</span> <span class="token string">'#527fe4'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>children<span class="token punctuation">}</span>
      &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">AttributeToggler</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">,</span> fontSize<span class="token punctuation">:</span> <span class="token number">15</span><span class="token punctuation">}</span><span class="token punctuation">;</span>

  toggleWeight <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      fontWeight<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>fontWeight <span class="token operator">===</span> <span class="token string">'bold'</span> <span class="token operator">?</span> <span class="token string">'normal'</span> <span class="token punctuation">:</span> <span class="token string">'bold'</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  increaseSize <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      fontSize<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>fontSize <span class="token operator">+</span> <span class="token number">1</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> curStyle <span class="token operator">=</span> <span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>fontWeight<span class="token punctuation">,</span> fontSize<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>fontSize<span class="token punctuation">}</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>curStyle<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Tap the controls below to change attributes<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>See how it will even work on &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>curStyle<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token keyword">this</span> nested text&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#ffaaaa'</span><span class="token punctuation">,</span> marginTop<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>toggleWeight<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Toggle Weight
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#aaaaff'</span><span class="token punctuation">,</span> marginTop<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>increaseSize<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Increase Size
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">var</span> AdjustingFontSize <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>dynamicText<span class="token punctuation">:</span><span class="token string">''</span><span class="token punctuation">,</span> shouldRender<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  reset<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    LayoutAnimation<span class="token punctuation">.</span><span class="token function">easeInEaseOut<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      shouldRender<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">setTimeout<span class="token punctuation">(</span></span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token operator">=</span><span class="token operator">&gt;</span><span class="token punctuation">{</span>
      LayoutAnimation<span class="token punctuation">.</span><span class="token function">easeInEaseOut<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
        dynamicText<span class="token punctuation">:</span> <span class="token string">''</span><span class="token punctuation">,</span>
        shouldRender<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">300</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  addText<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      dynamicText<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dynamicText <span class="token operator">+</span> <span class="token punctuation">(</span>Math<span class="token punctuation">.</span><span class="token function">floor<span class="token punctuation">(</span></span><span class="token punctuation">(</span>Math<span class="token punctuation">.</span><span class="token function">random<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token operator">*</span> <span class="token number">10</span><span class="token punctuation">)</span> <span class="token operator">%</span> <span class="token number">2</span><span class="token punctuation">)</span> <span class="token operator">?</span> <span class="token string">' foo'</span> <span class="token punctuation">:</span> <span class="token string">' bar'</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  removeText<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      dynamicText<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dynamicText<span class="token punctuation">.</span><span class="token function">slice<span class="token punctuation">(</span></span><span class="token number">0</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dynamicText<span class="token punctuation">.</span>length <span class="token operator">-</span> <span class="token number">4</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>

    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">!</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>shouldRender<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>&lt;View<span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text lineBreakMode<span class="token operator">=</span><span class="token string">"tail"</span> numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">36</span><span class="token punctuation">,</span> marginVertical<span class="token punctuation">:</span><span class="token number">6</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Truncated text is baaaaad<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span> adjustsFontSizeToFit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">40</span><span class="token punctuation">,</span> marginVertical<span class="token punctuation">:</span><span class="token number">6</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Shrinking to fit available space is much better<span class="token operator">!</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>

        &lt;Text adjustsFontSizeToFit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span> numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span><span class="token number">30</span><span class="token punctuation">,</span> marginVertical<span class="token punctuation">:</span><span class="token number">6</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        <span class="token punctuation">{</span><span class="token string">'Add text to me to watch me shrink!'</span> <span class="token operator">+</span> <span class="token string">' '</span> <span class="token operator">+</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dynamicText<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>

        &lt;Text adjustsFontSizeToFit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span> numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">4</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span><span class="token number">20</span><span class="token punctuation">,</span> marginVertical<span class="token punctuation">:</span><span class="token number">6</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        <span class="token punctuation">{</span><span class="token string">'Multiline text component shrinking is supported, watch as this reeeeaaaally loooooong teeeeeeext grooooows and then shriiiinks as you add text to me! ioahsdia soady auydoa aoisyd aosdy '</span> <span class="token operator">+</span> <span class="token string">' '</span> <span class="token operator">+</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dynamicText<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>

        &lt;Text adjustsFontSizeToFit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span> numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginVertical<span class="token punctuation">:</span><span class="token number">6</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span><span class="token number">14</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            <span class="token punctuation">{</span><span class="token string">'Differently sized nested elements will shrink together. '</span><span class="token punctuation">}</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span><span class="token number">20</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            <span class="token punctuation">{</span><span class="token string">'LARGE TEXT! '</span> <span class="token operator">+</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>dynamicText<span class="token punctuation">}</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>

        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flexDirection<span class="token punctuation">:</span><span class="token string">'row'</span><span class="token punctuation">,</span> justifyContent<span class="token punctuation">:</span><span class="token string">'space-around'</span><span class="token punctuation">,</span> marginTop<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span> marginVertical<span class="token punctuation">:</span><span class="token number">6</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#ffaaaa'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>reset<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Reset
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#aaaaff'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>removeText<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Remove Text
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#aaffaa'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
            onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>addText<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Add Text
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;Text&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Base component for rendering styled text.'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token string">'TextExample'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
<span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Wrap'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;Text<span class="token operator">&gt;</span>
        The text should wrap <span class="token keyword">if</span> it goes on multiple lines<span class="token punctuation">.</span> See<span class="token punctuation">,</span> <span class="token keyword">this</span> is going to
        the next line<span class="token punctuation">.</span>
      &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Padding'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>padding<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        This text is indented by 10px padding on all sides<span class="token punctuation">.</span>
      &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Font Family'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'Cochin'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Cochin
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'Cochin'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Cochin bold
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'Helvetica'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Helvetica
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'Helvetica'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Helvetica bold
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'Verdana'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Verdana
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'Verdana'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Verdana bold
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Font Size'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">23</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Size <span class="token number">23</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">8</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Size <span class="token number">8</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Color'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>color<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Red color
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>color<span class="token punctuation">:</span> <span class="token string">'blue'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Blue color
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Font Weight'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'100'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Move fast and be ultralight
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'200'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Move fast and be light
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'normal'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Move fast and be normal
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Move fast and be bold
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'900'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Move fast and be ultrabold
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span>  <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Font Style'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontStyle<span class="token punctuation">:</span> <span class="token string">'normal'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Normal text
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Italic text
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Text Decoration'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'underline'</span><span class="token punctuation">,</span> textDecorationStyle<span class="token punctuation">:</span> <span class="token string">'solid'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Solid underline
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'underline'</span><span class="token punctuation">,</span> textDecorationStyle<span class="token punctuation">:</span> <span class="token string">'double'</span><span class="token punctuation">,</span> textDecorationColor<span class="token punctuation">:</span> <span class="token string">'#ff0000'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Double underline <span class="token keyword">with</span> custom color
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'underline'</span><span class="token punctuation">,</span> textDecorationStyle<span class="token punctuation">:</span> <span class="token string">'dashed'</span><span class="token punctuation">,</span> textDecorationColor<span class="token punctuation">:</span> <span class="token string">'#9CDC40'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Dashed underline <span class="token keyword">with</span> custom color
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'underline'</span><span class="token punctuation">,</span> textDecorationStyle<span class="token punctuation">:</span> <span class="token string">'dotted'</span><span class="token punctuation">,</span> textDecorationColor<span class="token punctuation">:</span> <span class="token string">'blue'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Dotted underline <span class="token keyword">with</span> custom color
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'none'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          None textDecoration
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'line-through'</span><span class="token punctuation">,</span> textDecorationStyle<span class="token punctuation">:</span> <span class="token string">'solid'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Solid line<span class="token operator">-</span>through
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'line-through'</span><span class="token punctuation">,</span> textDecorationStyle<span class="token punctuation">:</span> <span class="token string">'double'</span><span class="token punctuation">,</span> textDecorationColor<span class="token punctuation">:</span> <span class="token string">'#ff0000'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Double line<span class="token operator">-</span>through <span class="token keyword">with</span> custom color
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'line-through'</span><span class="token punctuation">,</span> textDecorationStyle<span class="token punctuation">:</span> <span class="token string">'dashed'</span><span class="token punctuation">,</span> textDecorationColor<span class="token punctuation">:</span> <span class="token string">'#9CDC40'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Dashed line<span class="token operator">-</span>through <span class="token keyword">with</span> custom color
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'line-through'</span><span class="token punctuation">,</span> textDecorationStyle<span class="token punctuation">:</span> <span class="token string">'dotted'</span><span class="token punctuation">,</span> textDecorationColor<span class="token punctuation">:</span> <span class="token string">'blue'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Dotted line<span class="token operator">-</span>through <span class="token keyword">with</span> custom color
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'underline line-through'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Both underline and line<span class="token operator">-</span>through
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Nested'</span><span class="token punctuation">,</span>
  description<span class="token punctuation">:</span> <span class="token string">'Nested text components will inherit the styles of their '</span> <span class="token operator">+</span>
    <span class="token string">'parents (only backgroundColor is inherited from non-Text parents).  '</span> <span class="token operator">+</span>
    <span class="token string">'&lt;Text&gt; only supports other &lt;Text&gt; and raw text (strings) as children.'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          <span class="token punctuation">(</span>Normal text<span class="token punctuation">,</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            <span class="token punctuation">(</span>and bold
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">11</span><span class="token punctuation">,</span> color<span class="token punctuation">:</span> <span class="token string">'#527fe4'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              <span class="token punctuation">(</span>and tiny inherited bold blue<span class="token punctuation">)</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            <span class="token punctuation">)</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          <span class="token punctuation">)</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>opacity<span class="token punctuation">:</span><span class="token number">0.7</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">(</span>opacity
            &lt;Text<span class="token operator">&gt;</span>
              <span class="token punctuation">(</span>is inherited
                &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>opacity<span class="token punctuation">:</span><span class="token number">0.7</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                  <span class="token punctuation">(</span>and accumulated
                    &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span><span class="token string">'#ffaaaa'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                      <span class="token punctuation">(</span>and also applies to the background<span class="token punctuation">)</span>
                    &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
                  <span class="token punctuation">)</span>
                &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              <span class="token punctuation">)</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          <span class="token punctuation">)</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">12</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Entity<span class="token operator">&gt;</span>Entity Name&lt;<span class="token operator">/</span>Entity<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Text Align'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          auto <span class="token punctuation">(</span>default<span class="token punctuation">)</span> <span class="token operator">-</span> english LTR
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          أحب اللغة العربية auto <span class="token punctuation">(</span>default<span class="token punctuation">)</span> <span class="token operator">-</span> arabic RTL
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textAlign<span class="token punctuation">:</span> <span class="token string">'left'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          left left left left left left left left left left left left left left left
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textAlign<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          center center center center center center center center center center center
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textAlign<span class="token punctuation">:</span> <span class="token string">'right'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          right right right right right right right right right right right right right
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textAlign<span class="token punctuation">:</span> <span class="token string">'justify'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          justify<span class="token punctuation">:</span> <span class="token keyword">this</span> text component<span class="token punctuation">{</span><span class="token string">"'"</span><span class="token punctuation">}</span>s contents are laid out <span class="token keyword">with</span> <span class="token string">"textAlign: justify"</span>
          and as you can see all of the lines except the last one span the
          available width of the parent container<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Letter Spacing'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>letterSpacing<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          letterSpacing <span class="token operator">=</span> <span class="token number">0</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>letterSpacing<span class="token punctuation">:</span> <span class="token number">2</span><span class="token punctuation">,</span> marginTop<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          letterSpacing <span class="token operator">=</span> <span class="token number">2</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>letterSpacing<span class="token punctuation">:</span> <span class="token number">9</span><span class="token punctuation">,</span> marginTop<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          letterSpacing <span class="token operator">=</span> <span class="token number">9</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>letterSpacing<span class="token punctuation">:</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">,</span> marginTop<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          letterSpacing <span class="token operator">=</span> <span class="token operator">-</span><span class="token number">1</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Spaces'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;Text<span class="token operator">&gt;</span>
        A <span class="token punctuation">{</span><span class="token string">'generated'</span><span class="token punctuation">}</span> <span class="token punctuation">{</span><span class="token string">' '</span><span class="token punctuation">}</span> <span class="token punctuation">{</span><span class="token string">'string'</span><span class="token punctuation">}</span> and    some &amp;nbsp<span class="token punctuation">;</span>&amp;nbsp<span class="token punctuation">;</span>&amp;nbsp<span class="token punctuation">;</span> spaces
      &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Line Height'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>lineHeight<span class="token punctuation">:</span> <span class="token number">35</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          A lot of space between the lines of <span class="token keyword">this</span> long passage that should
          wrap once<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Empty Text'</span><span class="token punctuation">,</span>
  description<span class="token punctuation">:</span> <span class="token string">'It\'s ok to have Text with zero or null children.'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;Text <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Toggling Attributes'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;AttributeToggler <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'backgroundColor attribute'</span><span class="token punctuation">,</span>
  description<span class="token punctuation">:</span> <span class="token string">'backgroundColor is inherited from all types of views.'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'yellow'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        Yellow container background<span class="token punctuation">,</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#ffaaaa'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token string">' '</span><span class="token punctuation">}</span>red background<span class="token punctuation">,</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#aaaaff'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            <span class="token punctuation">{</span><span class="token string">' '</span><span class="token punctuation">}</span>blue background<span class="token punctuation">,</span>
            &lt;Text<span class="token operator">&gt;</span>
              <span class="token punctuation">{</span><span class="token string">' '</span><span class="token punctuation">}</span>inherited blue background<span class="token punctuation">,</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#aaffaa'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                <span class="token punctuation">{</span><span class="token string">' '</span><span class="token punctuation">}</span>nested green background<span class="token punctuation">.</span>
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'numberOfLines attribute'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Maximum of one line<span class="token punctuation">,</span> no matter how much I write here<span class="token punctuation">.</span> If I keep writing<span class="token punctuation">,</span> it<span class="token punctuation">{</span><span class="token string">"'"</span><span class="token punctuation">}</span>ll just truncate after one line<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">2</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginTop<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Maximum of two lines<span class="token punctuation">,</span> no matter how much I write here<span class="token punctuation">.</span> If I keep writing<span class="token punctuation">,</span> it<span class="token punctuation">{</span><span class="token string">"'"</span><span class="token punctuation">}</span>ll just truncate after two lines<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginTop<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          No maximum lines specified<span class="token punctuation">,</span> no matter how much I write here<span class="token punctuation">.</span> If I keep writing<span class="token punctuation">,</span> it<span class="token punctuation">{</span><span class="token string">"'"</span><span class="token punctuation">}</span>ll just keep going and going<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Text highlighting (tap the link to see highlight)'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>Lorem ipsum dolor sit amet<span class="token punctuation">,</span> &lt;Text suppressHighlighting<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'white'</span><span class="token punctuation">,</span> textDecorationLine<span class="token punctuation">:</span> <span class="token string">'underline'</span><span class="token punctuation">,</span> color<span class="token punctuation">:</span> <span class="token string">'blue'</span><span class="token punctuation">}</span><span class="token punctuation">}</span> onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">null</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>consectetur adipiscing elit<span class="token punctuation">,</span> sed <span class="token keyword">do</span> eiusmod tempor incididunt ut labore et dolore magna aliqua<span class="token punctuation">.</span> Ut enim ad minim veniam<span class="token punctuation">,</span> quis nostrud&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span> exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat<span class="token punctuation">.</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'allowFontScaling attribute'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          By default<span class="token punctuation">,</span> text will respect Text Size accessibility setting on iOS<span class="token punctuation">.</span>
          It means that all font sizes will be increased or descreased depending on the value of Text Size setting <span class="token keyword">in</span>
          <span class="token punctuation">{</span><span class="token string">" "</span><span class="token punctuation">}</span>&lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>Settings<span class="token punctuation">.</span>app <span class="token operator">-</span> Display &amp; Brightness <span class="token operator">-</span> Text Size&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginTop<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          You can disable scaling <span class="token keyword">for</span> your Text component by passing <span class="token punctuation">{</span><span class="token string">"\""</span><span class="token punctuation">}</span>allowFontScaling<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">"{"</span><span class="token punctuation">}</span><span class="token boolean">false</span><span class="token punctuation">{</span><span class="token string">"}\""</span><span class="token punctuation">}</span> prop<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text allowFontScaling<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginTop<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          This text will not scale<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Inline views'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          This text contains an inline blue view &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>width<span class="token punctuation">:</span> <span class="token number">25</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token number">25</span><span class="token punctuation">,</span> backgroundColor<span class="token punctuation">:</span> <span class="token string">'steelblue'</span><span class="token punctuation">}</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span> and
          an inline image &lt;Image source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./flux.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>width<span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token number">11</span><span class="token punctuation">,</span> resizeMode<span class="token punctuation">:</span> <span class="token string">'cover'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">.</span> Neat<span class="token punctuation">,</span> huh<span class="token operator">?</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Text shadow'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span> textShadowOffset<span class="token punctuation">:</span> <span class="token punctuation">{</span>width<span class="token punctuation">:</span> <span class="token number">2</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token number">2</span><span class="token punctuation">}</span><span class="token punctuation">,</span> textShadowRadius<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span> textShadowColor<span class="token punctuation">:</span> <span class="token string">'#00cccc'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Demo text shadow
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Ellipsize mode'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          This very long text should be truncated <span class="token keyword">with</span> dots <span class="token keyword">in</span> the end<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text ellipsizeMode<span class="token operator">=</span><span class="token string">"middle"</span> numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          This very long text should be truncated <span class="token keyword">with</span> dots <span class="token keyword">in</span> the middle<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text ellipsizeMode<span class="token operator">=</span><span class="token string">"head"</span> numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          This very long text should be truncated <span class="token keyword">with</span> dots <span class="token keyword">in</span> the beginning<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text ellipsizeMode<span class="token operator">=</span><span class="token string">"clip"</span> numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          This very looooooooooooooooooooooooooooong text should be clipped<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Font variants'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontVariant<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token string">'small-caps'</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Small Caps<span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'Hoefler Text'</span><span class="token punctuation">,</span> fontVariant<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token string">'oldstyle-nums'</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Old Style nums <span class="token number">0123456789</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'Hoefler Text'</span><span class="token punctuation">,</span> fontVariant<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token string">'lining-nums'</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Lining nums <span class="token number">0123456789</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontVariant<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token string">'tabular-nums'</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Tabular nums<span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
          <span class="token number">1111</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
          <span class="token number">2222</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontVariant<span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token string">'proportional-nums'</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Proportional nums<span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
          <span class="token number">1111</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
          <span class="token number">2222</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'Dynamic Font Size Adjustment'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;AdjustingFontSize <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22Text%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div><div><table width="100%"><tbody><tr><td><h4><a class="anchor" name="android"></a>ANDROID <a class="hash-link" href="docs/text.html#android">#</a></h4></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/TextExample.android.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Image<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>
<span class="token keyword">var</span> UIExplorerBlock <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./UIExplorerBlock'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> UIExplorerPage <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./UIExplorerPage'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

class <span class="token class-name">Entity</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">,</span> color<span class="token punctuation">:</span> <span class="token string">'#527fe4'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>children<span class="token punctuation">}</span>
      &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">AttributeToggler</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">,</span> fontSize<span class="token punctuation">:</span> <span class="token number">15</span><span class="token punctuation">}</span><span class="token punctuation">;</span>

  toggleWeight <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      fontWeight<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>fontWeight <span class="token operator">===</span> <span class="token string">'bold'</span> <span class="token operator">?</span> <span class="token string">'normal'</span> <span class="token punctuation">:</span> <span class="token string">'bold'</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  increaseSize <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
      fontSize<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>fontSize <span class="token operator">+</span> <span class="token number">1</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> curStyle <span class="token operator">=</span> <span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>fontWeight<span class="token punctuation">,</span> fontSize<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>fontSize<span class="token punctuation">}</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>curStyle<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Tap the controls below to change attributes<span class="token punctuation">.</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>See how it will even work on &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>curStyle<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token keyword">this</span> nested text&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text<span class="token operator">&gt;</span>
          &lt;Text onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>toggleWeight<span class="token punctuation">}</span><span class="token operator">&gt;</span>Toggle Weight&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token string">' (with highlight onPress)'</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>increaseSize<span class="token punctuation">}</span> suppressHighlighting<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          Increase Size <span class="token punctuation">(</span>suppressHighlighting <span class="token boolean">true</span><span class="token punctuation">)</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">TextExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  static title <span class="token operator">=</span> <span class="token string">'&lt;Text&gt;'</span><span class="token punctuation">;</span>
  static description <span class="token operator">=</span> <span class="token string">'Base component for rendering styled text.'</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;UIExplorerPage title<span class="token operator">=</span><span class="token string">"&lt;Text&gt;"</span><span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Wrap"</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>
            The text should wrap <span class="token keyword">if</span> it goes on multiple lines<span class="token punctuation">.</span>
            See<span class="token punctuation">,</span> <span class="token keyword">this</span> is going to the next line<span class="token punctuation">.</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Padding"</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>padding<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            This text is indented by 10px padding on all sides<span class="token punctuation">.</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Font Family"</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Sans<span class="token operator">-</span>Serif
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Sans<span class="token operator">-</span>Serif Bold
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'serif'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Serif
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'serif'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Serif Bold
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'monospace'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Monospace
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'monospace'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Monospace Bold <span class="token punctuation">(</span>After <span class="token number">5.0</span><span class="token punctuation">)</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Android Material Design fonts"</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span> alignItems<span class="token punctuation">:</span> <span class="token string">'flex-start'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Regular
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif'</span><span class="token punctuation">,</span> fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Italic
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Bold
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif'</span><span class="token punctuation">,</span> fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Bold Italic
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif-light'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Light
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif-light'</span><span class="token punctuation">,</span> fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Light Italic
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif-thin'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Thin <span class="token punctuation">(</span>After <span class="token number">4.2</span><span class="token punctuation">)</span>
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif-thin'</span><span class="token punctuation">,</span> fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Thin Italic <span class="token punctuation">(</span>After <span class="token number">4.2</span><span class="token punctuation">)</span>
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif-condensed'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Condensed
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif-condensed'</span><span class="token punctuation">,</span> fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Condensed Italic
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif-condensed'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Condensed Bold
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>
                  fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif-condensed'</span><span class="token punctuation">,</span>
                  fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">,</span>
                  fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Condensed Bold Italic
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif-medium'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Medium <span class="token punctuation">(</span>After <span class="token number">5.0</span><span class="token punctuation">)</span>
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif-medium'</span><span class="token punctuation">,</span> fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Roboto Medium Italic <span class="token punctuation">(</span>After <span class="token number">5.0</span><span class="token punctuation">)</span>
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Custom Fonts"</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span> alignItems<span class="token punctuation">:</span> <span class="token string">'flex-start'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'notoserif'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                NotoSerif Regular
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'notoserif'</span><span class="token punctuation">,</span> fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                NotoSerif Bold Italic
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'notoserif'</span><span class="token punctuation">,</span> fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                NotoSerif Italic <span class="token punctuation">(</span>Missing Font file<span class="token punctuation">)</span>
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>

        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Font Size"</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">23</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Size <span class="token number">23</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">8</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Size <span class="token number">8</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Color"</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>color<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Red color
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>color<span class="token punctuation">:</span> <span class="token string">'blue'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Blue color
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Font Weight"</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Move fast and be bold
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'normal'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Move fast and be bold
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Font Style"</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Move fast and be bold
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontStyle<span class="token punctuation">:</span> <span class="token string">'normal'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Move fast and be bold
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Font Style and Weight"</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Move fast and be bold
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Text Decoration"</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'underline'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Solid underline
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'none'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            None textDecoration
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'line-through'</span><span class="token punctuation">,</span> textDecorationStyle<span class="token punctuation">:</span> <span class="token string">'solid'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Solid line<span class="token operator">-</span>through
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'underline line-through'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Both underline and line<span class="token operator">-</span>through
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>
            Mixed text <span class="token keyword">with</span> &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'underline'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>underline&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span> and &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textDecorationLine<span class="token punctuation">:</span> <span class="token string">'line-through'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>line<span class="token operator">-</span>through&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span> text nodes
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Nested"</span><span class="token operator">&gt;</span>
          &lt;Text onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'1st'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            <span class="token punctuation">(</span>Normal text<span class="token punctuation">,</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span> onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'2nd'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              <span class="token punctuation">(</span>and bold
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">,</span> fontSize<span class="token punctuation">:</span> <span class="token number">11</span><span class="token punctuation">,</span> color<span class="token punctuation">:</span> <span class="token string">'#527fe4'</span><span class="token punctuation">}</span><span class="token punctuation">}</span> onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'3rd'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                <span class="token punctuation">(</span>and tiny bold italic blue
                &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'normal'</span><span class="token punctuation">,</span> fontStyle<span class="token punctuation">:</span> <span class="token string">'normal'</span><span class="token punctuation">}</span><span class="token punctuation">}</span> onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'4th'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                  <span class="token punctuation">(</span>and tiny normal blue<span class="token punctuation">)</span>
                &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
                <span class="token punctuation">)</span>
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              <span class="token punctuation">)</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            <span class="token punctuation">)</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'serif'</span><span class="token punctuation">}</span><span class="token punctuation">}</span> onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'1st'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            <span class="token punctuation">(</span>Serif
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span> onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'2nd'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              <span class="token punctuation">(</span>Serif Bold Italic
              &lt;Text
                style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'monospace'</span><span class="token punctuation">,</span> fontStyle<span class="token punctuation">:</span> <span class="token string">'normal'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'normal'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
                onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'3rd'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                <span class="token punctuation">(</span>Monospace Normal
                &lt;Text
                  style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
                  onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'4th'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                  <span class="token punctuation">(</span>Sans<span class="token operator">-</span>Serif Bold
                  &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontWeight<span class="token punctuation">:</span> <span class="token string">'normal'</span><span class="token punctuation">}</span><span class="token punctuation">}</span> onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'5th'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                    <span class="token punctuation">(</span>and Sans<span class="token operator">-</span>Serif Normal<span class="token punctuation">)</span>
                  &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
                  <span class="token punctuation">)</span>
                &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
                <span class="token punctuation">)</span>
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              <span class="token punctuation">)</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            <span class="token punctuation">)</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">12</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Entity<span class="token operator">&gt;</span>Entity Name&lt;<span class="token operator">/</span>Entity<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Text Align"</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>
            auto <span class="token punctuation">(</span>default<span class="token punctuation">)</span> <span class="token operator">-</span> english LTR
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>
            أحب اللغة العربية auto <span class="token punctuation">(</span>default<span class="token punctuation">)</span> <span class="token operator">-</span> arabic RTL
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textAlign<span class="token punctuation">:</span> <span class="token string">'left'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            left left left left left left left left left left left left left left left
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textAlign<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            center center center center center center center center center center center
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>textAlign<span class="token punctuation">:</span> <span class="token string">'right'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            right right right right right right right right right right right right right
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Unicode"</span><span class="token operator">&gt;</span>
          &lt;View<span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                星际争霸是世界上最好的游戏。
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
            &lt;View<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                星际争霸是世界上最好的游戏。
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                星际争霸是世界上最好的游戏。
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
            &lt;View<span class="token operator">&gt;</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Spaces"</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>
            A <span class="token punctuation">{</span><span class="token string">'generated'</span><span class="token punctuation">}</span> <span class="token punctuation">{</span><span class="token string">' '</span><span class="token punctuation">}</span> <span class="token punctuation">{</span><span class="token string">'string'</span><span class="token punctuation">}</span> and    some &amp;nbsp<span class="token punctuation">;</span>&amp;nbsp<span class="token punctuation">;</span>&amp;nbsp<span class="token punctuation">;</span> spaces
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Line Height"</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>lineHeight<span class="token punctuation">:</span> <span class="token number">35</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Holisticly formulate inexpensive ideas before best<span class="token operator">-</span>of<span class="token operator">-</span>breed benefits<span class="token punctuation">.</span> &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>Continually&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span> expedite magnetic potentialities rather than client<span class="token operator">-</span>focused interfaces<span class="token punctuation">.</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Empty Text"</span><span class="token operator">&gt;</span>
          &lt;Text <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Toggling Attributes"</span><span class="token operator">&gt;</span>
          &lt;AttributeToggler <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"backgroundColor attribute"</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#ffaaaa'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Red background<span class="token punctuation">,</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#aaaaff'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              <span class="token punctuation">{</span><span class="token string">' '</span><span class="token punctuation">}</span>blue background<span class="token punctuation">,</span>
              &lt;Text<span class="token operator">&gt;</span>
                <span class="token punctuation">{</span><span class="token string">' '</span><span class="token punctuation">}</span>inherited blue background<span class="token punctuation">,</span>
                &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#aaffaa'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                  <span class="token punctuation">{</span><span class="token string">' '</span><span class="token punctuation">}</span>nested green background<span class="token punctuation">.</span>
                &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'rgba(100, 100, 100, 0.3)'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Same alpha as background<span class="token punctuation">,</span>
            &lt;Text<span class="token operator">&gt;</span>
              Inherited alpha from background<span class="token punctuation">,</span>
              &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'rgba(100, 100, 100, 0.3)'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
                Reapply alpha
              &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"containerBackgroundColor attribute"</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token number">85</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#ffaaaa'</span><span class="token punctuation">,</span> width<span class="token punctuation">:</span> <span class="token number">150</span><span class="token punctuation">}</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'#aaaaff'</span><span class="token punctuation">,</span> width<span class="token punctuation">:</span> <span class="token number">150</span><span class="token punctuation">}</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>backgroundColorText<span class="token punctuation">,</span> <span class="token punctuation">{</span>top<span class="token punctuation">:</span> <span class="token operator">-</span><span class="token number">80</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Default containerBackgroundColor <span class="token punctuation">(</span>inherited<span class="token punctuation">)</span> <span class="token operator">+</span> backgroundColor wash
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>backgroundColorText<span class="token punctuation">,</span> <span class="token punctuation">{</span>top<span class="token punctuation">:</span> <span class="token operator">-</span><span class="token number">70</span><span class="token punctuation">,</span> backgroundColor<span class="token punctuation">:</span> <span class="token string">'transparent'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            <span class="token punctuation">{</span><span class="token string">"containerBackgroundColor: 'transparent' + backgroundColor wash"</span><span class="token punctuation">}</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"numberOfLines attribute"</span><span class="token operator">&gt;</span>
          &lt;Text numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Maximum of one line no matter now much I write here<span class="token punctuation">.</span> If I keep writing it<span class="token punctuation">{</span><span class="token string">"'"</span><span class="token punctuation">}</span>ll just truncate after one line
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">2</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginTop<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Maximum of two lines no matter now much I write here<span class="token punctuation">.</span> If I keep writing it<span class="token punctuation">{</span><span class="token string">"'"</span><span class="token punctuation">}</span>ll just truncate after two lines
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginTop<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            No maximum lines specified no matter now much I write here<span class="token punctuation">.</span> If I keep writing it<span class="token punctuation">{</span><span class="token string">"'"</span><span class="token punctuation">}</span>ll just keep going and going
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"selectable attribute"</span><span class="token operator">&gt;</span>
          &lt;Text selectable<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            This text is selectable <span class="token keyword">if</span> you click<span class="token operator">-</span>and<span class="token operator">-</span>hold<span class="token punctuation">,</span> and will offer the native Android selection menus<span class="token punctuation">.</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Inline images"</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span>
            This text contains an inline image &lt;Image source<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./flux.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">.</span> Neat<span class="token punctuation">,</span> huh<span class="token operator">?</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Text shadow"</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>fontSize<span class="token punctuation">:</span> <span class="token number">20</span><span class="token punctuation">,</span> textShadowOffset<span class="token punctuation">:</span> <span class="token punctuation">{</span>width<span class="token punctuation">:</span> <span class="token number">2</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token number">2</span><span class="token punctuation">}</span><span class="token punctuation">,</span> textShadowRadius<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span> textShadowColor<span class="token punctuation">:</span> <span class="token string">'#00cccc'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            Demo text shadow
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
        &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token string">"Ellipsize mode"</span><span class="token operator">&gt;</span>
          &lt;Text numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            This very long text should be truncated <span class="token keyword">with</span> dots <span class="token keyword">in</span> the end<span class="token punctuation">.</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text ellipsizeMode<span class="token operator">=</span><span class="token string">"middle"</span> numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            This very long text should be truncated <span class="token keyword">with</span> dots <span class="token keyword">in</span> the middle<span class="token punctuation">.</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;Text ellipsizeMode<span class="token operator">=</span><span class="token string">"head"</span> numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            This very long text should be truncated <span class="token keyword">with</span> dots <span class="token keyword">in</span> the beginning<span class="token punctuation">.</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>UIExplorerPage<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  backgroundColorText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    left<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'rgba(100, 100, 100, 0.3)'</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> TextExample<span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22Text%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/tabbarios-item.html#content">← Prev</a><a class="docs-next" href="docs/textinput.html#content">Next →</a></div>