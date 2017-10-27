---
id: version-0.44-alert
title: alert
original_id: alert
---
<a id="content"></a><h1><a class="anchor" name="alert"></a>Alert <a class="hash-link" href="docs/alert.html#alert">#</a></h1><div><div><p>Launches an alert dialog with the specified title and message.</p><p>Optionally provide a list of buttons. Tapping any button will fire the
respective onPress callback and dismiss the alert. By default, the only
button will be an 'OK' button.</p><p>This is an API that works both on iOS and Android and can show static
alerts. To show an alert that prompts the user to enter some information,
see <code>AlertIOS</code>; entering text in an alert is common on iOS only.</p><h2><a class="anchor" name="ios"></a>iOS <a class="hash-link" href="docs/alert.html#ios">#</a></h2><p>On iOS you can specify any number of buttons. Each button can optionally
specify a style, which is one of 'default', 'cancel' or 'destructive'.</p><h2><a class="anchor" name="android"></a>Android <a class="hash-link" href="docs/alert.html#android">#</a></h2><p>On Android at most three buttons can be specified. Android has a concept
of a neutral, negative and a positive button:</p><ul><li>If you specify one button, it will be the 'positive' one (such as 'OK')</li><li>Two buttons mean 'negative', 'positive' (such as 'Cancel', 'OK')</li><li>Three buttons mean 'neutral', 'negative', 'positive' (such as 'Later', 'Cancel', 'OK')</li></ul><p>By default alerts on Android can be dismissed by tapping outside of the alert
box. This event can be handled by providing an optional <code>options</code> parameter,
with an <code>onDismiss</code> callback property <code>{ onDismiss: () =&gt; {} }</code>.</p><p>Alternatively, the dismissing behavior can be disabled altogether by providing
an optional <code>options</code> parameter with the <code>cancelable</code> property set to <code>false</code>
i.e. <code>{ cancelable: false }</code></p><p>Example usage:</p><div class="prism language-javascript"><span class="token comment" spellcheck="true">// Works on both iOS and Android
</span>Alert<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
  <span class="token string">'Alert Title'</span><span class="token punctuation">,</span>
  <span class="token string">'My Alert Msg'</span><span class="token punctuation">,</span>
  <span class="token punctuation">[</span>
    <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Ask me later'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Ask me later pressed'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Cancel'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Cancel Pressed'</span><span class="token punctuation">)</span><span class="token punctuation">,</span> style<span class="token punctuation">:</span> <span class="token string">'cancel'</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
    <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'OK'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'OK Pressed'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
  <span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token punctuation">{</span> cancelable<span class="token punctuation">:</span> <span class="token boolean">false</span> <span class="token punctuation">}</span>
<span class="token punctuation">)</span></div></div><span><h3><a class="anchor" name="methods"></a>Methods <a class="hash-link" href="docs/alert.html#methods">#</a></h3><div class="props"><div class="prop"><h4 class="methodTitle"><a class="anchor" name="alert"></a><span class="methodType">static </span>alert<span class="methodType">(title, message?, buttons?, options?, type?)</span> <a class="hash-link" href="docs/alert.html#alert">#</a></h4></div></div></span></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/Libraries/Alert/Alert.js">edit the content above on GitHub</a> and send us a pull request!</p><div><div><table width="100%"><tbody><tr><td><h3><a class="anchor" name="examples"></a>Examples <a class="hash-link" href="docs/alert.html#examples">#</a></h3></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/js/AlertExample.js">Edit on GitHub</a></td></tr></tbody></table><div class="example-container"><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> ReactNative <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  Alert<span class="token punctuation">,</span>
  StyleSheet<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  TouchableHighlight<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> ReactNative<span class="token punctuation">;</span>

<span class="token keyword">var</span> UIExplorerBlock <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./UIExplorerBlock'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token comment" spellcheck="true">
// corporate ipsum &gt; lorem ipsum
</span><span class="token keyword">var</span> alertMessage <span class="token operator">=</span> <span class="token string">'Credibly reintermediate next-generation potentialities after goal-oriented '</span> <span class="token operator">+</span>
                   <span class="token string">'catalysts for change. Dynamically revolutionize.'</span><span class="token punctuation">;</span>

<span class="token comment" spellcheck="true">/**
 * Simple alert examples.
 */</span>
