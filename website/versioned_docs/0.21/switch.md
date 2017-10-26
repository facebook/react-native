---
id: switch
title: switch
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="switch"></a>Switch <a class="hash-link" href="undefined#switch">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/Switch/Switch.js">Edit on GitHub</a></td></tr></tbody></table><div><div><p>Universal two-state toggle component.</p></div><h3><a class="anchor" name="props"></a>Props <a class="hash-link" href="undefined#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="view.html#props">View props...</a> <a class="hash-link" href="undefined#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="disabled"></a>disabled <span class="propType">bool</span> <a class="hash-link" href="undefined#disabled">#</a></h4><div><p>If true the user won't be able to toggle the switch.
Default value is false.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="onvaluechange"></a>onValueChange <span class="propType">function</span> <a class="hash-link" href="undefined#onvaluechange">#</a></h4><div><p>Invoked with the new value when the value changes.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="testid"></a>testID <span class="propType">string</span> <a class="hash-link" href="undefined#testid">#</a></h4><div><p>Used to locate this view in end-to-end tests.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="value"></a>value <span class="propType">bool</span> <a class="hash-link" href="undefined#value">#</a></h4><div><p>The value of the switch.  If true the switch will be turned on.
Default value is false.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="ontintcolor"></a><span class="platform">ios</span>onTintColor <span class="propType"><a href="colors.html">color</a></span> <a class="hash-link" href="undefined#ontintcolor">#</a></h4><div><p>Background color when the switch is turned on.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="thumbtintcolor"></a><span class="platform">ios</span>thumbTintColor <span class="propType"><a href="colors.html">color</a></span> <a class="hash-link" href="undefined#thumbtintcolor">#</a></h4><div><p>Color of the foreground switch grip.</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="tintcolor"></a><span class="platform">ios</span>tintColor <span class="propType"><a href="colors.html">color</a></span> <a class="hash-link" href="undefined#tintcolor">#</a></h4><div><p>Background color when the switch is turned off.</p></div></div></div></div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="undefined#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/SwitchExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Switch<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

<span class="token keyword">var</span> BasicSwitchExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      trueSwitchIsOn<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
      falseSwitchIsOn<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
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
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> DisabledSwitchExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
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
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> ColorSwitchExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      colorTrueSwitchIsOn<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
      colorFalseSwitchIsOn<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
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
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> EventSwitchExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  <span class="token function">getInitialState<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      eventSwitchIsOn<span class="token punctuation">:</span> <span class="token boolean">false</span><span class="token punctuation">,</span>
      eventSwitchRegressionIsOn<span class="token punctuation">:</span> <span class="token boolean">true</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
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
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> examples <span class="token operator">=</span> <span class="token punctuation">[</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Switches can be set to true or false'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;BasicSwitchExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Switches can be disabled'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;DisabledSwitchExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Change events can be detected'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;EventSwitchExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Switches are controlled components'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;Switch <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">]</span><span class="token punctuation">;</span>

<span class="token keyword">if</span> <span class="token punctuation">(</span>React<span class="token punctuation">.</span>Platform<span class="token punctuation">.</span>OS <span class="token operator">===</span> <span class="token string">'ios'</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
  examples<span class="token punctuation">.</span><span class="token function">push<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'Custom colors can be provided'</span><span class="token punctuation">,</span>
    <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span><span class="token punctuation">:</span> ReactElement <span class="token punctuation">{</span> <span class="token keyword">return</span> &lt;ColorSwitchExample <span class="token operator">/</span><span class="token operator">&gt;</span><span class="token punctuation">;</span> <span class="token punctuation">}</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span>

exports<span class="token punctuation">.</span>title <span class="token operator">=</span> <span class="token string">'&lt;Switch&gt;'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>displayName <span class="token operator">=</span> <span class="token string">'SwitchExample'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>description <span class="token operator">=</span> <span class="token string">'Native boolean input'</span><span class="token punctuation">;</span>
exports<span class="token punctuation">.</span>examples <span class="token operator">=</span> examples<span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="tabbarios.html#content">Next →</a></div>