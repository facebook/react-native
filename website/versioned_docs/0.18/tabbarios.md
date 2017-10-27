---
id: version-0.18-tabbarios
title: tabbarios
original_id: tabbarios
---
<a id="content"></a><h1>TabBarIOS</h1><div><noscript></noscript><h3><a class="anchor" name="props"></a><a class="edit-github" href="https://github.com/facebook/react-native/blob/master/Libraries/Components/TabBarIOS/TabBarIOS.ios.js">Edit on GitHub</a>Props <a class="hash-link" href="#props">#</a></h3><div class="props"><div class="prop"><h4 class="propTitle"><a class="anchor" name="view"></a><a href="view.html#props">View props...</a> <a class="hash-link" href="#view">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="bartintcolor"></a>barTintColor <span class="propType">ColorPropType</span> <a class="hash-link" href="#bartintcolor">#</a></h4><div><p>Background color of the tab bar</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="style"></a>style <span class="propType"><a href="view.html#style">View#style</a></span> <a class="hash-link" href="#style">#</a></h4></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="tintcolor"></a>tintColor <span class="propType">ColorPropType</span> <a class="hash-link" href="#tintcolor">#</a></h4><div><p>Color of the currently selected tab icon</p></div></div><div class="prop"><h4 class="propTitle"><a class="anchor" name="translucent"></a>translucent <span class="propType">bool</span> <a class="hash-link" href="#translucent">#</a></h4><div><p>A Boolean value that indicates whether the tab bar is translucent</p></div></div></div></div><div><h3><a class="anchor" name="examples"></a><a class="edit-github" href="https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/TabBarIOSExample.js">Edit on GitHub</a>Examples <a class="hash-link" href="#examples">#</a></h3><div class="prism language-javascript"><span class="token string">'use strict'</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> React <span class="token operator">=</span> <span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'react-native'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> <span class="token punctuation">{</span>
  StyleSheet<span class="token punctuation">,</span>
  TabBarIOS<span class="token punctuation">,</span>
  Text<span class="token punctuation">,</span>
  View<span class="token punctuation">,</span>
<span class="token punctuation">}</span> <span class="token operator">=</span> React<span class="token punctuation">;</span>

