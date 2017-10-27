---
id: version-0.36-datepickerios
title: datepickerios
original_id: datepickerios
---
<a id="content"></a><h1><a class="anchor" name="datepickerios"></a>DatePickerIOS <a class="hash-link" href="docs/datepickerios.html#datepickerios">#</a></h1><div><div><p>Use <code>DatePickerIOS</code> to render a date/time picker (selector) on iOS.  This is
a controlled component, so you must hook in to the <code>onDateChange</code> callback
and update the <code>date</code> prop in order for the component to update, otherwise
the user's change will be reverted immediately to reflect <code>props.date</code> as the
source of truth.</p></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/datepickerios.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="docs/view.html#props">View props...</a> <a class="hash-link" href="docs/datepickerios.html#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="date"></a>date <span class="propType">PropTypes.instanceOf(Date).isRequired</span> <a class="hash-link" href="docs/datepickerios.html#date">#</a></h4><div><p>The currently selected date.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="maximumdate"></a>maximumDate <span class="propType">PropTypes.instanceOf(Date)</span> <a class="hash-link" href="docs/datepickerios.html#maximumdate">#</a></h4><div><p>Maximum date.</p><p>Restricts the range of possible date/time values.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="minimumdate"></a>minimumDate <span class="propType">PropTypes.instanceOf(Date)</span> <a class="hash-link" href="docs/datepickerios.html#minimumdate">#</a></h4><div><p>Minimum date.</p><p>Restricts the range of possible date/time values.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="minuteinterval"></a>minuteInterval <span class="propType">PropTypes.oneOf([1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30])</span> <a class="hash-link" href="docs/datepickerios.html#minuteinterval">#</a></h4><div><p>The interval at which minutes can be selected.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="mode"></a>mode <span class="propType">PropTypes.oneOf(['date', 'time', 'datetime'])</span> <a class="hash-link" href="docs/datepickerios.html#mode">#</a></h4><div><p>The date picker mode.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="ondatechange"></a>onDateChange <span class="propType">PropTypes.func.isRequired</span> <a class="hash-link" href="docs/datepickerios.html#ondatechange">#</a></h4><div><p>Date change handler.</p><p>This is called when the user changes the date or time in the UI.
The first and only argument is a Date object representing the new
date and time.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="timezoneoffsetinminutes"></a>timeZoneOffsetInMinutes <span class="propType">PropTypes.number</span> <a class="hash-link" href="docs/datepickerios.html#timezoneoffsetinminutes">#</a></h4><div><p>Timezone offset in minutes.</p><p>By default, the date picker will use the device's timezone. With this
parameter, it is possible to force a certain timezone offset. For
instance, to show times in Pacific Standard Time, pass -7 * 60.</p></div></div></div></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/DatePicker/DatePickerIOS.ios.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/datepickerios.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/DatePickerIOSExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  DatePickerIOS<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TextInput<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

