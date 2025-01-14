import*as e from"../../core/common/common.js";import*as t from"../../core/host/host.js";import*as n from"../../core/i18n/i18n.js";import*as o from"../../core/sdk/sdk.js";import*as s from"../../third_party/marked/marked.js";import*as i from"../../ui/components/buttons/buttons.js";import*as a from"../../ui/components/icon_button/icon_button.js";import*as r from"../../ui/components/input/input.js";import*as l from"../../ui/components/markdown_view/markdown_view.js";import*as c from"../../ui/legacy/legacy.js";import*as d from"../../ui/lit-html/lit-html.js";import*as g from"../../ui/visual_logging/visual_logging.js";import*as h from"../../models/bindings/bindings.js";import*as u from"../../models/formatter/formatter.js";import*as m from"../../models/logs/logs.js";import*as p from"../../ui/legacy/components/utils/utils.js";import*as f from"../console/console.js";const v=1e3;var y;!function(e){e.MESSAGE="message",e.STACKTRACE="stacktrace",e.NETWORK_REQUEST="networkRequest",e.RELATED_CODE="relatedCode"}(y||(y={}));class k{#e;constructor(e){this.#e=e}async getNetworkRequest(){const e=this.#e.consoleMessage().getAffectedResources()?.requestId;if(!e)return;return m.NetworkLog.NetworkLog.instance().requestsForId(e)[0]}async getMessageSourceCode(){const e=this.#e.consoleMessage().stackTrace?.callFrames[0],t=this.#e.consoleMessage().runtimeModel(),n=t?.debuggerModel();if(!n||!t||!e)return{text:"",columnNumber:0,lineNumber:0};const s=new o.DebuggerModel.Location(n,e.scriptId,e.lineNumber,e.columnNumber),i=await h.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().rawLocationToUILocation(s),a=await(i?.uiSourceCode.requestContent()),r=!a?.isEncoded&&a?.content?a.content:"",l=r.indexOf("\n");if(r.length>v&&(l<0||l>v)){const{formattedContent:e,formattedMapping:t}=await u.ScriptFormatter.formatScriptContent(i?.uiSourceCode.mimeType()??"text/javascript",r),[n,o]=t.originalToFormatted(i?.lineNumber??0,i?.columnNumber??0);return{text:e,columnNumber:o,lineNumber:n}}return{text:r,columnNumber:i?.columnNumber??0,lineNumber:i?.lineNumber??0}}async buildPrompt(e=Object.values(y)){const[t,n]=await Promise.all([e.includes(y.RELATED_CODE)?this.getMessageSourceCode():void 0,e.includes(y.NETWORK_REQUEST)?this.getNetworkRequest():void 0]),o=t?.text?w(t):"",s=n?$(n):"",i=e.includes(y.STACKTRACE)?R(this.#e):"",a=C(this.#e),r=this.formatPrompt({message:[a,i].join("\n").trim(),relatedCode:o,relatedRequest:s}),l=[{type:y.MESSAGE,value:a}];return i&&l.push({type:y.STACKTRACE,value:i}),o&&l.push({type:y.RELATED_CODE,value:o}),s&&l.push({type:y.NETWORK_REQUEST,value:s}),{prompt:r,sources:l,isPageReloadRecommended:e.includes(y.NETWORK_REQUEST)&&Boolean(this.#e.consoleMessage().getAffectedResources()?.requestId)&&!s}}formatPrompt({message:e,relatedCode:t,relatedRequest:n}){let o=`Why does browser show an error\n${e}`;return t&&(o+=`\nFor the following code in my web app\n\n\`\`\`\n${t}\n\`\`\``),n&&(o+=`\nFor the following network request in my web app\n\n\`\`\`\n${n}\n\`\`\``),o}getSearchQuery(){let e=this.#e.toMessageTextString();return e&&(e=e.split("\n")[0]),e}}function x(e){const t=e.name.toLowerCase().trim();return!t.startsWith("x-")&&("cookie"!==t&&"set-cookie"!==t&&"authorization"!==t)}function b(e){const t=/^\s*/.exec(e);if(!t||!t.length)return null;const n=t[0];return n===e?null:n}function w({text:e,columnNumber:t,lineNumber:n},o=1e3){const s=e.split("\n");if(s[n].length>=o/2){const e=Math.max(t-o/2,0),i=Math.min(t+o/2,s[n].length);return s[n].substring(e,i)}let i=0,a=n,r=b(s[n]);const l=new Map;for(;void 0!==s[a]&&i+s[a].length<=o/2;){const e=b(s[a]);null===e||null===r||e!==r&&e.startsWith(r)||(/^\s*[\}\)\]]/.exec(s[a])||l.set(e,a),r=e),i+=s[a].length+1,a--}a=n+1;let c=n,d=n;for(r=b(s[n]);void 0!==s[a]&&i+s[a].length<=o;){i+=s[a].length;const e=b(s[a]);if(null!==e&&null!==r&&(e===r||!e.startsWith(r))){const t=s[a+1],n=t?b(t):null;n&&n!==e&&n.startsWith(e)||l.has(e)&&(c=l.get(e)??0,d=a),r=e}a++}return s.slice(c,d+1).join("\n")}function T(e,t,n){let o="";for(const e of t){if(o.length+e.length>n)break;o+=e}return o=o.trim(),o&&e?e+"\n"+o:o}function $(e){const t=(e,t)=>T(e,t.filter(x).map((e=>e.name+": "+e.value+"\n")),1e3);return`Request: ${e.url()}\n\n${t("Request headers:",e.requestHeaders())}\n\n${t("Response headers:",e.responseHeaders)}\n\nResponse status: ${e.statusCode} ${e.statusText}`}function C(e){return e.toMessageTextString().substr(0,1e3)}function R(e){const t=e.contentElement().querySelector(".stack-preview-container");if(!t)return"";const n=t.shadowRoot?.querySelector(".stack-preview-container");return T("",n.childTextNodes().filter((e=>!e.parentElement?.closest(".show-all-link,.show-less-link,.hidden-row"))).map(p.Linkifier.Linkifier.untruncatedNodeText),1e3)}const M=new CSSStyleSheet;M.replaceSync('*{padding:0;margin:0;box-sizing:border-box}:host{--max-height:2000px;--loading-max-height:140px;font-family:var(--default-font-family);font-size:inherit;display:block;overflow:hidden;max-height:0}:host-context(.opening){animation:expand-to-loading var(--sys-motion-duration-medium2) var(--sys-motion-easing-emphasized);animation-fill-mode:forwards}:host-context(.loaded){animation:expand-to-full var(--sys-motion-duration-medium2) var(--sys-motion-easing-emphasized);animation-fill-mode:forwards}:host-context(.closing){animation:collapse var(--sys-motion-duration-medium2) var(--sys-motion-easing-emphasized);animation-fill-mode:forwards}@keyframes expand-to-loading{from{max-height:0}to{max-height:var(--loading-max-height)}}@keyframes expand-to-full{from{max-height:var(--actual-height,var(--loading-max-height))}to{max-height:var(--max-height)}}@keyframes collapse{from{max-height:var(--actual-height,var(--max-height))}to{max-height:0;margin-top:0;margin-bottom:0}}.wrapper{padding:16px;background-color:var(--sys-color-cdt-base-container);border-radius:16px;container-type:inline-size}.wrapper.top{border-radius:16px 16px 4px 4px}.wrapper.bottom{margin-top:5px;border-radius:4px 4px 16px 16px}header{display:flex;flex-direction:row;gap:6px;color:var(--sys-color-on-surface);font-size:13px;font-style:normal;font-weight:500;height:14px}header:focus-visible{outline:none}header > .filler{flex:1}main{--override-markdown-view-message-color:var(--sys-color-on-surface);margin:12px 0 0;color:var(--sys-color-on-surface);font-size:12px;font-style:normal;font-weight:400;line-height:20px;p{margin-block-start:1em;margin-block-end:1em}ul{list-style-type:none;list-style-position:inside;padding-inline-start:0.2em;li{display:list-item;list-style-type:disc;list-style-position:outside;margin-inline-start:1em}li::marker{font-size:11px;line-height:1}}label{display:inline-flex;flex-direction:row;gap:0.5em;input,\n    span{vertical-align:middle}input[type="checkbox"]{margin-top:0.3em}}}devtools-markdown-view{margin-bottom:12px}footer{display:flex;flex-direction:row;align-items:center;color:var(--sys-color-on-surface);font-style:normal;font-weight:400;line-height:normal;margin-top:14px;gap:32px}@container (max-width: 600px){footer{gap:8px}}footer > .filler{flex:1}footer .rating{display:flex;flex-direction:row;gap:8px}textarea{height:84px;padding:10px;border-radius:8px;border:1px solid var(--sys-color-neutral-outline);width:100%;font-family:var(--default-font-family);font-size:inherit}.buttons{display:flex;flex-wrap:wrap;gap:5px}main .buttons{margin-top:12px}.disclaimer{display:flex;gap:2px;color:var(--sys-color-on-surface-subtle);font-size:11px;align-items:flex-start;flex-direction:column;max-width:360px}.link{color:var(--sys-color-primary);text-decoration-line:underline;devtools-icon{color:var(--sys-color-primary);width:14px;height:14px}}.loader{background:linear-gradient(130deg,transparent 0%,var(--sys-color-gradient-tertiary) 20%,var(--sys-color-gradient-primary) 40%,transparent 60%,var(--sys-color-gradient-tertiary) 80%,var(--sys-color-gradient-primary) 100%);background-position:0% 0%;background-size:250% 250%;animation:gradient 5s infinite linear}@keyframes gradient{0%{background-position:0 0}100%{background-position:100% 100%}}summary{font-size:12px;font-style:normal;font-weight:400;line-height:20px}details{--collapsed-height:20px;overflow:hidden;height:var(--collapsed-height)}details[open]{height:calc(var(--list-height) + var(--collapsed-height) + 8px);transition:height var(--sys-motion-duration-short4) var(--sys-motion-easing-emphasized)}h2{display:block;font-size:inherit;margin:0;font-weight:inherit}h2:focus-visible{outline:none}.info{width:20px;height:20px}devtools-icon[name="spark"]{color:var(--sys-color-primary-bright)}devtools-icon[name="dog-paw"]{width:16px;height:16px}\n/*# sourceURL=./components/consoleInsight.css */\n');const I=new CSSStyleSheet;I.replaceSync('*{padding:0;margin:0;box-sizing:border-box}:host{display:block}ul{color:var(--sys-color-primary);font-size:12px;font-style:normal;font-weight:400;line-height:18px;margin-top:8px}li{list-style-type:none}ul .link{color:var(--sys-color-primary);display:inline-flex!important;align-items:center;gap:4px;text-decoration-line:underline}devtools-icon{height:16px;width:16px}devtools-icon[name="open-externally"]{color:var(--icon-link)}.source-disclaimer{color:var(--sys-color-on-surface-subtle)}\n/*# sourceURL=./components/consoleInsightSourcesList.css */\n');const S={consoleMessage:"Console message",stackTrace:"Stacktrace",networkRequest:"Network request",relatedCode:"Related code",generating:"Generating explanation…",insight:"Explanation",closeInsight:"Close explanation",inputData:"Data used to understand this message",thumbsUp:"Thumbs up",thumbsDown:"Thumbs down",report:"Report legal issue",error:"DevTools has encountered an error",errorBody:"Something went wrong. Try again.",opensInNewTab:"(opens in a new tab)",learnMore:"Learn more",notAvailable:"This feature is not available",notLoggedIn:"This feature is only available when you sign into Chrome with your Google account.",syncIsOff:"This feature requires you to turn on Chrome sync.",updateSettings:"Update Settings",offlineHeader:"DevTools can’t reach the internet",offline:"Check your internet connection and try again.",signInToUse:"Sign in to use this feature",cancel:"Cancel",disableFeature:"Disable this feature",next:"Next",back:"Back",continue:"Continue",search:"Use search instead",reloadRecommendation:"Reload the page to capture related network request data for this message in order to create a better insight."},N=n.i18n.registerUIStrings("panels/explain/components/ConsoleInsight.ts",S),A=n.i18n.getLocalizedString.bind(void 0,N),{render:B,html:E,Directives:j}=d;class P extends Event{static eventName="close";constructor(){super(P.eventName,{composed:!0,bubbles:!0})}}function U(e){switch(e){case y.MESSAGE:return A(S.consoleMessage);case y.STACKTRACE:return A(S.stackTrace);case y.NETWORK_REQUEST:return A(S.networkRequest);case y.RELATED_CODE:return A(S.relatedCode)}}const L="https://policies.google.com/terms",O="https://goo.gle/devtools-console-messages-ai";class D extends HTMLElement{static async create(e,n){const o=await t.AidaClient.AidaClient.getAidaClientAvailability();return new D(e,n,o)}static litTagName=d.literal`devtools-console-insight`;#t=this.attachShadow({mode:"open"});#n;#o;#s=new l.MarkdownView.MarkdownInsightRenderer;#i;#a;constructor(e,n,o){switch(super(),this.#n=e,this.#o=n,o){case t.AidaClient.AidaAvailability.AVAILABLE:this.#i={type:"loading",consentReminderConfirmed:!1,consentOnboardingFinished:this.#r().get()};break;case t.AidaClient.AidaAvailability.NO_ACCOUNT_EMAIL:this.#i={type:"not-logged-in"};break;case t.AidaClient.AidaAvailability.NO_ACTIVE_SYNC:this.#i={type:"sync-is-off"};break;case t.AidaClient.AidaAvailability.NO_INTERNET:this.#i={type:"offline"}}this.#l(),this.addEventListener("keydown",(e=>{e.stopPropagation()})),this.addEventListener("keyup",(e=>{e.stopPropagation()})),this.addEventListener("keypress",(e=>{e.stopPropagation()})),this.addEventListener("click",(e=>{e.stopPropagation()})),this.focus(),this.addEventListener("animationend",(()=>{this.style.setProperty("--actual-height",`${this.offsetHeight}px`)}))}#r(){return e.Settings.Settings.instance().createLocalSetting("console-insights-onboarding-finished",!1)}connectedCallback(){this.#t.adoptedStyleSheets=[M,r.checkboxStyles],this.classList.add("opening"),this.#c()}#d(e){const t=this.#i;this.#i=e,e.type!==t.type&&"loading"===t.type&&this.classList.add("loaded"),this.#l(),e.type!==t.type&&this.#g()}async#c(){if("loading"===this.#i.type){if(!this.#i.consentOnboardingFinished)return this.#d({type:"consent-onboarding",page:"private"}),void t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsOnboardingShown);if(!this.#i.consentReminderConfirmed){const{sources:e,isPageReloadRecommended:n}=await this.#n.buildPrompt();return this.#d({type:"consent-reminder",sources:e,isPageReloadRecommended:n}),void t.userMetrics.actionTaken(t.UserMetrics.Action.InsightConsentReminderShown)}}}#h(){"consent-reminder"===this.#i.type?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightConsentReminderCanceled):"consent-onboarding"===this.#i.type&&("private"===this.#i.page?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsOnboardingCanceledOnPage1):t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsOnboardingCanceledOnPage2)),this.dispatchEvent(new P),this.classList.add("closing")}#u(e){if("insight"!==this.#i.type)throw new Error("Unexpected state");if(void 0===this.#i.metadata?.rpcGlobalId)throw new Error("RPC Id not in metadata");void 0===this.#a&&(this.#a="true"===e.target.dataset.rating,this.#l(),this.#a?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightRatedPositive):t.userMetrics.actionTaken(t.UserMetrics.Action.InsightRatedNegative),this.#o.registerClientEvent({corresponding_aida_rpc_global_id:this.#i.metadata.rpcGlobalId,do_conversation_client_event:{user_feedback:{sentiment:this.#a?"POSITIVE":"NEGATIVE"}}}))}#m(){t.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab("https://support.google.com/legal/troubleshooter/1114905?hl=en#ts=1115658%2C13380504")}#p(){const e=this.#n.getSearchQuery();t.InspectorFrontendHost.InspectorFrontendHostInstance.openSearchResultsInNewTab(e)}async#f(){this.#d({type:"loading",consentReminderConfirmed:!0,consentOnboardingFinished:this.#r().get()}),t.userMetrics.actionTaken(t.UserMetrics.Action.InsightConsentReminderConfirmed);try{for await(const{sources:e,isPageReloadRecommended:t,explanation:n,metadata:o}of this.#v()){const s=this.#y(n),i=!1!==s;this.#d({type:"insight",tokens:i?s:[],validMarkdown:i,explanation:n,sources:e,metadata:o,isPageReloadRecommended:t})}t.userMetrics.actionTaken(t.UserMetrics.Action.InsightGenerated)}catch(e){t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErrored),this.#d({type:"error",error:e.message})}}#y(e){try{const t=s.Marked.lexer(e);for(const e of t)this.#s.renderToken(e);return t}catch{return t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredMarkdown),!1}}async*#v(){const{prompt:e,sources:n,isPageReloadRecommended:o}=await this.#n.buildPrompt();try{for await(const s of this.#o.fetch(t.AidaClient.AidaClient.buildConsoleInsightsRequest(e)))yield{sources:n,isPageReloadRecommended:o,...s}}catch(e){throw"Server responded: permission denied"===e.message?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredPermissionDenied):e.message.startsWith("Cannot send request:")?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredCannotSend):e.message.startsWith("Request failed:")?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredRequestFailed):e.message.startsWith("Cannot parse chunk:")?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredCannotParseChunk):"Unknown chunk result"===e.message?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredUnknownChunk):e.message.startsWith("Server responded:")?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredApi):t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredOther),e}}#k(){const e=o.TargetManager.TargetManager.instance().rootTarget();if(null===e)return;const n="chrome://settings";e.targetAgent().invoke_createTarget({url:n}).then((e=>{e.getError()&&t.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(n)}))}#x(){try{e.Settings.moduleSetting("console-insights-enabled").set(!1)}finally{this.#h(),c.InspectorView.InspectorView.instance().displayReloadRequiredWarning("Reload for the change to apply.")}t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsOnboardingFeatureDisabled)}#b(){this.#d({type:"consent-onboarding",page:"legal"}),t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsOnboardingNextPage)}#g(){this.#t.querySelector("header h2")?.focus()}#w(){const e=this.#t.querySelector(".terms");return!!e?.checked}#T(){this.#w()&&(this.#r().set(!0),this.#d({type:"loading",consentReminderConfirmed:!1,consentOnboardingFinished:this.#r().get()}),t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsOnboardingConfirmed),this.#c())}#$(){this.#d({type:"consent-onboarding",page:"private"}),t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsOnboardingPrevPage)}#C(){return E`<${i.Button.Button.litTagName}
      class="cancel-button"
      @click=${this.#h}
      .data=${{variant:"outlined",jslogContext:"cancel"}}
    >
      ${A(S.cancel)}
    </${i.Button.Button.litTagName}>`}#R(){return E`<${i.Button.Button.litTagName}
      @click=${this.#x}
      class="disable-button"
      .data=${{variant:"outlined",jslogContext:"disable"}}
    >
      ${A(S.disableFeature)}
    </${i.Button.Button.litTagName}>`}#M(){return E`<${i.Button.Button.litTagName}
      class="next-button"
      @click=${this.#b}
      .data=${{variant:"primary",jslogContext:"next"}}
    >
      ${A(S.next)}
    </${i.Button.Button.litTagName}>`}#I(){return E`<${i.Button.Button.litTagName}
      @click=${this.#$}
      .data=${{variant:"outlined",jslogContext:"back"}}
    >
      ${A(S.back)}
    </${i.Button.Button.litTagName}>`}#S(e,t=!1){return E`<${i.Button.Button.litTagName}
      @click=${e}
      class="continue-button"
      .data=${{variant:"primary",disabled:t,jslogContext:"continue"}}
    >
      ${A(S.continue)}
    </${i.Button.Button.litTagName}>`}#N(){return E`<${i.Button.Button.litTagName}
      @click=${this.#p}
      class="search-button"
      .data=${{variant:"outlined",jslogContext:"search"}}
    >
      ${A(S.search)}
    </${i.Button.Button.litTagName}>`}#A(){return E`<x-link href=${O} class="link" jslog=${g.link("learn-more").track({click:!0})}>
      ${A(S.learnMore)}
    </x-link>`}#B(){this.#l()}#E(){const t=`${g.section(this.#i.type).track({resize:!0})}`,n=!0===e.Settings.Settings.instance().getHostConfig()?.devToolsConsoleInsights.disallowLogging;switch(this.#i.type){case"loading":return E`<main jslog=${t}>
            <div role="presentation" class="loader" style="clip-path: url('#clipPath');">
              <svg width="100%" height="64">
                <clipPath id="clipPath">
                  <rect x="0" y="0" width="100%" height="16" rx="8"></rect>
                  <rect x="0" y="24" width="100%" height="16" rx="8"></rect>
                  <rect x="0" y="48" width="100%" height="16" rx="8"></rect>
                </clipPath>
              </svg>
            </div>
          </main>`;case"insight":return E`
        <main jslog=${t}>
          ${this.#i.validMarkdown?E`<${l.MarkdownView.MarkdownView.litTagName}
              .data=${{tokens:this.#i.tokens,renderer:this.#s}}>
            </${l.MarkdownView.MarkdownView.litTagName}>`:this.#i.explanation}
          <details style="--list-height: ${20*(this.#i.sources.length+(this.#i.isPageReloadRecommended?1:0))}px;" jslog=${g.expand("sources").track({click:!0})}>
            <summary>${A(S.inputData)}</summary>
            <${q.litTagName} .sources=${this.#i.sources} .isPageReloadRecommended=${this.#i.isPageReloadRecommended}>
            </${q.litTagName}>
          </details>
          <div class="buttons">
            ${this.#N()}
          </div>
        </main>`;case"error":return E`
        <main jslog=${t}>
          <div class="error">${A(S.errorBody)}</div>
        </main>`;case"consent-reminder":return E`
          <main jslog=${t}>
            <p>The following data will be sent to Google to understand the context for the console message.
            ${n?"":"Human reviewers may process this information for quality purposes. Don’t submit sensitive information."}
            Read Google’s <x-link href=${L} class="link" jslog=${g.link("terms-of-service").track({click:!0})}>Terms of Service</x-link>.</p>
            <${q.litTagName} .sources=${this.#i.sources} .isPageReloadRecommended=${this.#i.isPageReloadRecommended}>
            </${q.litTagName}>
          </main>
        `;case"consent-onboarding":switch(this.#i.page){case"private":return E`<main jslog=${t}>
              <p>This notice and our <x-link href=${"https://policies.google.com/privacy"} class="link" jslog=${g.link("privacy-notice").track({click:!0})}>privacy notice</x-link> describe how Chrome DevTools handles your data. Please read them carefully.</p>

              <p>Chrome DevTools uses the console message, associated stack trace, related source code, and the associated network headers as input data. When you use "Understand this message", Google collects this input data, generated output, related feature usage information, and your feedback. Google uses this data to provide, improve, and develop Google products and services and machine learning technologies, including Google's enterprise products such as Google Cloud.</p>

              <p>To help with quality and improve our products, human reviewers may read, annotate, and process the above-mentioned input data, generated output, related feature usage information, and your feedback. <strong>Please do not include sensitive (e.g., confidential) or personal information that can be used to identify you or others in your prompts or feedback.</strong> Your data will be stored in a way where Google cannot tell who provided it and can no longer fulfill any deletion requests and will be retained for up to 18 months. We may refrain from collecting data to improve our product if your Google account is managed by an organization and depending on your region.</p>
            </main>`;case"legal":return E`<main jslog=${t}>
            <p>As you try "Understand this message", here are key things to know:

            <ul>
              <li>Chrome DevTools uses console message, associated stack trace, related source code, and the associated network headers to provide answers.</li>
              <li>Chrome DevTools uses experimental technology, and may generate inaccurate or offensive information that doesn't represent Google's views. Voting on the responses will help make this feature better.</li>
              <li>This feature is an experimental feature and subject to future changes.</li>
              <li><strong><x-link class="link" href=${"https://support.google.com/legal/answer/13505487"} jslog=${g.link("use-code-with-caution").track({click:!0})}>Use generated code snippets with caution</x-link>.</strong></li>
            </ul>
            </p>

            <p>
            <label>
              <input class="terms" @change=${this.#B} type="checkbox" jslog=${g.toggle("terms-of-service-accepted")}>
              <span>I accept my use of "Understand this message" is subject to the <x-link href=${L} class="link" jslog=${g.link("terms-of-service").track({click:!0})}>Google Terms of Service</x-link>.</span>
            </label>
            </p>
            </main>`}case"not-logged-in":return E`
          <main jslog=${t}>
            <div class="error">${A(S.notLoggedIn)}</div>
          </main>`;case"sync-is-off":return E`
          <main jslog=${t}>
            <div class="error">${A(S.syncIsOff)}</div>
          </main>`;case"offline":return E`
          <main jslog=${t}>
            <div class="error">${A(S.offline)}</div>
          </main>`}}#j(){const t=!0!==e.Settings.Settings.instance().getHostConfig()?.devToolsConsoleInsights.disallowLogging,n=d.html`<span>
              This feature may display inaccurate or offensive information that doesn't represent Google's views.
              <x-link href=${O} class="link" jslog=${g.link("learn-more").track({click:!0})}>${A(S.learnMore)}</x-link>
            </span>`;switch(this.#i.type){case"loading":return d.nothing;case"error":case"offline":return E`<footer jslog=${g.section("footer")}>
          <div class="disclaimer">
            ${n}
          </div>
        </footer>`;case"not-logged-in":case"sync-is-off":return E`<footer jslog=${g.section("footer")}>
        <div class="filler"></div>
        <div>
          <${i.Button.Button.litTagName}
            @click=${this.#k}
            .data=${{variant:"primary",jslogContext:"update-settings"}}
          >
            ${S.updateSettings}
          </${i.Button.Button.litTagName}>
        </div>
      </footer>`;case"consent-reminder":return E`<footer jslog=${g.section("footer")}>
          <div class="disclaimer">
            ${n}
          </div>
          <div class="filler"></div>
          <div class="buttons">
            ${this.#C()}
            ${this.#S(this.#f)}
          </div>
        </footer>`;case"consent-onboarding":switch(this.#i.page){case"private":return E`<footer jslog=${g.section("footer")}>
                <div class="disclaimer">
                  ${this.#A()}
                </div>
                <div class="filler"></div>
                <div class="buttons">
                    ${this.#C()}
                    ${this.#R()}
                    ${this.#M()}
                  </div>
              </footer>`;case"legal":return E`<footer jslog=${g.section("footer")}>
            <div class="disclaimer">
              ${this.#A()}
            </div>
            <div class="filler"></div>
            <div class="buttons">
                ${this.#I()}
                ${this.#R()}
                ${this.#S(this.#T,!this.#w())}
              </div>
          </footer>`}case"insight":return E`<footer jslog=${g.section("footer")}>
        <div class="disclaimer">
          ${n}
        </div>
        <div class="filler"></div>
        <div class="rating">
          ${t?E`
            <${i.Button.Button.litTagName}
              data-rating=${"true"}
              .data=${{variant:"icon",size:"SMALL",iconName:"thumb-up",active:void 0!==this.#a&&this.#a,title:A(S.thumbsUp),jslogContext:"thumbs-up"}}
              @click=${this.#u}
            ></${i.Button.Button.litTagName}>
            <${i.Button.Button.litTagName}
              data-rating=${"false"}
              .data=${{variant:"icon",size:"SMALL",iconName:"thumb-down",active:void 0!==this.#a&&!this.#a,title:A(S.thumbsDown),jslogContext:"thumbs-down"}}
              @click=${this.#u}
            ></${i.Button.Button.litTagName}>
          `:d.nothing}
          <${i.Button.Button.litTagName}
            .data=${{variant:"icon",size:"SMALL",iconName:"report",title:A(S.report),jslogContext:"report"}}
            @click=${this.#m}
          ></${i.Button.Button.litTagName}>
        </div>

      </footer>`}}#P(){switch(this.#i.type){case"not-logged-in":return A(S.signInToUse);case"sync-is-off":return A(S.notAvailable);case"offline":return A(S.offlineHeader);case"loading":return A(S.generating);case"insight":return A(S.insight);case"error":return A(S.error);case"consent-reminder":return A(S.inputData);case"consent-onboarding":switch(this.#i.page){case"private":return"Privacy notice";case"legal":return"Legal notice"}}}#l(){B(E`
      <div class="wrapper" jslog=${g.pane("console-insights").track({resize:!0})}>
        <header>
          <div class="filler">
            <h2 tabindex="-1">
              ${this.#P()}
            </h2>
          </div>
          <div>
            <${i.Button.Button.litTagName}
              .data=${{variant:"icon",size:"SMALL",iconName:"cross",title:A(S.closeInsight)}}
              jslog=${g.close().track({click:!0})}
              @click=${this.#h}
            ></${i.Button.Button.litTagName}>
          </div>
        </header>
        ${this.#E()}
        ${this.#j()}
      </div>
    `,this.#t,{host:this})}}class q extends HTMLElement{static litTagName=d.literal`devtools-console-insight-sources-list`;#t=this.attachShadow({mode:"open"});#U=[];#L=!1;constructor(){super(),this.#t.adoptedStyleSheets=[I,r.checkboxStyles]}#l(){B(E`
      <ul>
        ${j.repeat(this.#U,(e=>e.value),(e=>E`<li><x-link class="link" title="${U(e.type)} ${A(S.opensInNewTab)}" href="data:text/plain,${encodeURIComponent(e.value)}" jslog=${g.link("source-"+e.type).track({click:!0})}>
            <${a.Icon.Icon.litTagName} name="open-externally"></${a.Icon.Icon.litTagName}>
            ${U(e.type)}
          </x-link></li>`))}
        ${this.#L?d.html`<li class="source-disclaimer">
          <${a.Icon.Icon.litTagName} name="warning"></${a.Icon.Icon.litTagName}>
          ${A(S.reloadRecommendation)}</li>`:d.nothing}
      </ul>
    `,this.#t,{host:this})}set sources(e){this.#U=e,this.#l()}set isPageReloadRecommended(e){this.#L=e,this.#l()}}customElements.define("devtools-console-insight",D),customElements.define("devtools-console-insight-sources-list",q);class _{handleAction(e,n){switch(n){case"explain.console-message.context":case"explain.console-message.context.error":case"explain.console-message.context.warning":case"explain.console-message.context.other":case"explain.console-message.hover":{const o=e.flavor(f.ConsoleViewMessage.ConsoleViewMessage);if(o){n.startsWith("explain.console-message.context")?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightRequestedViaContextMenu):"explain.console-message.hover"===n&&t.userMetrics.actionTaken(t.UserMetrics.Action.InsightRequestedViaHoverButton);const e=new k(o),s=new t.AidaClient.AidaClient;return D.create(e,s).then((e=>{o.setInsight(e)})),!0}return!1}}return!1}}export{_ as ActionDelegate,P as CloseEvent,D as ConsoleInsight,k as PromptBuilder,y as SourceType,x as allowHeader,C as formatConsoleMessage,$ as formatNetworkRequest,w as formatRelatedCode,R as formatStackTrace,b as lineWhitespace};