<span class="token keyword">var</span> base64Icon <span class="token operator">=</span> <span class="token string">'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABLCAQAAACSR7JhAAADtUlEQVR4Ac3YA2Bj6QLH0XPT1Fzbtm29tW3btm3bfLZtv7e2ObZnms7d8Uw098tuetPzrxv8wiISrtVudrG2JXQZ4VOv+qUfmqCGGl1mqLhoA52oZlb0mrjsnhKpgeUNEs91Z0pd1kvihA3ULGVHiQO2narKSHKkEMulm9VgUyE60s1aWoMQUbpZOWE+kaqs4eLEjdIlZTcFZB0ndc1+lhB1lZrIuk5P2aib1NBpZaL+JaOGIt0ls47SKzLC7CqrlGF6RZ09HGoNy1lYl2aRSWL5GuzqWU1KafRdoRp0iOQEiDzgZPnG6DbldcomadViflnl/cL93tOoVbsOLVM2jylvdWjXolWX1hmfZbGR/wjypDjFLSZIRov09BgYmtUqPQPlQrPapecLgTIy0jMgPKtTeob2zWtrGH3xvjUkPCtNg/tm1rjwrMa+mdUkPd3hWbH0jArPGiU9ufCsNNWFZ40wpwn+62/66R2RUtoso1OB34tnLOcy7YB1fUdc9e0q3yru8PGM773vXsuZ5YIZX+5xmHwHGVvlrGPN6ZSiP1smOsMMde40wKv2VmwPPVXNut4sVpUreZiLBHi0qln/VQeI/LTMYXpsJtFiclUN+5HVZazim+Ky+7sAvxWnvjXrJFneVtLWLyPJu9K3cXLWeOlbMTlrIelbMDlrLenrjEQOtIF+fuI9xRp9ZBFp6+b6WT8RrxEpdK64BuvHgDk+vUy+b5hYk6zfyfs051gRoNO1usU12WWRWL73/MMEy9pMi9qIrR4ZpV16Rrvduxazmy1FSvuFXRkqTnE7m2kdb5U8xGjLw/spRr1uTov4uOgQE+0N/DvFrG/Jt7i/FzwxbA9kDanhf2w+t4V97G8lrT7wc08aA2QNUkuTfW/KimT01wdlfK4yEw030VfT0RtZbzjeMprNq8m8tnSTASrTLti64oBNdpmMQm0eEwvfPwRbUBywG5TzjPCsdwk3IeAXjQblLCoXnDVeoAz6SfJNk5TTzytCNZk/POtTSV40NwOFWzw86wNJRpubpXsn60NJFlHeqlYRbslqZm2jnEZ3qcSKgm0kTli3zZVS7y/iivZTweYXJ26Y+RTbV1zh3hYkgyFGSTKPfRVbRqWWVReaxYeSLarYv1Qqsmh1s95S7G+eEWK0f3jYKTbV6bOwepjfhtafsvUsqrQvrGC8YhmnO9cSCk3yuY984F1vesdHYhWJ5FvASlacshUsajFt2mUM9pqzvKGcyNJW0arTKN1GGGzQlH0tXwLDgQTurS8eIQAAAABJRU5ErkJggg=='</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> TabBarExample <span class="token operator">=</span> React<span class="token punctuation">.</span><span class="token function">createClass<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  statics<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    title<span class="token punctuation">:</span> <span class="token string">'&lt;TabBarIOS&gt;'</span><span class="token punctuation">,</span>
    description<span class="token punctuation">:</span> <span class="token string">'Tab-based navigation.'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  displayName<span class="token punctuation">:</span> <span class="token string">'TabBarExample'</span><span class="token punctuation">,</span>

  getInitialState<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">{</span>
      selectedTab<span class="token punctuation">:</span> <span class="token string">'redTab'</span><span class="token punctuation">,</span>
      notifCount<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
      presses<span class="token punctuation">:</span> <span class="token number">0</span><span class="token punctuation">,</span>
    <span class="token punctuation">}</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  _renderContent<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span>color<span class="token punctuation">:</span> string<span class="token punctuation">,</span> pageText<span class="token punctuation">:</span> string<span class="token punctuation">,</span> num<span class="token operator">?</span><span class="token punctuation">:</span> number<span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;View style<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">[</span>styles<span class="token punctuation">.</span>tabContent<span class="token punctuation">,</span> <span class="token punctuation">{</span>backgroundColor<span class="token punctuation">:</span> color<span class="token punctuation">}</span><span class="token punctuation">]</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>tabText<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span>pageText<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
        &lt;Text style<span class="token operator">=</span><span class="token punctuation">{</span>styles<span class="token punctuation">.</span>tabText<span class="token punctuation">}</span><span class="token operator">&gt;</span><span class="token punctuation">{</span>num<span class="token punctuation">}</span> re<span class="token operator">-</span>renders of the <span class="token punctuation">{</span>pageText<span class="token punctuation">}</span>&lt;<span class="token operator">/</span>Text<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>View<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

  render<span class="token punctuation">:</span> <span class="token keyword">function</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">{</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span>
      &lt;TabBarIOS
        tintColor<span class="token operator">=</span><span class="token string">"white"</span>
        barTintColor<span class="token operator">=</span><span class="token string">"darkslateblue"</span><span class="token operator">&gt;</span>
        &lt;TabBarIOS<span class="token punctuation">.</span>Item
          title<span class="token operator">=</span><span class="token string">"Blue Tab"</span>
          icon<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">{</span>uri<span class="token punctuation">:</span> base64Icon<span class="token punctuation">,</span> scale<span class="token punctuation">:</span> <span class="token number">3</span><span class="token punctuation">}</span><span class="token punctuation">}</span>
          selected<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>selectedTab <span class="token operator">===</span> <span class="token string">'blueTab'</span><span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
              selectedTab<span class="token punctuation">:</span> <span class="token string">'blueTab'</span><span class="token punctuation">,</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderContent<span class="token punctuation">(</span></span><span class="token string">'#414A8C'</span><span class="token punctuation">,</span> <span class="token string">'Blue Tab'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>TabBarIOS<span class="token punctuation">.</span>Item<span class="token operator">&gt;</span>
        &lt;TabBarIOS<span class="token punctuation">.</span>Item
          systemIcon<span class="token operator">=</span><span class="token string">"history"</span>
          badge<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>notifCount <span class="token operator">&gt;</span> <span class="token number">0</span> <span class="token operator">?</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>notifCount <span class="token punctuation">:</span> undefined<span class="token punctuation">}</span>
          selected<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>selectedTab <span class="token operator">===</span> <span class="token string">'redTab'</span><span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
              selectedTab<span class="token punctuation">:</span> <span class="token string">'redTab'</span><span class="token punctuation">,</span>
              notifCount<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>notifCount <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">,</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderContent<span class="token punctuation">(</span></span><span class="token string">'#783E33'</span><span class="token punctuation">,</span> <span class="token string">'Red Tab'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>notifCount<span class="token punctuation">)</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>TabBarIOS<span class="token punctuation">.</span>Item<span class="token operator">&gt;</span>
        &lt;TabBarIOS<span class="token punctuation">.</span>Item
          icon<span class="token operator">=</span><span class="token punctuation">{</span><span class="token function">require<span class="token punctuation">(</span></span><span class="token string">'./flux.png'</span><span class="token punctuation">)</span><span class="token punctuation">}</span>
          title<span class="token operator">=</span><span class="token string">"More"</span>
          selected<span class="token operator">=</span><span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>selectedTab <span class="token operator">===</span> <span class="token string">'greenTab'</span><span class="token punctuation">}</span>
          onPress<span class="token operator">=</span><span class="token punctuation">{</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=</span><span class="token operator">&gt;</span> <span class="token punctuation">{</span>
            <span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">setState<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
              selectedTab<span class="token punctuation">:</span> <span class="token string">'greenTab'</span><span class="token punctuation">,</span>
              presses<span class="token punctuation">:</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>presses <span class="token operator">+</span> <span class="token number">1</span>
            <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
          <span class="token punctuation">}</span><span class="token punctuation">}</span><span class="token operator">&gt;</span>
          <span class="token punctuation">{</span><span class="token keyword">this</span><span class="token punctuation">.</span><span class="token function">_renderContent<span class="token punctuation">(</span></span><span class="token string">'#21551C'</span><span class="token punctuation">,</span> <span class="token string">'Green Tab'</span><span class="token punctuation">,</span> <span class="token keyword">this</span><span class="token punctuation">.</span>state<span class="token punctuation">.</span>presses<span class="token punctuation">)</span><span class="token punctuation">}</span>
        &lt;<span class="token operator">/</span>TabBarIOS<span class="token punctuation">.</span>Item<span class="token operator">&gt;</span>
      &lt;<span class="token operator">/</span>TabBarIOS<span class="token operator">&gt;</span>
    <span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>

<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

<span class="token keyword">var</span> styles <span class="token operator">=</span> StyleSheet<span class="token punctuation">.</span><span class="token function">create<span class="token punctuation">(</span></span><span class="token punctuation">{</span>
  tabContent<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    flex<span class="token punctuation">:</span> <span class="token number">1</span><span class="token punctuation">,</span>
    alignItems<span class="token punctuation">:</span> <span class="token string">'center'</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
  tabText<span class="token punctuation">:</span> <span class="token punctuation">{</span>
    color<span class="token punctuation">:</span> <span class="token string">'white'</span><span class="token punctuation">,</span>
    margin<span class="token punctuation">:</span> <span class="token number">50</span><span class="token punctuation">,</span>
  <span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

module<span class="token punctuation">.</span>exports <span class="token operator">=</span> TabBarExample<span class="token punctuation">;</span></div></div><div class="docs-prevnext"><a class="docs-next" href="tabbarios-item.html#content">Next →</a></div>