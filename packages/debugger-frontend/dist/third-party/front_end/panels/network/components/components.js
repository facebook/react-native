import*as e from"../../../ui/components/helpers/helpers.js";import*as t from"../../../ui/lit-html/lit-html.js";import*as r from"../../../ui/visual_logging/visual_logging.js";import*as s from"../../../core/host/host.js";import*as i from"../../../core/i18n/i18n.js";import*as o from"../../../core/platform/platform.js";import*as a from"../../../core/sdk/sdk.js";import*as n from"../../../third_party/chromium/client-variations/client-variations.js";import*as d from"../../../ui/components/buttons/buttons.js";import*as l from"../../../ui/components/icon_button/icon_button.js";import"../forward/forward.js";import*as h from"../../../core/common/common.js";import*as c from"../../../models/persistence/persistence.js";import*as u from"../../../models/workspace/workspace.js";import*as p from"../../../ui/components/input/input.js";import*as m from"../../../ui/components/legacy_wrapper/legacy_wrapper.js";import*as g from"../../../ui/components/render_coordinator/render_coordinator.js";import*as v from"../../../ui/legacy/legacy.js";import*as w from"../../sources/sources.js";import*as f from"../../../models/issues_manager/issues_manager.js";import*as y from"../../../ui/components/report_view/report_view.js";import{PanelUtils as b}from"../../utils/utils.js";import*as k from"../../../ui/components/data_grid/data_grid.js";const R=new CSSStyleSheet;R.replaceSync(":host{display:inline}.editable{cursor:text;overflow-wrap:anywhere;min-height:18px;line-height:18px;min-width:0.5em;background:transparent;border:none;border-radius:4px;outline:none;display:inline-block;font-family:var(--monospace-font-family);font-size:var(--monospace-font-size);&:hover{border:1px solid var(--sys-color-neutral-outline)}&:focus{border:1px solid var(--sys-color-state-focus-ring)}}.editable::selection{color:var(--sys-color-on-tonal-container);background-color:var(--sys-color-tonal-container)}\n/*# sourceURL=EditableSpan.css */\n");const{render:x,html:S}=t;class $ extends HTMLElement{static litTagName=t.literal`devtools-editable-span`;#e=this.attachShadow({mode:"open"});#t=this.#r.bind(this);#s="";connectedCallback(){this.#e.adoptedStyleSheets=[R],this.#e.addEventListener("focusin",this.#i.bind(this)),this.#e.addEventListener("keydown",this.#o.bind(this)),this.#e.addEventListener("input",this.#a.bind(this))}set data(t){this.#s=t.value,e.ScheduledRender.scheduleRender(this,this.#t)}get value(){return this.#e.querySelector("span")?.innerText||""}set value(e){this.#s=e;const t=this.#e.querySelector("span");t&&(t.innerText=e)}#o(e){"Enter"===e.key&&(e.preventDefault(),e.target?.blur())}#a(e){this.#s=e.target.innerText}#i(e){const t=e.target,r=window.getSelection(),s=document.createRange();s.selectNodeContents(t),r?.removeAllRanges(),r?.addRange(s)}#r(){if(!e.ScheduledRender.isScheduledRender(this))throw new Error("HeaderSectionRow render was not scheduled");x(S`<span
        contenteditable="plaintext-only"
        class="editable"
        tabindex="0"
        .innerText=${this.#s}
        jslog=${r.value("header-editor").track({change:!0,keydown:"Enter|Escape"})}
    </span>`,this.#e,{host:this})}focus(){requestAnimationFrame((()=>{const e=this.#e.querySelector(".editable");e?.focus()}))}}customElements.define("devtools-editable-span",$);var T=Object.freeze({__proto__:null,EditableSpan:$});const H=new CSSStyleSheet;H.replaceSync(':host{display:block}.row{display:flex;line-height:20px;padding-left:8px;gap:12px;user-select:text}.row.header-editable{font-family:var(--monospace-font-family);font-size:var(--monospace-font-size)}.header-name{color:var(--sys-color-on-surface);font-weight:400;width:30%;min-width:160px;max-width:240px;flex-shrink:0;text-transform:capitalize;overflow-wrap:break-word}.header-name,\n.header-value{&::selection{color:var(--sys-color-on-tonal-container);background-color:var(--sys-color-tonal-container)}}.header-name.pseudo-header{text-transform:none}.header-editable .header-name{color:var(--sys-color-token-property-special)}.row.header-deleted .header-name{color:var(--sys-color-token-subtle)}.header-value{display:flex;overflow-wrap:anywhere;margin-inline-end:14px}.header-badge-text{font-variant:small-caps;font-weight:500;white-space:pre-wrap;word-break:break-all;text-transform:none}.header-badge{display:inline;background-color:var(--sys-color-error);color:var(--sys-color-on-error);border-radius:100vh;padding-left:6px;padding-right:6px}.call-to-action{background-color:var(--sys-color-neutral-container);padding:8px;border-radius:5px;margin:4px}.call-to-action-body{padding:6px 0;margin-left:9.5px;border-left:2px solid var(--issue-color-yellow);padding-left:18px;line-height:20px}.call-to-action .explanation{font-weight:bold}.call-to-action code{font-size:90%}.call-to-action .example .comment::before{content:" — "}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.explanation .link{font-weight:normal}.inline-icon{vertical-align:middle}.row-flex-icon{margin:2px 5px 0}.header-value code{display:block;white-space:pre-wrap;font-size:90%;color:var(--sys-color-token-subtle)}x-link .inline-icon{padding-right:3px}.header-highlight{background-color:var(--sys-color-yellow-container)}.header-warning{color:var(--sys-color-error)}.header-overridden{background-color:var(--sys-color-tertiary-container);border-left:3px solid var(--sys-color-tertiary);padding-left:5px}.header-deleted{background-color:var(--sys-color-surface-error);border-left:3px solid var(--sys-color-error-bright);color:var(--sys-color-token-subtle);text-decoration:line-through}.header-highlight.header-overridden{background-color:var(--sys-color-yellow-container);border-left:3px solid var(--sys-color-tertiary);padding-left:5px}.inline-button{vertical-align:middle}.row .inline-button{opacity:0%;visibility:hidden;transition:opacity 200ms;padding-left:2px}.row.header-overridden:focus-within .inline-button,\n.row.header-overridden:hover .inline-button{opacity:100%;visibility:visible}.row:hover .inline-button.enable-editing{opacity:100%;visibility:visible}.flex-right{margin-left:auto}.flex-columns{flex-direction:column}\n/*# sourceURL=HeaderSectionRow.css */\n');const{render:E,html:N}=t,q={activeClientExperimentVariation:"Active `client experiment variation IDs`.",activeClientExperimentVariationIds:"Active `client experiment variation IDs` that trigger server-side behavior.",decoded:"Decoded:",editHeader:"Override header",headerNamesOnlyLetters:"Header names should contain only letters, digits, hyphens or underscores",learnMore:"Learn more",learnMoreInTheIssuesTab:"Learn more in the issues tab",reloadPrompt:"Refresh the page/request for these changes to take effect",removeOverride:"Remove this header override"},C=i.i18n.registerUIStrings("panels/network/components/HeaderSectionRow.ts",q),I=i.i18n.getLocalizedString.bind(void 0,C),O=new URL("../../../Images/bin.svg",import.meta.url).toString(),V=new URL("../../../Images/edit.svg",import.meta.url).toString(),L=e=>/^[a-z0-9_\-]+$/i.test(e),A=(e,t)=>e?.replaceAll(/\s/g," ")===t?.replaceAll(/\s/g," ");class D extends Event{static eventName="headeredited";headerName;headerValue;constructor(e,t){super(D.eventName,{}),this.headerName=e,this.headerValue=t}}class U extends Event{static eventName="headerremoved";headerName;headerValue;constructor(e,t){super(U.eventName,{}),this.headerName=e,this.headerValue=t}}class F extends Event{static eventName="enableheaderediting";constructor(){super(F.eventName,{})}}class M extends HTMLElement{static litTagName=t.literal`devtools-header-section-row`;#e=this.attachShadow({mode:"open"});#n=null;#t=this.#r.bind(this);#d=!1;#l=!0;connectedCallback(){this.#e.adoptedStyleSheets=[H]}set data(t){this.#n=t.header,this.#d=void 0!==this.#n.originalValue&&this.#n.value!==this.#n.originalValue,this.#l=L(this.#n.name),e.ScheduledRender.scheduleRender(this,this.#t)}#r(){if(!e.ScheduledRender.isScheduledRender(this))throw new Error("HeaderSectionRow render was not scheduled");if(!this.#n)return;const r=t.Directives.classMap({row:!0,"header-highlight":Boolean(this.#n.highlight),"header-overridden":Boolean(this.#n.isOverride)||this.#d,"header-editable":1===this.#n.valueEditable,"header-deleted":Boolean(this.#n.isDeleted)}),o=t.Directives.classMap({"header-name":!0,"pseudo-header":this.#n.name.startsWith(":")}),a=t.Directives.classMap({"header-value":!0,"header-warning":Boolean(this.#n.headerValueIncorrect),"flex-columns":"x-client-data"===this.#n.name&&!this.#n.isResponseHeader}),n=this.#n.nameEditable&&1===this.#n.valueEditable,d=this.#n.nameEditable||this.#n.isDeleted||this.#d;E(N`
      <div class=${r}>
        <div class=${o}>
          ${this.#n.headerNotSet?N`<div class="header-badge header-badge-text">${i.i18n.lockedString("not-set")}</div> `:t.nothing}
          ${n&&!this.#l?N`<${l.Icon.Icon.litTagName} class="inline-icon disallowed-characters" title=${q.headerNamesOnlyLetters} .data=${{iconName:"cross-circle-filled",width:"16px",height:"16px",color:"var(--icon-error)"}}>
            </${l.Icon.Icon.litTagName}>`:t.nothing}
          ${n&&!this.#n.isDeleted?N`<${$.litTagName}
              @focusout=${this.#h}
              @keydown=${this.#o}
              @input=${this.#c}
              @paste=${this.#u}
              .data=${{value:this.#n.name}}
            ></${$.litTagName}>`:this.#n.name}:
        </div>
        <div
          class=${a}
          @copy=${()=>s.userMetrics.actionTaken(s.UserMetrics.Action.NetworkPanelCopyValue)}
        >
          ${this.#p()}
        </div>
        ${d?N`<${l.Icon.Icon.litTagName} class="row-flex-icon flex-right" title=${q.reloadPrompt} .data=${{iconName:"info",width:"16px",height:"16px",color:"var(--icon-default)"}}>
          </${l.Icon.Icon.litTagName}>`:t.nothing}
      </div>
      ${this.#m(this.#n.blockedDetails)}
    `,this.#e,{host:this}),this.#n.highlight&&this.scrollIntoView({behavior:"auto"})}#p(){if(!this.#n)return t.nothing;if("x-client-data"===this.#n.name&&!this.#n.isResponseHeader)return this.#g(this.#n);if(this.#n.isDeleted||1!==this.#n.valueEditable){const e=this.#n.isResponseHeader&&!this.#n.isDeleted&&2!==this.#n.valueEditable;return N`
      ${this.#n.value||""}
      ${this.#v(this.#n)}
      ${e?N`
        <${d.Button.Button.litTagName}
          title=${I(q.editHeader)}
          .size=${"SMALL"}
          .iconUrl=${V}
          .variant=${"icon"}
          @click=${()=>{this.dispatchEvent(new F)}}
          jslog=${r.action("enable-header-overrides").track({click:!0})}
          class="enable-editing inline-button"
        ></${d.Button.Button.litTagName}>
      `:t.nothing}
    `}return N`
      <${$.litTagName}
        @focusout=${this.#w}
        @input=${this.#f}
        @paste=${this.#f}
        @keydown=${this.#o}
        .data=${{value:this.#n.value||""}}
      ></${$.litTagName}>
      ${this.#v(this.#n)}
      <${d.Button.Button.litTagName}
        title=${I(q.removeOverride)}
        .size=${"SMALL"}
        .iconUrl=${O}
        .variant=${"icon"}
        class="remove-header inline-button"
        @click=${this.#y}
        jslog=${r.action("remove-header-override").track({click:!0})}
      ></${d.Button.Button.litTagName}>
    `}#g(e){const t=n.parseClientVariations(e.value||""),r=n.formatClientVariations(t,I(q.activeClientExperimentVariation),I(q.activeClientExperimentVariationIds));return N`
      <div>${e.value||""}</div>
      <div>${I(q.decoded)}</div>
      <code>${r}</code>
    `}focus(){requestAnimationFrame((()=>{const e=this.#e.querySelector(".header-name devtools-editable-span");e?.focus()}))}#v(e){if("set-cookie"===e.name&&e.setCookieBlockedReasons){const t=e.setCookieBlockedReasons.map(a.NetworkRequest.setCookieBlockedReasonToUiString).join("\n");return N`
        <${l.Icon.Icon.litTagName} class="row-flex-icon" title=${t} .data=${{iconName:"warning-filled",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
        </${l.Icon.Icon.litTagName}>
      `}return t.nothing}#m(e){return e?N`
      <div class="call-to-action">
        <div class="call-to-action-body">
          <div class="explanation">${e.explanation()}</div>
          ${e.examples.map((e=>N`
            <div class="example">
              <code>${e.codeSnippet}</code>
              ${e.comment?N`
                <span class="comment">${e.comment()}</span>
              `:""}
            </div>
          `))}
          ${this.#b(e)}
        </div>
      </div>
    `:t.nothing}#b(e){return e?.reveal?N`
        <div class="devtools-link" @click=${e.reveal}>
          <${l.Icon.Icon.litTagName} class="inline-icon" .data=${{iconName:"issue-exclamation-filled",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
          </${l.Icon.Icon.litTagName}
          >${I(q.learnMoreInTheIssuesTab)}
        </div>
      `:e?.link?N`
        <x-link href=${e.link.url} class="link">
          <${l.Icon.Icon.litTagName} class="inline-icon" .data=${{iconName:"open-externally",color:"var(--icon-link)",width:"20px",height:"20px"}}>
          </${l.Icon.Icon.litTagName}
          >${I(q.learnMore)}
        </x-link>
      `:t.nothing}#w(t){const r=t.target;if(!this.#n)return;const s=r.value.trim();A(s,this.#n.value?.trim())||(this.#n.value=s,this.dispatchEvent(new D(this.#n.name,s)),e.ScheduledRender.scheduleRender(this,this.#t));const i=window.getSelection();i?.removeAllRanges(),this.#n.originalName=""}#h(t){const r=t.target;if(!this.#n)return;const s=o.StringUtilities.toLowerCaseString(r.value.trim());""===s?r.value=this.#n.name:A(s,this.#n.name.trim())||(this.#n.name=s,this.dispatchEvent(new D(s,this.#n.value||"")),e.ScheduledRender.scheduleRender(this,this.#t));const i=window.getSelection();i?.removeAllRanges()}#y(){if(!this.#n)return;const e=this.#e.querySelector(".header-value devtools-editable-span");this.#n.originalValue&&(e.value=this.#n?.originalValue),this.dispatchEvent(new U(this.#n.name,this.#n.value||""))}#o(e){const t=e,r=e.target;if("Escape"===t.key){if(e.consume(),r.matches(".header-name devtools-editable-span"))r.value=this.#n?.name||"",this.#c(e);else if(r.matches(".header-value devtools-editable-span")&&(r.value=this.#n?.value||"",this.#f(e),this.#n?.originalName)){const e=this.#e.querySelector(".header-name devtools-editable-span");return e.value=this.#n.originalName,this.#n.originalName="",e.dispatchEvent(new Event("input")),void e.focus()}r.blur()}}#c(t){const r=t.target,s=L(r.value);this.#l!==s&&(this.#l=s,e.ScheduledRender.scheduleRender(this,this.#t))}#f(t){const r=t.target,s=void 0!==this.#n?.originalValue&&!A(this.#n?.originalValue||"",r.value);this.#d!==s&&(this.#d=s,this.#n&&(this.#n.highlight=!1),e.ScheduledRender.scheduleRender(this,this.#t))}#u(e){if(!e.clipboardData)return;const t=e.target,r=e.clipboardData.getData("text/plain")||"",s=r.indexOf(":");if(s<1)return t.value=r,void t.dispatchEvent(new Event("input",{bubbles:!0}));this.#n&&(this.#n.originalName=this.#n.name);const i=r.substring(s+1,r.length).trim(),o=r.substring(0,s);t.value=o,t.dispatchEvent(new Event("input"));const a=this.#e.querySelector(".header-value devtools-editable-span");a&&(a.focus(),a.value=i,a.dispatchEvent(new Event("input"))),e.preventDefault()}}customElements.define("devtools-header-section-row",M);var P=Object.freeze({__proto__:null,isValidHeaderName:L,compareHeaders:A,HeaderEditedEvent:D,HeaderRemovedEvent:U,EnableHeaderEditingEvent:F,HeaderSectionRow:M});const j=new CSSStyleSheet;j.replaceSync(':host{display:block}devtools-header-section-row:last-of-type{margin-bottom:10px}devtools-header-section-row:first-of-type{margin-top:2px}.call-to-action{background-color:var(--sys-color-neutral-container);padding:8px;border-radius:5px;margin:4px}.call-to-action-body{padding:6px 0;margin-left:9.5px;border-left:2px solid var(--issue-color-yellow);padding-left:18px;line-height:20px}.call-to-action .explanation{font-weight:bold}.call-to-action code{font-size:90%}.call-to-action .example .comment::before{content:" — "}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.explanation .link{font-weight:normal}.inline-icon{vertical-align:middle}@media (forced-colors: active){.link,\n  .devtools-link{color:linktext;text-decoration-color:linktext}}\n/*# sourceURL=RequestHeaderSection.css */\n');const{render:_,html:B}=t,W={learnMore:"Learn more",provisionalHeadersAreShownDisableCache:"Provisional headers are shown. Disable cache to see full headers.",onlyProvisionalHeadersAre:"Only provisional headers are available because this request was not sent over the network and instead was served from a local cache, which doesn’t store the original request headers. Disable cache to see full request headers.",provisionalHeadersAreShown:"Provisional headers are shown."},z=i.i18n.registerUIStrings("panels/network/components/RequestHeaderSection.ts",W),K=i.i18n.getLocalizedString.bind(void 0,z);class G extends HTMLElement{static litTagName=t.literal`devtools-request-header-section`;#e=this.attachShadow({mode:"open"});#k;#R=[];connectedCallback(){this.#e.adoptedStyleSheets=[j]}set data(e){this.#k=e.request,this.#R=this.#k.requestHeaders().map((e=>({name:o.StringUtilities.toLowerCaseString(e.name),value:e.value,valueEditable:2}))),this.#R.sort(((e,t)=>o.StringUtilities.compare(e.name,t.name))),"Request"===e.toReveal?.section&&this.#R.filter((t=>t.name===e.toReveal?.header?.toLowerCase())).forEach((e=>{e.highlight=!0})),this.#r()}#r(){this.#k&&_(B`
      ${this.#x()}
      ${this.#R.map((e=>B`
        <${M.litTagName}
          .data=${{header:e}}
          jslog=${r.item("request-header")}
        ></${M.litTagName}>
      `))}
    `,this.#e,{host:this})}#x(){if(!this.#k||void 0!==this.#k.requestHeadersText())return t.nothing;let e,r="";return this.#k.cachedInMemory()||this.#k.cached()?(e=K(W.provisionalHeadersAreShownDisableCache),r=K(W.onlyProvisionalHeadersAre)):e=K(W.provisionalHeadersAreShown),B`
      <div class="call-to-action">
        <div class="call-to-action-body">
          <div class="explanation" title=${r}>
            <${l.Icon.Icon.litTagName} class="inline-icon" .data=${{iconName:"warning-filled",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
            </${l.Icon.Icon.litTagName}>
            ${e} <x-link href="https://developer.chrome.com/docs/devtools/network/reference/#provisional-headers" class="link">${K(W.learnMore)}</x-link>
          </div>
        </div>
      </div>
    `}}customElements.define("devtools-request-header-section",G);var Y=Object.freeze({__proto__:null,RequestHeaderSection:G});const J=new CSSStyleSheet;J.replaceSync('.header{background-color:var(--sys-color-surface1);border-bottom:1px solid var(--sys-color-divider);border-top:1px solid var(--sys-color-divider);line-height:25px;padding:0 5px}.header::marker{font-size:11px;line-height:1}.header:focus{background-color:var(--sys-color-state-header-hover)}details[open] .header-count{display:none}details .hide-when-closed{display:none}details[open] .hide-when-closed{display:block}details summary input{vertical-align:middle}.row{display:flex;line-height:20px;padding-left:8px;gap:12px;user-select:text}div.raw-headers-row{display:block}.row:first-of-type{margin-top:2px}.row:last-child{margin-bottom:10px}.header-name{color:var(--sys-color-on-surface);font-weight:400;width:30%;min-width:160px;max-width:240px;flex-shrink:0;text-transform:capitalize}.header-value{word-break:break-all;display:flex;align-items:center;gap:2px}.header-name,\n.header-value{&::selection{color:var(--sys-color-on-tonal-container);background-color:var(--sys-color-tonal-container)}}.green-circle::before,\n.red-circle::before,\n.yellow-circle::before{content:"";display:inline-block;width:12px;height:12px;border-radius:6px;vertical-align:text-top;margin-right:2px}.green-circle::before{background-color:var(--sys-color-green-bright)}.red-circle::before{background-color:var(--sys-color-error-bright)}.yellow-circle::before{background-color:var(--issue-color-yellow)}.status-with-comment{color:var(--sys-color-token-subtle)}.raw-headers{font-family:var(--source-code-font-family);font-size:var(--source-code-font-size);white-space:pre-wrap;word-break:break-all}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.inline-icon{vertical-align:middle}.header-grid-container{display:inline-grid;grid-template-columns:156px 50px 1fr;grid-gap:4px;width:calc(100% - 15px)}.header-grid-container div:last-child{text-align:right}.header .devtools-link{color:var(--sys-color-on-surface)}x-link{position:relative}x-link .inline-icon{padding-right:3px}.purple.dot::before{background-color:var(--sys-color-purple-bright);content:var(--image-file-empty);width:6px;height:6px;border-radius:50%;outline:1px solid var(--icon-gap-toolbar);left:9px;position:absolute;top:11px;z-index:1}summary label input[type="checkbox"]{margin-top:1px}\n/*# sourceURL=RequestHeadersView.css */\n');const X=new CSSStyleSheet;X.replaceSync(":host{display:block}devtools-header-section-row:last-of-type{margin-bottom:10px}devtools-header-section-row:first-of-type{margin-top:2px}.add-header-button{margin:-4px 0 10px 5px}\n/*# sourceURL=ResponseHeaderSection.css */\n");const{render:Q,html:Z}=t,ee={addHeader:"Add header",chooseThisOptionIfTheResourceAnd:"Choose this option if the resource and the document are served from the same site.",onlyChooseThisOptionIfAn:"Only choose this option if an arbitrary website including this resource does not impose a security risk.",thisDocumentWasBlockedFrom:"The document was blocked from loading in a popup opened by a sandboxed iframe because this document specified a cross-origin opener policy.",toEmbedThisFrameInYourDocument:"To embed this frame in your document, the response needs to enable the cross-origin embedder policy by specifying the following response header:",toUseThisResourceFromADifferent:"To use this resource from a different origin, the server needs to specify a cross-origin resource policy in the response headers:",toUseThisResourceFromADifferentOrigin:"To use this resource from a different origin, the server may relax the cross-origin resource policy response header:",toUseThisResourceFromADifferentSite:"To use this resource from a different site, the server may relax the cross-origin resource policy response header:"},te=i.i18n.registerUIStrings("panels/network/components/ResponseHeaderSection.ts",ee),re=i.i18n.getLocalizedString.bind(void 0,te),se=i.i18n.getLazilyComputedLocalizedString.bind(void 0,te),ie=new URL("../../../Images/plus.svg",import.meta.url).toString(),oe="ResponseHeaderSection";class ae extends HTMLElement{shadow=this.attachShadow({mode:"open"});headerDetails=[];connectedCallback(){this.shadow.adoptedStyleSheets=[X]}setHeaders(e){e.sort((function(e,t){return o.StringUtilities.compare(e.name.toLowerCase(),t.name.toLowerCase())})),this.headerDetails=e.map((e=>({name:o.StringUtilities.toLowerCaseString(e.name),value:e.value.replace(/\s/g," ")})))}highlightHeaders(e){"Response"===e.toReveal?.section&&this.headerDetails.filter((t=>A(t.name,e.toReveal?.header?.toLowerCase()))).forEach((e=>{e.highlight=!0}))}}class ne extends ae{static litTagName=t.literal`devtools-early-hints-header-section`;#k;set data(e){this.#k=e.request,this.setHeaders(this.#k.earlyHintsHeaders),this.highlightHeaders(e),this.#r()}#r(){this.#k&&Q(Z`
      ${this.headerDetails.map((e=>Z`
        <${M.litTagName} .data=${{header:e}}></${M.litTagName}>
      `))}
    `,this.shadow,{host:this})}}customElements.define("devtools-early-hints-header-section",ne);class de extends ae{static litTagName=t.literal`devtools-response-header-section`;#k;#S=[];#$=null;#T=[];#H=0;set data(e){this.#k=e.request,this.#H=c.NetworkPersistenceManager.NetworkPersistenceManager.isForbiddenNetworkUrl(this.#k.url())?2:0;const t=this.#k.sortedResponseHeaders.concat(this.#k.setCookieHeaders);this.setHeaders(t);const r=[];if(this.#k.wasBlocked()){const e=le.get(this.#k.blockedReason());if(e){if(f.RelatedIssue.hasIssueOfCategory(this.#k,"CrossOriginEmbedderPolicy")){const t=()=>{s.userMetrics.issuesPanelOpenedFrom(1),this.#k&&f.RelatedIssue.reveal(this.#k,"CrossOriginEmbedderPolicy")};e.blockedDetails&&(e.blockedDetails.reveal=t)}r.push(e)}}this.headerDetails=function(e,t){let r=0,s=0;const i=[];for(;r<e.length&&s<t.length;)e[r].name<t[s].name?i.push({...e[r++],headerNotSet:!1}):e[r].name>t[s].name?i.push({...t[s++],headerNotSet:!0}):i.push({...t[s++],...e[r++],headerNotSet:!1});for(;r<e.length;)i.push({...e[r++],headerNotSet:!1});for(;s<t.length;)i.push({...t[s++],headerNotSet:!0});return i}(this.headerDetails,r);const i=this.#k.blockedResponseCookies(),o=new Map(i?.map((e=>[e.cookieLine.replace(/\s/g," "),e.blockedReasons])));for(const e of this.headerDetails)if("set-cookie"===e.name&&e.value){const t=o.get(e.value);t&&(e.setCookieBlockedReasons=t)}this.highlightHeaders(e);const a=this.#k.getAssociatedData(oe);a?this.#S=a:(this.#S=this.headerDetails.map((e=>({name:e.name,value:e.value,originalValue:e.value,valueEditable:this.#H}))),this.#E()),this.#N(),this.#k.setAssociatedData(oe,this.#S),this.#r()}#q(){this.#k&&(this.#H=c.NetworkPersistenceManager.NetworkPersistenceManager.isForbiddenNetworkUrl(this.#k.url())?2:0,this.#S=this.headerDetails.map((e=>({name:e.name,value:e.value,originalValue:e.value,valueEditable:this.#H}))),this.#E(),this.#k.setAssociatedData(oe,this.#S))}async#N(){if(this.#k){if(this.#$=c.NetworkPersistenceManager.NetworkPersistenceManager.instance().getHeadersUISourceCodeFromUrl(this.#k.url()),!this.#$)return this.#q(),void this.#r();try{const e=await this.#$.requestContent();if(this.#T=JSON.parse(e.content||"[]"),!this.#T.every(c.NetworkPersistenceManager.isHeaderOverride))throw"Type mismatch after parsing";h.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").get()&&0===this.#H&&(this.#H=1);for(const e of this.#S)e.valueEditable=this.#H}catch(e){console.error("Failed to parse",this.#$?.url()||"source code file","for locally overriding headers."),this.#q()}finally{this.#r()}}}#E(){if(!this.#k||0===this.#k.originalResponseHeaders.length)return;const e=this.#k.originalResponseHeaders.map((e=>({name:o.StringUtilities.toLowerCaseString(e.name),value:e.value.replace(/\s/g," ")})));e.sort((function(e,t){return o.StringUtilities.compare(e.name,t.name)}));let t=0,r=0;for(;t<this.headerDetails.length;){const s=this.headerDetails[t].name;let i=this.headerDetails[t].value||"";const o=this.headerDetails[t].headerNotSet;for(;t<this.headerDetails.length-1&&this.headerDetails[t+1].name===s;)t++,i+=`, ${this.headerDetails[t].value}`;for(;r<e.length&&e[r].name<s;)r++;if(r<e.length&&e[r].name===s){let t=e[r].value;for(;r<e.length-1&&e[r+1].name===s;)r++,t+=`, ${e[r].value}`;r++,"set-cookie"===s||o||A(i,t)||this.#S.filter((e=>A(e.name,s))).forEach((e=>{e.isOverride=!0}))}else"set-cookie"===s||o||this.#S.filter((e=>A(e.name,s))).forEach((e=>{e.isOverride=!0}));t++}this.#S.filter((e=>"set-cookie"===e.name)).forEach((e=>{void 0===this.#k?.originalResponseHeaders.find((t=>"set-cookie"===o.StringUtilities.toLowerCaseString(t.name)&&A(t.value,e.value)))&&(e.isOverride=!0)}))}#C(e){const t=e.target;if(void 0===t.dataset.index)return;const r=Number(t.dataset.index);L(e.headerName)&&(this.#I(e.headerName,e.headerValue,r),s.userMetrics.actionTaken(s.UserMetrics.Action.HeaderOverrideHeaderEdited))}#O(e){const t=c.NetworkPersistenceManager.NetworkPersistenceManager.instance().rawPathFromUrl(e,!0),r=t.lastIndexOf("/");return h.ParsedURL.ParsedURL.substring(t,r+1)}#V(){this.#$?.setWorkingCopy(JSON.stringify(this.#T,null,2)),this.#$?.commitWorkingCopy()}#L(e,t,r){for(let s=this.#T.length-1;s>=0;s--){const i=this.#T[s];if(i.applyTo!==e)continue;const o=i.headers.findIndex((e=>A(e.name,t)&&A(e.value,r)));if(!(o<0))return i.headers.splice(o,1),void(0===i.headers.length&&this.#T.splice(s,1))}}#A(e){const t=e.target;if(void 0===t.dataset.index||!this.#k)return;const r=Number(t.dataset.index),i=this.#O(this.#k.url());this.#L(i,e.headerName,e.headerValue),this.#V(),this.#S[r].isDeleted=!0,this.#r(),s.userMetrics.actionTaken(s.UserMetrics.Action.HeaderOverrideHeaderRemoved)}#I(e,t,r){if(!this.#k)return;0===this.#k.originalResponseHeaders.length&&(this.#k.originalResponseHeaders=this.#k.sortedResponseHeaders.map((e=>({...e}))));const s=this.#S[r].name,i=this.#S[r].value;this.#S[r].name=e,this.#S[r].value=t;let o=[];"set-cookie"===e?o.push({name:e,value:t,valueEditable:this.#H}):o=this.#S.filter((t=>A(t.name,e)&&(!A(t.value,t.originalValue)||t.isOverride)));const a=this.#O(this.#k.url());let n=null;const[d]=this.#T.slice(-1);if(d?.applyTo===a?n=d:(n={applyTo:a,headers:[]},this.#T.push(n)),"set-cookie"===e){const e=n.headers.findIndex((e=>A(e.name,s)&&A(e.value,i)));e>=0&&n.headers.splice(e,1)}else n.headers=n.headers.filter((t=>!A(t.name,e)));if(!A(this.#S[r].name,s))for(let e=0;e<n.headers.length;++e)if(A(n.headers[e].name,s)&&A(n.headers[e].value,i)){n.headers.splice(e,1);break}for(const e of o)n.headers.push({name:e.name,value:e.value||""});0===n.headers.length&&this.#T.pop(),this.#V()}#D(){this.#S.push({name:o.StringUtilities.toLowerCaseString(i.i18n.lockedString("header-name")),value:i.i18n.lockedString("header value"),isOverride:!0,nameEditable:!0,valueEditable:1});const e=this.#S.length-1;this.#I(this.#S[e].name,this.#S[e].value||"",e),this.#r();const t=this.shadow.querySelectorAll("devtools-header-section-row"),[r]=Array.from(t).slice(-1);r?.focus(),s.userMetrics.actionTaken(s.UserMetrics.Action.HeaderOverrideHeaderAdded)}#r(){if(!this.#k)return;const e=this.#S.map(((e,t)=>({...this.headerDetails[t],...e,isResponseHeader:!0})));Q(Z`
      ${e.map(((e,t)=>Z`
        <${M.litTagName}
            .data=${{header:e}}
            @headeredited=${this.#C}
            @headerremoved=${this.#A}
            @enableheaderediting=${this.#U}
            data-index=${t}
            jslog=${r.item("response-header")}
        ></${M.litTagName}>
      `))}
      ${1===this.#H?Z`
        <${d.Button.Button.litTagName}
          class="add-header-button"
          .variant=${"outlined"}
          .iconUrl=${ie}
          @click=${this.#D}
          jslog=${r.action("add-header").track({click:!0})}>
          ${re(ee.addHeader)}
        </${d.Button.Button.litTagName}>
      `:t.nothing}
    `,this.shadow,{host:this})}async#U(){if(!this.#k)return;s.userMetrics.actionTaken(s.UserMetrics.Action.HeaderOverrideEnableEditingClicked);const e=this.#k.url(),t=c.NetworkPersistenceManager.NetworkPersistenceManager.instance();t.project()?(h.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").set(!0),await t.getOrCreateHeadersUISourceCodeFromUrl(e)):v.InspectorView.InspectorView.instance().displaySelectOverrideFolderInfobar((async()=>{await w.SourcesNavigator.OverridesNavigatorView.instance().setupNewWorkspace(),await t.getOrCreateHeadersUISourceCodeFromUrl(e)}))}}customElements.define("devtools-response-header-section",de);const le=new Map([["coep-frame-resource-needs-coep-header",{name:o.StringUtilities.toLowerCaseString("cross-origin-embedder-policy"),value:null,blockedDetails:{explanation:se(ee.toEmbedThisFrameInYourDocument),examples:[{codeSnippet:"Cross-Origin-Embedder-Policy: require-corp",comment:void 0}],link:{url:"https://web.dev/coop-coep/"}}}],["corp-not-same-origin-after-defaulted-to-same-origin-by-coep",{name:o.StringUtilities.toLowerCaseString("cross-origin-resource-policy"),value:null,blockedDetails:{explanation:se(ee.toUseThisResourceFromADifferent),examples:[{codeSnippet:"Cross-Origin-Resource-Policy: same-site",comment:se(ee.chooseThisOptionIfTheResourceAnd)},{codeSnippet:"Cross-Origin-Resource-Policy: cross-origin",comment:se(ee.onlyChooseThisOptionIfAn)}],link:{url:"https://web.dev/coop-coep/"}}}],["coop-sandboxed-iframe-cannot-navigate-to-coop-page",{name:o.StringUtilities.toLowerCaseString("cross-origin-opener-policy"),value:null,headerValueIncorrect:!1,blockedDetails:{explanation:se(ee.thisDocumentWasBlockedFrom),examples:[],link:{url:"https://web.dev/coop-coep/"}}}],["corp-not-same-site",{name:o.StringUtilities.toLowerCaseString("cross-origin-resource-policy"),value:null,headerValueIncorrect:!0,blockedDetails:{explanation:se(ee.toUseThisResourceFromADifferentSite),examples:[{codeSnippet:"Cross-Origin-Resource-Policy: cross-origin",comment:se(ee.onlyChooseThisOptionIfAn)}],link:null}}],["corp-not-same-origin",{name:o.StringUtilities.toLowerCaseString("cross-origin-resource-policy"),value:null,headerValueIncorrect:!0,blockedDetails:{explanation:se(ee.toUseThisResourceFromADifferentOrigin),examples:[{codeSnippet:"Cross-Origin-Resource-Policy: same-site",comment:se(ee.chooseThisOptionIfTheResourceAnd)},{codeSnippet:"Cross-Origin-Resource-Policy: cross-origin",comment:se(ee.onlyChooseThisOptionIfAn)}],link:null}}]]);var he=Object.freeze({__proto__:null,RESPONSE_HEADER_SECTION_DATA_KEY:oe,EarlyHintsHeaderSection:ne,ResponseHeaderSection:de});const{render:ce,html:ue}=t,pe={fromDiskCache:"(from disk cache)",fromMemoryCache:"(from memory cache)",fromEarlyHints:"(from early hints)",fromPrefetchCache:"(from prefetch cache)",fromServiceWorker:"(from `service worker`)",fromSignedexchange:"(from signed-exchange)",fromWebBundle:"(from Web Bundle)",general:"General",raw:"Raw",referrerPolicy:"Referrer Policy",remoteAddress:"Remote Address",requestHeaders:"Request Headers",requestMethod:"Request Method",requestUrl:"Request URL",responseHeaders:"Response Headers",earlyHintsHeaders:"Early Hints Headers",revealHeaderOverrides:"Reveal header override definitions",showMore:"Show more",statusCode:"Status Code"},me=i.i18n.registerUIStrings("panels/network/components/RequestHeadersView.ts",pe),ge=i.i18n.getLocalizedString.bind(void 0,me),ve=g.RenderCoordinator.RenderCoordinator.instance();class we extends m.LegacyWrapper.WrappableComponent{#k;static litTagName=t.literal`devtools-request-headers`;#e=this.attachShadow({mode:"open"});#F=!1;#M=!1;#P=!1;#j=!1;#_=void 0;#B=u.Workspace.WorkspaceImpl.instance();constructor(e){super(),this.#k=e,this.setAttribute("jslog",`${r.pane("headers").track({resize:!0})}`)}wasShown(){this.#k.addEventListener(a.NetworkRequest.Events.RemoteAddressChanged,this.#W,this),this.#k.addEventListener(a.NetworkRequest.Events.FinishedLoading,this.#W,this),this.#k.addEventListener(a.NetworkRequest.Events.RequestHeadersChanged,this.#W,this),this.#k.addEventListener(a.NetworkRequest.Events.ResponseHeadersChanged,this.#z,this),this.#_=void 0,this.#W()}willHide(){this.#k.removeEventListener(a.NetworkRequest.Events.RemoteAddressChanged,this.#W,this),this.#k.removeEventListener(a.NetworkRequest.Events.FinishedLoading,this.#W,this),this.#k.removeEventListener(a.NetworkRequest.Events.RequestHeadersChanged,this.#W,this),this.#k.removeEventListener(a.NetworkRequest.Events.ResponseHeadersChanged,this.#z,this)}#z(){this.#k.deleteAssociatedData(oe),this.render()}#W(){this.render()}revealHeader(e,t){this.#_={section:e,header:t},this.render()}connectedCallback(){this.#e.adoptedStyleSheets=[J],this.#B.addEventListener(u.Workspace.Events.UISourceCodeAdded,this.#K,this),this.#B.addEventListener(u.Workspace.Events.UISourceCodeRemoved,this.#K,this),h.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").addChangeListener(this.render,this)}disconnectedCallback(){this.#B.removeEventListener(u.Workspace.Events.UISourceCodeAdded,this.#K,this),this.#B.removeEventListener(u.Workspace.Events.UISourceCodeRemoved,this.#K,this),h.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").removeChangeListener(this.render,this)}#K(e){this.#G()===e.data.url()&&this.render()}async render(){if(this.#k)return ve.write((()=>{ce(ue`
        ${this.#Y()}
        ${this.#J()}
        ${this.#X()}
        ${this.#Q()}
      `,this.#e,{host:this})}))}#J(){if(!this.#k||!this.#k.earlyHintsHeaders||0===this.#k.earlyHintsHeaders.length)return t.nothing;return ue`
      <${ye.litTagName}
        @togglerawevent=${()=>{this.#F=!this.#F,this.render()}}
        .data=${{name:"early-hints-headers",title:ge(pe.earlyHintsHeaders),headerCount:this.#k.earlyHintsHeaders.length,checked:void 0,additionalContent:void 0,forceOpen:"EarlyHints"===this.#_?.section,loggingContext:"early-hints-headers"}}
        aria-label=${ge(pe.earlyHintsHeaders)}
      >
        ${this.#F?this.#Z(this.#k.responseHeadersText,!0):ue`
          <${ne.litTagName} .data=${{request:this.#k,toReveal:this.#_}}></${ne.litTagName}>
        `}
      </${ye.litTagName}>
    `}#X(){if(!this.#k)return t.nothing;return ue`
      <${ye.litTagName}
        @togglerawevent=${()=>{this.#F=!this.#F,this.render()}}
        .data=${{name:"response-headers",title:ge(pe.responseHeaders),headerCount:this.#k.sortedResponseHeaders.length,checked:this.#k.responseHeadersText?this.#F:void 0,additionalContent:this.#ee(),forceOpen:"Response"===this.#_?.section,loggingContext:"response-headers"}}
        aria-label=${ge(pe.responseHeaders)}
      >
        ${this.#F?this.#Z(this.#k.responseHeadersText,!0):ue`
          <${de.litTagName} .data=${{request:this.#k,toReveal:this.#_}} jslog=${r.section("response-headers")}></${de.litTagName}>
        `}
      </${ye.litTagName}>
    `}#ee(){if(!this.#B.uiSourceCodeForURL(this.#G()))return t.nothing;const e=h.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled"),s=ue`
      <${l.Icon.Icon.litTagName} class=${e.get()?"inline-icon dot purple":"inline-icon"} .data=${{iconName:"document",width:"16px",height:"16px"}}>
      </${l.Icon.Icon.litTagName}>`;return ue`
      <x-link
          href="https://goo.gle/devtools-override"
          class="link devtools-link"
          jslog=${r.link("devtools-override").track({click:!0})}
      >
        <${l.Icon.Icon.litTagName} class="inline-icon" .data=${{iconName:"help",width:"16px",height:"16px"}}>
        </${l.Icon.Icon.litTagName}
      ></x-link>
      <x-link
          @click=${e=>{e.preventDefault();const t=this.#B.uiSourceCodeForURL(this.#G());t&&(w.SourcesPanel.SourcesPanel.instance().showUISourceCode(t),w.SourcesPanel.SourcesPanel.instance().revealInNavigator(t))}}
          class="link devtools-link"
          title=${pe.revealHeaderOverrides}
          jslog=${r.link("reveal-header-overrides").track({click:!0})}
      >
        ${s}${c.NetworkPersistenceManager.HEADERS_FILENAME}
      </x-link>
    `}#G(){if(!this.#k)return o.DevToolsPath.EmptyUrlString;const e=c.NetworkPersistenceManager.NetworkPersistenceManager.instance().fileUrlFromNetworkUrl(this.#k.url(),!0);return e.substring(0,e.lastIndexOf("/"))+"/"+c.NetworkPersistenceManager.HEADERS_FILENAME}#Q(){if(!this.#k)return t.nothing;const e=this.#k.requestHeadersText();return ue`
      <${ye.litTagName}
        @togglerawevent=${()=>{this.#M=!this.#M,this.render()}}
        .data=${{name:"request-headers",title:ge(pe.requestHeaders),headerCount:this.#k.requestHeaders().length,checked:e?this.#M:void 0,forceOpen:"Request"===this.#_?.section,loggingContext:"request-headers"}}
        aria-label=${ge(pe.requestHeaders)}
      >
        ${this.#M&&e?this.#Z(e,!1):ue`
          <${G.litTagName} .data=${{request:this.#k,toReveal:this.#_}} jslog=${r.section("request-headers")}></${G.litTagName}>
        `}
      </${ye.litTagName}>
    `}#Z(s,i){const o=s.trim(),a=!(i?this.#P:this.#j)&&o.length>3e3,n=()=>{i?this.#P=!0:this.#j=!0,this.render()},l=e=>{if(!(i?this.#P:this.#j)){const t=new v.ContextMenu.ContextMenu(e);t.newSection().appendItem(ge(pe.showMore),n,{jslogContext:"show-more"}),t.show()}};return ue`
      <div class="row raw-headers-row" on-render=${e.Directives.nodeRenderedCallback((e=>{a&&e.addEventListener("contextmenu",l)}))}>
        <div class="raw-headers">${a?o.substring(0,3e3):o}</div>
        ${a?ue`
          <${d.Button.Button.litTagName}
            .size=${"SMALL"}
            .variant=${"outlined"}
            @click=${n}
            jslog=${r.action("raw-headers-show-more").track({click:!0})}
          >${ge(pe.showMore)}</${d.Button.Button.litTagName}>
        `:t.nothing}
      </div>
    `}#Y(){if(!this.#k)return t.nothing;const e=["status"];this.#k.statusCode<300||304===this.#k.statusCode?e.push("green-circle"):this.#k.statusCode<400?e.push("yellow-circle"):e.push("red-circle");let s="";this.#k.cachedInMemory()?s=ge(pe.fromMemoryCache):this.#k.fromEarlyHints()?s=ge(pe.fromEarlyHints):this.#k.fetchedViaServiceWorker?s=ge(pe.fromServiceWorker):this.#k.redirectSourceSignedExchangeInfoHasNoErrors()?s=ge(pe.fromSignedexchange):this.#k.webBundleInnerRequestInfo()?s=ge(pe.fromWebBundle):this.#k.fromPrefetchCache()?s=ge(pe.fromPrefetchCache):this.#k.cached()&&(s=ge(pe.fromDiskCache)),s&&e.push("status-with-comment");const i=[this.#k.statusCode,this.#k.getInferredStatusText(),s].join(" ");return ue`
      <${ye.litTagName}
        .data=${{name:"general",title:ge(pe.general),forceOpen:"General"===this.#_?.section,loggingContext:"general"}}
        aria-label=${ge(pe.general)}
      >
      <div jslog=${r.section("general")}>
        ${this.#te(ge(pe.requestUrl),this.#k.url())}
        ${this.#k.statusCode?this.#te(ge(pe.requestMethod),this.#k.requestMethod):t.nothing}
        ${this.#k.statusCode?this.#te(ge(pe.statusCode),i,e):t.nothing}
        ${this.#k.remoteAddress()?this.#te(ge(pe.remoteAddress),this.#k.remoteAddress()):t.nothing}
        ${this.#k.referrerPolicy()?this.#te(ge(pe.referrerPolicy),String(this.#k.referrerPolicy())):t.nothing}
      </div>
      </${ye.litTagName}>
    `}#te(e,t,r){const i="General"===this.#_?.section&&e.toLowerCase()===this.#_?.header?.toLowerCase();return ue`
      <div class="row ${i?"header-highlight":""}">
        <div class="header-name">${e}:</div>
        <div
          class="header-value ${r?.join(" ")}"
          @copy=${()=>s.userMetrics.actionTaken(s.UserMetrics.Action.NetworkPanelCopyValue)}
        >${t}</div>
      </div>
    `}}class fe extends Event{static eventName="togglerawevent";constructor(){super(fe.eventName,{})}}class ye extends HTMLElement{static litTagName=t.literal`devtools-request-headers-category`;#e=this.attachShadow({mode:"open"});#re;#se=h.UIString.LocalizedEmptyString;#ie=void 0;#oe=void 0;#ae=void 0;#ne=void 0;#de="";connectedCallback(){this.#e.adoptedStyleSheets=[J,p.checkboxStyles]}set data(e){this.#se=e.title,this.#re=h.Settings.Settings.instance().createSetting("request-info-"+e.name+"-category-expanded",!0),this.#ie=e.headerCount,this.#oe=e.checked,this.#ae=e.additionalContent,this.#ne=e.forceOpen,this.#de=e.loggingContext,this.#r()}#le(){this.dispatchEvent(new fe)}#r(){const e=!this.#re||this.#re.get()||this.#ne;ce(ue`
      <details ?open=${e} @toggle=${this.#he}>
        <summary
          class="header"
          @keydown=${this.#ce}
          jslog=${r.sectionHeader().track({click:!0}).context(this.#de)}
        >
          <div class="header-grid-container">
            <div>
              ${this.#se}${void 0!==this.#ie?ue`<span class="header-count"> (${this.#ie})</span>`:t.nothing}
            </div>
            <div class="hide-when-closed">
              ${void 0!==this.#oe?ue`
                <label><input
                    type="checkbox"
                    .checked=${this.#oe}
                    @change=${this.#le}
                    jslog=${r.toggle("raw-headers").track({change:!0})}
                />${ge(pe.raw)}</label>
              `:t.nothing}
            </div>
            <div class="hide-when-closed">${this.#ae}</div>
        </summary>
        <slot></slot>
      </details>
    `,this.#e,{host:this})}#ce(e){if(!e.target)return;const t=e.target.parentElement;if(!t)throw new Error("<details> element is not found for a <summary> element");switch(e.key){case"ArrowLeft":t.open=!1;break;case"ArrowRight":t.open=!0}}#he(e){this.#re?.set(e.target.open)}}customElements.define("devtools-request-headers",we),customElements.define("devtools-request-headers-category",ye);var be=Object.freeze({__proto__:null,RequestHeadersView:we,ToggleRawHeadersEvent:fe,Category:ye});const ke=new CSSStyleSheet;ke.replaceSync(".code{font-family:var(--monospace-font-family);font-size:var(--monospace-font-size)}.issuers-list{display:flex;flex-direction:column;list-style-type:none;padding:0;margin:0}.status-icon{margin:0 0.3em 2px 0;vertical-align:middle}\n/*# sourceURL=RequestTrustTokensView.css */\n");const Re={parameters:"Parameters",type:"Type",refreshPolicy:"Refresh policy",issuers:"Issuers",topLevelOrigin:"Top level origin",issuer:"Issuer",result:"Result",status:"Status",numberOfIssuedTokens:"Number of issued tokens",success:"Success",failure:"Failure",theOperationsResultWasServedFrom:"The operations result was served from cache.",theOperationWasFulfilledLocally:"The operation was fulfilled locally, no request was sent.",theKeysForThisPSTIssuerAreUnavailable:"The keys for this PST issuer are unavailable. The issuer may need to be registered via the Chrome registration process.",aClientprovidedArgumentWas:"A client-provided argument was malformed or otherwise invalid.",eitherNoInputsForThisOperation:"Either no inputs for this operation are available or the output exceeds the operations quota.",theServersResponseWasMalformedOr:"The servers response was malformed or otherwise invalid.",theOperationFailedForAnUnknown:"The operation failed for an unknown reason."},xe=i.i18n.registerUIStrings("panels/network/components/RequestTrustTokensView.ts",Re),Se=i.i18n.getLocalizedString.bind(void 0,xe);class $e extends m.LegacyWrapper.WrappableComponent{static litTagName=t.literal`devtools-trust-token-report`;#e=this.attachShadow({mode:"open"});#k;constructor(e){super(),this.#k=e}wasShown(){this.#k.addEventListener(a.NetworkRequest.Events.TrustTokenResultAdded,this.render,this),this.render()}willHide(){this.#k.removeEventListener(a.NetworkRequest.Events.TrustTokenResultAdded,this.render,this)}connectedCallback(){this.#e.adoptedStyleSheets=[ke]}async render(){if(!this.#k)throw new Error("Trying to render a Trust Token report without providing data");t.render(t.html`<${y.ReportView.Report.litTagName}>
        ${this.#ue()}
        ${this.#pe()}
      </${y.ReportView.Report.litTagName}>
    `,this.#e,{host:this})}#ue(){const e=this.#k.trustTokenParams();return e?t.html`
      <${y.ReportView.ReportSectionHeader.litTagName} jslog=${r.pane("trust-tokens").track({resize:!0})}>${Se(Re.parameters)}</${y.ReportView.ReportSectionHeader.litTagName}>
      ${qe(Se(Re.type),e.operation.toString())}
      ${this.#me(e)}
      ${this.#ge(e)}
      ${this.#ve()}
      <${y.ReportView.ReportSectionDivider.litTagName}></${y.ReportView.ReportSectionDivider.litTagName}>
    `:t.nothing}#me(e){return"Redemption"!==e.operation?t.nothing:qe(Se(Re.refreshPolicy),e.refreshPolicy.toString())}#ge(e){return e.issuers&&0!==e.issuers.length?t.html`
      <${y.ReportView.ReportKey.litTagName}>${Se(Re.issuers)}</${y.ReportView.ReportKey.litTagName}>
      <${y.ReportView.ReportValue.litTagName}>
        <ul class="issuers-list">
          ${e.issuers.map((e=>t.html`<li>${e}</li>`))}
        </ul>
      </${y.ReportView.ReportValue.litTagName}>
    `:t.nothing}#ve(){const e=this.#k.trustTokenOperationDoneEvent();return e?t.html`
      ${Ne(Se(Re.topLevelOrigin),e.topLevelOrigin)}
      ${Ne(Se(Re.issuer),e.issuerOrigin)}`:t.nothing}#pe(){const e=this.#k.trustTokenOperationDoneEvent();return e?t.html`
      <${y.ReportView.ReportSectionHeader.litTagName}>${Se(Re.result)}</${y.ReportView.ReportSectionHeader.litTagName}>
      <${y.ReportView.ReportKey.litTagName}>${Se(Re.status)}</${y.ReportView.ReportKey.litTagName}>
      <${y.ReportView.ReportValue.litTagName}>
        <span>
          <${l.Icon.Icon.litTagName} class="status-icon"
            .data=${r=e.status,Ee(r)?Te:He}>
          </${l.Icon.Icon.litTagName}>
          <strong>${function(e){return Ee(e)?Se(Re.success):Se(Re.failure)}(e.status)}</strong>
          ${function(e){switch(e){case"Ok":return null;case"AlreadyExists":return Se(Re.theOperationsResultWasServedFrom);case"FulfilledLocally":return Se(Re.theOperationWasFulfilledLocally);case"InvalidArgument":return Se(Re.aClientprovidedArgumentWas);case"ResourceExhausted":return Se(Re.eitherNoInputsForThisOperation);case"BadResponse":return Se(Re.theServersResponseWasMalformedOr);case"MissingIssuerKeys":return Se(Re.theKeysForThisPSTIssuerAreUnavailable);case"FailedPrecondition":case"ResourceLimited":case"InternalError":case"Unauthorized":case"UnknownError":return Se(Re.theOperationFailedForAnUnknown)}}(e.status)}
        </span>
      </${y.ReportView.ReportValue.litTagName}>
      ${this.#we(e)}
      <${y.ReportView.ReportSectionDivider.litTagName}></${y.ReportView.ReportSectionDivider.litTagName}>
      `:t.nothing;var r}#we(e){return"Issuance"!==e.type?t.nothing:Ne(Se(Re.numberOfIssuedTokens),e.issuedTokenCount)}}const Te={color:"var(--icon-checkmark-green)",iconName:"check-circle",width:"16px",height:"16px"},He={color:"var(--icon-error)",iconName:"cross-circle-filled",width:"16px",height:"16px"};function Ee(e){return"Ok"===e||"AlreadyExists"===e||"FulfilledLocally"===e}function Ne(e,r){return void 0===r?t.nothing:t.html`
    <${y.ReportView.ReportKey.litTagName}>${e}</${y.ReportView.ReportKey.litTagName}>
    <${y.ReportView.ReportValue.litTagName}>${r}</${y.ReportView.ReportValue.litTagName}>
  `}function qe(e,r){return t.html`
    <${y.ReportView.ReportKey.litTagName}>${e}</${y.ReportView.ReportKey.litTagName}>
    <${y.ReportView.ReportValue.litTagName} class="code">${r}</${y.ReportView.ReportValue.litTagName}>
  `}customElements.define("devtools-trust-token-report",$e);var Ce=Object.freeze({__proto__:null,RequestTrustTokensView:$e,statusConsideredSuccess:Ee});const Ie=new CSSStyleSheet;Ie.replaceSync(":host{--icon-padding:4px}.header{display:flex;font-weight:bold;padding:calc(2 * var(--icon-padding)) var(--icon-padding);line-height:20px}.icon{margin:0 var(--icon-padding)}\n/*# sourceURL=WebBundleInfoView.css */\n");const{render:Oe,html:Ve}=t,Le={bundledResource:"Bundled resource"},Ae=i.i18n.registerUIStrings("panels/network/components/WebBundleInfoView.ts",Le),De=i.i18n.getLocalizedString.bind(void 0,Ae);class Ue extends m.LegacyWrapper.WrappableComponent{static litTagName=t.literal`devtools-web-bundle-info`;#e=this.attachShadow({mode:"open"});#fe;#ye;constructor(e){super();const t=e.webBundleInfo();if(!t)throw new Error("Trying to render a Web Bundle info without providing data");this.#fe=t,this.#ye=e.parsedURL.lastPathComponent,this.setAttribute("jslog",`${r.pane("webbundle").track({resize:!0})}`)}connectedCallback(){this.#e.adoptedStyleSheets=[Ie]}async render(){const e=this.#fe.resourceUrls?.map((e=>{const t=h.ResourceType.ResourceType.mimeFromURL(e)||null,r=h.ResourceType.ResourceType.fromMimeTypeOverride(t)||h.ResourceType.ResourceType.fromMimeType(t),s=b.iconDataForResourceType(r);return{cells:[{columnId:"url",value:null,renderer:()=>Ve`
                <div style="display: flex;">
                  <${l.Icon.Icon.litTagName} class="icon"
                    .data=${{...s,width:"20px"}}>
                  </${l.Icon.Icon.litTagName}>
                  <span>${e}</span>
                </div>`}]}}));Oe(Ve`
      <div class="header">
        <${l.Icon.Icon.litTagName} class="icon"
          .data=${{color:"var(--icon-default)",iconName:"bundle",width:"20px"}}>
        </${l.Icon.Icon.litTagName}>
        <span>${this.#ye}</span>
        <x-link href="https://web.dev/web-bundles/#explaining-web-bundles"
          jslog=${r.link("webbundle-explainer").track({click:!0})}>
          <${l.Icon.Icon.litTagName} class="icon"
            .data=${{color:"var(--icon-default)",iconName:"help",width:"16px"}}>
          </${l.Icon.Icon.litTagName}>
        </x-link>
      </div>
      <div>
        <${k.DataGrid.DataGrid.litTagName}
          .data=${{columns:[{id:"url",title:De(Le.bundledResource),widthWeighting:1,visible:!0,hideable:!1}],rows:e,activeSort:null}}>
        </${k.DataGrid.DataGrid.litTagName}>
      </div>`,this.#e,{host:this})}}customElements.define("devtools-web-bundle-info",Ue);var Fe=Object.freeze({__proto__:null,WebBundleInfoView:Ue});export{T as EditableSpan,P as HeaderSectionRow,Y as RequestHeaderSection,be as RequestHeadersView,Ce as RequestTrustTokensView,he as ResponseHeaderSection,Fe as WebBundleInfoView};
