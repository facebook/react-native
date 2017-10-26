---
id: switch
title: switch
---
<a id="content"></a><h1><a class="anchor" name="switch"></a>Switch <a class="hash-link" href="docs/switch.html#switch">#</a></h1><div><div><p>Renders a boolean input.</p><p>This is a controlled component that requires an <code>onValueChange</code> callback that
updates the <code>value</code> prop in order for the component to reflect user actions.
If the <code>value</code> prop is not updated, the component will continue to render
the supplied <code>value</code> prop instead of the expected result of any user actions.</p><p>@keyword checkbox
@keyword toggle</p></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="docs/switch.html#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="docs/view.html#props">View props...</a> <a class="hash-link" href="docs/switch.html#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="disabled"></a>disabled?: <span class="propType"><code>bool</code></span> <a class="hash-link" href="docs/switch.html#disabled">#</a></h4><div><p>If true the user won't be able to toggle the switch.
Default value is false.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="ontintcolor"></a>onTintColor?: <span class="propType"><code>[object Object]</code></span> <a class="hash-link" href="docs/switch.html#ontintcolor">#</a></h4><div><p>Background color when the switch is turned on.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onvaluechange"></a>onValueChange?: <span class="propType"><code>function</code></span> <a class="hash-link" href="docs/switch.html#onvaluechange">#</a></h4><div><p>Invoked with the new value when the value changes.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="testid"></a>testID?: <span class="propType"><code>string</code></span> <a class="hash-link" href="docs/switch.html#testid">#</a></h4><div><p>Used to locate this view in end-to-end tests.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="thumbtintcolor"></a>thumbTintColor?: <span class="propType"><code>[object Object]</code></span> <a class="hash-link" href="docs/switch.html#thumbtintcolor">#</a></h4><div><p>Color of the foreground switch grip.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="tintcolor"></a>tintColor?: <span class="propType"><code>[object Object]</code></span> <a class="hash-link" href="docs/switch.html#tintcolor">#</a></h4><div><p>Border color on iOS and background color on Android when the switch is turned off.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="value"></a>value?: <span class="propType"><code>bool</code></span> <a class="hash-link" href="docs/switch.html#value">#</a></h4><div><p>The value of the switch.  If true the switch will be turned on.
Default value is false.</p></div></div></div></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/Switch/Switch.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/switch.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/SwitchExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Platform<span class="token punctuation">,</span>
  Switch<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

class <span class="token class-name">BasicSwitchExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    trueSwitchIsOn<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    falseSwitchIsOn<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Switch
          onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>falseSwitchIsOn<span class="token punctuation">:</span> value<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
          value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>falseSwitchIsOn<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Switch
          onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>trueSwitchIsOn<span class="token punctuation">:</span> value<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>trueSwitchIsOn<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">DisabledSwitchExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Switch
          disabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
          value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Switch
          disabled<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">true</span><span class="token punctuation">}</span>
          value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token boolean">false</span><span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">ColorSwitchExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    colorTrueSwitchIsOn<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    colorFalseSwitchIsOn<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;Switch
          onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>colorFalseSwitchIsOn<span class="token punctuation">:</span> value<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          onTintColor<span class="token operator">=</span><span class="token string">"#00ff00"</span>
          style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
          thumbTintColor<span class="token operator">=</span><span class="token string">"#0000ff"</span>
          tintColor<span class="token operator">=</span><span class="token string">"#ff0000"</span>
          value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>colorFalseSwitchIsOn<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
        &lt;Switch
          onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>colorTrueSwitchIsOn<span class="token punctuation">:</span> value<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          onTintColor<span class="token operator">=</span><span class="token string">"#00ff00"</span>
          thumbTintColor<span class="token operator">=</span><span class="token string">"#0000ff"</span>
          tintColor<span class="token operator">=</span><span class="token string">"#ff0000"</span>
          value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>colorTrueSwitchIsOn<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">EventSwitchExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  state <span class="token operator">=</span> <span class="token punctuation">{</span>
    eventSwitchIsOn<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    eventSwitchRegressionIsOn<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span> flexDirection<span class="token punctuation">:</span> <span class="token string">'row'</span><span class="token punctuation">,</span> justifyContent<span class="token punctuation">:</span> <span class="token string">'space-around'</span> <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;Switch
            onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>eventSwitchIsOn<span class="token punctuation">:</span> value<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
            value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>eventSwitchIsOn<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Switch
            onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>eventSwitchIsOn<span class="token punctuation">:</span> value<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
            value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>eventSwitchIsOn<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>eventSwitchIsOn <span class="token operator">?</span> <span class="token string">'On'</span> <span class="token punctuation">:</span> <span class="token string">'Off'</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;View<span class="token operator">&gt;</span>
          &lt;Switch
            onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>eventSwitchRegressionIsOn<span class="token punctuation">:</span> value<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
            value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>eventSwitchRegressionIsOn<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Switch
            onValueChange<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span>value<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>eventSwitchRegressionIsOn<span class="token punctuation">:</span> value<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
            style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>marginBottom<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
            value<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>eventSwitchRegressionIsOn<span class="token punctuation">}</span> <span class="token operator">/</span><span class="token operator">&gt;</span>
          &lt;Text<span class="token operator">&gt;</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>eventSwitchRegressionIsOn <span class="token operator">?</span> <span class="token string">'On'</span> <span class="token punctuation">:</span> <span class="token string">'Off'</span><span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">var</span> examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Switches can be set to true or false'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;BasicSwitchExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Switches can be disabled'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;DisabledSwitchExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Change events can be detected'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;EventSwitchExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Switches are controlled components'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;Switch <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom colors can be provided'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> React<span class="token punctuation">.</span>Element&lt;any<span class="token operator">&gt;</span> <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;ColorSwitchExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>

exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;Switch&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token string">'SwitchExample'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Native boolean input'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> examples<span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22Switch%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/statusbar.html#content">← Prev</a><a class="docs-next" href="docs/tabbarios.html#content">Next →</a></div>