class <span class="token class-name">DatePickerExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  static defaultProps <span class="token operator">=</span> <span class="token punctuation">{</span>
    date<span class="token punctuation">:</span> <span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">,</span>
    timeZoneOffsetInHours<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">)</span> <span class="token operator">*</span> <span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">getTimezoneOffset<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token operator">/</span> <span class="token number">60</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    date<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>date<span class="token punctuation">,</span>
    timeZoneOffsetInHours<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>timeZoneOffsetInHours<span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  onDateChange <span class="token operator">=</span> <span class="token punctuation">(</span>date<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>date<span class="token punctuation">:</span> date<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  onTimezoneChange <span class="token operator">=</span> <span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">var</span> offset <span class="token operator">=</span> <span class="token function">parseInt<span class="token punctuation">(</span></span>event<span class="token punctuation">.</span>nativeEvent<span class="token punctuation">.</span>text<span class="token punctuation">,</span> <span class="token number">10</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">isNaN<span class="token punctuation">(</span></span>offset<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
      <span class="token keyword">return</span><span class="token punctuation">;</span>
    <span class="token punctuation">}</span>
    <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>timeZoneOffsetInHours<span class="token punctuation">:</span> offset<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
   <span class="token comment" spellcheck="true"> // Ideally, the timezone input would be a picker rather than a
</span>   <span class="token comment" spellcheck="true"> // text input, but we don't have any pickers yet :(
</span>    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;WithLabel label<span class="token operator">=</span><span class="token string">"Value:"</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>date<span class="token punctuation">.</span><span class="token function">toLocaleDateString<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token operator">+</span>
            <span class="token string">' '</span> <span class="token operator">+</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>date<span class="token punctuation">.</span><span class="token function">toLocaleTimeString<span class="token punctuation">(</span></span><span class="token punctuation">)</span>
          <span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
        &lt;WithLabel label<span class="token operator">=</span><span class="token string">"Timezone:"</span><span class="token operator">&gt;</span>
          &lt;TextInput
            onChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onTimezoneChange<span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>textinput<span class="token punctuation">}</span>
            value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>timeZoneOffsetInHours<span class="token punctuation">.</span><span class="token function">toString<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span> hours from UTC&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>WithLabel<span class="token operator">&gt;</span>
        &lt;Heading label<span class="token operator">=</span><span class="token string">"Date + time picker"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;DatePickerIOS
          date<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>date<span class="token punctuation">}</span>
          mode<span class="token operator">=</span><span class="token string">"datetime"</span>
          timeZoneOffsetInMinutes<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>timeZoneOffsetInHours <span class="token operator">*</span> <span class="token number">60</span><span class="token punctuation">}</span>
          onDateChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onDateChange<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Heading label<span class="token operator">=</span><span class="token string">"Date picker"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;DatePickerIOS
          date<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>date<span class="token punctuation">}</span>
          mode<span class="token operator">=</span><span class="token string">"date"</span>
          timeZoneOffsetInMinutes<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>timeZoneOffsetInHours <span class="token operator">*</span> <span class="token number">60</span><span class="token punctuation">}</span>
          onDateChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onDateChange<span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Heading label<span class="token operator">=</span><span class="token string">"Time picker, 10-minute interval"</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;DatePickerIOS
          date<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>date<span class="token punctuation">}</span>
          mode<span class="token operator">=</span><span class="token string">"time"</span>
          timeZoneOffsetInMinutes<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>timeZoneOffsetInHours <span class="token operator">*</span> <span class="token number">60</span><span class="token punctuation">}</span>
          onDateChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>onDateChange<span class="token punctuation">}</span>
          minuteInterval<span class="token operator">=</span><span class="token punctuation">{</span><span class="token number">10</span><span class="token punctuation">}</span>
        <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">WithLabel</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>labelContainer<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>labelView<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>label<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>label<span class="token punctuation">}</span>
          &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>children<span class="token punctuation">}</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">Heading</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>headingContainer<span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>heading<span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>props<span class="token punctuation">.</span>label<span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token punctuation">(</span>undefined<span class="token punctuation">:</span> <span class="token operator">?</span>string<span class="token punctuation">)</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;DatePickerIOS&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Select dates and times using the native UIDatePicker.'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> <span class="token punctuation">[</span>
<span class="token punctuation">{</span>
  title<span class="token punctuation">:</span> <span class="token string">'&lt;DatePickerIOS&gt;'</span><span class="token punctuation">,</span>
  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> &lt;DatePickerExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  textinput<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    height<span class="token punctuation">:</span> <span class="token number">26</span><span class="token punctuation">,</span>
    width<span class="token punctuation">:</span> <span class="token number">50</span><span class="token punctuation">,</span>
    borderWidth<span class="token punctuation">:</span> <span class="token number">0.5</span><span class="token punctuation">,</span>
    borderColor<span class="token punctuation">:</span> <span class="token string">'#0f0f0f'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">4</span><span class="token punctuation">,</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">13</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  labelContainer<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
    marginVertical<span class="token punctuation">:</span> <span class="token number">2</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  labelView<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    marginRight<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
    paddingVertical<span class="token punctuation">:</span> <span class="token number">2</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  label<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'500'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  headingContainer<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    padding<span class="token punctuation">:</span> <span class="token number">4</span><span class="token punctuation">,</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#f6f7f8'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  heading<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    fontWeight<span class="token punctuation">:</span> <span class="token string">'500'</span><span class="token punctuation">,</span>
    fontSize<span class="token punctuation">:</span> <span class="token number">14</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22DatePickerIOS%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/activityindicatorios.html#content">← Prev</a><a class="docs-next" href="docs/drawerlayoutandroid.html#content">Next →</a></div>