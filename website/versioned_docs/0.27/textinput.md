---
id: version-0.27-textinput
title: textinput
original_id: textinput
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="textinput"></a>TextInput <a class="hash-link" href="docs/textinput.html#textinput">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.27-stable/Libraries/Components/TextInput/TextInput.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>A foundational component for inputting text into the app via a
keyboard. Props provide configurability for several features, such as
auto-correction, auto-capitalization, placeholder text, and different keyboard
types, such as a numeric keypad.</p><p>The simplest use case is to plop down a <code>TextInput</code> and subscribe to the
<code>onChangeText</code> events to read the user input. There are also other events,
such as <code>onSubmitEditing</code> and <code>onFocus</code> that can be subscribed to. A simple
example:</p><div class="prism language-javascript">  &lt;TextInput
    style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>height<span class="token punctuation">:</span> <span class="token number">40</span><span class="token punctuation">,</span> borderColor<span class="token punctuation">:</span> <span class="token string">'gray'</span><span class="token punctuation">,</span> borderWidth<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
    onChangeText<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>text<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
    value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>text<span class="token punctuation">}</span>
  <span class="token operator">/</span><span class="token operator">&gt;</span></div><p>Note that some props are only available with <code>multiline={true/false}</code>.
Additionally, border styles that apply to only one side of the element
(e.g., <code>borderBottomColor</code>, <code>borderLeftWidth</code>, etc.) will not be applied if
<code>multiline=false</code>. To achieve the same effect, you can wrap your <code>TextInput</code>
in a <code>View</code>:</p><div class="prism language-javascript"> &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span> borderBottomColor<span class="token punctuation">:</span> <span class="token string">'#000000'</span><span class="token punctuation">,</span> borderBottomWidth<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span> <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
   &lt;TextInput <span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
 &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span></div></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/textinput.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="docs/view.html#props">View props...</a> <a class="hash-link" href="docs/textinput.html#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="autocapitalize"></a>autoCapitalize <span class="propType">enum('none', 'sentences', 'words', 'characters')</span> <a class="hash-link" href="docs/textinput.html#autocapitalize">#</a></h4><div><p>Can tell TextInput to automatically capitalize certain characters.</p><ul><li>characters: all characters,</li><li>words: first letter of each word</li><li>sentences: first letter of each sentence (default)</li><li>none: don't auto capitalize anything</li></ul></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="autocorrect"></a>autoCorrect <span class="propType">bool</span> <a class="hash-link" href="docs/textinput.html#autocorrect">#</a></h4><div><p>If false, disables auto-correct. The default value is true.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="autofocus"></a>autoFocus <span class="propType">bool</span> <a class="hash-link" href="docs/textinput.html#autofocus">#</a></h4><div><p>If true, focuses the input on componentDidMount.
