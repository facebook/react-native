import*as e from"../../core/host/host.js";import*as t from"../../core/i18n/i18n.js";import*as i from"../../ui/components/buttons/buttons.js";import*as n from"../../ui/components/input/input.js";import*as s from"../../ui/lit-html/lit-html.js";import*as o from"../../core/common/common.js";import*as a from"../../third_party/marked/marked.js";import*as r from"../../ui/components/icon_button/icon_button.js";import*as l from"../../ui/components/markdown_view/markdown_view.js";import*as c from"../../ui/visual_logging/visual_logging.js";import*as d from"../../core/platform/platform.js";import*as h from"../../core/sdk/sdk.js";import*as u from"../../ui/legacy/legacy.js";class p extends Error{}class g extends Error{}function m(){const e=new WeakMap;return JSON.stringify(this,(function(t,i){if("object"==typeof i&&null!==i){if(e.has(i))return"(cycle)";e.set(i,!0)}if(i instanceof HTMLElement){const e=i.id?` id="${i.id}"`:"",t=i.classList.value?` class="${i.classList.value}"`:"";return`<${i.nodeName.toLowerCase()}${e}${t}>${i.hasChildNodes()?"...":""}</${i.nodeName.toLowerCase()}>`}if(!(this instanceof CSSStyleDeclaration)||isNaN(Number(t)))return i}))}class f{static async execute(e,t,{throwOnSideEffect:i}){const n=await t.evaluate({expression:e,replMode:!0,includeCommandLineAPI:!0,returnByValue:!1,silent:!1,generatePreview:!0,allowUnsafeEvalBlockedByCSP:!1,throwOnSideEffect:i},!1,!0);if(!n)throw new Error("Response is not found");if("error"in n)throw new p(n.error);if(n.exceptionDetails){const e=n.exceptionDetails.exception?.description;if(e?.startsWith("EvalError: Possible side-effect in debug-evaluate"))throw new g(e);throw new p(e||"JS exception")}return async function(e){switch(e.type){case"string":return`'${e.value}'`;case"bigint":return`${e.value}n`;case"boolean":case"number":return`${e.value}`;case"undefined":return"undefined";case"symbol":case"function":return`${e.description}`;case"object":{const t=await e.callFunction(m);if(!t.object||"string"!==t.object.type)throw new Error("Could not stringify the object"+e);return t.object.value}default:throw new Error("Unknown type to stringify "+e.type)}}(n.object)}}const y=new CSSStyleSheet;y.replaceSync("*{box-sizing:border-box}.feedback{display:flex;flex-direction:column;gap:var(--sys-size-4);margin-top:var(--sys-size-4)}.feedback-header{display:flex;justify-content:space-between;align-items:center}.feedback-title{margin:0}.feedback-disclaimer{padding:0 var(--sys-size-4)}.vertical-separator{height:20px;width:1px;vertical-align:top;margin:0 var(--sys-size-2);background:var(--color-background-inverted);opacity:10%;display:inline-block}\n/*# sourceURL=./components/provideFeedback.css */\n");const b="Thumbs up",v="Thumbs down",w="Provide additional feedback",x="Feedback submitted will also include your conversation.",C="Submit",S="Why did you choose this rating? (optional)",k="Close",T="Report legal issue",E=t.i18n.lockedString;class $ extends HTMLElement{static litTagName=s.literal`devtools-provide-feedback`;#e=this.attachShadow({mode:"open"});#t;#i=!1;#n;constructor(e){super(),this.#t=e}set props(e){this.#t=e,this.#s()}connectedCallback(){this.#e.adoptedStyleSheets=[y,n.textInputStyles],this.#s()}#o(e){this.#n!==e&&(this.#n=e,this.#i=!0,this.#t.onFeedbackSubmit(this.#n),this.#s())}#a=()=>{this.#i=!1,this.#s()};#r=e=>{e.preventDefault();const t=this.#e.querySelector(".feedback-input");this.#n&&t&&t.value&&(this.#t.onFeedbackSubmit(this.#n,t.value),this.#i=!1,this.#s())};#l=()=>{e.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab("https://support.google.com/legal/troubleshooter/1114905?hl=en#ts=1115658%2C13380504")};#c(){return s.html`
      <${i.Button.Button.litTagName}
        .data=${{variant:"icon",size:"SMALL",iconName:"thumb-up",active:"POSITIVE"===this.#n,title:E(b),jslogContext:"thumbs-up"}}
        @click=${()=>this.#o("POSITIVE")}
      ></${i.Button.Button.litTagName}>
      <${i.Button.Button.litTagName}
        .data=${{variant:"icon",size:"SMALL",iconName:"thumb-down",active:"NEGATIVE"===this.#n,title:E(v),jslogContext:"thumbs-down"}}
        @click=${()=>this.#o("NEGATIVE")}
      ></${i.Button.Button.litTagName}>
      <div class="vertical-separator"></div>
      <${i.Button.Button.litTagName}
        .data=${{variant:"icon",size:"SMALL",title:E(T),iconName:"report",jslogContext:"report"}}
        @click=${this.#l}
      ></${i.Button.Button.litTagName}>
    `}#d(){return s.html`
      <form class="feedback" @submit=${this.#r}>
        <div class="feedback-header">
          <h4 class="feedback-title">${E(S)}</h4>
          <${i.Button.Button.litTagName}
            aria-label=${E(k)}
            @click=${this.#a}
            .data=${{variant:"icon",iconName:"cross",size:"SMALL",title:E(k),jslogContext:"close"}}
          ></${i.Button.Button.litTagName}>
        </div>
        <input
          type="text"
          class="devtools-text-input feedback-input"
          placeholder=${E(w)}
        >
        <span class="feedback-disclaimer">${E(x)}</span>
        <${i.Button.Button.litTagName}
        aria-label=${E(C)}
        .data=${{type:"submit",variant:"outlined",size:"SMALL",title:E(C),jslogContext:"send"}}
        >${E(C)}</${i.Button.Button.litTagName}>
      </div>
    `}#s(){s.render(s.html`
        <div class="rate-buttons">
          ${this.#c()}
          ${this.#i?this.#d():s.nothing}
        </div>`,this.#e,{host:this})}}customElements.define("devtools-provide-feedback",$);const A="Fix this issue using JavaScript code execution";var N;async function I(e,{throwOnSideEffect:t}){const i=u.Context.Context.instance().flavor(h.Target.Target);if(!i)throw new Error("Target is not found for executing code");const n=i.model(h.ResourceTreeModel.ResourceTreeModel),s=i.model(h.RuntimeModel.RuntimeModel),o=i.pageAgent();if(!n?.mainFrame)throw new Error("Main frame is not found for executing code");const{executionContextId:a}=await o.invoke_createIsolatedWorld({frameId:n.mainFrame.id,worldName:"devtools_freestyler"}),r=s?.executionContext(a);if(!r)throw new Error("Execution context is not found for executing code");try{return await f.execute(e,r,{throwOnSideEffect:t})}catch(e){if(e instanceof p)return`Error: ${e.message}`;throw e}}!function(e){e.THOUGHT="thought",e.ACTION="action",e.ANSWER="answer",e.ERROR="error",e.QUERYING="querying"}(N||(N={}));class R{static buildRequest(t){const i=o.Settings.Settings.instance().getHostConfig();return{input:t.input,preamble:t.preamble,chat_history:t.chatHistory,client:e.AidaClient.CLIENT_NAME,options:{temperature:i?.devToolsFreestylerDogfood.aidaTemperature??0,model_id:i?.devToolsFreestylerDogfood.aidaModelId??void 0},metadata:{disable_user_content_logging:!t.serverSideLoggingEnabled,string_session_id:t.sessionId},functionality_type:e.AidaClient.FunctionalityType.CHAT,client_feature:e.AidaClient.ClientFeature.CHROME_FREESTYLER}}static parseResponse(e){const t=e.split("\n");let i,n,s,o=0;for(;o<t.length;){const e=t[o].trim();if(e.startsWith("THOUGHT:")&&!i)i=e.substring(8).trim(),o++;else if(e.startsWith("ACTION")&&!n){const e=[];let i=o+1;for(;i<t.length&&"STOP"!==t[i].trim();)"js"!==t[i].trim()&&e.push(t[i]),i++;n=e.join("\n").replaceAll("```","").replaceAll("``","").trim(),o=i+1}else if(e.startsWith("ANSWER:")&&!s){const i=[e.substring(7).trim()];let n=o+1;for(;n<t.length;){const e=t[n].trim();if(e.startsWith("ACTION")||e.startsWith("OBSERVATION:")||e.startsWith("THOUGHT:"))break;i.push(t[n]),n++}s=i.join("\n").trim(),o=n}else o++}return s||i||n||(s=e),{thought:i,action:n,answer:s}}#h;#u=new Map;#p;#g;#m;#f=crypto.randomUUID();constructor(e){this.#h=e.aidaClient,this.#m=e.execJs??I,this.#g=e.confirmSideEffect,this.#p=e.serverSideLoggingEnabled??!1}get#y(){return[...this.#u.values()].flat()}get chatHistoryForTesting(){return this.#y}async#b(t){let i,n="";for await(const s of this.#h.fetch(t))if(n=s.explanation,i=s.metadata.rpcGlobalId??i,s.metadata.attributionMetadata?.some((t=>t.attributionAction===e.AidaClient.RecitationAction.BLOCK)))throw new Error("Attribution action does not allow providing the response");return{response:n,rpcId:i}}async#v(e,{throwOnSideEffect:t,confirmExecJs:i,execJsDeniedMesssage:n}){const s=`{${e};((typeof data !== "undefined") ? data : undefined)}`;try{if(!await(i?.call(this,e)??Promise.resolve(!0)))throw new Error(n??"Code execution is not allowed");const o=await this.#m(s,{throwOnSideEffect:t});if(d.StringUtilities.countWtf8Bytes(o)>25e3)throw new Error("Output exceeded the maximum allowed length.");return o}catch(t){return t instanceof g?await this.#v(e,{throwOnSideEffect:!1,confirmExecJs:this.#g,execJsDeniedMesssage:t.message}):`Error: ${t.message}`}}#w=0;async*run(t,i={isFixQuery:!1}){const n="Sorry, I could not help you with this query.",s=[];t=`QUERY: ${t}`;const o=++this.#w;i.signal?.addEventListener("abort",(()=>{this.#u.delete(o)}));for(let a=0;a<10;a++){yield{step:N.QUERYING};const r=R.buildRequest({input:t,preamble:"You are a CSS debugging assistant integrated into Chrome DevTools.\nThe user selected a DOM element in the browser's DevTools and sends a CSS-related\nquery about the selected DOM element. You are going to answer to the query in these steps:\n* THOUGHT\n* ACTION\n* ANSWER\nUse THOUGHT to explain why you take the ACTION.\nUse ACTION to evaluate JavaScript code on the page to gather all the data needed to answer the query and put it inside the data variable - then return STOP.\nYou have access to a special $0 variable referencing the current element in the scope of the JavaScript code.\nOBSERVATION will be the result of running the JS code on the page.\nAfter that, you can answer the question with ANSWER or run another ACTION query.\nPlease run ACTION again if the information you received is not enough to answer the query.\nPlease answer only if you are sure about the answer. Otherwise, explain why you're not able to answer.\nWhen answering, remember to consider CSS concepts such as the CSS cascade, explicit and implicit stacking contexts and various CSS layout types.\nWhen answering, always consider MULTIPLE possible solutions.\n\nExample:\nACTION\nconst data = {\n  color: window.getComputedStyle($0)['color'],\n  backgroundColor: window.getComputedStyle($0)['backgroundColor'],\n}\nSTOP\n\nExample session:\n\nQUERY: Why is this element centered in its container?\nTHOUGHT: Let's check the layout properties of the container.\nACTION\n/* COLLECT_INFORMATION_HERE */\nconst data = {\n  /* THE RESULT YOU ARE GOING TO USE AS INFORMATION */\n}\nSTOP\n\nYou will be called again with this:\nOBSERVATION\n/* OBJECT_CONTAINING_YOUR_DATA */\n\nYou then output:\nANSWER: The element is centered on the page because the parent is a flex container with justify-content set to center.\n\nThe example session ends here.",chatHistory:this.#u.size?this.#y:void 0,serverSideLoggingEnabled:this.#p,sessionId:this.#f});let l,c;try{const e=await this.#b(r);l=e.response,c=e.rpcId}catch(e){if(O("Error calling the AIDA API",e),i.signal?.aborted)break;yield{step:N.ERROR,text:n,rpcId:c};break}if(i.signal?.aborted)break;O(`Iteration: ${a}`,"Request",r,"Response",l),s.push({request:structuredClone(r),response:l});const d=this.#u.get(o)??[];this.#u.set(o,[...d,{text:t,entity:e.AidaClient.Entity.USER},{text:l,entity:e.AidaClient.Entity.SYSTEM}]);const{thought:h,action:u,answer:p}=R.parseResponse(l);if(!u){if(p){yield{step:N.ANSWER,text:p,rpcId:c};break}yield{step:N.ANSWER,text:n,rpcId:c};break}{h&&(yield{step:N.THOUGHT,text:h,rpcId:c}),O(`Action to execute: ${u}`);const e=await this.#v(u,{throwOnSideEffect:!i.isFixQuery});O(`Action result: ${e}`),yield{step:N.ACTION,code:u,output:e,rpcId:c},t=`OBSERVATION: ${e}`}9===a&&(yield{step:N.ERROR,text:"Max steps reached, please try again."})}L()&&(localStorage.setItem("freestylerStructuredLog",JSON.stringify(s)),window.dispatchEvent(new CustomEvent("freestylerdone")))}}function L(){return Boolean(localStorage.getItem("debugFreestylerEnabled"))}function O(...e){L()&&console.log(...e)}globalThis.setDebugFreestylerEnabled=function(e){e?localStorage.setItem("debugFreestylerEnabled","true"):localStorage.removeItem("debugFreestylerEnabled")};const B=new CSSStyleSheet;B.replaceSync("*{box-sizing:border-box;margin:0;padding:0}:host{width:100%;height:100%;user-select:text;display:flex;flex-direction:column;background-color:var(--sys-color-cdt-base-container)}.chat-ui{width:100%;height:100%;max-height:100%;display:flex;flex-direction:column}.input-form{display:flex;flex-direction:column;padding:var(--sys-size-8) var(--sys-size-4) 0 var(--sys-size-4);max-width:720px;width:100%;margin:0 auto}.chat-input-container{margin:var(--sys-size-3) 0;padding:0 2px;border-radius:4px;border:1px solid var(--sys-color-neutral-outline);width:100%;display:flex;background-color:var(--sys-color-cdt-base-container)}.chat-input{border:0;height:var(--sys-size-11);padding:0 6px;flex-grow:1;color:var(--sys-color-on-surface);background-color:var(--sys-color-cdt-base-container)}.chat-input:focus-visible{outline:none}.chat-input-container:has(.chat-input:focus-visible){outline:1px solid var(--sys-color-primary)}.chat-input::placeholder{color:var(--sys-color-state-disabled)}.chat-input-disclaimer{text-align:center;color:var(--sys-color-on-surface-subtle);margin-bottom:var(--sys-size-4)}.messages-container{margin:var(--sys-size-6) auto 0 auto;max-width:720px;padding:0 var(--sys-size-4)}.messages-scroll-container{overflow:overlay;flex-grow:1}.chat-message{user-select:text;cursor:initial;width:fit-content;padding:8px var(--sys-size-8);font-size:12px;border-radius:var(--sys-size-6);word-break:break-word;&:not(:first-of-type){margin-top:var(--sys-size-6)}&.query{max-width:320px;color:var(--sys-color-on-surface);background:var(--sys-color-surface2);margin-left:auto}&.answer{max-width:440px;color:var(--sys-color-on-surface);background:var(--sys-color-surface2)}& .chat-loading{margin:4px 0;padding:4px 0}& .actions{display:flex;gap:var(--sys-size-8);justify-content:space-between;align-items:flex-end}}.input-header{display:inline-flex;align-items:center;justify-content:space-between;margin-bottom:2px;line-height:20px;& .feedback-icon{width:var(--sys-size-8);height:var(--sys-size-8)}& .header-link-container{display:inline-flex;align-items:center;gap:var(--sys-size-2)}}.link{color:var(--text-link);text-decoration:underline}.select-an-element-text{margin-left:2px}.empty-state-container{display:flex;flex-direction:column;width:100%;height:100%;align-items:center;justify-content:center;gap:4px;font-size:16px;opacity:70%}.action-result{margin:8px 0}.js-code-output{margin-top:-8px;white-space:pre;max-width:100%;overflow:auto;scrollbar-width:none;padding:4px 6px;background-color:var(--sys-color-surface3);color:var(--sys-color-on-surface);font-size:10px;font-family:var(--source-code-font-family)}.error-step{color:var(--sys-color-error)}.side-effect-confirmation{background:var(--color-background);padding:24px;border-radius:var(--sys-size-6);margin-bottom:8px;p{margin:0;margin-bottom:12px;padding:0}}.side-effect-buttons-container{margin-top:8px;devtools-button{margin-top:4px}}.consent-view{padding:24px;text-wrap:pretty;.accept-button{margin-top:8px}ul{padding:0 13px}h2{font-weight:500}}\n/*# sourceURL=./components/freestylerChatUi.css */\n");const F="https://goo.gle/freestyler-dogfood",M="Ask a question about the selected element",U="Chat messages and data from this page will be sent to Google, reviewed by humans, and used to improve the feature. Do not use on pages with personal or sensitive information. Freestyler may display inaccurate information.",j="Send",_="Cancel",H="Select an element",P="How can I help you?",D="This feature is only available when you sign into Chrome with your Google account.",z="This feature requires you to turn on Chrome sync.",V="Check your internet connection and try again.",W="Things to consider",q="Accept",G="This feature uses AI and might produce inaccurate information.",Y="Your inputs and the information from the page you are using this feature for are sent to Google.",J="Do not use on pages with personal or sensitive information.",Q="Data may be seen by human reviewers and can be used to improve this feature.",K="The code contains side effects. Do you wish to continue?",X="Execute",Z="Cancel",ee="Dogfood",te="Send Feedback",ie="Fix this issue",ne=t.i18n.lockedString;class se extends l.MarkdownView.MarkdownInsightRenderer{templateForToken(e){if("code"===e.type){const t=e.text.split("\n");"css"===t[0]?.trim()&&(e.lang="css",e.text=t.slice(1).join("\n"))}return super.templateForToken(e)}}class oe extends HTMLElement{static litTagName=s.literal`devtools-freestyler-chat-ui`;#e=this.attachShadow({mode:"open"});#x=new se;#t;constructor(e){super(),this.#t=e}set props(e){this.#t=e,this.#s()}connectedCallback(){this.#e.adoptedStyleSheets=[B],this.#s()}focusTextInput(){const e=this.#e.querySelector(".chat-input");e&&e.focus()}scrollToLastMessage(){const e=this.#e.querySelector(".chat-message:last-child");e&&e.scrollIntoViewIfNeeded()}#r=e=>{e.preventDefault();const t=this.#e.querySelector(".chat-input");t&&t.value&&(this.#t.onTextSubmit(t.value),t.value="")};#C=e=>{e.preventDefault(),this.#t.isLoading&&this.#t.onCancelClick()};#S(e){return s.html`<${$.litTagName}
      .props=${{onFeedbackSubmit:(t,i)=>{this.#t.onFeedbackSubmit(e,t,i)}}}
      ></${$.litTagName}>`}#k(e){let t=[];try{t=a.Marked.lexer(e);for(const e of t)this.#x.renderToken(e)}catch(t){return s.html`${e}`}return s.html`<${l.MarkdownView.MarkdownView.litTagName}
      .data=${{tokens:t,renderer:this.#x}}>
    </${l.MarkdownView.MarkdownView.litTagName}>`}#T(e){return e.step===N.ACTION?s.html`
        <div class="action-result">
          <${l.CodeBlock.CodeBlock.litTagName}
            .code=${e.code.trim()}
            .codeLang=${"js"}
            .displayToolbar=${!1}
            .displayNotice=${!0}
          ></${l.CodeBlock.CodeBlock.litTagName}>
          <div class="js-code-output">${e.output}</div>
        </div>
      `:e.step===N.ERROR?s.html`<p class="error-step">${this.#k(e.text)}</p>`:s.html`<p>${this.#k(e.text)}</p>`}#E(e){return s.html`<div class="side-effect-confirmation">
      <p>${ne(K)}</p>
      <${l.CodeBlock.CodeBlock.litTagName}
        .code=${e.code}
        .codeLang=${"js"}
        .displayToolbar=${!1}
      ></${l.CodeBlock.CodeBlock.litTagName}>
      <div class="side-effect-buttons-container">
        <${i.Button.Button.litTagName}
          .data=${{variant:"primary",jslogContext:"accept-execute-code"}}
          @click=${()=>e.onAnswer(!0)}
          >${ne(X)}</${i.Button.Button.litTagName}>
        <${i.Button.Button.litTagName}
          .data=${{variant:"outlined",jslogContext:"decline-execute-code"}}
          @click=${()=>e.onAnswer(!1)}
        >${ne(Z)}</${i.Button.Button.litTagName}>
      </div>
    </div>`}#$=(e,{isLast:t})=>{if("user"===e.entity)return s.html`<div class="chat-message query">${e.text}</div>`;const n=!this.#t.isLoading&&t&&e.suggestingFix,o=!t||!this.#t.confirmSideEffectDialog&&t,a=this.#t.isLoading&&t&&!this.#t.confirmSideEffectDialog;return s.html`
      <div class="chat-message answer">
        ${e.steps.map((e=>this.#T(e)))}
        ${this.#t.confirmSideEffectDialog&&t?this.#E(this.#t.confirmSideEffectDialog):s.nothing}
        <div class="actions">
          ${o&&void 0!==e.rpcId?this.#S(e.rpcId):s.nothing}
          ${n?s.html`<${i.Button.Button.litTagName}
                  .data=${{variant:"outlined",jslogContext:"fix-this-issue"}}
                  @click=${this.#t.onFixThisIssueClick}
                >${ne(ie)}</${i.Button.Button.litTagName}>`:s.nothing}
        </div>
        ${a?s.html`<div class="chat-loading">Loading...</div>`:s.nothing}
      </div>
    `};#A=()=>{const e={size:"SMALL",iconName:"select-element",toggledIconName:"select-element",toggleType:"primary-toggle",toggled:this.#t.inspectElementToggled,title:ne(H),jslogContext:"select-element"};return this.#t.selectedNode?s.html`
        <${i.Button.Button.litTagName}
          .data=${{variant:"icon_toggle",...e}}
          @click=${this.#t.onInspectElementClick}
        ></${i.Button.Button.litTagName}>
        ${s.Directives.until(o.Linkifier.Linkifier.linkify(this.#t.selectedNode))}`:s.html`
        <${i.Button.Button.litTagName}
          .data=${{variant:"text",...e}}
          @click=${this.#t.onInspectElementClick}
        ><span class="select-an-element-text">${ne(H)}</span></${i.Button.Button.litTagName}>`};#N=()=>s.html`
        <${r.Icon.Icon.litTagName}
          name="dog-paw"
          class="feedback-icon"
        ></${r.Icon.Icon.litTagName}>
        <span>${ne(ee)}</span>
        <span>-</span>
        <x-link href=${"https://goo.gle/freestyler-feedback"}
          class="link"
          jslog=${c.action("freestyler.feedback").track({click:!0})}>
         ${ne(te)}
        </x-link>`;#I=()=>s.html`
      <div class="messages-scroll-container">
        <div class="messages-container">
          ${this.#t.messages.map(((e,t,i)=>this.#$(e,{isLast:i.at(-1)===e})))}
        </div>
      </div>
    `;#R=()=>s.html`<div class="empty-state-container">
      <${r.Icon.Icon.litTagName} name="spark" style="width: 36px; height: 36px;"></${r.Icon.Icon.litTagName}>
      ${ne(P)}
    </div>`;#L=()=>{const t=this.#t.aidaAvailability===e.AidaClient.AidaAvailability.AVAILABLE,n=!Boolean(this.#t.selectedNode)||!t;return s.html`
      <div class="chat-ui">
        ${this.#t.messages.length>0?this.#I():this.#R()}
        <form class="input-form" @submit=${this.#r}>
          <div class="input-header">
            <div class="header-link-container">
              ${this.#A()}
            </div>
            <div class="header-link-container">
              ${this.#N()}
            </div>
          </div>
          <div class="chat-input-container">
            <input type="text" class="chat-input" .disabled=${n}
              placeholder=${function(t){switch(t){case e.AidaClient.AidaAvailability.AVAILABLE:return ne(M);case e.AidaClient.AidaAvailability.NO_ACCOUNT_EMAIL:return ne(D);case e.AidaClient.AidaAvailability.NO_ACTIVE_SYNC:return ne(z);case e.AidaClient.AidaAvailability.NO_INTERNET:return ne(V)}}(this.#t.aidaAvailability)}>
              ${this.#t.isLoading?s.html`
                    <${i.Button.Button.litTagName}
                      class="step-actions"
                      aria-label=${ne(_)}
                      @click=${this.#C}
                      .data=${{variant:"primary",size:"SMALL",iconName:"stop",title:ne(_),jslogContext:"stop"}}
                    ></${i.Button.Button.litTagName}>`:s.html`
                    <${i.Button.Button.litTagName}
                      class="step-actions"
                      aria-label=${ne(j)}
                      .data=${{type:"submit",variant:"icon",size:"SMALL",iconName:"send",title:ne(j),disabled:n,jslogContext:"send"}}
                    ></${i.Button.Button.litTagName}>`}
          </div>
          <span class="chat-input-disclaimer">${ne(U)} See <x-link class="link" href=${F}>dogfood terms</x-link>.</span>
        </form>
      </div>
    `};#O=()=>s.html`
      <div class="consent-view">
        <h2 tabindex="-1">
          ${ne(W)}
        </h2>
        <main>
          ${ne(G)}
          <ul>
            <li>${ne(Y)}</li>
            <li>${ne(Q)}</li>
            <li>${ne(J)}</li>
            <li>See <x-link class="link" href=${F}>dogfood terms</x-link>.</li>
          </ul>
          <${i.Button.Button.litTagName}
            class="accept-button"
            @click=${this.#t.onAcceptConsentClick}
            .data=${{variant:"primary",jslogContext:"accept"}}
          >${ne(q)}</${i.Button.Button.litTagName}>
        </main>
      </div>
    `;#s(){switch(this.#t.state){case"chat-view":s.render(this.#L(),this.#e,{host:this});break;case"consent-view":s.render(this.#O(),this.#e,{host:this})}}}const ae={MarkdownRendererWithCodeBlock:se};customElements.define("devtools-freestyler-chat-ui",oe);const re=new CSSStyleSheet;re.replaceSync(".freestyler-toolbar-container{display:flex;background-color:var(--sys-color-cdt-base-container);border-bottom:1px solid var(--sys-color-divider);flex:0 0 auto;justify-content:space-between}.freestyler-chat-ui-container{display:flex;flex-direction:column;width:100%;height:100%;align-items:center;overflow:hidden}\n/*# sourceURL=./freestylerPanel.css */\n");const le="Clear messages",ce="Send feedback",de="You stopped this response",he=t.i18n.lockedString;function ue(e,t,i){s.render(s.html`
    <${oe.litTagName} .props=${e} ${s.Directives.ref((e=>{e&&e instanceof oe&&(t.freestylerChatUi=e)}))}></${oe.litTagName}>
  `,i,{host:e})}let pe;class ge extends u.Panel.Panel{view;static panelName="freestyler";#B;#F;#M;#h;#U;#j;#_={};#p=function(){return"true"===localStorage.getItem("freestyler_enableServerSideLogging")}();#H=o.Settings.Settings.instance().createLocalSetting("freestyler-dogfood-consent-onboarding-finished",!1);constructor(t=ue,{aidaClient:i,aidaAvailability:n}){super(ge.panelName),this.view=t,function(t,{onClearClick:i}){const n=t.createChild("div","freestyler-toolbar-container"),s=new u.Toolbar.Toolbar("",n),o=new u.Toolbar.Toolbar("freestyler-right-toolbar",n),a=new u.Toolbar.ToolbarButton(he(le),"clear",void 0,"freestyler.clear");a.addEventListener("Click",i),s.appendToolbarItem(a),o.appendSeparator();const r=new u.Toolbar.ToolbarButton(he(ce),"help",void 0,"freestyler.feedback");r.addEventListener("Click",(()=>{e.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(F)})),o.appendToolbarItem(r)}(this.contentElement,{onClearClick:this.#P.bind(this)}),this.#B=u.ActionRegistry.ActionRegistry.instance().getAction("elements.toggle-element-search"),this.#h=i,this.#M=this.contentElement.createChild("div","freestyler-chat-ui-container"),this.#F=u.Context.Context.instance().flavor(h.DOMModel.DOMNode),this.#j={state:this.#H.get()?"chat-view":"consent-view",aidaAvailability:n,messages:[],inspectElementToggled:this.#B.toggled(),selectedNode:this.#F,isLoading:!1,onTextSubmit:this.#D.bind(this),onInspectElementClick:this.#z.bind(this),onFeedbackSubmit:this.#V.bind(this),onAcceptConsentClick:this.#W.bind(this),onCancelClick:this.#q.bind(this),onFixThisIssueClick:()=>{this.#D(A,!0)}},this.#B.addEventListener("Toggled",(e=>{this.#j.inspectElementToggled=e.data,this.doUpdate()})),this.#U=this.#G(),u.Context.Context.instance().addFlavorChangeListener(h.DOMModel.DOMNode,(e=>{this.#j.selectedNode!==e.data&&(this.#j.selectedNode=e.data,this.doUpdate())})),this.doUpdate()}#G(){return new R({aidaClient:this.#h,serverSideLoggingEnabled:this.#p,confirmSideEffect:this.showConfirmSideEffectUi.bind(this)})}static async instance(t={forceNew:null}){const{forceNew:i}=t;if(!pe||i){const t=await e.AidaClient.AidaClient.getAidaClientAvailability(),i=new e.AidaClient.AidaClient;pe=new ge(ue,{aidaClient:i,aidaAvailability:t})}return pe}wasShown(){this.registerCSSFiles([re]),this.#_.freestylerChatUi?.focusTextInput()}doUpdate(){this.view(this.#j,this.#_,this.#M)}async showConfirmSideEffectUi(e){const t=d.PromiseUtilities.promiseWithResolvers();this.#j.confirmSideEffectDialog={code:e,onAnswer:e=>t.resolve(e)},this.doUpdate();const i=await t.promise;return this.#j.confirmSideEffectDialog=void 0,this.doUpdate(),i}#z(){this.#B.execute()}#V(e,t,i){this.#h.registerClientEvent({corresponding_aida_rpc_global_id:e,disable_user_content_logging:!this.#p,do_conversation_client_event:{user_feedback:{sentiment:t,user_input:{comment:i}}}})}#W(){this.#H.set(!0),this.#j.state="chat-view",this.doUpdate()}handleAction(t){switch(t){case"freestyler.element-panel-context":e.userMetrics.actionTaken(e.UserMetrics.Action.FreestylerOpenedFromElementsPanel),this.doUpdate();break;case"freestyler.style-tab-context":e.userMetrics.actionTaken(e.UserMetrics.Action.FreestylerOpenedFromStylesTab),this.doUpdate()}}#P(){this.#j.messages=[],this.#j.isLoading=!1,this.#U=this.#G(),this.#q(),this.doUpdate()}#Y=new AbortController;#q(){this.#Y.abort(),this.#Y=new AbortController,this.#j.isLoading=!1,this.doUpdate()}async#D(e,t=!1){this.#j.messages.push({entity:"user",text:e}),this.#j.isLoading=!0;const i=e!==A;let n={entity:"model",suggestingFix:i,steps:[]};this.doUpdate(),this.#Y=new AbortController;const s=this.#Y.signal;s.addEventListener("abort",(()=>{n.rpcId=void 0,n.suggestingFix=!1,n.steps.push({step:N.ERROR,text:he(de)})}));for await(const o of this.#U.run(e,{signal:s,isFixQuery:t}))o.step!==N.QUERYING?(o.step!==N.ANSWER&&o.step!==N.ERROR||(this.#j.isLoading=!1),n.rpcId=o.rpcId,n.steps.push(o),this.doUpdate(),this.#_.freestylerChatUi?.scrollToLastMessage()):(n={entity:"model",suggestingFix:i,steps:[]},this.#j.messages.push(n),this.doUpdate(),this.#_.freestylerChatUi?.scrollToLastMessage())}}class me{handleAction(e,t){switch(t){case"freestyler.element-panel-context":case"freestyler.style-tab-context":return(async()=>{const e=u.ViewManager.ViewManager.instance().view(ge.panelName);if(e){await u.ViewManager.ViewManager.instance().showView(ge.panelName);(await e.widget()).handleAction(t)}})(),!0}return!1}}globalThis.setFreestylerServerSideLoggingEnabled=function(e){e?localStorage.setItem("freestyler_enableServerSideLogging","true"):localStorage.removeItem("freestyler_enableServerSideLogging")};export{me as ActionDelegate,F as DOGFOOD_INFO,p as ExecutionError,A as FIX_THIS_ISSUE_PROMPT,ae as FOR_TEST,R as FreestylerAgent,oe as FreestylerChatUi,f as FreestylerEvaluateAction,ge as FreestylerPanel,$ as ProvideFeedback,g as SideEffectError,N as Step};
