import*as e from"../../core/common/common.js";import*as t from"../../core/host/host.js";import*as n from"../../core/i18n/i18n.js";import*as o from"../../core/sdk/sdk.js";import*as i from"../../third_party/marked/marked.js";import*as s from"../../ui/components/buttons/buttons.js";import*as a from"../../ui/components/icon_button/icon_button.js";import*as r from"../../ui/components/input/input.js";import*as l from"../../ui/components/markdown_view/markdown_view.js";import*as c from"../../ui/legacy/legacy.js";import*as d from"../../ui/lit-html/lit-html.js";import*as h from"../../ui/visual_logging/visual_logging.js";import*as g from"../../models/bindings/bindings.js";import*as u from"../../models/formatter/formatter.js";import*as m from"../../models/logs/logs.js";import*as p from"../../ui/legacy/components/utils/utils.js";import*as f from"../console/console.js";const y=1e3;var v;!function(e){e.MESSAGE="message",e.STACKTRACE="stacktrace",e.NETWORK_REQUEST="networkRequest",e.RELATED_CODE="relatedCode"}(v||(v={}));class x{#e;constructor(e){this.#e=e}async getNetworkRequest(){const e=this.#e.consoleMessage().getAffectedResources()?.requestId;if(!e)return;return m.NetworkLog.NetworkLog.instance().requestsForId(e)[0]}async getMessageSourceCode(){const e=this.#e.consoleMessage().stackTrace?.callFrames[0],t=this.#e.consoleMessage().runtimeModel(),n=t?.debuggerModel();if(!n||!t||!e)return{text:"",columnNumber:0,lineNumber:0};const i=new o.DebuggerModel.Location(n,e.scriptId,e.lineNumber,e.columnNumber),s=await g.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().rawLocationToUILocation(i),a=await(s?.uiSourceCode.requestContent()),r=!a?.isEncoded&&a?.content?a.content:"",l=r.indexOf("\n");if(r.length>y&&(l<0||l>y)){const{formattedContent:e,formattedMapping:t}=await u.ScriptFormatter.formatScriptContent(s?.uiSourceCode.mimeType()??"text/javascript",r),[n,o]=t.originalToFormatted(s?.lineNumber??0,s?.columnNumber??0);return{text:e,columnNumber:o,lineNumber:n}}return{text:r,columnNumber:s?.columnNumber??0,lineNumber:s?.lineNumber??0}}async buildPrompt(e=Object.values(v)){const[t,n]=await Promise.all([e.includes(v.RELATED_CODE)?this.getMessageSourceCode():void 0,e.includes(v.NETWORK_REQUEST)?this.getNetworkRequest():void 0]),o=t?.text?b(t):"",i=n?T(n):"",s=e.includes(v.STACKTRACE)?C(this.#e):"",a=$(this.#e),r=this.formatPrompt({message:[a,s].join("\n").trim(),relatedCode:o,relatedRequest:i}),l=[{type:v.MESSAGE,value:a}];return s&&l.push({type:v.STACKTRACE,value:s}),o&&l.push({type:v.RELATED_CODE,value:o}),i&&l.push({type:v.NETWORK_REQUEST,value:i}),{prompt:r,sources:l}}formatPrompt({message:e,relatedCode:t,relatedRequest:n}){let o=`Why does browser show an error\n${e}`;return t&&(o+=`\nFor the following code in my web app\n\n\`\`\`\n${t}\n\`\`\``),n&&(o+=`\nFor the following network request in my web app\n\n\`\`\`\n${n}\n\`\`\``),o}}function k(e){const t=e.name.toLowerCase().trim();return!t.startsWith("x-")&&("cookie"!==t&&"set-cookie"!==t&&"authorization"!==t)}function w(e){const t=/^\s*/.exec(e);if(!t||!t.length)return null;const n=t[0];return n===e?null:n}function b({text:e,columnNumber:t,lineNumber:n},o=1e3){const i=e.split("\n");if(i[n].length>=o/2){const e=Math.max(t-o/2,0),s=Math.min(t+o/2,i[n].length);return i[n].substring(e,s)}let s=0,a=n,r=w(i[n]);const l=new Map;for(;void 0!==i[a]&&s+i[a].length<=o/2;){const e=w(i[a]);null===e||null===r||e!==r&&e.startsWith(r)||(/^\s*[\}\)\]]/.exec(i[a])||l.set(e,a),r=e),s+=i[a].length+1,a--}a=n+1;let c=n,d=n;for(r=w(i[n]);void 0!==i[a]&&s+i[a].length<=o;){s+=i[a].length;const e=w(i[a]);if(null!==e&&null!==r&&(e===r||!e.startsWith(r))){const t=i[a+1],n=t?w(t):null;n&&n!==e&&n.startsWith(e)||l.has(e)&&(c=l.get(e)??0,d=a),r=e}a++}return i.slice(c,d+1).join("\n")}function T(e){return`Request: ${e.url()}\n\nRequest headers:\n${e.requestHeaders().filter(k).map((e=>`${e.name}: ${e.value}`)).join("\n")}\n\nResponse headers:\n${e.responseHeaders.filter(k).map((e=>`${e.name}: ${e.value}`)).join("\n")}\n\nResponse status: ${e.statusCode} ${e.statusText}`}function $(e){return e.toMessageTextString()}function C(e){const t=e.contentElement().querySelector(".stack-preview-container");if(!t)return"";const n=t.shadowRoot?.querySelector(".stack-preview-container");return n.childTextNodes().filter((e=>!e.parentElement?.closest(".show-all-link,.show-less-link,.hidden-row"))).map(p.Linkifier.Linkifier.untruncatedNodeText).join("").trim()}const S=new CSSStyleSheet;S.replaceSync('*{padding:0;margin:0;box-sizing:border-box}:host{--max-height:2000px;--loading-max-height:140px;font-family:var(--default-font-family);font-size:inherit;display:block;overflow:hidden;max-height:0}:host-context(.opening){animation:expand-to-loading var(--sys-motion-duration-medium2) var(--sys-motion-easing-emphasized);animation-fill-mode:forwards}:host-context(.loaded){animation:expand-to-full var(--sys-motion-duration-medium2) var(--sys-motion-easing-emphasized);animation-fill-mode:forwards}:host-context(.closing){animation:collapse var(--sys-motion-duration-medium2) var(--sys-motion-easing-emphasized);animation-fill-mode:forwards}@keyframes expand-to-loading{from{max-height:0}to{max-height:var(--loading-max-height)}}@keyframes expand-to-full{from{max-height:var(--actual-height,var(--loading-max-height))}to{max-height:var(--max-height)}}@keyframes collapse{from{max-height:var(--actual-height,var(--max-height))}to{max-height:0;margin-top:0;margin-bottom:0}}.wrapper{padding:16px;background-color:var(--sys-color-cdt-base-container);border-radius:16px;container-type:inline-size}.wrapper.top{border-radius:16px 16px 4px 4px}.wrapper.bottom{margin-top:5px;border-radius:4px 4px 16px 16px}header{display:flex;flex-direction:row;gap:6px;color:var(--sys-color-on-surface);font-size:13px;font-style:normal;font-weight:500;height:14px}header > .filler{flex:1}main{--override-markdown-view-message-color:var(--sys-color-on-surface);margin:12px 0 0;color:var(--sys-color-on-surface);font-size:12px;font-style:normal;font-weight:400;line-height:20px;p{margin-block-start:1em;margin-block-end:1em}ul{list-style-type:none;list-style-position:inside;padding-inline-start:0.2em;li{display:list-item;list-style-type:disc}li::marker{font-size:11px;line-height:1}}label{display:inline-flex;flex-direction:row;gap:0.5em;input,\n    span{vertical-align:middle}input[type="checkbox"]{margin-top:0.3em}}}devtools-markdown-view{margin-bottom:12px}footer{display:flex;flex-direction:row;align-items:center;color:var(--sys-color-on-surface);font-style:normal;font-weight:400;line-height:normal;margin-top:14px;gap:32px}@container (max-width: 600px){footer{gap:8px}}footer > .filler{flex:1}footer .rating{display:flex;flex-direction:row;gap:8px}textarea{height:84px;padding:10px;border-radius:8px;border:1px solid var(--sys-color-neutral-outline);width:100%;font-family:var(--default-font-family);font-size:inherit}.buttons{display:flex;flex-wrap:wrap;gap:5px}.disclaimer{display:flex;gap:2px;color:var(--sys-color-on-surface-subtle);font-size:11px;align-items:flex-start;flex-direction:column;max-width:360px}.link{color:var(--sys-color-primary);text-decoration-line:underline;devtools-icon{color:var(--sys-color-primary);width:14px;height:14px}}.loader{background:linear-gradient(130deg,transparent 0%,var(--sys-color-gradient-tertiary) 20%,var(--sys-color-gradient-primary) 40%,transparent 60%,var(--sys-color-gradient-tertiary) 80%,var(--sys-color-gradient-primary) 100%);background-position:0% 0%;background-size:250% 250%;animation:gradient 5s infinite linear}@keyframes gradient{0%{background-position:0 0}100%{background-position:100% 100%}}summary{font-size:12px;font-style:normal;font-weight:400;line-height:20px}details{--collapsed-height:20px;overflow:hidden;height:var(--collapsed-height)}details[open]{height:calc(var(--list-height) + var(--collapsed-height) + 8px);transition:height var(--sys-motion-duration-short4) var(--sys-motion-easing-emphasized)}h2{display:block;font-size:inherit;margin:0;font-weight:inherit}.info{width:20px;height:20px}devtools-icon[name="spark"]{color:var(--sys-color-primary-bright)}devtools-icon[name="dog-paw"]{width:16px;height:16px}\n/*# sourceURL=./components/consoleInsight.css */\n');const N=new CSSStyleSheet;N.replaceSync('*{padding:0;margin:0;box-sizing:border-box}:host{display:block}ul{color:var(--sys-color-primary);font-size:12px;font-style:normal;font-weight:400;line-height:18px;margin-top:8px}li{list-style-type:none}ul .link{color:var(--sys-color-primary);display:inline-flex!important;align-items:center;gap:4px;text-decoration-line:underline}devtools-icon[name="open-externally"]{color:var(--icon-link);height:16px;width:16px}\n/*# sourceURL=./components/consoleInsightSourcesList.css */\n');const I={consoleMessage:"Console message",stackTrace:"Stacktrace",networkRequest:"Network request",relatedCode:"Related code",generating:"Insight generation is in progress…",insight:"Insight",closeInsight:"Close insight",inputData:"Data used to create this insight",thumbsUp:"Thumbs up",thumbsDown:"Thumbs down",submitFeedback:"Submit feedback",error:"Console insights has encountered an error",errorBody:"Something went wrong. Try again.",opensInNewTab:"(opens in a new tab)",learnMore:"Learn more",notAvailable:"Console insights is not available",notLoggedIn:"This feature is only available when you sign into Chrome with your Google account.",syncIsOff:"This feature requires you to turn on Chrome sync.",updateSettings:"Update Settings",offlineHeader:"Console insights can’t reach the internet",offline:"Check your internet connection and try again.",signInToUse:"Sign in to use Console insights",cancel:"Cancel"},M=n.i18n.registerUIStrings("panels/explain/components/ConsoleInsight.ts",I),E=n.i18n.getLocalizedString.bind(void 0,M),{render:R,html:B,Directives:A}=d;class L extends Event{static eventName="close";constructor(){super(L.eventName,{composed:!0,bubbles:!0})}}function F(e){switch(e){case v.MESSAGE:return E(I.consoleMessage);case v.STACKTRACE:return E(I.stackTrace);case v.NETWORK_REQUEST:return E(I.networkRequest);case v.RELATED_CODE:return E(I.relatedCode)}}const j="http://go/console-insights-experiment";class O extends HTMLElement{static async create(e,n,o){const i=await new Promise((e=>{t.InspectorFrontendHost.InspectorFrontendHostInstance.getSyncInformation((t=>{e(t)}))}));return new O(e,n,o,i)}static litTagName=d.literal`devtools-console-insight`;#t=this.attachShadow({mode:"open"});#n="";#o;#i;#s=new P;#a;#r;constructor(e,t,n,o){super(),this.#o=e,this.#i=t,this.#n=n??"",this.#a={type:"not-logged-in"},o?.accountEmail&&o.isSyncActive?this.#a={type:"loading",consentReminderConfirmed:!1,consentOnboardingFinished:this.#l().get()}:o?.accountEmail?o?.isSyncActive||(this.#a={type:"sync-is-off"}):this.#a={type:"not-logged-in"},navigator.onLine||(this.#a={type:"offline"}),this.#c(),this.addEventListener("keydown",(e=>{e.stopPropagation()})),this.addEventListener("keyup",(e=>{e.stopPropagation()})),this.addEventListener("keypress",(e=>{e.stopPropagation()})),this.addEventListener("click",(e=>{e.stopPropagation()})),this.tabIndex=0,this.focus(),this.addEventListener("animationend",(()=>{this.style.setProperty("--actual-height",`${this.offsetHeight}px`)}))}#l(){return e.Settings.Settings.instance().createLocalSetting("console-insights-onboarding-finished",!1)}connectedCallback(){this.#t.adoptedStyleSheets=[S,r.checkboxStyles],this.classList.add("opening"),this.#d()}#h(e){const t=this.#a;this.#a=e,e.type!==t.type&&"loading"===t.type&&this.classList.add("loaded"),this.#c()}async#d(){if("loading"===this.#a.type)if(this.#a.consentOnboardingFinished)if(this.#a.consentReminderConfirmed);else{const{sources:e}=await this.#o.buildPrompt();this.#h({type:"consent-reminder",sources:e})}else this.#h({type:"consent-onboarding",page:"private"})}#g(){this.dispatchEvent(new L),this.classList.add("closing")}#u(){if("insight"!==this.#a.type)throw new Error("Unexpected state");const e=function(e,t,n,o,i,s,a){const r="Negative"===e?{"entry.1465663861":e,"entry.1232404632":n,"entry.37285503":i,"entry.542010749":o,"entry.420621380":s,"entry.822323774":a}:{"entry.1465663861":e,"entry.1805879004":n,"entry.720239045":i,"entry.623054399":o,"entry.1520357991":s,"entry.1966708581":a};return`http://go/console-insights-experiment-rating?usp=pp_url&${Object.keys(r).map((e=>`${e}=${encodeURIComponent(r[e])}`)).join("&")}`}(this.#r?"Positive":"Negative",this.#t.querySelector("textarea")?.value,this.#a.explanation,this.#a.sources.filter((e=>e.type===v.MESSAGE)).map((e=>e.value)).join("\n"),this.#a.sources.filter((e=>e.type===v.STACKTRACE)).map((e=>e.value)).join("\n"),this.#a.sources.filter((e=>e.type===v.RELATED_CODE)).map((e=>e.value)).join("\n"),this.#a.sources.filter((e=>e.type===v.NETWORK_REQUEST)).map((e=>e.value)).join("\n"));t.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(e)}#m(e){if("insight"!==this.#a.type)throw new Error("Unexpected state");this.#r="true"===e.target.dataset.rating,this.#r?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightRatedPositive):t.userMetrics.actionTaken(t.UserMetrics.Action.InsightRatedNegative),t.InspectorFrontendHost.InspectorFrontendHostInstance.registerAidaClientEvent(JSON.stringify({client:"CHROME_DEVTOOLS",event_time:(new Date).toISOString(),corresponding_aida_rpc_global_id:this.#a.metadata?.rpcGlobalId,do_conversation_client_event:{user_feedback:{sentiment:this.#r?"POSITIVE":"NEGATIVE"}}})),this.#u()}async#p(){this.#h({type:"loading",consentReminderConfirmed:!0,consentOnboardingFinished:this.#l().get()});try{for await(const{sources:e,explanation:t,metadata:n}of this.#f()){const o=this.#y(t),i=!1!==o;this.#h({type:"insight",tokens:i?o:[],validMarkdown:i,explanation:t,sources:e,metadata:n})}t.userMetrics.actionTaken(t.UserMetrics.Action.InsightGenerated)}catch(e){t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErrored),this.#h({type:"error",error:e.message})}}#y(e){try{const t=i.Marked.lexer(e);for(const e of t)this.#s.renderToken(e);return t}catch{return t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredMarkdown),!1}}async*#f(){const{prompt:e,sources:n}=await this.#o.buildPrompt();try{for await(const t of this.#i.fetch(e))yield{sources:n,...t}}catch(e){throw t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredApi),e}}#v(){const e=o.TargetManager.TargetManager.instance().rootTarget();if(null===e)return;const n="chrome://settings";e.targetAgent().invoke_createTarget({url:n}).then((e=>{e.getError()&&t.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(n)}))}#x(){try{e.Settings.moduleSetting("console-insights-enabled").set(!1)}finally{this.#g(),c.InspectorView.InspectorView.instance().displayReloadRequiredWarning("Reload for the change to apply.")}}#k(){this.#h({type:"consent-onboarding",page:"legal"})}#w(){const e=this.#t.querySelector(".terms");return!!e?.checked}#b(){this.#w()&&(this.#l().set(!0),this.#h({type:"loading",consentReminderConfirmed:!1,consentOnboardingFinished:this.#l().get()}),this.#d())}#T(){this.#h({type:"consent-onboarding",page:"private"})}#$(){return B`<${s.Button.Button.litTagName}
      class="cancel-button"
      @click=${this.#g}
      .data=${{variant:"secondary"}}
    >
      ${I.cancel}
    </${s.Button.Button.litTagName}>`}#C(){return B`<${s.Button.Button.litTagName}
      @click=${this.#x}
      class="disable-button"
      .data=${{variant:"secondary"}}
    >
      Disable this feature
    </${s.Button.Button.litTagName}>`}#S(){return B`<${s.Button.Button.litTagName}
      class="next-button"
      @click=${this.#k}
      .data=${{variant:"primary"}}
    >
      Next
    </${s.Button.Button.litTagName}>`}#N(){return B`<${s.Button.Button.litTagName}
      @click=${this.#T}
      .data=${{variant:"secondary"}}
    >
      Back
    </${s.Button.Button.litTagName}>`}#I(e,t=!1){return B`<${s.Button.Button.litTagName}
      @click=${e}
      class="continue-button"
      .data=${{variant:"primary",disabled:t}}
    >
      Continue
    </${s.Button.Button.litTagName}>`}#M(){return B`<x-link href=${j} class="link">Learn more about Console insights</x-link>`}#E(){this.#c()}#R(){switch(this.#a.type){case"loading":return B`<main>
            <div role="presentation" class="loader" style="clip-path: url('#clipPath');">
              <svg width="100%" height="64">
                <clipPath id="clipPath">
                  <rect x="0" y="0" width="100%" height="16" rx="8"></rect>
                  <rect x="0" y="24" width="100%" height="16" rx="8"></rect>
                  <rect x="0" y="48" width="100%" height="16" rx="8"></rect>
                </clipPath>
              </svg>
            </div>
          </main>`;case"insight":return B`
        <main>
          ${this.#a.validMarkdown?B`<${l.MarkdownView.MarkdownView.litTagName}
              .data=${{tokens:this.#a.tokens,renderer:this.#s}}>
            </${l.MarkdownView.MarkdownView.litTagName}>`:this.#a.explanation}
          <details style="--list-height: ${20*this.#a.sources.length}px;">
            <summary>${E(I.inputData)}</summary>
            <${D.litTagName} .sources=${this.#a.sources}>
            </${D.litTagName}>
          </details>
        </main>`;case"error":return B`
        <main>
          <div class="error">${E(I.errorBody)}</div>
        </main>`;case"consent-reminder":return B`
          <main>
            <p>The following data will be sent to Google to understand the context for the console message.
            Human reviewers may process this information for quality purposes.
            Don’t submit sensitive information. Read Google’s <x-link href="https://policies.google.com/terms" class="link">Terms of Service</x-link> and
            the <x-link href=${"https://policies.google.com/terms/generative-ai"} class="link">${"Generative"} AI Additional Terms of Service</x-link>.</p>
            <${D.litTagName} .sources=${this.#a.sources}>
            </${D.litTagName}>
          </main>
        `;case"consent-onboarding":switch(this.#a.page){case"private":return B`<main>
              <p>This notice and our <x-link href="https://policies.google.com/privacy" class="link">Privacy Notice</x-link> describe how Console insights in Chrome DevTools handles your data. Please read them carefully.</p>

              <p>Console insights uses the console message, associated stack trace, related source code, and the associated network headers as input data. When you use Console insights, Google collects this input data, generated output, related feature usage information, and your feedback. Google uses this data to provide, improve, and develop Google products and services and machine learning technologies, including Google's enterprise products such as Google Cloud.</p>

              <p>To help with quality and improve our products, human reviewers may read, annotate, and process the above-mentioned input data, generated output, related feature usage information, and your feedback. <strong>Please do not include sensitive (e.g., confidential) or personal information that can be used to identify you or others in your prompts or feedback.</strong> Your data will be stored in a way where Google cannot tell who provided it and can no longer fulfill any deletion requests and will be retained for up to 18 months.</p>
            </main>`;case"legal":return B`<main>
            <p>As you try Console insights, here are key things to know:

            <ul>
              <li>Console insights uses console message, associated stack trace, related source code, and the associated network headers to provide answers.</li>
              <li>Console insights is an experimental technology, and may generate inaccurate or offensive information that doesn't represent Google's views. Voting on the responses will help make Console insights better.</li>
              <li>Console insights is an experimental feature and subject to future changes.</li>
              <li><strong><x-link class="link" href="https://support.google.com/legal/answer/13505487">Use generated code snippets with caution</x-link>.</strong></li>
            </ul>
            </p>

            <p>
            <label>
              <input class="terms" @change=${this.#E} type="checkbox">
              <span>I accept my use of Console insights is subject to the <x-link href="https://policies.google.com/terms" class="link">Google Terms of Service</x-link> and the <x-link href=${"https://policies.google.com/terms/generative-ai"} class="link">${"Generative"} AI Additional Terms of Service</x-link>.</span>
            </label>
            </p>
            </main>`}case"not-logged-in":return B`
          <main>
            <div class="error">${E(I.notLoggedIn)}</div>
          </main>`;case"sync-is-off":return B`
          <main>
            <div class="error">${E(I.syncIsOff)}</div>
          </main>`;case"offline":return B`
          <main>
            <div class="error">${E(I.offline)}</div>
          </main>`}}#B(){return B`<x-link href=${"http://go/console-insights-experiment-general-feedback"} class="link">${E(I.submitFeedback)}</x-link>`}#A(){const e=d.html`<span>
                Console insights may display inaccurate or offensive information that doesn't represent Google's views.
                <x-link href=${j} class="link">${E(I.learnMore)}</x-link>
                ${(()=>"insight"===this.#a.type||"error"===this.#a.type||"offline"===this.#a.type)()?d.html` - ${this.#B()}`:d.nothing}
            </span>`;switch(this.#a.type){case"loading":return d.nothing;case"error":case"offline":return B`<footer>
          <div class="disclaimer">
            ${e}
          </div>
        </footer>`;case"not-logged-in":case"sync-is-off":return B`<footer>
        <div class="filler"></div>
        <div>
          <${s.Button.Button.litTagName}
            @click=${this.#v}
            .data=${{variant:"primary"}}
          >
            ${I.updateSettings}
          </${s.Button.Button.litTagName}>
        </div>
      </footer>`;case"consent-reminder":return B`<footer>
          <div class="disclaimer">
            ${e}
          </div>
          <div class="filler"></div>
          <div class="buttons">
            ${this.#$()}
            ${this.#I(this.#p)}
          </div>
        </footer>`;case"consent-onboarding":switch(this.#a.page){case"private":return B`<footer>
                <div class="disclaimer">
                  ${this.#M()}
                </div>
                <div class="filler"></div>
                <div class="buttons">
                    ${this.#$()}
                    ${this.#C()}
                    ${this.#S()}
                  </div>
              </footer>`;case"legal":return B`<footer>
            <div class="disclaimer">
              ${this.#M()}
            </div>
            <div class="filler"></div>
            <div class="buttons">
                ${this.#N()}
                ${this.#C()}
                ${this.#I(this.#b,!this.#w())}
              </div>
          </footer>`}case"insight":return B`<footer>
        <div class="disclaimer">
          ${e}
        </div>
        <div class="filler"></div>
        <div class="rating">
          <${s.Button.Button.litTagName}
            data-rating=${"true"}
            .data=${{variant:"round",size:"SMALL",iconName:"thumb-up",active:this.#r,title:E(I.thumbsUp)}}
            @click=${this.#m}
          ></${s.Button.Button.litTagName}>
          <${s.Button.Button.litTagName}
            data-rating=${"false"}
            .data=${{variant:"round",size:"SMALL",iconName:"thumb-down",active:void 0!==this.#r&&!this.#r,title:E(I.thumbsDown)}}
            @click=${this.#m}
          ></${s.Button.Button.litTagName}>
        </div>

      </footer>`}}#L(){switch(this.#a.type){case"not-logged-in":return E(I.signInToUse);case"sync-is-off":return E(I.notAvailable);case"offline":return E(I.offlineHeader);case"loading":return E(I.generating);case"insight":return E(I.insight);case"error":return E(I.error);case"consent-reminder":return this.#n;case"consent-onboarding":switch(this.#a.page){case"private":return"Console insights Privacy Notice";case"legal":return"Console insights Legal Notice"}}}#c(){R(B`
      <div class="wrapper">
        <header>
          <div class="filler">
            <h2>
              ${this.#L()}
            </h2>
          </div>
          <div>
            <${s.Button.Button.litTagName}
              .data=${{variant:"round",size:"SMALL",iconName:"cross",title:E(I.closeInsight)}}
              jslog=${h.close().track({click:!0})}
              @click=${this.#g}
            ></${s.Button.Button.litTagName}>
          </div>
        </header>
        ${this.#R()}
        ${this.#A()}
      </div>
    `,this.#t,{host:this})}}class D extends HTMLElement{static litTagName=d.literal`devtools-console-insight-sources-list`;#t=this.attachShadow({mode:"open"});#F=[];constructor(){super(),this.#t.adoptedStyleSheets=[N,r.checkboxStyles]}#c(){R(B`
      <ul>
        ${A.repeat(this.#F,(e=>e.value),(e=>B`<li><x-link class="link" title="${F(e.type)} ${E(I.opensInNewTab)}" href=${`data:text/plain,${encodeURIComponent(e.value)}`}>
            <${a.Icon.Icon.litTagName} name="open-externally"></${a.Icon.Icon.litTagName}>
            ${F(e.type)}
          </x-link></li>`))}
      </ul>
    `,this.#t,{host:this})}set sources(e){this.#F=e,this.#c()}}customElements.define("devtools-console-insight",O),customElements.define("devtools-console-insight-sources-list",D);class P extends l.MarkdownView.MarkdownLitRenderer{renderToken(e){const t=this.templateForToken(e);return null===t?d.html`${e.raw}`:t}templateForToken(e){switch(e.type){case"heading":return B`<strong>${this.renderText(e)}</strong>`;case"link":case"image":return d.html`${c.XLink.XLink.create(e.href,e.text,void 0,void 0,"token")}`;case"code":return d.html`<${l.CodeBlock.CodeBlock.litTagName}
          .code=${this.unescape(e.text)}
          .codeLang=${e.lang}
          .displayNotice=${!0}>
        </${l.CodeBlock.CodeBlock.litTagName}>`}return super.templateForToken(e)}}class _{handleAction(e,n){switch(n){case"explain.console-message.context":case"explain.console-message.context.error":case"explain.console-message.context.warning":case"explain.console-message.context.other":case"explain.console-message.hover":{const o=c.ActionRegistry.ActionRegistry.instance().getAction(n),i=e.flavor(f.ConsoleViewMessage.ConsoleViewMessage);if(i){n.startsWith("explain.console-message.context")?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightRequestedViaContextMenu):"explain.console-message.hover"===n&&t.userMetrics.actionTaken(t.UserMetrics.Action.InsightRequestedViaHoverButton);const e=new x(i),s=new t.AidaClient.AidaClient;return O.create(e,s,o?.title()).then((e=>{i.setInsight(e)})),!0}return!1}}return!1}}export{_ as ActionDelegate,L as CloseEvent,O as ConsoleInsight,P as MarkdownRenderer,x as PromptBuilder,v as SourceType,k as allowHeader,$ as formatConsoleMessage,T as formatNetworkRequest,b as formatRelatedCode,C as formatStackTrace,w as lineWhitespace};