The default value is false.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="bluronsubmit"></a>blurOnSubmit <span class="propType">bool</span> <a class="hash-link" href="docs/textinput.html#bluronsubmit">#</a></h4><div><p>If true, the text field will blur when submitted.
The default value is true for single-line fields and false for
multiline fields. Note that for multiline fields, setting blurOnSubmit
to true means that pressing return will blur the field and trigger the
onSubmitEditing event instead of inserting a newline into the field.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="defaultvalue"></a>defaultValue <span class="propType">string</span> <a class="hash-link" href="docs/textinput.html#defaultvalue">#</a></h4><div><p>Provides an initial value that will change when the user starts typing.
Useful for simple use-cases where you don't want to deal with listening
to events and updating the value prop to keep the controlled state in sync.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="editable"></a>editable <span class="propType">bool</span> <a class="hash-link" href="docs/textinput.html#editable">#</a></h4><div><p>If false, text is not editable. The default value is true.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="keyboardtype"></a>keyboardType <span class="propType">enum('default', 'email-address', 'numeric', 'phone-pad', 'ascii-capable', 'numbers-and-punctuation', 'url', 'number-pad', 'name-phone-pad', 'decimal-pad', 'twitter', 'web-search')</span> <a class="hash-link" href="docs/textinput.html#keyboardtype">#</a></h4><div><p>Determines which keyboard to open, e.g.<code>numeric</code>.</p><p>The following values work across platforms:</p><ul><li>default</li><li>numeric</li><li>email-address</li></ul></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="maxlength"></a>maxLength <span class="propType">number</span> <a class="hash-link" href="docs/textinput.html#maxlength">#</a></h4><div><p>Limits the maximum number of characters that can be entered. Use this
instead of implementing the logic in JS to avoid flicker.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="multiline"></a>multiline <span class="propType">bool</span> <a class="hash-link" href="docs/textinput.html#multiline">#</a></h4><div><p>If true, the text input can be multiple lines.
The default value is false.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onblur"></a>onBlur <span class="propType">function</span> <a class="hash-link" href="docs/textinput.html#onblur">#</a></h4><div><p>Callback that is called when the text input is blurred</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onchange"></a>onChange <span class="propType">function</span> <a class="hash-link" href="docs/textinput.html#onchange">#</a></h4><div><p>Callback that is called when the text input's text changes.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onchangetext"></a>onChangeText <span class="propType">function</span> <a class="hash-link" href="docs/textinput.html#onchangetext">#</a></h4><div><p>Callback that is called when the text input's text changes.
Changed text is passed as an argument to the callback handler.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onendediting"></a>onEndEditing <span class="propType">function</span> <a class="hash-link" href="docs/textinput.html#onendediting">#</a></h4><div><p>Callback that is called when text input ends.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onfocus"></a>onFocus <span class="propType">function</span> <a class="hash-link" href="docs/textinput.html#onfocus">#</a></h4><div><p>Callback that is called when the text input is focused</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onlayout"></a>onLayout <span class="propType">function</span> <a class="hash-link" href="docs/textinput.html#onlayout">#</a></h4><div><p>Invoked on mount and layout changes with <code>{x, y, width, height}</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onselectionchange"></a>onSelectionChange <span class="propType">function</span> <a class="hash-link" href="docs/textinput.html#onselectionchange">#</a></h4><div><p>Callback that is called when the text input selection is changed</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onsubmitediting"></a>onSubmitEditing <span class="propType">function</span> <a class="hash-link" href="docs/textinput.html#onsubmitediting">#</a></h4><div><p>Callback that is called when the text input's submit button is pressed.
Invalid if multiline={true} is specified.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="placeholder"></a>placeholder <span class="propType">string</span> <a class="hash-link" href="docs/textinput.html#placeholder">#</a></h4><div><p>The string that will be rendered before text input has been entered</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="placeholdertextcolor"></a>placeholderTextColor <span class="propType">string</span> <a class="hash-link" href="docs/textinput.html#placeholdertextcolor">#</a></h4><div><p>The text color of the placeholder string</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="returnkeytype"></a>returnKeyType <span class="propType">enum('done', 'go', 'next', 'search', 'send', 'none', 'previous', 'default', 'emergency-call', 'google', 'join', 'route', 'yahoo')</span> <a class="hash-link" href="docs/textinput.html#returnkeytype">#</a></h4><div><p>Determines how the return key should look. On Android you can also use
<code>returnKeyLabel</code>.</p><p>The following values work across platforms:</p><ul><li>done</li><li>go</li><li>next</li><li>search</li><li>send</li></ul><p>The following values work on Android only:</p><ul><li>none</li><li>previous</li></ul><p>The following values work on iOS only:</p><ul><li>default</li><li>emergency-call</li><li>google</li><li>join</li><li>route</li><li>yahoo</li></ul></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="securetextentry"></a>secureTextEntry <span class="propType">bool</span> <a class="hash-link" href="docs/textinput.html#securetextentry">#</a></h4><div><p>If true, the text input obscures the text entered so that sensitive text
like passwords stay secure. The default value is false.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="selecttextonfocus"></a>selectTextOnFocus <span class="propType">bool</span> <a class="hash-link" href="docs/textinput.html#selecttextonfocus">#</a></h4><div><p>If true, all text will automatically be selected on focus</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="selectioncolor"></a>selectionColor <span class="propType">string</span> <a class="hash-link" href="docs/textinput.html#selectioncolor">#</a></h4><div><p>The highlight (and cursor on ios) color of the text input</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="style"></a>style <span class="propType"><a href="docs/text.html#style">Text#style</a></span> <a class="hash-link" href="docs/textinput.html#style">#</a></h4><div><p>Styles</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="value"></a>value <span class="propType">string</span> <a class="hash-link" href="docs/textinput.html#value">#</a></h4><div><p>The value to show for the text input. TextInput is a controlled
component, which means the native value will be forced to match this
value prop if provided. For most uses this works great, but in some
cases this may cause flickering - one common cause is preventing edits
by keeping value the same. In addition to simply setting the same value,
either set <code>editable={false}</code>, or set/update <code>maxLength</code> to prevent
unwanted edits without flicker.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="numberoflines"></a><span class="platform">android</span>numberOfLines <span class="propType">number</span> <a class="hash-link" href="docs/textinput.html#numberoflines">#</a></h4><div><p>Sets the number of lines for a TextInput. Use it with multiline set to
true to be able to fill the lines.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="returnkeylabel"></a><span class="platform">android</span>returnKeyLabel <span class="propType">string</span> <a class="hash-link" href="docs/textinput.html#returnkeylabel">#</a></h4><div><p>Sets the return key to the label. Use it instead of <code>returnKeyType</code>.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="underlinecolorandroid"></a><span class="platform">android</span>underlineColorAndroid <span class="propType">string</span> <a class="hash-link" href="docs/textinput.html#underlinecolorandroid">#</a></h4><div><p>The color of the textInput underline.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="clearbuttonmode"></a><span class="platform">ios</span>clearButtonMode <span class="propType">enum('never', 'while-editing', 'unless-editing', 'always')</span> <a class="hash-link" href="docs/textinput.html#clearbuttonmode">#</a></h4><div><p>When the clear button should appear on the right side of the text view</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="cleartextonfocus"></a><span class="platform">ios</span>clearTextOnFocus <span class="propType">bool</span> <a class="hash-link" href="docs/textinput.html#cleartextonfocus">#</a></h4><div><p>If true, clears the text field automatically when editing begins</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="enablesreturnkeyautomatically"></a><span class="platform">ios</span>enablesReturnKeyAutomatically <span class="propType">bool</span> <a class="hash-link" href="docs/textinput.html#enablesreturnkeyautomatically">#</a></h4><div><p>If true, the keyboard disables the return key when there is no text and
automatically enables it when there is text. The default value is false.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="keyboardappearance"></a><span class="platform">ios</span>keyboardAppearance <span class="propType">enum('default', 'light', 'dark')</span> <a class="hash-link" href="docs/textinput.html#keyboardappearance">#</a></h4><div><p>Determines the color of the keyboard.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onkeypress"></a><span class="platform">ios</span>onKeyPress <span class="propType">function</span> <a class="hash-link" href="docs/textinput.html#onkeypress">#</a></h4><div><p>Callback that is called when a key is pressed.
Pressed key value is passed as an argument to the callback handler.
Fires before onChange callbacks.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="selectionstate"></a><span class="platform">ios</span>selectionState <span class="propType">DocumentSelectionState</span> <a class="hash-link" href="docs/textinput.html#selectionstate">#</a></h4><div><p>See DocumentSelectionState.js, some state that is responsible for
maintaining selection information for a document</p></div></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/textinput.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="isfocused"></a>isFocused<span class="propType">(): boolean</span> <a class="hash-link" href="docs/textinput.html#isfocused">#</a></h4><div><p>Returns if the input is currently focused.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="clear"></a>clear<span class="propType">()</span> <a class="hash-link" href="docs/textinput.html#clear">#</a></h4><div><p>Removes all text from the input.</p></div></div></div></span></div><div><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/textinput.html#examples">#</a></h3><div><table width="100%"><tbody><tr><td><h4><a class="anchor" name="ios"></a>IOS <a class="hash-link" href="docs/textinput.html#ios">#</a></h4></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.27-stable/Examples/UIExplorer/TextInputExample.ios.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Text<span class="token punctuation">,</span>
  TextInput<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