class <span class="token class-name">SimpleAlertExampleBlock</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View<span class="token operator">&gt;</span>
        &lt;TouchableHighlight style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> Alert<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
            <span class="token string">'Alert Title'</span><span class="token punctuation">,</span>
            alertMessage<span class="token punctuation">,</span>
          <span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>Alert <span class="token keyword">with</span> message and default button&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> Alert<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
            <span class="token string">'Alert Title'</span><span class="token punctuation">,</span>
            alertMessage<span class="token punctuation">,</span>
            <span class="token punctuation">[</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'OK'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'OK Pressed!'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
            <span class="token punctuation">]</span>
          <span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>Alert <span class="token keyword">with</span> one button&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> Alert<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
            <span class="token string">'Alert Title'</span><span class="token punctuation">,</span>
            alertMessage<span class="token punctuation">,</span>
            <span class="token punctuation">[</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Cancel'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Cancel Pressed!'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'OK'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'OK Pressed!'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
            <span class="token punctuation">]</span>
          <span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>Alert <span class="token keyword">with</span> two buttons&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> Alert<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
            <span class="token string">'Alert Title'</span><span class="token punctuation">,</span>
            <span class="token keyword">null</span><span class="token punctuation">,</span>
            <span class="token punctuation">[</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Foo'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Foo Pressed!'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Bar'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Bar Pressed!'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'Baz'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Baz Pressed!'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
            <span class="token punctuation">]</span>
          <span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>Alert <span class="token keyword">with</span> three buttons&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> Alert<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
            <span class="token string">'Foo Title'</span><span class="token punctuation">,</span>
            alertMessage<span class="token punctuation">,</span>
            <span class="token string">'..............'</span><span class="token punctuation">.</span><span class="token function">split<span class="token punctuation">(</span></span><span class="token string">''</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">map<span class="token punctuation">(</span></span><span class="token punctuation">(</span>dot<span class="token punctuation">,</span> index<span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">(</span><span class="token punctuation">{</span>
              text<span class="token punctuation">:</span> <span class="token string">'Button '</span> <span class="token operator">+</span> index<span class="token punctuation">,</span>
              onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'Pressed '</span> <span class="token operator">+</span> index<span class="token punctuation">)</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">)</span>
          <span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>Alert <span class="token keyword">with</span> too many buttons&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
        &lt;TouchableHighlight style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>wrapper<span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> Alert<span class="token punctuation">.</span><span class="token function">alert<span class="token punctuation">(</span></span>
            <span class="token string">'Alert Title'</span><span class="token punctuation">,</span>
            <span class="token keyword">null</span><span class="token punctuation">,</span>
            <span class="token punctuation">[</span>
              <span class="token punctuation">{</span>text<span class="token punctuation">:</span> <span class="token string">'OK'</span><span class="token punctuation">,</span> onPress<span class="token punctuation">:</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> console<span class="token punctuation">.</span><span class="token function">log<span class="token punctuation">(</span></span><span class="token string">'OK Pressed!'</span><span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token punctuation">,</span>
            <span class="token punctuation">]</span><span class="token punctuation">,</span>
            <span class="token punctuation">{</span>
              cancelable<span class="token punctuation">:</span> <span class="token boolean">false</span>
            <span class="token punctuation">}</span>
          <span class="token punctuation">)</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>button<span class="token punctuation">}</span><span class="token operator">&gt;</span>
            &lt;Text<span class="token operator">&gt;</span>Alert that cannot be dismissed&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
          &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
        &lt;<span class="token operator">/</span>TouchableHighlight<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

class <span class="token class-name">AlertExample</span> extends <span class="token class-name">React<span class="token punctuation">.</span>Component</span> <span class="token punctuation">{</span>
  static title <span class="token operator">=</span> <span class="token string">'Alert'</span><span class="token punctuation">;</span>

  static description <span class="token operator">=</span> <span class="token string">'Alerts display a concise and informative message '</span> <span class="token operator">+</span>
  <span class="token string">'and prompt the user to make a decision.'</span><span class="token punctuation">;</span>

  <span class="token function">render<span class="token punctuation">(</span></span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;UIExplorerBlock title<span class="token operator">=</span><span class="token punctuation">{</span><span class="token string">'Alert'</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;SimpleAlertExampleBlock <span class="token operator">/</span><span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>UIExplorerBlock<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span>
<span class="token punctuation">}</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  wrapper<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    borderRadius<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
    marginBottom<span class="token punctuation">:</span> <span class="token number">5</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  button<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    backgroundColor<span class="token punctuation">:</span> <span class="token string">'#eeeeee'</span><span class="token punctuation">,</span>
    padding<span class="token punctuation">:</span> <span class="token number">10</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> <span class="token punctuation">{</span>
  AlertExample<span class="token punctuation">,</span>
  SimpleAlertExampleBlock<span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span></div><div class="embedded-simulator"><p><a class="modal-button-open"><strong>Run this example</strong></a></p><div class="modal-button-open modal-button-open-img"><img alt="Run example in simulator" width="170" height="356" src="img/uiexplorer_main_ios.png"></div><div><div class="modal"><div class="modal-content"><button class="modal-button-close">×</button><div class="center"><iframe class="simulator" src="https://appetize.io/embed/7vdfm9h3e6vuf4gfdm7r5rgc48?device=iphone6s&amp;scale=60&amp;autoplay=false&amp;orientation=portrait&amp;deviceColor=white&amp;params=%7B%22route%22%3A%22Alert%22%7D" width="256" height="550" scrolling="no"></iframe><p>Powered by <a target="_blank" href="https://appetize.io">appetize.io</a></p></div></div></div><div class="modal-backdrop"></div></div></div></div></div></div><div class="docs-prevnext"><a class="docs-prev" href="docs/adsupportios.html#content">← Prev</a><a class="docs-next" href="docs/alertios.html#content">Next →</a></div>