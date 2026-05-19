import"../../ui/components/spinners/spinners.js";import*as e from"../../core/common/common.js";import*as t from"../../core/host/host.js";import*as s from"../../core/i18n/i18n.js";import*as i from"../../core/root/root.js";import*as n from"../../third_party/marked/marked.js";import"../../ui/components/buttons/buttons.js";import*as o from"../../ui/components/input/input.js";import*as r from"../../ui/components/markdown_view/markdown_view.js";import*as a from"../../ui/legacy/legacy.js";import*as l from"../../ui/lit/lit.js";import*as c from"../../ui/visual_logging/visual_logging.js";import*as d from"../../core/sdk/sdk.js";import*as g from"../../models/ai_assistance/ai_assistance.js";import*as h from"../../models/bindings/bindings.js";import*as u from"../../models/formatter/formatter.js";import*as m from"../../models/logs/logs.js";import*as p from"../../ui/legacy/components/utils/utils.js";import*as f from"../console/console.js";const v=1e3;var y;!function(e){e.MESSAGE="message",e.STACKTRACE="stacktrace",e.NETWORK_REQUEST="networkRequest",e.RELATED_CODE="relatedCode"}(y||(y={}));class b{#e;constructor(e){this.#e=e}async getNetworkRequest(){const e=this.#e.consoleMessage().getAffectedResources()?.requestId;if(!e)return;return m.NetworkLog.NetworkLog.instance().requestsForId(e)[0]}async getMessageSourceCode(){const e=this.#e.consoleMessage().stackTrace?.callFrames[0],t=this.#e.consoleMessage().runtimeModel(),s=t?.debuggerModel();if(!s||!t||!e)return{text:"",columnNumber:0,lineNumber:0};const i=new d.DebuggerModel.Location(s,e.scriptId,e.lineNumber,e.columnNumber),n=await h.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().rawLocationToUILocation(i),o=await(n?.uiSourceCode.requestContent()),r=!o?.isEncoded&&o?.content?o.content:"",a=r.indexOf("\n");if(r.length>v&&(a<0||a>v)){const{formattedContent:e,formattedMapping:t}=await u.ScriptFormatter.formatScriptContent(n?.uiSourceCode.mimeType()??"text/javascript",r),[s,i]=t.originalToFormatted(n?.lineNumber??0,n?.columnNumber??0);return{text:e,columnNumber:i,lineNumber:s}}return{text:r,columnNumber:n?.columnNumber??0,lineNumber:n?.lineNumber??0}}async buildPrompt(e=Object.values(y)){const[t,s]=await Promise.all([e.includes(y.RELATED_CODE)?this.getMessageSourceCode():void 0,e.includes(y.NETWORK_REQUEST)?this.getNetworkRequest():void 0]),i=t?.text?x(t):"",n=s?C(s):"",o=e.includes(y.STACKTRACE)?I(this.#e):"",r=R(this.#e),a=this.formatPrompt({message:[r,o].join("\n").trim(),relatedCode:i,relatedRequest:n}),l=[{type:y.MESSAGE,value:r}];return o&&l.push({type:y.STACKTRACE,value:o}),i&&l.push({type:y.RELATED_CODE,value:i}),n&&l.push({type:y.NETWORK_REQUEST,value:n}),{prompt:a,sources:l,isPageReloadRecommended:e.includes(y.NETWORK_REQUEST)&&Boolean(this.#e.consoleMessage().getAffectedResources()?.requestId)&&!n}}formatPrompt({message:e,relatedCode:t,relatedRequest:s}){let i=`Please explain the following console error or warning:\n\n\`\`\`\n${e}\n\`\`\``;return t&&(i+=`\nFor the following code:\n\n\`\`\`\n${t}\n\`\`\``),s&&(i+=`\nFor the following network request:\n\n\`\`\`\n${s}\n\`\`\``),i}getSearchQuery(){let e=this.#e.toMessageTextString();return e&&(e=e.split("\n")[0]),e}}function k(e){const t=e.name.toLowerCase().trim();return!t.startsWith("x-")&&("cookie"!==t&&"set-cookie"!==t&&"authorization"!==t)}function w(e){const t=/^\s*/.exec(e);if(!t?.length)return null;const s=t[0];return s===e?null:s}function x({text:e,columnNumber:t,lineNumber:s},i=1e3){const n=e.split("\n");if(n[s].length>=i/2){const e=Math.max(t-i/2,0),o=Math.min(t+i/2,n[s].length);return n[s].substring(e,o)}let o=0,r=s,a=w(n[s]);const l=new Map;for(;void 0!==n[r]&&o+n[r].length<=i/2;){const e=w(n[r]);null===e||null===a||e!==a&&e.startsWith(a)||(/^\s*[\}\)\]]/.exec(n[r])||l.set(e,r),a=e),o+=n[r].length+1,r--}r=s+1;let c=s,d=s;for(a=w(n[s]);void 0!==n[r]&&o+n[r].length<=i;){o+=n[r].length;const e=w(n[r]);if(null!==e&&null!==a&&(e===a||!e.startsWith(a))){const t=n[r+1],s=t?w(t):null;s&&s!==e&&s.startsWith(e)||l.has(e)&&(c=l.get(e)??0,d=r),a=e}r++}return n.slice(c,d+1).join("\n")}function C(e){return`Request: ${e.url()}\n\n${g.NetworkRequestFormatter.formatHeaders("Request headers:",e.requestHeaders())}\n\n${g.NetworkRequestFormatter.formatHeaders("Response headers:",e.responseHeaders)}\n\nResponse status: ${e.statusCode} ${e.statusText}`}function R(e){return e.toMessageTextString().substr(0,1e3)}function I(e){const t=e.contentElement().querySelector(".stack-preview-container");if(!t)return"";const s=t.shadowRoot?.querySelector(".stack-preview-container");return function(e,t,s){let i="";for(const e of t){if(i.length+e.length>s)break;i+=e}return i=i.trim(),i&&e?e+"\n"+i:i}("",s.childTextNodes().filter((e=>!e.parentElement?.closest(".show-all-link,.show-less-link,.hidden-row"))).map(p.Linkifier.Linkifier.untruncatedNodeText),1e3)}var S={cssText:`*{padding:0;margin:0;box-sizing:border-box}:host{font-family:var(--default-font-family);font-size:inherit;display:block}.wrapper{background-color:var(--sys-color-cdt-base-container);border-radius:16px;container-type:inline-size;display:grid;animation:expand var(--sys-motion-duration-medium2) var(--sys-motion-easing-emphasized) forwards}:host-context(.closing) .wrapper{animation:collapse var(--sys-motion-duration-medium2) var(--sys-motion-easing-emphasized) forwards}@keyframes expand{from{grid-template-rows:0fr}to{grid-template-rows:1fr}}@keyframes collapse{from{grid-template-rows:1fr}to{grid-template-rows:0fr;padding-top:0;padding-bottom:0}}.animation-wrapper{overflow:hidden;padding:var(--sys-size-6) var(--sys-size-8)}.wrapper.top{border-radius:16px 16px 4px 4px}.wrapper.bottom{margin-top:5px;border-radius:4px 4px 16px 16px}header{display:flex;flex-direction:row;gap:6px;color:var(--sys-color-on-surface);font-size:13px;font-style:normal;font-weight:500;margin-bottom:var(--sys-size-6);align-items:center}header:focus-visible{outline:none}header > .filler{display:flex;flex-direction:row;gap:var(--sys-size-5);align-items:center;flex:1}.reminder-container{border-radius:var(--sys-size-5);background-color:var(--sys-color-surface4);padding:var(--sys-size-8);font-weight:var(--ref-typeface-weight-medium);h3{font:inherit}}.reminder-items{display:grid;grid-template-columns:var(--sys-size-8) auto;gap:var(--sys-size-5) var(--sys-size-6);margin-top:var(--sys-size-6);line-height:var(--sys-size-8);font-weight:var(--ref-typeface-weight-regular)}main{--override-markdown-view-message-color:var(--sys-color-on-surface);color:var(--sys-color-on-surface);font-size:12px;font-style:normal;font-weight:400;line-height:20px;p{margin-block:1em}ul{list-style-type:none;list-style-position:inside;padding-inline-start:0.2em;li{display:list-item;list-style-type:disc;list-style-position:outside;margin-inline-start:1em}li::marker{font-size:11px;line-height:1}}label{display:inline-flex;flex-direction:row;gap:0.5em;input,\n    span{vertical-align:middle}input[type="checkbox"]{margin-top:0.3em}}}.opt-in-teaser{display:flex;gap:var(--sys-size-5)}devtools-markdown-view{margin-bottom:12px}footer{display:flex;flex-direction:row;align-items:center;color:var(--sys-color-on-surface);font-style:normal;font-weight:400;line-height:normal;margin-top:14px;gap:32px}@container (max-width: 600px){footer{gap:8px}}footer > .filler{flex:1}footer .rating{display:flex;flex-direction:row;gap:8px}textarea{height:84px;padding:10px;border-radius:8px;border:1px solid var(--sys-color-neutral-outline);width:100%;font-family:var(--default-font-family);font-size:inherit}.buttons{display:flex;gap:5px}@media (width <= 500px){.buttons{flex-wrap:wrap}}main .buttons{margin-top:12px}.disclaimer{display:flex;gap:2px;color:var(--sys-color-on-surface-subtle);font-size:11px;align-items:flex-start;flex-direction:column}.link{color:var(--sys-color-primary);text-decoration-line:underline;devtools-icon{color:var(--sys-color-primary);width:14px;height:14px}}button.link{border:none;background:none;cursor:pointer;font:inherit}.loader{background:linear-gradient(130deg,transparent 0%,var(--sys-color-gradient-tertiary) 20%,var(--sys-color-gradient-primary) 40%,transparent 60%,var(--sys-color-gradient-tertiary) 80%,var(--sys-color-gradient-primary) 100%);background-position:0% 0%;background-size:250% 250%;animation:gradient 5s infinite linear}@keyframes gradient{0%{background-position:0 0}100%{background-position:100% 100%}}summary{font-size:12px;font-style:normal;font-weight:400;line-height:20px}details{overflow:hidden;margin-top:10px}::details-content{height:0;transition:height var(--sys-motion-duration-short4) var(--sys-motion-easing-emphasized),content-visibility var(--sys-motion-duration-short4) var(--sys-motion-easing-emphasized) allow-discrete}[open]::details-content{height:auto}details.references{transition:margin-bottom var(--sys-motion-duration-short4) var(--sys-motion-easing-emphasized)}details.references[open]{margin-bottom:var(--sys-size-1)}h2{display:block;font-size:var(--sys-size-7);margin:0;font-weight:var(--ref-typeface-weight-medium);line-height:var(--sys-size-9)}h2:focus-visible{outline:none}.info{width:20px;height:20px}.badge{background:linear-gradient(135deg,var(--sys-color-gradient-primary),var(--sys-color-gradient-tertiary));border-radius:var(--sys-size-3);height:var(--sys-size-9);devtools-icon{margin:var(--sys-size-2)}}.header-icon-container{background:linear-gradient(135deg,var(--sys-color-gradient-primary),var(--sys-color-gradient-tertiary));border-radius:var(--sys-size-4);height:36px;width:36px;display:flex;align-items:center;justify-content:center}.close-button{align-self:flex-start}.sources-list{padding-left:var(--sys-size-6);margin-bottom:var(--sys-size-6);list-style:none;counter-reset:sources;display:grid;grid-template-columns:var(--sys-size-9) auto;list-style-position:inside}.sources-list li{display:contents}.sources-list li::before{counter-increment:sources;content:"[" counter(sources) "]";display:table-cell}.sources-list x-link.highlighted{animation:highlight-fadeout 2s}@keyframes highlight-fadeout{from{background-color:var(--sys-color-yellow-container)}to{background-color:transparent}}.references-list{padding-left:var(--sys-size-8)}.references-list li{padding-left:var(--sys-size-3)}details h3{font-size:10px;font-weight:var(--ref-typeface-weight-medium);text-transform:uppercase;color:var(--sys-color-on-surface-subtle);padding-left:var(--sys-size-6)}.error-message{font:var(--sys-typescale-body4-bold)}\n/*# sourceURL=${import.meta.resolve("././components/consoleInsight.css")} */\n`},A={cssText:`*{padding:0;margin:0;box-sizing:border-box}:host{display:block}ul{color:var(--sys-color-primary);font-size:12px;font-style:normal;font-weight:400;line-height:18px;margin-top:8px;padding-left:var(--sys-size-6)}li{list-style-type:none}ul .link{color:var(--sys-color-primary);display:inline-flex!important;align-items:center;gap:4px;text-decoration-line:underline}devtools-icon{height:16px;width:16px;margin-right:var(--sys-size-1)}devtools-icon[name="open-externally"]{color:var(--icon-link)}.source-disclaimer{color:var(--sys-color-on-surface-subtle)}\n/*# sourceURL=${import.meta.resolve("././components/consoleInsightSourcesList.css")} */\n`};const T=new CSSStyleSheet;T.replaceSync(S.cssText);const $=new CSSStyleSheet;$.replaceSync(A.cssText);const M={consoleMessage:"Console message",stackTrace:"Stacktrace",networkRequest:"Network request",relatedCode:"Related code",generating:"Generating explanation…",insight:"Explanation",closeInsight:"Close explanation",inputData:"Data used to understand this message",goodResponse:"Good response",badResponse:"Bad response",report:"Report legal issue",error:"DevTools has encountered an error",errorBody:"Something went wrong. Try again.",opensInNewTab:"(opens in a new tab)",learnMore:"Learn more",notLoggedIn:"This feature is only available when you sign into Chrome with your Google account.",signIn:"Sign in",offlineHeader:"DevTools can’t reach the internet",offline:"Check your internet connection and try again.",signInToUse:"Sign in to use this feature",search:"Use search instead",reloadRecommendation:"Reload the page to capture related network request data for this message in order to create a better insight.",turnOnInSettings:"Turn on {PH1} to receive AI assistance for understanding and addressing console warnings and errors.",settingsLink:"`Console insights` in Settings",references:"Sources and related content",relatedContent:"Related content",timedOut:"Generating a response took too long. Please try again.",notAvailableInIncognitoMode:"AI assistance is not available in Incognito mode or Guest mode"},E=s.i18n.registerUIStrings("panels/explain/components/ConsoleInsight.ts",M),z=s.i18n.getLocalizedString.bind(void 0,E),{render:L,html:N,Directives:U}=l;class j extends Event{static eventName="close";constructor(){super(j.eventName,{composed:!0,bubbles:!0})}}function O(e){switch(e){case y.MESSAGE:return z(M.consoleMessage);case y.STACKTRACE:return z(M.stackTrace);case y.NETWORK_REQUEST:return z(M.networkRequest);case y.RELATED_CODE:return z(M.relatedCode)}}const D="https://goo.gle/devtools-console-messages-ai",P={name:"citation",level:"inline",start:e=>e.match(/\[\^/)?.index,tokenizer(e){const t=e.match(/^\[\^(\d+)\]/);return!!t&&{type:"citation",raw:t[0],linkText:Number(t[1])}},renderer:()=>""};class _ extends HTMLElement{static async create(e,s){const i=await t.AidaClient.AidaClient.checkAccessPreconditions();return new _(e,s,i)}#t=this.attachShadow({mode:"open"});disableAnimations=!1;#s;#i;#n;#o;#r=l.Directives.createRef();#a=!1;#l;#c;#d;#g;#h;constructor(e,t,s){super(),this.#s=e,this.#i=t,this.#d=s,this.#c=this.#u(),this.#n=new r.MarkdownView.MarkdownInsightRenderer(this.#m.bind(this)),this.#h=new n.Marked.Marked({extensions:[P]}),this.#o=this.#p(),this.#g=this.#f.bind(this),this.#v(),this.addEventListener("keydown",(e=>{e.stopPropagation()})),this.addEventListener("keyup",(e=>{e.stopPropagation()})),this.addEventListener("keypress",(e=>{e.stopPropagation()})),this.addEventListener("click",(e=>{e.stopPropagation()})),this.focus()}#m(e){if("insight"!==this.#o.type||!this.#r.value)return;const t=this.#r.value.open;this.#a=!0,this.#v();const s=this.#t.querySelector(`.sources-list x-link[data-index="${e}"]`);s&&(a.UIUtils.runCSSAnimationOnce(s,"highlighted"),t?(s.scrollIntoView({behavior:"auto"}),s.focus()):this.#r.value.addEventListener("transitionend",(()=>{s.scrollIntoView({behavior:"auto"}),s.focus()}),{once:!0}))}#p(){switch(this.#d){case"available":{const t=e.Settings.Settings.instance().createSetting("console-insights-skip-reminder",!1,"Session").get();return{type:"loading",consentOnboardingCompleted:this.#y().get()||t}}case"no-account-email":return{type:"not-logged-in"};case"sync-is-paused":return{type:"sync-is-paused"};case"no-internet":return{type:"offline"}}}#u(){try{return e.Settings.moduleSetting("console-insights-enabled")}catch{return}}#y(){return e.Settings.Settings.instance().createLocalSetting("console-insights-onboarding-finished",!1)}connectedCallback(){this.#t.adoptedStyleSheets=[T,o.checkboxStyles],this.classList.add("opening"),this.#c?.addChangeListener(this.#b,this);const e=!0===i.Runtime.hostConfig.aidaAvailability?.blockedByAge;"loading"===this.#o.type&&!0===this.#c?.getIfNotDisabled()&&!e&&this.#o.consentOnboardingCompleted&&t.userMetrics.actionTaken(t.UserMetrics.Action.GeneratingInsightWithoutDisclaimer),t.AidaClient.HostConfigTracker.instance().addEventListener("aidaAvailabilityChanged",this.#g),this.#f(),"insight"!==this.#o.type&&"error"!==this.#o.type&&(this.#o=this.#p()),this.#k()}disconnectedCallback(){this.#c?.removeChangeListener(this.#b,this),t.AidaClient.HostConfigTracker.instance().removeEventListener("aidaAvailabilityChanged",this.#g)}async#f(){const e=await t.AidaClient.AidaClient.checkAccessPreconditions();e!==this.#d&&(this.#d=e,this.#o=this.#p(),this.#k())}#b(){!0===this.#c?.getIfNotDisabled()&&this.#y().set(!0),"setting-is-not-true"===this.#o.type&&!0===this.#c?.getIfNotDisabled()&&(this.#w({type:"loading",consentOnboardingCompleted:!0}),t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsOptInTeaserConfirmedInSettings),this.#k()),"consent-reminder"===this.#o.type&&!1===this.#c?.getIfNotDisabled()&&(this.#w({type:"loading",consentOnboardingCompleted:!1}),t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsReminderTeaserAbortedInSettings),this.#k())}#w(e){const t=this.#o;this.#o=e,this.#v(),e.type!==t.type&&this.#x()}async#k(){if("loading"!==this.#o.type)return;const e=!0===i.Runtime.hostConfig.aidaAvailability?.blockedByAge;if(!0!==this.#c?.getIfNotDisabled()||e)return this.#w({type:"setting-is-not-true"}),void t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsOptInTeaserShown);if(!this.#o.consentOnboardingCompleted){const{sources:e,isPageReloadRecommended:s}=await this.#s.buildPrompt();return this.#w({type:"consent-reminder",sources:e,isPageReloadRecommended:s}),void t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsReminderTeaserShown)}await this.#C()}#R(){"consent-reminder"===this.#o.type&&t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsReminderTeaserCanceled),this.shadowRoot?.addEventListener("animationend",(()=>{this.dispatchEvent(new j)}),{once:!0}),this.classList.add("closing")}#I(e){if("insight"!==this.#o.type)throw new Error("Unexpected state");if(void 0===this.#o.metadata?.rpcGlobalId)throw new Error("RPC Id not in metadata");if(void 0!==this.#l)return;this.#l="true"===e.target.dataset.rating,this.#v(),this.#l?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightRatedPositive):t.userMetrics.actionTaken(t.UserMetrics.Action.InsightRatedNegative);const s=i.Runtime.hostConfig.aidaAvailability?.disallowLogging??!0;this.#i.registerClientEvent({corresponding_aida_rpc_global_id:this.#o.metadata.rpcGlobalId,disable_user_content_logging:s,do_conversation_client_event:{user_feedback:{sentiment:this.#l?"POSITIVE":"NEGATIVE"}}})}#S(){t.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab("https://support.google.com/legal/troubleshooter/1114905?hl=en#ts=1115658%2C13380504")}#A(){const e=this.#s.getSearchQuery();t.InspectorFrontendHost.InspectorFrontendHostInstance.openSearchResultsInNewTab(e)}async#T(){this.#y().set(!0),this.#w({type:"loading",consentOnboardingCompleted:!0}),t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsReminderTeaserConfirmed),await this.#C()}#$(e,s){const i=[];if(!this.#M(s)||!s.attributionMetadata)return{explanationWithCitations:e,directCitationUrls:i};const{attributionMetadata:n}=s,o=n.citations.filter((e=>e.sourceType===t.AidaClient.CitationSourceType.WORLD_FACTS)).sort(((e,t)=>(t.endIndex||0)-(e.endIndex||0)));let r=e;for(const[e,t]of o.entries()){const s=/[.,:;!?]*\s/g;s.lastIndex=t.endIndex||0;const n=s.exec(r);n&&t.uri&&(r=r.slice(0,n.index)+`[^${o.length-e}]`+r.slice(n.index),i.push(t.uri))}return i.reverse(),{explanationWithCitations:r,directCitationUrls:i}}async#C(){try{for await(const{sources:e,isPageReloadRecommended:t,explanation:s,metadata:i,completed:n}of this.#E()){const{explanationWithCitations:o,directCitationUrls:r}=this.#$(s,i),a=this.#z(o),l=!1!==a;this.#w({type:"insight",tokens:l?a:[],validMarkdown:l,explanation:s,sources:e,metadata:i,isPageReloadRecommended:t,completed:n,directCitationUrls:r})}t.userMetrics.actionTaken(t.UserMetrics.Action.InsightGenerated)}catch(e){t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErrored),"doAidaConversation timed out"===e.message&&"insight"===this.#o.type?(this.#o.timedOut=!0,this.#w({...this.#o,completed:!0,timedOut:!0})):this.#w({type:"error",error:e.message})}}#z(e){try{const t=this.#h.lexer(e);for(const e of t)this.#n.renderToken(e);return t}catch{return t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredMarkdown),!1}}async*#E(){const{prompt:e,sources:s,isPageReloadRecommended:i}=await this.#s.buildPrompt();try{for await(const n of this.#i.fetch(t.AidaClient.AidaClient.buildConsoleInsightsRequest(e)))yield{sources:s,isPageReloadRecommended:i,...n}}catch(e){throw"Server responded: permission denied"===e.message?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredPermissionDenied):e.message.startsWith("Cannot send request:")?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredCannotSend):e.message.startsWith("Request failed:")?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredRequestFailed):e.message.startsWith("Cannot parse chunk:")?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredCannotParseChunk):"Unknown chunk result"===e.message?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredUnknownChunk):e.message.startsWith("Server responded:")?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredApi):t.userMetrics.actionTaken(t.UserMetrics.Action.InsightErroredOther),e}}#L(){t.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab("https://accounts.google.com")}#x(){this.addEventListener("animationend",(()=>{this.#t.querySelector("header h2")?.focus()}),{once:!0})}#N(){return N`<devtools-button
      @click=${this.#A}
      class="search-button"
      .data=${{variant:"outlined",jslogContext:"search"}}
    >
      ${z(M.search)}
    </devtools-button>`}#U(){return N`<x-link href=${D} class="link" jslog=${c.link("learn-more").track({click:!0})}>
      ${z(M.learnMore)}
    </x-link>`}#j(){return"insight"===this.#o.type&&this.#o.directCitationUrls.length?N`
      <ol class="sources-list">
        ${this.#o.directCitationUrls.map(((e,t)=>N`
          <li>
            <x-link
              href=${e}
              class="link"
              data-index=${t+1}
              jslog=${c.link("references.console-insights").track({click:!0})}
            >
              ${e}
            </x-link>
          </li>
        `))}
      </ol>
    `:l.nothing}#O(){if("insight"!==this.#o.type||!this.#o.metadata.factualityMetadata?.facts.length)return l.nothing;const e=this.#o.directCitationUrls,s=this.#o.metadata.factualityMetadata.facts.filter((t=>t.sourceUri&&!e.includes(t.sourceUri))).map((e=>e.sourceUri)),i=this.#o.metadata.attributionMetadata?.citations.filter((e=>e.sourceType===t.AidaClient.CitationSourceType.TRAINING_DATA&&(e.uri||e.repository))).map((e=>e.uri||`https://www.github.com/${e.repository}`))||[],n=[...new Set(i.filter((t=>!s.includes(t)&&!e.includes(t))))];return s.push(...n),0===s.length?l.nothing:N`
      ${this.#o.directCitationUrls.length?N`<h3>${z(M.relatedContent)}</h3>`:l.nothing}
      <ul class="references-list">
        ${s.map((e=>N`
          <li>
            <x-link
              href=${e}
              class="link"
              jslog=${c.link("references.console-insights").track({click:!0})}
            >
              ${e}
            </x-link>
          </li>
        `))}
      </ul>
    `}#M(e){return Boolean(e.factualityMetadata?.facts.length)}#D(){this.#r.value&&(this.#a=this.#r.value.open)}#P(){const e=`${c.section(this.#o.type).track({resize:!0})}`,n=i.Runtime.hostConfig.aidaAvailability?.enterprisePolicyValue===i.Runtime.GenAiEnterprisePolicyValue.ALLOW_WITHOUT_LOGGING;switch(this.#o.type){case"loading":return N`<main jslog=${e}>
            <div role="presentation" aria-label="Loading" class="loader" style="clip-path: url('#clipPath');">
              <svg width="100%" height="64">
                <clipPath id="clipPath">
                  <rect x="0" y="0" width="100%" height="16" rx="8"></rect>
                  <rect x="0" y="24" width="100%" height="16" rx="8"></rect>
                  <rect x="0" y="48" width="100%" height="16" rx="8"></rect>
                </clipPath>
              </svg>
            </div>
          </main>`;case"insight":return N`
        <main jslog=${e}>
          ${this.#o.validMarkdown?N`<devtools-markdown-view
              .data=${{tokens:this.#o.tokens,renderer:this.#n,animationEnabled:!this.disableAnimations}}>
            </devtools-markdown-view>`:this.#o.explanation}
          ${this.#o.timedOut?N`<p class="error-message">${z(M.timedOut)}</p>`:l.nothing}
          ${this.#M(this.#o.metadata)?N`
            <details class="references" ${l.Directives.ref(this.#r)} @toggle=${this.#D} jslog=${c.expand("references").track({click:!0})}>
              <summary>${z(M.references)}</summary>
              ${this.#j()}
              ${this.#O()}
            </details>
          `:l.nothing}
          <details jslog=${c.expand("sources").track({click:!0})}>
            <summary>${z(M.inputData)}</summary>
            <devtools-console-insight-sources-list .sources=${this.#o.sources} .isPageReloadRecommended=${this.#o.isPageReloadRecommended}>
            </devtools-console-insight-sources-list>
          </details>
          <div class="buttons">
            ${this.#N()}
          </div>
        </main>`;case"error":return N`
        <main jslog=${e}>
          <div class="error">${z(M.errorBody)}</div>
        </main>`;case"consent-reminder":return N`
          <main class="reminder-container" jslog=${e}>
            <h3>Things to consider</h3>
            <div class="reminder-items">
              <div>
                <devtools-icon .data=${{iconName:"google",width:"var(--sys-size-8)",height:"var(--sys-size-8)"}}>
                </devtools-icon>
              </div>
              <div>The console message, associated stack trace, related source code, and the associated network headers are sent to Google to generate explanations.
                ${n?"The content you submit and that is generated by this feature will not be used to improve Google’s AI models.":"This data may be seen by human reviewers to improve this feature. Avoid sharing sensitive or personal information."}
              </div>
              <div>
                <devtools-icon .data=${{iconName:"policy",width:"var(--sys-size-8)",height:"var(--sys-size-8)"}}>
                </devtools-icon>
              </div>
              <div>Use of this feature is subject to the
                <x-link
                  href=${"https://policies.google.com/terms"}
                  class="link"
                  jslog=${c.link("terms-of-service.console-insights").track({click:!0})}
                >Google Terms of Service</x-link>
                and
                <x-link
                  href=${"https://policies.google.com/privacy"}
                  class="link"
                  jslog=${c.link("privacy-policy.console-insights").track({click:!0})}
                >Google Privacy Policy</x-link>
              </div>
              <div>
                <devtools-icon .data=${{iconName:"warning",width:"var(--sys-size-8)",height:"var(--sys-size-8)"}}>
                </devtools-icon>
              </div>
              <div>
                <x-link
                  href=${"https://support.google.com/legal/answer/13505487"}
                  class="link"
                  jslog=${c.link("code-snippets-explainer.console-insights").track({click:!0})}
                >Use generated code snippets with caution</x-link>
              </div>
            </div>
          </main>
        `;case"setting-is-not-true":{const i=document.createElement("button");return i.textContent=z(M.settingsLink),i.classList.add("link"),a.ARIAUtils.markAsLink(i),i.addEventListener("click",(()=>{t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsOptInTeaserSettingsLinkClicked),a.ViewManager.ViewManager.instance().showView("chrome-ai")})),i.setAttribute("jslog",`${c.action("open-ai-settings").track({click:!0})}`),N`<main class="opt-in-teaser" jslog=${e}>
          <div class="badge">
            <devtools-icon .data=${{iconName:"lightbulb-spark",width:"var(--sys-size-8)",height:"var(--sys-size-8)"}}>
            </devtools-icon>
          </div>
          <div>
            ${s.i18n.getFormatLocalizedString(E,M.turnOnInSettings,{PH1:i})}
            ${this.#U()}
          </div>
        </main>`}case"not-logged-in":case"sync-is-paused":return N`
          <main jslog=${e}>
            <div class="error">${i.Runtime.hostConfig.isOffTheRecord?z(M.notAvailableInIncognitoMode):z(M.notLoggedIn)}</div>
          </main>`;case"offline":return N`
          <main jslog=${e}>
            <div class="error">${z(M.offline)}</div>
          </main>`}}#_(){const e=i.Runtime.hostConfig.aidaAvailability?.enterprisePolicyValue===i.Runtime.GenAiEnterprisePolicyValue.ALLOW_WITHOUT_LOGGING;return N`<span>
      AI tools may generate inaccurate info that doesn't represent Google's views.
      ${e?"The content you submit and that is generated by this feature will not be used to improve Google’s AI models.":"Data sent to Google may be seen by human reviewers to improve this feature."}
      <button class="link" role="link" @click=${()=>a.ViewManager.ViewManager.instance().showView("chrome-ai")}
        jslog=${c.action("open-ai-settings").track({click:!0})}
      >Open settings</button>
      or
      <x-link href=${D} class="link" jslog=${c.link("learn-more").track({click:!0})}>learn more</x-link>
    </span>`}#G(){const e=!(i.Runtime.hostConfig.aidaAvailability?.disallowLogging??1),s=this.#_();switch(this.#o.type){case"loading":case"setting-is-not-true":return l.nothing;case"error":case"offline":return N`<footer jslog=${c.section("footer")}>
          <div class="disclaimer">
            ${s}
          </div>
        </footer>`;case"not-logged-in":case"sync-is-paused":return i.Runtime.hostConfig.isOffTheRecord?l.nothing:N`<footer jslog=${c.section("footer")}>
        <div class="filler"></div>
        <div>
          <devtools-button
            @click=${this.#L}
            .data=${{variant:"primary",jslogContext:"update-settings"}}
          >
            ${M.signIn}
          </devtools-button>
        </div>
      </footer>`;case"consent-reminder":return N`<footer jslog=${c.section("footer")}>
          <div class="filler"></div>
          <div class="buttons">
            <devtools-button
              @click=${()=>{t.userMetrics.actionTaken(t.UserMetrics.Action.InsightsReminderTeaserSettingsLinkClicked),a.ViewManager.ViewManager.instance().showView("chrome-ai")}}
              .data=${{variant:"tonal",jslogContext:"settings",title:"Settings"}}
            >
              Settings
            </devtools-button>
            <devtools-button
              class='continue-button'
              @click=${this.#T}
              .data=${{variant:"primary",jslogContext:"continue",title:"continue"}}
              >
              Continue
            </devtools-button>
          </div>
        </footer>`;case"insight":return N`<footer jslog=${c.section("footer")}>
        <div class="disclaimer">
          ${s}
        </div>
        <div class="filler"></div>
        <div class="rating">
          ${e?N`
            <devtools-button
              data-rating=${"true"}
              .data=${{variant:"icon_toggle",size:"SMALL",iconName:"thumb-up",toggledIconName:"thumb-up",toggleOnClick:!1,toggleType:"primary-toggle",disabled:void 0!==this.#l,toggled:!0===this.#l,title:z(M.goodResponse),jslogContext:"thumbs-up"}}
              @click=${this.#I}
            ></devtools-button>
            <devtools-button
              data-rating=${"false"}
              .data=${{variant:"icon_toggle",size:"SMALL",iconName:"thumb-down",toggledIconName:"thumb-down",toggleOnClick:!1,toggleType:"primary-toggle",disabled:void 0!==this.#l,toggled:!1===this.#l,title:z(M.badResponse),jslogContext:"thumbs-down"}}
              @click=${this.#I}
            ></devtools-button>
          `:l.nothing}
          <devtools-button
            .data=${{variant:"icon",size:"SMALL",iconName:"report",title:z(M.report),jslogContext:"report"}}
            @click=${this.#S}
          ></devtools-button>
        </div>

      </footer>`}}#q(){switch(this.#o.type){case"not-logged-in":case"sync-is-paused":return z(M.signInToUse);case"offline":return z(M.offlineHeader);case"loading":return z(M.generating);case"insight":return z(M.insight);case"error":return z(M.error);case"consent-reminder":return"Understand console messages with AI";case"setting-is-not-true":return""}}#H(){return"insight"!==this.#o.type||this.#o.completed?l.nothing:N`<devtools-spinner></devtools-spinner>`}#W(){if("setting-is-not-true"===this.#o.type)return l.nothing;const e="consent-reminder"===this.#o.type;return N`
      <header>
        ${e?N`
          <div class="header-icon-container">
            <devtools-icon .data=${{iconName:"lightbulb-spark",width:"18px",height:"18px"}}>
            </devtools-icon>
          </div>`:l.nothing}
        <div class="filler">
          <h2 tabindex="-1">
            ${this.#q()}
          </h2>
          ${this.#H()}
        </div>
        <div class="close-button">
          <devtools-button
            .data=${{variant:"icon",size:"SMALL",iconName:"cross",title:z(M.closeInsight)}}
            jslog=${c.close().track({click:!0})}
            @click=${this.#R}
          ></devtools-button>
        </div>
      </header>
    `}#v(){L(N`
      <div class="wrapper" jslog=${c.pane("console-insights").track({resize:!0})}>
        <div class="animation-wrapper">
          ${this.#W()}
          ${this.#P()}
          ${this.#G()}
        </div>
      </div>
    `,this.#t,{host:this}),this.#r.value&&(this.#r.value.open=this.#a)}}class G extends HTMLElement{#t=this.attachShadow({mode:"open"});#F=[];#V=!1;constructor(){super(),this.#t.adoptedStyleSheets=[$,o.checkboxStyles]}#v(){L(N`
      <ul>
        ${U.repeat(this.#F,(e=>e.value),(e=>N`<li><x-link class="link" title="${O(e.type)} ${z(M.opensInNewTab)}" href="data:text/plain,${encodeURIComponent(e.value)}" jslog=${c.link("source-"+e.type).track({click:!0})}>
            <devtools-icon name="open-externally"></devtools-icon>
            ${O(e.type)}
          </x-link></li>`))}
        ${this.#V?N`<li class="source-disclaimer">
          <devtools-icon name="warning"></devtools-icon>
          ${z(M.reloadRecommendation)}</li>`:l.nothing}
      </ul>
    `,this.#t,{host:this})}set sources(e){this.#F=e,this.#v()}set isPageReloadRecommended(e){this.#V=e,this.#v()}}customElements.define("devtools-console-insight",_),customElements.define("devtools-console-insight-sources-list",G);class q{handleAction(e,s){switch(s){case"explain.console-message.context":case"explain.console-message.context.error":case"explain.console-message.context.warning":case"explain.console-message.context.other":case"explain.console-message.hover":{const i=e.flavor(f.ConsoleViewMessage.ConsoleViewMessage);if(i){s.startsWith("explain.console-message.context")?t.userMetrics.actionTaken(t.UserMetrics.Action.InsightRequestedViaContextMenu):"explain.console-message.hover"===s&&t.userMetrics.actionTaken(t.UserMetrics.Action.InsightRequestedViaHoverButton);const e=new b(i),n=new t.AidaClient.AidaClient;return _.create(e,n).then((e=>{i.setInsight(e)})),!0}return!1}}return!1}}export{q as ActionDelegate,j as CloseEvent,_ as ConsoleInsight,b as PromptBuilder,y as SourceType,k as allowHeader,R as formatConsoleMessage,C as formatNetworkRequest,x as formatRelatedCode,I as formatStackTrace,w as lineWhitespace};