<span class="token keyword">var</span> WithLabel <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>labelContainer<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>label<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>label<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>children<span class="token punctuation">}</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> TextEventsExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      curText<span class="token punctuation">:</span> <span class="token string">'&lt;No Event&gt;'</span><span class="token punctuation">,</span>
      prevText<span class="token punctuation">:</span> <span class="token string">'&lt;No Event&gt;'</span><span class="token punctuation">,</span>
      prev2Text<span class="token punctuation">:</span> <span class="token string">'&lt;No Event&gt;'</span><span class="token punctuation">,</span>
      prev3Text<span class="token punctuation">:</span> <span class="token string">'&lt;No Event&gt;'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  updateText<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">(</span>state<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">{</span>
        curText<span class="token punctuation">:</span> text<span class="token punctuation">,</span>
        prevText<span class="token punctuation">:</span> state<span class="token punctuation">.</span>curText<span class="token punctuation">,</span>
        prev2Text<span class="token punctuation">:</span> state<span class="token punctuation">.</span>prevText<span class="token punctuation">,</span>
        prev3Text<span class="token punctuation">:</span> state<span class="token punctuation">.</span>prev2Text<span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TextInput
          autoCapitalize<span class="token operator">=</span><span class="token string">"none"</span>
          placeholder<span class="token operator">=</span><span class="token string">"Enter text to see events"</span>
          autoCorrect<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          onFocus<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">updateText<span class="token punctuation">(</span></span><span class="token string">'onFocus'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          onBlur<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">updateText<span class="token punctuation">(</span></span><span class="token string">'onBlur'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          onChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">updateText<span class="token punctuation">(</span></span>
            <span class="token string">'onChange text: '</span> <span class="token operator">+</span> event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text
          <span class="token punctuation">)</span><span class="token punctuation">}</span>
          onEndEditing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">updateText<span class="token punctuation">(</span></span>
            <span class="token string">'onEndEditing text: '</span> <span class="token operator">+</span> event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text
          <span class="token punctuation">)</span><span class="token punctuation">}</span>
          onSubmitEditing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">updateText<span class="token punctuation">(</span></span>
            <span class="token string">'onSubmitEditing text: '</span> <span class="token operator">+</span> event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text
          <span class="token punctuation">)</span><span class="token punctuation">}</span>
          onSelectionChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">updateText<span class="token punctuation">(</span></span>
            <span class="token string">'onSelectionChange range: '</span> <span class="token operator">+</span>
              event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>selection<span class="token punctuation">.</span>start <span class="token operator">+</span> <span class="token string">','</span> <span class="token operator">+</span>
              event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>selection<span class="token punctuation">.</span>end
          <span class="token punctuation">)</span><span class="token punctuation">}</span>
          onKeyPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">updateText<span class="token punctuation">(</span></span><span class="token string">'onKeyPress key: '</span> <span class="token operator">+</span> event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>eventLabel<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>curText<span class="token punctuation">}</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
          <span class="token punctuation">(</span>prev<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>prevText<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
          <span class="token punctuation">(</span>prev2<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>prev2Text<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
          <span class="token punctuation">(</span>prev3<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>prev3Text<span class="token punctuation">}</span><span class="token punctuation">)</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

class <span class="token class-name">AutoExpandingTextInput</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state<span class="token punctuation">:</span> any<span class="token punctuation">;</span>

  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">''</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TextInput
        <span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span>
        multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
        onChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
          <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
            text<span class="token punctuation">:</span> event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text<span class="token punctuation">,</span>
            height<span class="token punctuation">:</span> event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>contentSize<span class="token punctuation">.</span>height<span class="token punctuation">,</span>
          <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span><span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">,</span> <span class="token punctuation">{</span>height<span class="token punctuation">:</span> Math<span class="token punctuation">.</span><span class="token function">max<span class="token punctuation">(</span></span><span class="token number">35</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>height<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
        value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>text<span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">RewriteExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state<span class="token punctuation">:</span> any<span class="token punctuation">;</span>

  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">''</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> limit <span class="token operator">=</span> <span class="token number">20</span><span class="token punctuation">;</span>
    <span class="token keyword">var</span> remainder <span class="token operator">=</span> limit <span class="token operator">-</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>text<span class="token punctuation">.</span>length<span class="token punctuation">;</span>
    <span class="token keyword">var</span> remainderColor <span class="token operator">=</span> remainder <span class="token operator">&gt;</span> <span class="token number">5</span> <span class="token operator">?</span> <span class="token string">'blue'</span> <span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rewriteContainer<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;TextInput
          multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          maxLength<span class="token operator">=</span><span class="token punctuation">{</span>limit<span class="token punctuation">}</span>
          onChangeText<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            text <span class="token operator">=</span> text<span class="token punctuation">.</span><span class="token function">replace<span class="token punctuation">(</span></span><span class="token regex">/ /g</span><span class="token punctuation">,</span> <span class="token string">'_'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>text<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
          value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>text<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>remainder<span class="token punctuation">,</span> <span class="token punctuation">{</span>color<span class="token punctuation">:</span> remainderColor<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span>remainder<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">RewriteExampleInvalidCharacters</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state<span class="token punctuation">:</span> any<span class="token punctuation">;</span>

  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">''</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rewriteContainer<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;TextInput
          multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          onChangeText<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>text<span class="token punctuation">:</span> text<span class="token punctuation">.</span><span class="token function">replace<span class="token punctuation">(</span></span><span class="token regex">/\s/g</span><span class="token punctuation">,</span> <span class="token string">''</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
          value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>text<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">TokenizedTextExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state<span class="token punctuation">:</span> any<span class="token punctuation">;</span>

  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Hello #World'</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>

   <span class="token comment" spellcheck="true"> //define delimiter
</span>    <span class="token keyword">let</span> delimiter <span class="token operator">=</span> <span class="token regex">/\s+/</span><span class="token punctuation">;</span>

   <span class="token comment" spellcheck="true"> //split string
</span>    <span class="token keyword">let</span> _text <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>text<span class="token punctuation">;</span>
    <span class="token keyword">let</span> token<span class="token punctuation">,</span> index<span class="token punctuation">,</span> parts <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token keyword">while</span> <span class="token punctuation">(</span>_text<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      delimiter<span class="token punctuation">.</span>lastIndex <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
      token <span class="token operator">=</span> delimiter<span class="token punctuation">.</span><span class="token function">exec<span class="token punctuation">(</span></span>_text<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">if</span> <span class="token punctuation">(</span>token <span class="token operator">===</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">break</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
      index <span class="token operator">=</span> token<span class="token punctuation">.</span>index<span class="token punctuation">;</span>
      <span class="token keyword">if</span> <span class="token punctuation">(</span>token<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">.</span>length <span class="token operator">===</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        index <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
      parts<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span>_text<span class="token punctuation">.</span><span class="token function">substr<span class="token punctuation">(</span></span><span class="token number">0</span><span class="token punctuation">,</span> index<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      parts<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span>token<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      index <span class="token operator">=</span> index <span class="token operator">+</span> token<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">.</span>length<span class="token punctuation">;</span>
      _text <span class="token operator">=</span> _text<span class="token punctuation">.</span><span class="token function">slice<span class="token punctuation">(</span></span>index<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    parts<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span>_text<span class="token punctuation">)</span><span class="token punctuation">;</span>

   <span class="token comment" spellcheck="true"> //highlight hashtags
</span>    parts <span class="token operator">=</span> parts<span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token regex">/^#/</span><span class="token punctuation">.</span><span class="token function">test<span class="token punctuation">(</span></span>text<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> &lt;Text key<span class="token operator">=</span><span class="token punctuation">{</span>text<span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>hashtag<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span>text<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> text<span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TextInput
          multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>multiline<span class="token punctuation">}</span>
          onChangeText<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>text<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>parts<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TextInput<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">var</span> BlurOnSubmitExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">focusNextField<span class="token punctuation">(</span></span>nextField<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>refs<span class="token punctuation">[</span>nextField<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">focus<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TextInput
          ref<span class="token operator">=</span><span class="token string">"1"</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
          placeholder<span class="token operator">=</span><span class="token string">"blurOnSubmit = false"</span>
          returnKeyType<span class="token operator">=</span><span class="token string">"next"</span>
          blurOnSubmit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          onSubmitEditing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">focusNextField<span class="token punctuation">(</span></span><span class="token string">'2'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TextInput
          ref<span class="token operator">=</span><span class="token string">"2"</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
          keyboardType<span class="token operator">=</span><span class="token string">"email-address"</span>
          placeholder<span class="token operator">=</span><span class="token string">"blurOnSubmit = false"</span>
          returnKeyType<span class="token operator">=</span><span class="token string">"next"</span>
          blurOnSubmit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          onSubmitEditing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">focusNextField<span class="token punctuation">(</span></span><span class="token string">'3'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TextInput
          ref<span class="token operator">=</span><span class="token string">"3"</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
          keyboardType<span class="token operator">=</span><span class="token string">"url"</span>
          placeholder<span class="token operator">=</span><span class="token string">"blurOnSubmit = false"</span>
          returnKeyType<span class="token operator">=</span><span class="token string">"next"</span>
          blurOnSubmit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          onSubmitEditing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">focusNextField<span class="token punctuation">(</span></span><span class="token string">'4'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TextInput
          ref<span class="token operator">=</span><span class="token string">"4"</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
          keyboardType<span class="token operator">=</span><span class="token string">"numeric"</span>
          placeholder<span class="token operator">=</span><span class="token string">"blurOnSubmit = false"</span>
          blurOnSubmit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          onSubmitEditing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">focusNextField<span class="token punctuation">(</span></span><span class="token string">'5'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TextInput
          ref<span class="token operator">=</span><span class="token string">"5"</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
          keyboardType<span class="token operator">=</span><span class="token string">"numbers-and-punctuation"</span>
          placeholder<span class="token operator">=</span><span class="token string">"blurOnSubmit = true"</span>
          returnKeyType<span class="token operator">=</span><span class="token string">"done"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  page<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    paddingBottom<span class="token punctuation">:</span> <span class="token number">300</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  default<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> <span class="token number">26</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">0.5</span><span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'#0f0f0f'</span><span class="token punctuation">,</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">13</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">4</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  multiline<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">0.5</span><span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'#0f0f0f'</span><span class="token punctuation">,</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">13</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">50</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">4</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">4</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  multilineWithFontStyles<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    color<span class="token punctuation">:</span> <span class="token string">'blue'</span><span class="token punctuation">,</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">,</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">18</span><span class="token punctuation">,</span>
    fontFamily<span class="token punctuation">:</span> <span class="token string">'Cochin'</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">60</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  multilineChild<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">50</span><span class="token punctuation">,</span>
    height<span class="token punctuation">:</span> <span class="token number">40</span><span class="token punctuation">,</span>
    position<span class="token punctuation">:</span> <span class="token string">'absolute'</span><span class="token punctuation">,</span>
    right<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  eventLabel<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    margin<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">12</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  labelContainer<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    marginVertical<span class="token punctuation">:</span> <span class="token number">2</span><span class="token punctuation">,</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  label<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    width<span class="token punctuation">:</span> <span class="token number">115</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'flex-end'</span><span class="token punctuation">,</span>
    marginRight<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    paddingTop<span class="token punctuation">:</span> <span class="token number">2</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  rewriteContainer<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  remainder<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    textAlign<span class="token punctuation">:</span> <span class="token string">'right'</span><span class="token punctuation">,</span>
    width<span class="token punctuation">:</span> <span class="token number">24</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  hashtag<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    color<span class="token punctuation">:</span> <span class="token string">'blue'</span><span class="token punctuation">,</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token punctuation">(</span>undefined<span class="token punctuation">:</span> <span class="token operator">?</span>string<span class="token punctuation">)</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;TextInput&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Single and multi-line text inputs.'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Auto-focus'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;TextInput
          autoFocus<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
          accessibilityLabel<span class="token operator">=</span><span class="token string">"I am the accessibility label for text input"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">"Live Re-Write (&lt;sp&gt;  -&gt;  '_') + maxLength"</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;RewriteExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Live Re-Write (no spaces allowed)'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;RewriteExampleInvalidCharacters <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Auto-capitalize'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"none"</span><span class="token operator">&gt;</span>
            &lt;TextInput
              autoCapitalize<span class="token operator">=</span><span class="token string">"none"</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"sentences"</span><span class="token operator">&gt;</span>
            &lt;TextInput
              autoCapitalize<span class="token operator">=</span><span class="token string">"sentences"</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"words"</span><span class="token operator">&gt;</span>
            &lt;TextInput
              autoCapitalize<span class="token operator">=</span><span class="token string">"words"</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"characters"</span><span class="token operator">&gt;</span>
            &lt;TextInput
              autoCapitalize<span class="token operator">=</span><span class="token string">"characters"</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Auto-correct'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"true"</span><span class="token operator">&gt;</span>
            &lt;TextInput autoCorrect<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"false"</span><span class="token operator">&gt;</span>
            &lt;TextInput autoCorrect<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Keyboard types'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">var</span> keyboardTypes <span class="token operator">=</span> <span class="token punctuation">[</span>
        <span class="token string">'default'</span><span class="token punctuation">,</span>
        <span class="token string">'ascii-capable'</span><span class="token punctuation">,</span>
        <span class="token string">'numbers-and-punctuation'</span><span class="token punctuation">,</span>
        <span class="token string">'url'</span><span class="token punctuation">,</span>
        <span class="token string">'number-pad'</span><span class="token punctuation">,</span>
        <span class="token string">'phone-pad'</span><span class="token punctuation">,</span>
        <span class="token string">'name-phone-pad'</span><span class="token punctuation">,</span>
        <span class="token string">'email-address'</span><span class="token punctuation">,</span>
        <span class="token string">'decimal-pad'</span><span class="token punctuation">,</span>
        <span class="token string">'twitter'</span><span class="token punctuation">,</span>
        <span class="token string">'web-search'</span><span class="token punctuation">,</span>
        <span class="token string">'numeric'</span><span class="token punctuation">,</span>
      <span class="token punctuation">]</span><span class="token punctuation">;</span>
      <span class="token keyword">var</span> examples <span class="token operator">=</span> keyboardTypes<span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>type<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token punctuation">(</span>
          &lt;WithLabel key<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span> label<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;TextInput
              keyboardType<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
        <span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">return</span> &lt;View<span class="token operator">&gt;</span><span class="token punctuation">{</span>examples<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Keyboard appearance'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">var</span> keyboardAppearance <span class="token operator">=</span> <span class="token punctuation">[</span>
        <span class="token string">'default'</span><span class="token punctuation">,</span>
        <span class="token string">'light'</span><span class="token punctuation">,</span>
        <span class="token string">'dark'</span><span class="token punctuation">,</span>
      <span class="token punctuation">]</span><span class="token punctuation">;</span>
      <span class="token keyword">var</span> examples <span class="token operator">=</span> keyboardAppearance<span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>type<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token punctuation">(</span>
          &lt;WithLabel key<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span> label<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;TextInput
              keyboardAppearance<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
        <span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">return</span> &lt;View<span class="token operator">&gt;</span><span class="token punctuation">{</span>examples<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Return key types'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">var</span> returnKeyTypes <span class="token operator">=</span> <span class="token punctuation">[</span>
        <span class="token string">'default'</span><span class="token punctuation">,</span>
        <span class="token string">'go'</span><span class="token punctuation">,</span>
        <span class="token string">'google'</span><span class="token punctuation">,</span>
        <span class="token string">'join'</span><span class="token punctuation">,</span>
        <span class="token string">'next'</span><span class="token punctuation">,</span>
        <span class="token string">'route'</span><span class="token punctuation">,</span>
        <span class="token string">'search'</span><span class="token punctuation">,</span>
        <span class="token string">'send'</span><span class="token punctuation">,</span>
        <span class="token string">'yahoo'</span><span class="token punctuation">,</span>
        <span class="token string">'done'</span><span class="token punctuation">,</span>
        <span class="token string">'emergency-call'</span><span class="token punctuation">,</span>
      <span class="token punctuation">]</span><span class="token punctuation">;</span>
      <span class="token keyword">var</span> examples <span class="token operator">=</span> returnKeyTypes<span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>type<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token punctuation">(</span>
          &lt;WithLabel key<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span> label<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;TextInput
              returnKeyType<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
        <span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">return</span> &lt;View<span class="token operator">&gt;</span><span class="token punctuation">{</span>examples<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Enable return key automatically'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"true"</span><span class="token operator">&gt;</span>
            &lt;TextInput enablesReturnKeyAutomatically<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Secure text entry'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"true"</span><span class="token operator">&gt;</span>
            &lt;TextInput password<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span> defaultValue<span class="token operator">=</span><span class="token string">"abc"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Event handling'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;TextEventsExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Colored input text'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TextInput
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">,</span> <span class="token punctuation">{</span>color<span class="token punctuation">:</span> <span class="token string">'blue'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            defaultValue<span class="token operator">=</span><span class="token string">"Blue"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">,</span> <span class="token punctuation">{</span>color<span class="token punctuation">:</span> <span class="token string">'green'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            defaultValue<span class="token operator">=</span><span class="token string">"Green"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Colored highlight/cursor for text input'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TextInput
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
            selectionColor<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">"green"</span><span class="token punctuation">}</span>
            defaultValue<span class="token operator">=</span><span class="token string">"Highlight me"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
            selectionColor<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">"rgba(86, 76, 205, 1)"</span><span class="token punctuation">}</span>
            defaultValue<span class="token operator">=</span><span class="token string">"Highlight me"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Clear button mode'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"never"</span><span class="token operator">&gt;</span>
            &lt;TextInput
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
              clearButtonMode<span class="token operator">=</span><span class="token string">"never"</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"while editing"</span><span class="token operator">&gt;</span>
            &lt;TextInput
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
              clearButtonMode<span class="token operator">=</span><span class="token string">"while-editing"</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"unless editing"</span><span class="token operator">&gt;</span>
            &lt;TextInput
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
              clearButtonMode<span class="token operator">=</span><span class="token string">"unless-editing"</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"always"</span><span class="token operator">&gt;</span>
            &lt;TextInput
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
              clearButtonMode<span class="token operator">=</span><span class="token string">"always"</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Clear and select'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"clearTextOnFocus"</span><span class="token operator">&gt;</span>
            &lt;TextInput
              placeholder<span class="token operator">=</span><span class="token string">"text is cleared on focus"</span>
              defaultValue<span class="token operator">=</span><span class="token string">"text is cleared on focus"</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
              clearTextOnFocus<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
          &lt;WithLabel label<span class="token operator">=</span><span class="token string">"selectTextOnFocus"</span><span class="token operator">&gt;</span>
            &lt;TextInput
              placeholder<span class="token operator">=</span><span class="token string">"text is selected on focus"</span>
              defaultValue<span class="token operator">=</span><span class="token string">"text is selected on focus"</span>
              style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
              selectTextOnFocus<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Blur on submit'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;BlurOnSubmitExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Multiline blur on submit'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TextInput
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>multiline<span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token string">"blurOnSubmit = true"</span>
            returnKeyType<span class="token operator">=</span><span class="token string">"next"</span>
            blurOnSubmit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            onSubmitEditing<span class="token operator">=</span><span class="token punctuation">{</span>event <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token function">alert<span class="token punctuation">(</span></span>event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text<span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Multiline'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TextInput
            placeholder<span class="token operator">=</span><span class="token string">"multiline text input"</span>
            multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>multiline<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            placeholder<span class="token operator">=</span><span class="token string">"multiline text input with font styles and placeholder"</span>
            multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            clearTextOnFocus<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            autoCorrect<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            autoCapitalize<span class="token operator">=</span><span class="token string">"words"</span>
            placeholderTextColor<span class="token operator">=</span><span class="token string">"red"</span>
            keyboardType<span class="token operator">=</span><span class="token string">"url"</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>multiline<span class="token punctuation">,</span> styles<span class="token punctuation">.</span>multilineWithFontStyles<span class="token punctuation">]</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            placeholder<span class="token operator">=</span><span class="token string">"uneditable multiline text input"</span>
            editable<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
            multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>multiline<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            placeholder<span class="token operator">=</span><span class="token string">"multiline with children"</span>
            multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            enablesReturnKeyAutomatically<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            returnKeyType<span class="token operator">=</span><span class="token string">"go"</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>multiline<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>multilineChild<span class="token punctuation">}</span><span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TextInput<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Auto-expanding'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;AutoExpandingTextInput
            placeholder<span class="token operator">=</span><span class="token string">"height increases with content"</span>
            enablesReturnKeyAutomatically<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            returnKeyType<span class="token operator">=</span><span class="token string">"default"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Attributed text'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;TokenizedTextExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div></div><div><table width="100%"><tbody><tr><td><h4><a class="anchor" name="android"></a>ANDROID <a class="hash-link" href="docs/textinput.html#android">#</a></h4></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.27-stable/Examples/UIExplorer/TextInputExample.android.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Text<span class="token punctuation">,</span>
  TextInput<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

<span class="token keyword">var</span> TextEventsExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      curText<span class="token punctuation">:</span> <span class="token string">'&lt;No Event&gt;'</span><span class="token punctuation">,</span>
      prevText<span class="token punctuation">:</span> <span class="token string">'&lt;No Event&gt;'</span><span class="token punctuation">,</span>
      prev2Text<span class="token punctuation">:</span> <span class="token string">'&lt;No Event&gt;'</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  updateText<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">(</span>state<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">{</span>
        curText<span class="token punctuation">:</span> text<span class="token punctuation">,</span>
        prevText<span class="token punctuation">:</span> state<span class="token punctuation">.</span>curText<span class="token punctuation">,</span>
        prev2Text<span class="token punctuation">:</span> state<span class="token punctuation">.</span>prevText<span class="token punctuation">,</span>
      <span class="token punctuation">}</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TextInput
          autoCapitalize<span class="token operator">=</span><span class="token string">"none"</span>
          placeholder<span class="token operator">=</span><span class="token string">"Enter text to see events"</span>
          autoCorrect<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          onFocus<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">updateText<span class="token punctuation">(</span></span><span class="token string">'onFocus'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          onBlur<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">updateText<span class="token punctuation">(</span></span><span class="token string">'onBlur'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          onChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">updateText<span class="token punctuation">(</span></span>
            <span class="token string">'onChange text: '</span> <span class="token operator">+</span> event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text
          <span class="token punctuation">)</span><span class="token punctuation">}</span>
          onEndEditing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">updateText<span class="token punctuation">(</span></span>
            <span class="token string">'onEndEditing text: '</span> <span class="token operator">+</span> event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text
          <span class="token punctuation">)</span><span class="token punctuation">}</span>
          onSubmitEditing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">updateText<span class="token punctuation">(</span></span>
            <span class="token string">'onSubmitEditing text: '</span> <span class="token operator">+</span> event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text
          <span class="token punctuation">)</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>eventLabel<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>curText<span class="token punctuation">}</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
          <span class="token punctuation">(</span>prev<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>prevText<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">{</span><span class="token string">'\n'</span><span class="token punctuation">}</span>
          <span class="token punctuation">(</span>prev2<span class="token punctuation">:</span> <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>prev2Text<span class="token punctuation">}</span><span class="token punctuation">)</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

class <span class="token class-name">AutoExpandingTextInput</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">''</span><span class="token punctuation">,</span> height<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TextInput
        <span class="token punctuation">{</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">}</span>
        multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
        onChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
          <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
            text<span class="token punctuation">:</span> event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text<span class="token punctuation">,</span>
            height<span class="token punctuation">:</span> event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>contentSize<span class="token punctuation">.</span>height<span class="token punctuation">,</span>
          <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token punctuation">}</span><span class="token punctuation">}</span>
        style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">,</span> <span class="token punctuation">{</span>height<span class="token punctuation">:</span> Math<span class="token punctuation">.</span><span class="token function">max<span class="token punctuation">(</span></span><span class="token number">35</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>height<span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
        value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>text<span class="token punctuation">}</span>
      <span class="token operator">/</span><span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">RewriteExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">''</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> limit <span class="token operator">=</span> <span class="token number">20</span><span class="token punctuation">;</span>
    <span class="token keyword">var</span> remainder <span class="token operator">=</span> limit <span class="token operator">-</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>text<span class="token punctuation">.</span>length<span class="token punctuation">;</span>
    <span class="token keyword">var</span> remainderColor <span class="token operator">=</span> remainder <span class="token operator">&gt;</span> <span class="token number">5</span> <span class="token operator">?</span> <span class="token string">'blue'</span> <span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>rewriteContainer<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;TextInput
          multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          maxLength<span class="token operator">=</span><span class="token punctuation">{</span>limit<span class="token punctuation">}</span>
          onChangeText<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            text <span class="token operator">=</span> text<span class="token punctuation">.</span><span class="token function">replace<span class="token punctuation">(</span></span><span class="token regex">/ /g</span><span class="token punctuation">,</span> <span class="token string">'_'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>text<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>default<span class="token punctuation">}</span>
          value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>text<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>remainder<span class="token punctuation">,</span> <span class="token punctuation">{</span>color<span class="token punctuation">:</span> remainderColor<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span>remainder<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">TokenizedTextExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">constructor<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token function">super<span class="token punctuation">(</span></span>props<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>state <span class="token operator">=</span> <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Hello #World'</span><span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>

   <span class="token comment" spellcheck="true"> //define delimiter
</span>    <span class="token keyword">let</span> delimiter <span class="token operator">=</span> <span class="token regex">/\s+/</span><span class="token punctuation">;</span>

   <span class="token comment" spellcheck="true"> //split string
</span>    <span class="token keyword">let</span> _text <span class="token operator">=</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>text<span class="token punctuation">;</span>
    <span class="token keyword">let</span> token<span class="token punctuation">,</span> index<span class="token punctuation">,</span> parts <span class="token operator">=</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">;</span>
    <span class="token keyword">while</span> <span class="token punctuation">(</span>_text<span class="token punctuation">)</span> <span class="token punctuation">{</span>
      delimiter<span class="token punctuation">.</span>lastIndex <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
      token <span class="token operator">=</span> delimiter<span class="token punctuation">.</span><span class="token function">exec<span class="token punctuation">(</span></span>_text<span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">if</span> <span class="token punctuation">(</span>token <span class="token operator">===</span> <span class="token keyword">null</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">break</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
      index <span class="token operator">=</span> token<span class="token punctuation">.</span>index<span class="token punctuation">;</span>
      <span class="token keyword">if</span> <span class="token punctuation">(</span>token<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">.</span>length <span class="token operator">===</span> <span class="token number">0</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        index <span class="token operator">=</span> <span class="token number">1</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
      parts<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span>_text<span class="token punctuation">.</span><span class="token function">substr<span class="token punctuation">(</span></span><span class="token number">0</span><span class="token punctuation">,</span> index<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      parts<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span>token<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      index <span class="token operator">=</span> index <span class="token operator">+</span> token<span class="token punctuation">[</span><span class="token number">0</span><span class="token punctuation">]</span><span class="token punctuation">.</span>length<span class="token punctuation">;</span>
      _text <span class="token operator">=</span> _text<span class="token punctuation">.</span><span class="token function">slice<span class="token punctuation">(</span></span>index<span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    parts<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span>_text<span class="token punctuation">)</span><span class="token punctuation">;</span>

   <span class="token comment" spellcheck="true"> //highlight hashtags
</span>    parts <span class="token operator">=</span> parts<span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
      <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token regex">/^#/</span><span class="token punctuation">.</span><span class="token function">test<span class="token punctuation">(</span></span>text<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> &lt;Text key<span class="token operator">=</span><span class="token punctuation">{</span>text<span class="token punctuation">}</span> style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>hashtag<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span>text<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span> <span class="token keyword">else</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> text<span class="token punctuation">;</span>
      <span class="token punctuation">}</span>
    <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TextInput
          multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>multiline<span class="token punctuation">}</span>
          onChangeText<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>text<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>text<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>parts<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TextInput<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">var</span> BlurOnSubmitExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">focusNextField<span class="token punctuation">(</span></span>nextField<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span>refs<span class="token punctuation">[</span>nextField<span class="token punctuation">]</span><span class="token punctuation">.</span><span class="token function">focus<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TextInput
          ref<span class="token operator">=</span><span class="token string">"1"</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          placeholder<span class="token operator">=</span><span class="token string">"blurOnSubmit = false"</span>
          returnKeyType<span class="token operator">=</span><span class="token string">"next"</span>
          blurOnSubmit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          onSubmitEditing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">focusNextField<span class="token punctuation">(</span></span><span class="token string">'2'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TextInput
          ref<span class="token operator">=</span><span class="token string">"2"</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          keyboardType<span class="token operator">=</span><span class="token string">"email-address"</span>
          placeholder<span class="token operator">=</span><span class="token string">"blurOnSubmit = false"</span>
          returnKeyType<span class="token operator">=</span><span class="token string">"next"</span>
          blurOnSubmit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          onSubmitEditing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">focusNextField<span class="token punctuation">(</span></span><span class="token string">'3'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TextInput
          ref<span class="token operator">=</span><span class="token string">"3"</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          keyboardType<span class="token operator">=</span><span class="token string">"url"</span>
          placeholder<span class="token operator">=</span><span class="token string">"blurOnSubmit = false"</span>
          returnKeyType<span class="token operator">=</span><span class="token string">"next"</span>
          blurOnSubmit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          onSubmitEditing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">focusNextField<span class="token punctuation">(</span></span><span class="token string">'4'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TextInput
          ref<span class="token operator">=</span><span class="token string">"4"</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          keyboardType<span class="token operator">=</span><span class="token string">"numeric"</span>
          placeholder<span class="token operator">=</span><span class="token string">"blurOnSubmit = false"</span>
          blurOnSubmit<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
          onSubmitEditing<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">focusNextField<span class="token punctuation">(</span></span><span class="token string">'5'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;TextInput
          ref<span class="token operator">=</span><span class="token string">"5"</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          keyboardType<span class="token operator">=</span><span class="token string">"numbers-and-punctuation"</span>
          placeholder<span class="token operator">=</span><span class="token string">"blurOnSubmit = true"</span>
          returnKeyType<span class="token operator">=</span><span class="token string">"done"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  multiline<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> <span class="token number">60</span><span class="token punctuation">,</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">16</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">4</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  eventLabel<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    margin<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">,</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">12</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  singleLine<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">16</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">4</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  singleLineWithHeightTextInput<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> <span class="token number">30</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  hashtag<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    color<span class="token punctuation">:</span> <span class="token string">'blue'</span><span class="token punctuation">,</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;TextInput&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Single and multi-line text inputs.'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Auto-focus'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;TextInput
          autoFocus<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          accessibilityLabel<span class="token operator">=</span><span class="token string">"I am the accessibility label for text input"</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">"Live Re-Write (&lt;sp&gt;  -&gt;  '_')"</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;RewriteExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Auto-capitalize'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">var</span> autoCapitalizeTypes <span class="token operator">=</span> <span class="token punctuation">[</span>
        <span class="token string">'none'</span><span class="token punctuation">,</span>
        <span class="token string">'sentences'</span><span class="token punctuation">,</span>
        <span class="token string">'words'</span><span class="token punctuation">,</span>
        <span class="token string">'characters'</span><span class="token punctuation">,</span>
      <span class="token punctuation">]</span><span class="token punctuation">;</span>
      <span class="token keyword">var</span> examples <span class="token operator">=</span> autoCapitalizeTypes<span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>type<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token punctuation">(</span>
          &lt;TextInput
            key<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span>
            autoCapitalize<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">'autoCapitalize: '</span> <span class="token operator">+</span> type<span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        <span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">return</span> &lt;View<span class="token operator">&gt;</span><span class="token punctuation">{</span>examples<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Auto-correct'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TextInput
            autoCorrect<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token string">"This has autoCorrect"</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            autoCorrect<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token string">"This does not have autoCorrect"</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Keyboard types'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">var</span> keyboardTypes <span class="token operator">=</span> <span class="token punctuation">[</span>
        <span class="token string">'default'</span><span class="token punctuation">,</span>
        <span class="token string">'email-address'</span><span class="token punctuation">,</span>
        <span class="token string">'numeric'</span><span class="token punctuation">,</span>
        <span class="token string">'phone-pad'</span><span class="token punctuation">,</span>
      <span class="token punctuation">]</span><span class="token punctuation">;</span>
      <span class="token keyword">var</span> examples <span class="token operator">=</span> keyboardTypes<span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>type<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token punctuation">(</span>
          &lt;TextInput
            key<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span>
            keyboardType<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">'keyboardType: '</span> <span class="token operator">+</span> type<span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        <span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">return</span> &lt;View<span class="token operator">&gt;</span><span class="token punctuation">{</span>examples<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Blur on submit'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;BlurOnSubmitExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Event handling'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;TextEventsExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Colors and text inputs'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TextInput
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">]</span><span class="token punctuation">}</span>
            defaultValue<span class="token operator">=</span><span class="token string">"Default color text"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">,</span> <span class="token punctuation">{</span>color<span class="token punctuation">:</span> <span class="token string">'green'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            defaultValue<span class="token operator">=</span><span class="token string">"Green Text"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            placeholder<span class="token operator">=</span><span class="token string">"Default placeholder text color"</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            placeholder<span class="token operator">=</span><span class="token string">"Red placeholder text color"</span>
            placeholderTextColor<span class="token operator">=</span><span class="token string">"red"</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            placeholder<span class="token operator">=</span><span class="token string">"Default underline color"</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            placeholder<span class="token operator">=</span><span class="token string">"Blue underline color"</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
            underlineColorAndroid<span class="token operator">=</span><span class="token string">"blue"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            defaultValue<span class="token operator">=</span><span class="token string">"Same BackgroundColor as View "</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">,</span> <span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'rgba(100, 100, 100, 0.3)'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> <span class="token string">'rgba(100, 100, 100, 0.3)'</span><span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
              Darker backgroundColor
            &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TextInput<span class="token operator">&gt;</span>
          &lt;TextInput
            defaultValue<span class="token operator">=</span><span class="token string">"Highlight Color is red"</span>
            selectionColor<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">'red'</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TextInput<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Text input, themes and heights'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;TextInput
          placeholder<span class="token operator">=</span><span class="token string">"If you set height, beware of padding set from themes"</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>singleLineWithHeightTextInput<span class="token punctuation">]</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'fontFamily, fontWeight and fontStyle'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TextInput 
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">,</span> <span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token string">"Custom fonts like Sans-Serif are supported"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput 
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">,</span> <span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif'</span><span class="token punctuation">,</span> fontWeight<span class="token punctuation">:</span> <span class="token string">'bold'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token string">"Sans-Serif bold"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput 
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">,</span> <span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'sans-serif'</span><span class="token punctuation">,</span> fontStyle<span class="token punctuation">:</span> <span class="token string">'italic'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token string">"Sans-Serif italic"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput 
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">,</span> <span class="token punctuation">{</span>fontFamily<span class="token punctuation">:</span> <span class="token string">'serif'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token string">"Serif"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Passwords'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TextInput
            defaultValue<span class="token operator">=</span><span class="token string">"iloveturtles"</span>
            secureTextEntry<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            secureTextEntry<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">,</span> <span class="token punctuation">{</span>color<span class="token punctuation">:</span> <span class="token string">'red'</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token string">"color is supported too"</span>
            placeholderTextColor<span class="token operator">=</span><span class="token string">"red"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Editable'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;TextInput
           defaultValue<span class="token operator">=</span><span class="token string">"Can't touch this! (&gt;'-')&gt; ^(' - ')^ &lt;('-'&lt;) (&gt;'-')&gt; ^(' - ')^"</span>
           editable<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span>
           style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
         <span class="token operator">/</span><span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Multiline'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TextInput
            autoCorrect<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token string">"multiline, aligned top-left"</span>
            placeholderTextColor<span class="token operator">=</span><span class="token string">"red"</span>
            multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>multiline<span class="token punctuation">,</span> <span class="token punctuation">{</span>textAlign<span class="token punctuation">:</span> <span class="token string">"left"</span><span class="token punctuation">,</span> textAlignVertical<span class="token punctuation">:</span> <span class="token string">"top"</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            autoCorrect<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token string">"multiline, aligned center"</span>
            placeholderTextColor<span class="token operator">=</span><span class="token string">"green"</span>
            multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>multiline<span class="token punctuation">,</span> <span class="token punctuation">{</span>textAlign<span class="token punctuation">:</span> <span class="token string">"center"</span><span class="token punctuation">,</span> textAlignVertical<span class="token punctuation">:</span> <span class="token string">"center"</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput
            autoCorrect<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>multiline<span class="token punctuation">,</span> <span class="token punctuation">{</span>color<span class="token punctuation">:</span> <span class="token string">'blue'</span><span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token punctuation">{</span>textAlign<span class="token punctuation">:</span> <span class="token string">"right"</span><span class="token punctuation">,</span> textAlignVertical<span class="token punctuation">:</span> <span class="token string">"bottom"</span><span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>multiline<span class="token punctuation">}</span><span class="token operator">&gt;</span>multiline <span class="token keyword">with</span> children<span class="token punctuation">,</span> aligned bottom<span class="token operator">-</span>right&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>TextInput<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Fixed number of lines'</span><span class="token punctuation">,</span>
    platform<span class="token punctuation">:</span> <span class="token string">'android'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;TextInput numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">2</span><span class="token punctuation">}</span>
            multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token string">"Two line input"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;TextInput numberOfLines<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">5</span><span class="token punctuation">}</span>
            multiline<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token string">"Five line input"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Auto-expanding'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> <span class="token punctuation">(</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;AutoExpandingTextInput
            placeholder<span class="token operator">=</span><span class="token string">"height increases with content"</span>
            enablesReturnKeyAutomatically<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
            returnKeyType<span class="token operator">=</span><span class="token string">"done"</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      <span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Attributed text'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span> &lt;TokenizedTextExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Return key'</span><span class="token punctuation">,</span>
    render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">var</span> returnKeyTypes <span class="token operator">=</span> <span class="token punctuation">[</span>
        <span class="token string">'none'</span><span class="token punctuation">,</span>
        <span class="token string">'go'</span><span class="token punctuation">,</span>
        <span class="token string">'search'</span><span class="token punctuation">,</span>
        <span class="token string">'send'</span><span class="token punctuation">,</span>
        <span class="token string">'done'</span><span class="token punctuation">,</span>
        <span class="token string">'previous'</span><span class="token punctuation">,</span>
        <span class="token string">'next'</span><span class="token punctuation">,</span>
      <span class="token punctuation">]</span><span class="token punctuation">;</span>
      <span class="token keyword">var</span> returnKeyLabels <span class="token operator">=</span> <span class="token punctuation">[</span>
        <span class="token string">'Compile'</span><span class="token punctuation">,</span>
        <span class="token string">'React Native'</span><span class="token punctuation">,</span>
      <span class="token punctuation">]</span><span class="token punctuation">;</span>
      <span class="token keyword">var</span> examples <span class="token operator">=</span> returnKeyTypes<span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>type<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token punctuation">(</span>
          &lt;TextInput
            key<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span>
            returnKeyType<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">'returnKeyType: '</span> <span class="token operator">+</span> type<span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        <span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">var</span> types <span class="token operator">=</span> returnKeyLabels<span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>type<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
        <span class="token keyword">return</span> <span class="token punctuation">(</span>
          &lt;TextInput
            key<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span>
            returnKeyLabel<span class="token operator">=</span><span class="token punctuation">{</span>type<span class="token punctuation">}</span>
            placeholder<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">'returnKeyLabel: '</span> <span class="token operator">+</span> type<span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>singleLine<span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
        <span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
      <span class="token keyword">return</span> &lt;View<span class="token operator">&gt;</span><span class="token punctuation">{</span>examples<span class="token punctuation">}</span><span class="token punctuation">{</span>types<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span></div></div></div><div class="docs-prevnext"><a class="docs-next" href="docs/toolbarandroid.html#content">Next →</a></div>