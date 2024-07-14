import*as e from"../../../ui/components/helpers/helpers.js";import*as t from"../../../ui/lit-html/lit-html.js";import*as r from"../../../ui/visual_logging/visual_logging.js";import*as s from"../../../core/host/host.js";import*as i from"../../../core/i18n/i18n.js";import*as o from"../../../core/platform/platform.js";import*as a from"../../../core/sdk/sdk.js";import*as n from"../../../third_party/chromium/client-variations/client-variations.js";import*as d from"../../../ui/components/buttons/buttons.js";import*as l from"../../../ui/components/icon_button/icon_button.js";import"../forward/forward.js";import*as c from"../../../core/common/common.js";import*as h from"../../../models/persistence/persistence.js";import*as u from"../../../models/workspace/workspace.js";import*as p from"../../../ui/components/input/input.js";import*as m from"../../../ui/components/legacy_wrapper/legacy_wrapper.js";import*as g from"../../../ui/components/render_coordinator/render_coordinator.js";import*as v from"../../../ui/legacy/legacy.js";import*as w from"../../sources/sources.js";import*as f from"../../../models/issues_manager/issues_manager.js";import*as b from"../../../ui/components/report_view/report_view.js";import{PanelUtils as k}from"../../utils/utils.js";import*as y from"../../../ui/components/data_grid/data_grid.js";const R=new CSSStyleSheet;R.replaceSync(":host{display:inline}.editable{cursor:text;overflow-wrap:anywhere;min-height:18px;line-height:18px;min-width:0.5em;background:transparent;border:none;border-radius:4px;outline:none;display:inline-block;font-family:var(--monospace-font-family);font-size:var(--monospace-font-size);&:hover{border:1px solid var(--sys-color-neutral-outline)}&:focus{border:1px solid var(--sys-color-state-focus-ring)}}.editable::selection{color:var(--sys-color-on-tonal-container);background-color:var(--sys-color-tonal-container)}\n/*# sourceURL=EditableSpan.css */\n");const{render:x,html:S}=t;class $ extends HTMLElement{static litTagName=t.literal`devtools-editable-span`;#e=this.attachShadow({mode:"open"});#t=this.#r.bind(this);#s="";connectedCallback(){this.#e.adoptedStyleSheets=[R],this.#e.addEventListener("focusin",this.#i.bind(this)),this.#e.addEventListener("keydown",this.#o.bind(this)),this.#e.addEventListener("paste",this.#a.bind(this)),this.#e.addEventListener("input",this.#n.bind(this))}set data(t){this.#s=t.value,e.ScheduledRender.scheduleRender(this,this.#t)}get value(){return this.#e.querySelector("span")?.innerText||""}set value(e){this.#s=e;const t=this.#e.querySelector("span");t&&(t.innerText=e)}#o(e){"Enter"===e.key&&(e.preventDefault(),e.target?.blur())}#n(e){this.#s=e.target.innerText}#i(e){const t=e.target,r=window.getSelection(),s=document.createRange();s.selectNodeContents(t),r?.removeAllRanges(),r?.addRange(s)}#a(e){const t=e;if(e.preventDefault(),t.clipboardData){const e=t.clipboardData.getData("text/plain"),r=this.#e.getSelection()?.getRangeAt(0);if(!r)return;r.deleteContents();const s=document.createTextNode(e);r.insertNode(s),r.selectNodeContents(s),r.collapse(!1);const i=window.getSelection();i?.removeAllRanges(),i?.addRange(r)}}#r(){if(!e.ScheduledRender.isScheduledRender(this))throw new Error("HeaderSectionRow render was not scheduled");x(S`<span
        contenteditable="true"
        class="editable"
        tabindex="0"
        .innerText=${this.#s}
        jslog=${r.textField("header-editor").track({keydown:!0})}
    </span>`,this.#e,{host:this})}focus(){requestAnimationFrame((()=>{const e=this.#e.querySelector(".editable");e?.focus()}))}}customElements.define("devtools-editable-span",$);var T=Object.freeze({__proto__:null,EditableSpan:$});const N=new CSSStyleSheet;N.replaceSync(':host{display:block}.row{display:flex;line-height:20px;padding-left:8px;gap:12px;user-select:text}.row.header-editable{font-family:var(--monospace-font-family);font-size:var(--monospace-font-size)}.header-name{color:var(--sys-color-on-surface);font-weight:400;width:30%;min-width:160px;max-width:240px;flex-shrink:0;text-transform:capitalize;overflow-wrap:break-word}.header-name,\n.header-value{&::selection{color:var(--sys-color-on-tonal-container);background-color:var(--sys-color-tonal-container)}}.header-name.pseudo-header{text-transform:none}.header-editable .header-name{color:var(--sys-color-token-property-special)}.row.header-deleted .header-name{color:var(--sys-color-token-subtle)}.header-value{display:flex;overflow-wrap:anywhere;margin-inline-end:14px}.header-badge-text{font-variant:small-caps;font-weight:500;white-space:pre-wrap;word-break:break-all;text-transform:none}.header-badge{display:inline;background-color:var(--sys-color-error);color:var(--sys-color-on-error);border-radius:100vh;padding-left:6px;padding-right:6px}.call-to-action{background-color:var(--sys-color-neutral-container);padding:8px;border-radius:5px;margin:4px}.call-to-action-body{padding:6px 0;margin-left:9.5px;border-left:2px solid var(--issue-color-yellow);padding-left:18px;line-height:20px}.call-to-action .explanation{font-weight:bold}.call-to-action code{font-size:90%}.call-to-action .example .comment::before{content:" — "}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.explanation .link{font-weight:normal}.inline-icon{vertical-align:middle}.row-flex-icon{margin:2px 5px 0}.header-value code{display:block;white-space:pre-wrap;font-size:90%;color:var(--sys-color-token-subtle)}x-link .inline-icon{padding-right:3px}.header-highlight{background-color:var(--sys-color-yellow-container)}.header-warning{color:var(--sys-color-error)}.header-overridden{background-color:var(--sys-color-tertiary-container);border-left:3px solid var(--sys-color-tertiary);padding-left:5px}.header-deleted{background-color:var(--sys-color-surface-error);border-left:3px solid var(--sys-color-error-bright);color:var(--sys-color-token-subtle);text-decoration:line-through}.header-highlight.header-overridden{background-color:var(--sys-color-yellow-container);border-left:3px solid var(--sys-color-tertiary);padding-left:5px}.inline-button{vertical-align:middle}.row .inline-button{opacity:0%;visibility:hidden;transition:opacity 200ms;padding-left:2px}.row.header-overridden:focus-within .inline-button,\n.row.header-overridden:hover .inline-button{opacity:100%;visibility:visible}.row:hover .inline-button.enable-editing{opacity:100%;visibility:visible}.flex-right{margin-left:auto}.flex-columns{flex-direction:column}\n/*# sourceURL=HeaderSectionRow.css */\n');const{render:H,html:q}=t,E={activeClientExperimentVariation:"Active `client experiment variation IDs`.",activeClientExperimentVariationIds:"Active `client experiment variation IDs` that trigger server-side behavior.",decoded:"Decoded:",editHeader:"Override header",headerNamesOnlyLetters:"Header names should contain only letters, digits, hyphens or underscores",learnMore:"Learn more",learnMoreInTheIssuesTab:"Learn more in the issues tab",reloadPrompt:"Refresh the page/request for these changes to take effect",removeOverride:"Remove this header override"},C=i.i18n.registerUIStrings("panels/network/components/HeaderSectionRow.ts",E),I=i.i18n.getLocalizedString.bind(void 0,C),O=new URL("../../../Images/bin.svg",import.meta.url).toString(),V=new URL("../../../Images/edit.svg",import.meta.url).toString(),L=e=>/^[a-z0-9_\-]+$/i.test(e),A=(e,t)=>e?.replaceAll(/\s/g," ")===t?.replaceAll(/\s/g," ");class D extends Event{static eventName="headeredited";headerName;headerValue;constructor(e,t){super(D.eventName,{}),this.headerName=e,this.headerValue=t}}class U extends Event{static eventName="headerremoved";headerName;headerValue;constructor(e,t){super(U.eventName,{}),this.headerName=e,this.headerValue=t}}class F extends Event{static eventName="enableheaderediting";constructor(){super(F.eventName,{})}}class M extends HTMLElement{static litTagName=t.literal`devtools-header-section-row`;#e=this.attachShadow({mode:"open"});#d=null;#t=this.#r.bind(this);#l=!1;#c=!0;connectedCallback(){this.#e.adoptedStyleSheets=[N]}set data(t){this.#d=t.header,this.#l=void 0!==this.#d.originalValue&&this.#d.value!==this.#d.originalValue,this.#c=L(this.#d.name),e.ScheduledRender.scheduleRender(this,this.#t)}#r(){if(!e.ScheduledRender.isScheduledRender(this))throw new Error("HeaderSectionRow render was not scheduled");if(!this.#d)return;const r=t.Directives.classMap({row:!0,"header-highlight":Boolean(this.#d.highlight),"header-overridden":Boolean(this.#d.isOverride)||this.#l,"header-editable":Boolean(this.#d.valueEditable),"header-deleted":Boolean(this.#d.isDeleted)}),o=t.Directives.classMap({"header-name":!0,"pseudo-header":this.#d.name.startsWith(":")}),a=t.Directives.classMap({"header-value":!0,"header-warning":Boolean(this.#d.headerValueIncorrect),"flex-columns":"x-client-data"===this.#d.name&&!this.#d.isResponseHeader}),n=this.#d.nameEditable&&this.#d.valueEditable,d=this.#d.nameEditable||this.#d.isDeleted||this.#l;H(q`
      <div class=${r}>
        <div class=${o}>
          ${this.#d.headerNotSet?q`<div class="header-badge header-badge-text">${i.i18n.lockedString("not-set")}</div> `:t.nothing}
          ${n&&!this.#c?q`<${l.Icon.Icon.litTagName} class="inline-icon disallowed-characters" title=${E.headerNamesOnlyLetters} .data=${{iconName:"cross-circle-filled",width:"16px",height:"16px",color:"var(--icon-error)"}}>
            </${l.Icon.Icon.litTagName}>`:t.nothing}
          ${n&&!this.#d.isDeleted?q`<${$.litTagName}
              @focusout=${this.#h}
              @keydown=${this.#o}
              @input=${this.#u}
              @paste=${this.#u}
              .data=${{value:this.#d.name}}
            ></${$.litTagName}>`:this.#d.name}:
        </div>
        <div
          class=${a}
          @copy=${()=>s.userMetrics.actionTaken(s.UserMetrics.Action.NetworkPanelCopyValue)}
        >
          ${this.#p()}
        </div>
        ${d?q`<${l.Icon.Icon.litTagName} class="row-flex-icon flex-right" title=${E.reloadPrompt} .data=${{iconName:"info",width:"16px",height:"16px",color:"var(--icon-default)"}}>
          </${l.Icon.Icon.litTagName}>`:t.nothing}
      </div>
      ${this.#m(this.#d.blockedDetails)}
    `,this.#e,{host:this}),this.#d.highlight&&this.scrollIntoView({behavior:"auto"})}#p(){return this.#d?"x-client-data"!==this.#d.name||this.#d.isResponseHeader?this.#d.isDeleted||!this.#d.valueEditable?q`
      ${this.#d.value||""}
      ${this.#g(this.#d)}
      ${this.#d.isResponseHeader&&!this.#d.isDeleted?q`
        <${d.Button.Button.litTagName}
          title=${I(E.editHeader)}
          .size=${"SMALL"}
          .iconUrl=${V}
          .variant=${"round"}
          @click=${()=>{this.dispatchEvent(new F)}}
          jslog=${r.action("enable-header-overrides").track({click:!0})}
          class="enable-editing inline-button"
        ></${d.Button.Button.litTagName}>
      `:t.nothing}
    `:q`
      <${$.litTagName}
        @focusout=${this.#v}
        @input=${this.#w}
        @paste=${this.#w}
        @keydown=${this.#o}
        .data=${{value:this.#d.value||""}}
      ></${$.litTagName}>
      ${this.#g(this.#d)}
      <${d.Button.Button.litTagName}
        title=${I(E.removeOverride)}
        .size=${"SMALL"}
        .iconUrl=${O}
        .variant=${"round"}
        class="remove-header inline-button"
        @click=${this.#f}
        jslog=${r.action("remove-header-override").track({click:!0})}
      ></${d.Button.Button.litTagName}>
    `:this.#b(this.#d):t.nothing}#b(e){const t=n.parseClientVariations(e.value||""),r=n.formatClientVariations(t,I(E.activeClientExperimentVariation),I(E.activeClientExperimentVariationIds));return q`
      <div>${e.value||""}</div>
      <div>${I(E.decoded)}</div>
      <code>${r}</code>
    `}focus(){requestAnimationFrame((()=>{const e=this.#e.querySelector(".header-name devtools-editable-span");e?.focus()}))}#g(e){if("set-cookie"===e.name&&e.setCookieBlockedReasons){const t=e.setCookieBlockedReasons.map(a.NetworkRequest.setCookieBlockedReasonToUiString).join("\n");return q`
        <${l.Icon.Icon.litTagName} class="row-flex-icon" title=${t} .data=${{iconName:"warning-filled",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
        </${l.Icon.Icon.litTagName}>
      `}return t.nothing}#m(e){return e?q`
      <div class="call-to-action">
        <div class="call-to-action-body">
          <div class="explanation">${e.explanation()}</div>
          ${e.examples.map((e=>q`
            <div class="example">
              <code>${e.codeSnippet}</code>
              ${e.comment?q`
                <span class="comment">${e.comment()}</span>
              `:""}
            </div>
          `))}
          ${this.#k(e)}
        </div>
      </div>
    `:t.nothing}#k(e){return e?.reveal?q`
        <div class="devtools-link" @click=${e.reveal}>
          <${l.Icon.Icon.litTagName} class="inline-icon" .data=${{iconName:"issue-exclamation-filled",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
          </${l.Icon.Icon.litTagName}
          >${I(E.learnMoreInTheIssuesTab)}
        </div>
      `:e?.link?q`
        <x-link href=${e.link.url} class="link">
          <${l.Icon.Icon.litTagName} class="inline-icon" .data=${{iconName:"open-externally",color:"var(--icon-link)",width:"20px",height:"20px"}}>
          </${l.Icon.Icon.litTagName}
          >${I(E.learnMore)}
        </x-link>
      `:t.nothing}#v(t){const r=t.target;if(!this.#d)return;const s=r.value.trim();A(s,this.#d.value?.trim())||(this.#d.value=s,this.dispatchEvent(new D(this.#d.name,s)),e.ScheduledRender.scheduleRender(this,this.#t));const i=window.getSelection();i?.removeAllRanges()}#h(t){const r=t.target;if(!this.#d)return;const s=o.StringUtilities.toLowerCaseString(r.value.trim());""===s?r.value=this.#d.name:A(s,this.#d.name.trim())||(this.#d.name=s,this.dispatchEvent(new D(s,this.#d.value||"")),e.ScheduledRender.scheduleRender(this,this.#t));const i=window.getSelection();i?.removeAllRanges()}#f(){if(!this.#d)return;const e=this.#e.querySelector(".header-value devtools-editable-span");this.#d.originalValue&&(e.value=this.#d?.originalValue),this.dispatchEvent(new U(this.#d.name,this.#d.value||""))}#o(e){const t=e,r=e.target;"Escape"===t.key&&(e.consume(),r.matches(".header-name devtools-editable-span")?(r.value=this.#d?.name||"",this.#u(e)):r.matches(".header-value devtools-editable-span")&&(r.value=this.#d?.value||"",this.#w(e)),r.blur())}#u(t){const r=t.target,s=L(r.value);this.#c!==s&&(this.#c=s,e.ScheduledRender.scheduleRender(this,this.#t))}#w(t){const r=t.target,s=void 0!==this.#d?.originalValue&&!A(this.#d?.originalValue||"",r.value);this.#l!==s&&(this.#l=s,this.#d&&(this.#d.highlight=!1),e.ScheduledRender.scheduleRender(this,this.#t))}}customElements.define("devtools-header-section-row",M);var P=Object.freeze({__proto__:null,isValidHeaderName:L,compareHeaders:A,HeaderEditedEvent:D,HeaderRemovedEvent:U,EnableHeaderEditingEvent:F,HeaderSectionRow:M});const j=new CSSStyleSheet;j.replaceSync(':host{display:block}devtools-header-section-row:last-of-type{margin-bottom:10px}devtools-header-section-row:first-of-type{margin-top:2px}.call-to-action{background-color:var(--sys-color-neutral-container);padding:8px;border-radius:5px;margin:4px}.call-to-action-body{padding:6px 0;margin-left:9.5px;border-left:2px solid var(--issue-color-yellow);padding-left:18px;line-height:20px}.call-to-action .explanation{font-weight:bold}.call-to-action code{font-size:90%}.call-to-action .example .comment::before{content:" — "}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.explanation .link{font-weight:normal}.inline-icon{vertical-align:middle}@media (forced-colors: active){.link,\n  .devtools-link{color:linktext;text-decoration-color:linktext}}\n/*# sourceURL=RequestHeaderSection.css */\n');const{render:B,html:_}=t,W={learnMore:"Learn more",provisionalHeadersAreShownDisableCache:"Provisional headers are shown. Disable cache to see full headers.",onlyProvisionalHeadersAre:"Only provisional headers are available because this request was not sent over the network and instead was served from a local cache, which doesn’t store the original request headers. Disable cache to see full request headers.",provisionalHeadersAreShown:"Provisional headers are shown."},z=i.i18n.registerUIStrings("panels/network/components/RequestHeaderSection.ts",W),K=i.i18n.getLocalizedString.bind(void 0,z);class G extends HTMLElement{static litTagName=t.literal`devtools-request-header-section`;#e=this.attachShadow({mode:"open"});#y;#R=[];connectedCallback(){this.#e.adoptedStyleSheets=[j]}set data(e){this.#y=e.request,this.#R=this.#y.requestHeaders().map((e=>({name:o.StringUtilities.toLowerCaseString(e.name),value:e.value}))),this.#R.sort(((e,t)=>o.StringUtilities.compare(e.name,t.name))),"Request"===e.toReveal?.section&&this.#R.filter((t=>t.name===e.toReveal?.header?.toLowerCase())).forEach((e=>{e.highlight=!0})),this.#r()}#r(){this.#y&&B(_`
      ${this.#x()}
      ${this.#R.map((e=>_`
        <${M.litTagName}
          .data=${{header:e}}
          jslog=${r.value("request-header")}
        ></${M.litTagName}>
      `))}
    `,this.#e,{host:this})}#x(){if(!this.#y||void 0!==this.#y.requestHeadersText())return t.nothing;let e,r="";return this.#y.cachedInMemory()||this.#y.cached()?(e=K(W.provisionalHeadersAreShownDisableCache),r=K(W.onlyProvisionalHeadersAre)):e=K(W.provisionalHeadersAreShown),_`
      <div class="call-to-action">
        <div class="call-to-action-body">
          <div class="explanation" title=${r}>
            <${l.Icon.Icon.litTagName} class="inline-icon" .data=${{iconName:"warning-filled",color:"var(--icon-warning)",width:"16px",height:"16px"}}>
            </${l.Icon.Icon.litTagName}>
            ${e} <x-link href="https://developer.chrome.com/docs/devtools/network/reference/#provisional-headers" class="link">${K(W.learnMore)}</x-link>
          </div>
        </div>
      </div>
    `}}customElements.define("devtools-request-header-section",G);var Y=Object.freeze({__proto__:null,RequestHeaderSection:G});const J=new CSSStyleSheet;J.replaceSync('.header{background-color:var(--sys-color-surface1);border-bottom:1px solid var(--sys-color-divider);border-top:1px solid var(--sys-color-divider);line-height:25px;padding:0 5px}.header::marker{font-size:11px;line-height:1}.header:focus{background-color:var(--sys-color-state-header-hover)}details[open] .header-count{display:none}details .hide-when-closed{display:none}details[open] .hide-when-closed{display:block}details summary input{vertical-align:middle}.row{display:flex;line-height:20px;padding-left:8px;gap:12px;user-select:text}div.raw-headers-row{display:block}.row:first-of-type{margin-top:2px}.row:last-child{margin-bottom:10px}.header-name{color:var(--sys-color-on-surface);font-weight:400;width:30%;min-width:160px;max-width:240px;flex-shrink:0;text-transform:capitalize}.header-value{word-break:break-all;display:flex;align-items:center;gap:2px}.header-name,\n.header-value{&::selection{color:var(--sys-color-on-tonal-container);background-color:var(--sys-color-tonal-container)}}.green-circle::before,\n.red-circle::before,\n.yellow-circle::before{content:"";display:inline-block;width:12px;height:12px;border-radius:6px;vertical-align:text-top;margin-right:2px}.green-circle::before{background-color:var(--sys-color-green-bright)}.red-circle::before{background-color:var(--sys-color-error-bright)}.yellow-circle::before{background-color:var(--issue-color-yellow)}.status-with-comment{color:var(--sys-color-token-subtle)}.raw-headers{font-family:var(--source-code-font-family);font-size:var(--source-code-font-size);white-space:pre-wrap;word-break:break-all}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}.inline-icon{vertical-align:middle}.header-grid-container{display:inline-grid;grid-template-columns:156px 50px 1fr;grid-gap:4px;width:calc(100% - 15px)}.header-grid-container div:last-child{text-align:right}.header .devtools-link{color:var(--sys-color-on-surface)}x-link{position:relative}x-link .inline-icon{padding-right:3px}.purple.dot::before{background-color:var(--sys-color-purple-bright);content:var(--image-file-empty);width:6px;height:6px;border-radius:50%;outline:1px solid var(--icon-gap-toolbar);left:9px;position:absolute;top:11px;z-index:1}summary label input[type="checkbox"]{margin-top:1px}\n/*# sourceURL=RequestHeadersView.css */\n');const X=new CSSStyleSheet;X.replaceSync(":host{display:block}devtools-header-section-row:last-of-type{margin-bottom:10px}devtools-header-section-row:first-of-type{margin-top:2px}.add-header-button{margin:-4px 0 10px 5px}\n/*# sourceURL=ResponseHeaderSection.css */\n");const{render:Q,html:Z}=t,ee={addHeader:"Add header",chooseThisOptionIfTheResourceAnd:"Choose this option if the resource and the document are served from the same site.",onlyChooseThisOptionIfAn:"Only choose this option if an arbitrary website including this resource does not impose a security risk.",thisDocumentWasBlockedFrom:"The document was blocked from loading in a popup opened by a sandboxed iframe because this document specified a cross-origin opener policy.",toEmbedThisFrameInYourDocument:"To embed this frame in your document, the response needs to enable the cross-origin embedder policy by specifying the following response header:",toUseThisResourceFromADifferent:"To use this resource from a different origin, the server needs to specify a cross-origin resource policy in the response headers:",toUseThisResourceFromADifferentOrigin:"To use this resource from a different origin, the server may relax the cross-origin resource policy response header:",toUseThisResourceFromADifferentSite:"To use this resource from a different site, the server may relax the cross-origin resource policy response header:"},te=i.i18n.registerUIStrings("panels/network/components/ResponseHeaderSection.ts",ee),re=i.i18n.getLocalizedString.bind(void 0,te),se=i.i18n.getLazilyComputedLocalizedString.bind(void 0,te),ie=new URL("../../../Images/plus.svg",import.meta.url).toString(),oe="ResponseHeaderSection";class ae extends HTMLElement{static litTagName=t.literal`devtools-response-header-section`;#e=this.attachShadow({mode:"open"});#y;#S=[];#$=[];#T=null;#N=[];#H=!1;connectedCallback(){this.#e.adoptedStyleSheets=[X]}set data(e){this.#y=e.request;const t=this.#y.sortedResponseHeaders.concat(this.#y.setCookieHeaders);t.sort((function(e,t){return o.StringUtilities.compare(e.name.toLowerCase(),t.name.toLowerCase())})),this.#S=t.map((e=>({name:o.StringUtilities.toLowerCaseString(e.name),value:e.value.replace(/\s/g," ")})));const r=[];if(this.#y.wasBlocked()){const e=ne.get(this.#y.blockedReason());if(e){if(f.RelatedIssue.hasIssueOfCategory(this.#y,"CrossOriginEmbedderPolicy")){const t=()=>{s.userMetrics.issuesPanelOpenedFrom(1),this.#y&&f.RelatedIssue.reveal(this.#y,"CrossOriginEmbedderPolicy")};e.blockedDetails&&(e.blockedDetails.reveal=t)}r.push(e)}}this.#S=function(e,t){let r=0,s=0;const i=[];for(;r<e.length&&s<t.length;)e[r].name<t[s].name?i.push({...e[r++],headerNotSet:!1}):e[r].name>t[s].name?i.push({...t[s++],headerNotSet:!0}):i.push({...t[s++],...e[r++],headerNotSet:!1});for(;r<e.length;)i.push({...e[r++],headerNotSet:!1});for(;s<t.length;)i.push({...t[s++],headerNotSet:!0});return i}(this.#S,r);const i=this.#y.blockedResponseCookies(),a=new Map(i?.map((e=>[e.cookieLine.replace(/\s/g," "),e.blockedReasons])));for(const e of this.#S)if("set-cookie"===e.name&&e.value){const t=a.get(e.value);t&&(e.setCookieBlockedReasons=t)}"Response"===e.toReveal?.section&&this.#S.filter((t=>A(t.name,e.toReveal?.header?.toLowerCase()))).forEach((e=>{e.highlight=!0}));const n=this.#y.getAssociatedData(oe);n?this.#$=n:(this.#$=this.#S.map((e=>({name:e.name,value:e.value,originalValue:e.value}))),this.#q()),this.#E(),this.#y.setAssociatedData(oe,this.#$),this.#r()}#C(){this.#y&&(this.#H=!1,this.#$=this.#S.map((e=>({name:e.name,value:e.value,originalValue:e.value}))),this.#q(),this.#y.setAssociatedData(oe,this.#$))}async#E(){if(this.#y){if(this.#T=h.NetworkPersistenceManager.NetworkPersistenceManager.instance().getHeadersUISourceCodeFromUrl(this.#y.url()),!this.#T)return this.#C(),void this.#r();try{const e=await this.#T.requestContent();if(this.#N=JSON.parse(e.content||"[]"),!this.#N.every(h.NetworkPersistenceManager.isHeaderOverride))throw"Type mismatch after parsing";this.#H=c.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").get();for(const e of this.#$)e.valueEditable=this.#H}catch(e){console.error("Failed to parse",this.#T?.url()||"source code file","for locally overriding headers."),this.#C()}finally{this.#r()}}}#q(){if(!this.#y||0===this.#y.originalResponseHeaders.length)return;const e=this.#y.originalResponseHeaders.map((e=>({name:o.StringUtilities.toLowerCaseString(e.name),value:e.value.replace(/\s/g," ")})));e.sort((function(e,t){return o.StringUtilities.compare(e.name,t.name)}));let t=0,r=0;for(;t<this.#S.length;){const s=this.#S[t].name;let i=this.#S[t].value||"";const o=this.#S[t].headerNotSet;for(;t<this.#S.length-1&&this.#S[t+1].name===s;)t++,i+=`, ${this.#S[t].value}`;for(;r<e.length&&e[r].name<s;)r++;if(r<e.length&&e[r].name===s){let t=e[r].value;for(;r<e.length-1&&e[r+1].name===s;)r++,t+=`, ${e[r].value}`;r++,"set-cookie"===s||o||A(i,t)||this.#$.filter((e=>A(e.name,s))).forEach((e=>{e.isOverride=!0}))}else"set-cookie"===s||o||this.#$.filter((e=>A(e.name,s))).forEach((e=>{e.isOverride=!0}));t++}this.#$.filter((e=>"set-cookie"===e.name)).forEach((e=>{void 0===this.#y?.originalResponseHeaders.find((t=>"set-cookie"===o.StringUtilities.toLowerCaseString(t.name)&&A(t.value,e.value)))&&(e.isOverride=!0)}))}#I(e){const t=e.target;if(void 0===t.dataset.index)return;const r=Number(t.dataset.index);this.#O(e.headerName,e.headerValue,r),s.userMetrics.actionTaken(s.UserMetrics.Action.HeaderOverrideHeaderEdited)}#V(e){const t=h.NetworkPersistenceManager.NetworkPersistenceManager.instance().rawPathFromUrl(e,!0),r=t.lastIndexOf("/");return c.ParsedURL.ParsedURL.substring(t,r+1)}#L(){this.#T?.setWorkingCopy(JSON.stringify(this.#N,null,2)),this.#T?.commitWorkingCopy()}#A(e,t,r){for(let s=this.#N.length-1;s>=0;s--){const i=this.#N[s];if(i.applyTo!==e)continue;const o=i.headers.findIndex((e=>A(e.name,t)&&A(e.value,r)));if(!(o<0))return i.headers.splice(o,1),void(0===i.headers.length&&this.#N.splice(s,1))}}#D(e){const t=e.target;if(void 0===t.dataset.index||!this.#y)return;const r=Number(t.dataset.index),i=this.#V(this.#y.url());this.#A(i,e.headerName,e.headerValue),this.#L(),this.#$[r].isDeleted=!0,this.#r(),s.userMetrics.actionTaken(s.UserMetrics.Action.HeaderOverrideHeaderRemoved)}#O(e,t,r){if(!this.#y)return;0===this.#y.originalResponseHeaders.length&&(this.#y.originalResponseHeaders=this.#y.sortedResponseHeaders.map((e=>({...e}))));const s=this.#$[r].name,i=this.#$[r].value;this.#$[r].name=e,this.#$[r].value=t;let o=[];"set-cookie"===e?o.push({name:e,value:t}):o=this.#$.filter((t=>A(t.name,e)&&(!A(t.value,t.originalValue)||t.isOverride)));const a=this.#V(this.#y.url());let n=null;const[d]=this.#N.slice(-1);if(d?.applyTo===a?n=d:(n={applyTo:a,headers:[]},this.#N.push(n)),"set-cookie"===e){const e=n.headers.findIndex((e=>A(e.name,s)&&A(e.value,i)));e>=0&&n.headers.splice(e,1)}else n.headers=n.headers.filter((t=>!A(t.name,e)));if(!A(this.#$[r].name,s))for(let e=0;e<n.headers.length;++e)if(A(n.headers[e].name,s)&&A(n.headers[e].value,i)){n.headers.splice(e,1);break}for(const e of o)n.headers.push({name:e.name,value:e.value||""});0===n.headers.length&&this.#N.pop(),this.#L()}#U(){this.#$.push({name:o.StringUtilities.toLowerCaseString(i.i18n.lockedString("header-name")),value:i.i18n.lockedString("header value"),isOverride:!0,nameEditable:!0,valueEditable:!0});const e=this.#$.length-1;this.#O(this.#$[e].name,this.#$[e].value||"",e),this.#r();const t=this.#e.querySelectorAll("devtools-header-section-row"),[r]=Array.from(t).slice(-1);r?.focus(),s.userMetrics.actionTaken(s.UserMetrics.Action.HeaderOverrideHeaderAdded)}#r(){if(!this.#y)return;const e=this.#$.map(((e,t)=>({...this.#S[t],...e,isResponseHeader:!0})));Q(Z`
      ${e.map(((e,t)=>Z`
        <${M.litTagName}
            .data=${{header:e}}
            @headeredited=${this.#I}
            @headerremoved=${this.#D}
            @enableheaderediting=${this.#F}
            data-index=${t}
            jslog=${r.value("response-header")}
        ></${M.litTagName}>
      `))}
      ${this.#H?Z`
        <${d.Button.Button.litTagName}
          class="add-header-button"
          .variant=${"secondary"}
          .iconUrl=${ie}
          @click=${this.#U}
          jslog=${r.action("add-header").track({click:!0})}>
          ${re(ee.addHeader)}
        </${d.Button.Button.litTagName}>
      `:t.nothing}
    `,this.#e,{host:this})}async#F(){if(!this.#y)return;s.userMetrics.actionTaken(s.UserMetrics.Action.HeaderOverrideEnableEditingClicked);const e=this.#y.url(),t=h.NetworkPersistenceManager.NetworkPersistenceManager.instance();t.project()?(c.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").set(!0),await t.getOrCreateHeadersUISourceCodeFromUrl(e)):v.InspectorView.InspectorView.instance().displaySelectOverrideFolderInfobar((async()=>{await w.SourcesNavigator.OverridesNavigatorView.instance().setupNewWorkspace(),await t.getOrCreateHeadersUISourceCodeFromUrl(e)}))}}customElements.define("devtools-response-header-section",ae);const ne=new Map([["coep-frame-resource-needs-coep-header",{name:o.StringUtilities.toLowerCaseString("cross-origin-embedder-policy"),value:null,blockedDetails:{explanation:se(ee.toEmbedThisFrameInYourDocument),examples:[{codeSnippet:"Cross-Origin-Embedder-Policy: require-corp",comment:void 0}],link:{url:"https://web.dev/coop-coep/"}}}],["corp-not-same-origin-after-defaulted-to-same-origin-by-coep",{name:o.StringUtilities.toLowerCaseString("cross-origin-resource-policy"),value:null,blockedDetails:{explanation:se(ee.toUseThisResourceFromADifferent),examples:[{codeSnippet:"Cross-Origin-Resource-Policy: same-site",comment:se(ee.chooseThisOptionIfTheResourceAnd)},{codeSnippet:"Cross-Origin-Resource-Policy: cross-origin",comment:se(ee.onlyChooseThisOptionIfAn)}],link:{url:"https://web.dev/coop-coep/"}}}],["coop-sandboxed-iframe-cannot-navigate-to-coop-page",{name:o.StringUtilities.toLowerCaseString("cross-origin-opener-policy"),value:null,headerValueIncorrect:!1,blockedDetails:{explanation:se(ee.thisDocumentWasBlockedFrom),examples:[],link:{url:"https://web.dev/coop-coep/"}}}],["corp-not-same-site",{name:o.StringUtilities.toLowerCaseString("cross-origin-resource-policy"),value:null,headerValueIncorrect:!0,blockedDetails:{explanation:se(ee.toUseThisResourceFromADifferentSite),examples:[{codeSnippet:"Cross-Origin-Resource-Policy: cross-origin",comment:se(ee.onlyChooseThisOptionIfAn)}],link:null}}],["corp-not-same-origin",{name:o.StringUtilities.toLowerCaseString("cross-origin-resource-policy"),value:null,headerValueIncorrect:!0,blockedDetails:{explanation:se(ee.toUseThisResourceFromADifferentOrigin),examples:[{codeSnippet:"Cross-Origin-Resource-Policy: same-site",comment:se(ee.chooseThisOptionIfTheResourceAnd)},{codeSnippet:"Cross-Origin-Resource-Policy: cross-origin",comment:se(ee.onlyChooseThisOptionIfAn)}],link:null}}]]);var de=Object.freeze({__proto__:null,RESPONSE_HEADER_SECTION_DATA_KEY:oe,ResponseHeaderSection:ae});const{render:le,html:ce}=t,he={fromDiskCache:"(from disk cache)",fromMemoryCache:"(from memory cache)",fromPrefetchCache:"(from prefetch cache)",fromServiceWorker:"(from `service worker`)",fromSignedexchange:"(from signed-exchange)",fromWebBundle:"(from Web Bundle)",general:"General",raw:"Raw",referrerPolicy:"Referrer Policy",remoteAddress:"Remote Address",requestHeaders:"Request Headers",requestMethod:"Request Method",requestUrl:"Request URL",responseHeaders:"Response Headers",revealHeaderOverrides:"Reveal header override definitions",showMore:"Show more",statusCode:"Status Code"},ue=i.i18n.registerUIStrings("panels/network/components/RequestHeadersView.ts",he),pe=i.i18n.getLocalizedString.bind(void 0,ue),me=g.RenderCoordinator.RenderCoordinator.instance();class ge extends m.LegacyWrapper.WrappableComponent{#y;static litTagName=t.literal`devtools-request-headers`;#e=this.attachShadow({mode:"open"});#M=!1;#P=!1;#j=!1;#B=!1;#_=void 0;#W=u.Workspace.WorkspaceImpl.instance();constructor(e){super(),this.#y=e,this.setAttribute("jslog",`${r.pane("headers").track({resize:!0})}`)}wasShown(){this.#y.addEventListener(a.NetworkRequest.Events.RemoteAddressChanged,this.#z,this),this.#y.addEventListener(a.NetworkRequest.Events.FinishedLoading,this.#z,this),this.#y.addEventListener(a.NetworkRequest.Events.RequestHeadersChanged,this.#z,this),this.#y.addEventListener(a.NetworkRequest.Events.ResponseHeadersChanged,this.#K,this),this.#_=void 0,this.#z()}willHide(){this.#y.removeEventListener(a.NetworkRequest.Events.RemoteAddressChanged,this.#z,this),this.#y.removeEventListener(a.NetworkRequest.Events.FinishedLoading,this.#z,this),this.#y.removeEventListener(a.NetworkRequest.Events.RequestHeadersChanged,this.#z,this),this.#y.removeEventListener(a.NetworkRequest.Events.ResponseHeadersChanged,this.#K,this)}#K(){this.#y.deleteAssociatedData(oe),this.render()}#z(){this.render()}revealHeader(e,t){this.#_={section:e,header:t},this.render()}connectedCallback(){this.#e.adoptedStyleSheets=[J],this.#W.addEventListener(u.Workspace.Events.UISourceCodeAdded,this.#G,this),this.#W.addEventListener(u.Workspace.Events.UISourceCodeRemoved,this.#G,this),c.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").addChangeListener(this.render,this)}disconnectedCallback(){this.#W.removeEventListener(u.Workspace.Events.UISourceCodeAdded,this.#G,this),this.#W.removeEventListener(u.Workspace.Events.UISourceCodeRemoved,this.#G,this),c.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled").removeChangeListener(this.render,this)}#G(e){this.#Y()===e.data.url()&&this.render()}async render(){if(this.#y)return me.write((()=>{le(ce`
        ${this.#J()}
        ${this.#X()}
        ${this.#Q()}
      `,this.#e,{host:this})}))}#X(){if(!this.#y)return t.nothing;return ce`
      <${we.litTagName}
        @togglerawevent=${()=>{this.#M=!this.#M,this.render()}}
        .data=${{name:"response-headers",title:pe(he.responseHeaders),headerCount:this.#y.sortedResponseHeaders.length,checked:this.#y.responseHeadersText?this.#M:void 0,additionalContent:this.#Z(),forceOpen:"Response"===this.#_?.section,loggingContext:"response-headers"}}
        aria-label=${pe(he.responseHeaders)}
      >
        ${this.#M?this.#ee(this.#y.responseHeadersText,!0):ce`
          <${ae.litTagName} .data=${{request:this.#y,toReveal:this.#_}} jslog=${r.section("response-headers")}></${ae.litTagName}>
        `}
      </${we.litTagName}>
    `}#Z(){if(!this.#W.uiSourceCodeForURL(this.#Y()))return t.nothing;const e=c.Settings.Settings.instance().moduleSetting("persistence-network-overrides-enabled"),s=ce`
      <${l.Icon.Icon.litTagName} class=${e.get()?"inline-icon dot purple":"inline-icon"} .data=${{iconName:"document",color:"var(--icon-default)",width:"16px",height:"16px"}}>
      </${l.Icon.Icon.litTagName}>`;return ce`
      <x-link
          href="https://goo.gle/devtools-override"
          class="link devtools-link"
          jslog=${r.link("devtools-override").track({click:!0})}
      >
        <${l.Icon.Icon.litTagName} class="inline-icon" .data=${{iconName:"help",color:"var(--icon-link)",width:"16px",height:"16px"}}>
        </${l.Icon.Icon.litTagName}
      ></x-link>
      <x-link
          @click=${e=>{e.preventDefault();const t=this.#W.uiSourceCodeForURL(this.#Y());t&&(w.SourcesPanel.SourcesPanel.instance().showUISourceCode(t),w.SourcesPanel.SourcesPanel.instance().revealInNavigator(t))}}
          class="link devtools-link"
          title=${he.revealHeaderOverrides}
          jslog=${r.link("reveal-header-overrides").track({click:!0})}
      >
        ${s}${h.NetworkPersistenceManager.HEADERS_FILENAME}
      </x-link>
    `}#Y(){if(!this.#y)return o.DevToolsPath.EmptyUrlString;const e=h.NetworkPersistenceManager.NetworkPersistenceManager.instance().fileUrlFromNetworkUrl(this.#y.url(),!0);return e.substring(0,e.lastIndexOf("/"))+"/"+h.NetworkPersistenceManager.HEADERS_FILENAME}#Q(){if(!this.#y)return t.nothing;const e=this.#y.requestHeadersText();return ce`
      <${we.litTagName}
        @togglerawevent=${()=>{this.#P=!this.#P,this.render()}}
        .data=${{name:"request-headers",title:pe(he.requestHeaders),headerCount:this.#y.requestHeaders().length,checked:e?this.#P:void 0,forceOpen:"Request"===this.#_?.section,loggingContext:"request-headers"}}
        aria-label=${pe(he.requestHeaders)}
      >
        ${this.#P&&e?this.#ee(e,!1):ce`
          <${G.litTagName} .data=${{request:this.#y,toReveal:this.#_}} jslog=${r.section("request-headers")}></${G.litTagName}>
        `}
      </${we.litTagName}>
    `}#ee(s,i){const o=s.trim(),a=!(i?this.#j:this.#B)&&o.length>3e3,n=()=>{i?this.#j=!0:this.#B=!0,this.render()},l=e=>{if(!(i?this.#j:this.#B)){const t=new v.ContextMenu.ContextMenu(e);t.newSection().appendItem(pe(he.showMore),n,{jslogContext:"show-more"}),t.show()}};return ce`
      <div class="row raw-headers-row" on-render=${e.Directives.nodeRenderedCallback((e=>{a&&e.addEventListener("contextmenu",l)}))}>
        <div class="raw-headers">${a?o.substring(0,3e3):o}</div>
        ${a?ce`
          <${d.Button.Button.litTagName}
            .size=${"SMALL"}
            .variant=${"secondary"}
            @click=${n}
            jslog=${r.action("raw-headers-show-more").track({click:!0})}
          >${pe(he.showMore)}</${d.Button.Button.litTagName}>
        `:t.nothing}
      </div>
    `}#J(){if(!this.#y)return t.nothing;const e=["status"];this.#y.statusCode<300||304===this.#y.statusCode?e.push("green-circle"):this.#y.statusCode<400?e.push("yellow-circle"):e.push("red-circle");let s="";this.#y.cachedInMemory()?s=pe(he.fromMemoryCache):this.#y.fetchedViaServiceWorker?s=pe(he.fromServiceWorker):this.#y.redirectSourceSignedExchangeInfoHasNoErrors()?s=pe(he.fromSignedexchange):this.#y.webBundleInnerRequestInfo()?s=pe(he.fromWebBundle):this.#y.fromPrefetchCache()?s=pe(he.fromPrefetchCache):this.#y.cached()&&(s=pe(he.fromDiskCache)),s&&e.push("status-with-comment");const i=[this.#y.statusCode,this.#y.getInferredStatusText(),s].join(" ");return ce`
      <${we.litTagName}
        .data=${{name:"general",title:pe(he.general),forceOpen:"General"===this.#_?.section,loggingContext:"general"}}
        aria-label=${pe(he.general)}
      >
      <div jslog=${r.section("general")}>
        ${this.#te(pe(he.requestUrl),this.#y.url())}
        ${this.#y.statusCode?this.#te(pe(he.requestMethod),this.#y.requestMethod):t.nothing}
        ${this.#y.statusCode?this.#te(pe(he.statusCode),i,e):t.nothing}
        ${this.#y.remoteAddress()?this.#te(pe(he.remoteAddress),this.#y.remoteAddress()):t.nothing}
        ${this.#y.referrerPolicy()?this.#te(pe(he.referrerPolicy),String(this.#y.referrerPolicy())):t.nothing}
      </div>
      </${we.litTagName}>
    `}#te(e,t,r){const i="General"===this.#_?.section&&e.toLowerCase()===this.#_?.header?.toLowerCase();return ce`
      <div class="row ${i?"header-highlight":""}">
        <div class="header-name">${e}:</div>
        <div
          class="header-value ${r?.join(" ")}"
          @copy=${()=>s.userMetrics.actionTaken(s.UserMetrics.Action.NetworkPanelCopyValue)}
        >${t}</div>
      </div>
    `}}class ve extends Event{static eventName="togglerawevent";constructor(){super(ve.eventName,{})}}class we extends HTMLElement{static litTagName=t.literal`devtools-request-headers-category`;#e=this.attachShadow({mode:"open"});#re;#se=c.UIString.LocalizedEmptyString;#ie=void 0;#oe=void 0;#ae=void 0;#ne=void 0;#de="";connectedCallback(){this.#e.adoptedStyleSheets=[J,p.checkboxStyles]}set data(e){this.#se=e.title,this.#re=c.Settings.Settings.instance().createSetting("request-info-"+e.name+"-category-expanded",!0),this.#ie=e.headerCount,this.#oe=e.checked,this.#ae=e.additionalContent,this.#ne=e.forceOpen,this.#de=e.loggingContext,this.#r()}#le(){this.dispatchEvent(new ve)}#r(){const e=!this.#re||this.#re.get()||this.#ne;le(ce`
      <details ?open=${e} @toggle=${this.#ce}>
        <summary
          class="header"
          @keydown=${this.#he}
          jslog=${r.sectionHeader().track({click:!0}).context(this.#de)}
        >
          <div class="header-grid-container">
            <div>
              ${this.#se}${void 0!==this.#ie?ce`<span class="header-count"> (${this.#ie})</span>`:t.nothing}
            </div>
            <div class="hide-when-closed">
              ${void 0!==this.#oe?ce`
                <label><input
                    type="checkbox"
                    .checked=${this.#oe}
                    @change=${this.#le}
                    jslog=${r.toggle("raw-headers").track({change:!0})}
                />${pe(he.raw)}</label>
              `:t.nothing}
            </div>
            <div class="hide-when-closed">${this.#ae}</div>
        </summary>
        <slot></slot>
      </details>
    `,this.#e,{host:this})}#he(e){if(!e.target)return;const t=e.target.parentElement;if(!t)throw new Error("<details> element is not found for a <summary> element");switch(e.key){case"ArrowLeft":t.open=!1;break;case"ArrowRight":t.open=!0}}#ce(e){this.#re?.set(e.target.open)}}customElements.define("devtools-request-headers",ge),customElements.define("devtools-request-headers-category",we);var fe=Object.freeze({__proto__:null,RequestHeadersView:ge,ToggleRawHeadersEvent:ve,Category:we});const be=new CSSStyleSheet;be.replaceSync(".code{font-family:var(--monospace-font-family);font-size:var(--monospace-font-size)}.issuers-list{display:flex;flex-direction:column;list-style-type:none;padding:0;margin:0}.status-icon{margin:0 0.3em 2px 0;vertical-align:middle}\n/*# sourceURL=RequestTrustTokensView.css */\n");const ke={parameters:"Parameters",type:"Type",refreshPolicy:"Refresh policy",issuers:"Issuers",topLevelOrigin:"Top level origin",issuer:"Issuer",result:"Result",status:"Status",numberOfIssuedTokens:"Number of issued tokens",success:"Success",failure:"Failure",theOperationsResultWasServedFrom:"The operations result was served from cache.",theOperationWasFulfilledLocally:"The operation was fulfilled locally, no request was sent.",theKeysForThisPSTIssuerAreUnavailable:"The keys for this PST issuer are unavailable. The issuer may need to be registered via the Chrome registration process.",aClientprovidedArgumentWas:"A client-provided argument was malformed or otherwise invalid.",eitherNoInputsForThisOperation:"Either no inputs for this operation are available or the output exceeds the operations quota.",theServersResponseWasMalformedOr:"The servers response was malformed or otherwise invalid.",theOperationFailedForAnUnknown:"The operation failed for an unknown reason."},ye=i.i18n.registerUIStrings("panels/network/components/RequestTrustTokensView.ts",ke),Re=i.i18n.getLocalizedString.bind(void 0,ye);class xe extends m.LegacyWrapper.WrappableComponent{static litTagName=t.literal`devtools-trust-token-report`;#e=this.attachShadow({mode:"open"});#y;constructor(e){super(),this.#y=e}wasShown(){this.#y.addEventListener(a.NetworkRequest.Events.TrustTokenResultAdded,this.render,this),this.render()}willHide(){this.#y.removeEventListener(a.NetworkRequest.Events.TrustTokenResultAdded,this.render,this)}connectedCallback(){this.#e.adoptedStyleSheets=[be]}async render(){if(!this.#y)throw new Error("Trying to render a Trust Token report without providing data");t.render(t.html`<${b.ReportView.Report.litTagName}>
        ${this.#ue()}
        ${this.#pe()}
      </${b.ReportView.Report.litTagName}>
    `,this.#e,{host:this})}#ue(){const e=this.#y.trustTokenParams();return e?t.html`
      <${b.ReportView.ReportSectionHeader.litTagName} jslog=${r.pane("trust-tokens").track({resize:!0})}>${Re(ke.parameters)}</${b.ReportView.ReportSectionHeader.litTagName}>
      ${He(Re(ke.type),e.operation.toString())}
      ${this.#me(e)}
      ${this.#ge(e)}
      ${this.#ve()}
      <${b.ReportView.ReportSectionDivider.litTagName}></${b.ReportView.ReportSectionDivider.litTagName}>
    `:t.nothing}#me(e){return"Redemption"!==e.operation?t.nothing:He(Re(ke.refreshPolicy),e.refreshPolicy.toString())}#ge(e){return e.issuers&&0!==e.issuers.length?t.html`
      <${b.ReportView.ReportKey.litTagName}>${Re(ke.issuers)}</${b.ReportView.ReportKey.litTagName}>
      <${b.ReportView.ReportValue.litTagName}>
        <ul class="issuers-list">
          ${e.issuers.map((e=>t.html`<li>${e}</li>`))}
        </ul>
      </${b.ReportView.ReportValue.litTagName}>
    `:t.nothing}#ve(){const e=this.#y.trustTokenOperationDoneEvent();return e?t.html`
      ${Ne(Re(ke.topLevelOrigin),e.topLevelOrigin)}
      ${Ne(Re(ke.issuer),e.issuerOrigin)}`:t.nothing}#pe(){const e=this.#y.trustTokenOperationDoneEvent();return e?t.html`
      <${b.ReportView.ReportSectionHeader.litTagName}>${Re(ke.result)}</${b.ReportView.ReportSectionHeader.litTagName}>
      <${b.ReportView.ReportKey.litTagName}>${Re(ke.status)}</${b.ReportView.ReportKey.litTagName}>
      <${b.ReportView.ReportValue.litTagName}>
        <span>
          <${l.Icon.Icon.litTagName} class="status-icon"
            .data=${r=e.status,Te(r)?Se:$e}>
          </${l.Icon.Icon.litTagName}>
          <strong>${function(e){return Te(e)?Re(ke.success):Re(ke.failure)}(e.status)}</strong>
          ${function(e){switch(e){case"Ok":return null;case"AlreadyExists":return Re(ke.theOperationsResultWasServedFrom);case"FulfilledLocally":return Re(ke.theOperationWasFulfilledLocally);case"InvalidArgument":return Re(ke.aClientprovidedArgumentWas);case"ResourceExhausted":return Re(ke.eitherNoInputsForThisOperation);case"BadResponse":return Re(ke.theServersResponseWasMalformedOr);case"MissingIssuerKeys":return Re(ke.theKeysForThisPSTIssuerAreUnavailable);case"FailedPrecondition":case"Unavailable":case"InternalError":case"Unauthorized":case"UnknownError":return Re(ke.theOperationFailedForAnUnknown)}}(e.status)}
        </span>
      </${b.ReportView.ReportValue.litTagName}>
      ${this.#we(e)}
      <${b.ReportView.ReportSectionDivider.litTagName}></${b.ReportView.ReportSectionDivider.litTagName}>
      `:t.nothing;var r}#we(e){return"Issuance"!==e.type?t.nothing:Ne(Re(ke.numberOfIssuedTokens),e.issuedTokenCount)}}const Se={color:"var(--icon-checkmark-green)",iconName:"check-circle",width:"16px",height:"16px"},$e={color:"var(--icon-error)",iconName:"cross-circle-filled",width:"16px",height:"16px"};function Te(e){return"Ok"===e||"AlreadyExists"===e||"FulfilledLocally"===e}function Ne(e,r){return void 0===r?t.nothing:t.html`
    <${b.ReportView.ReportKey.litTagName}>${e}</${b.ReportView.ReportKey.litTagName}>
    <${b.ReportView.ReportValue.litTagName}>${r}</${b.ReportView.ReportValue.litTagName}>
  `}function He(e,r){return t.html`
    <${b.ReportView.ReportKey.litTagName}>${e}</${b.ReportView.ReportKey.litTagName}>
    <${b.ReportView.ReportValue.litTagName} class="code">${r}</${b.ReportView.ReportValue.litTagName}>
  `}customElements.define("devtools-trust-token-report",xe);var qe=Object.freeze({__proto__:null,RequestTrustTokensView:xe,statusConsideredSuccess:Te});const Ee=new CSSStyleSheet;Ee.replaceSync(":host{--icon-padding:4px}.header{display:flex;font-weight:bold;padding:calc(2 * var(--icon-padding)) var(--icon-padding);line-height:20px}.icon{margin:0 var(--icon-padding)}\n/*# sourceURL=WebBundleInfoView.css */\n");const{render:Ce,html:Ie}=t,Oe={bundledResource:"Bundled resource"},Ve=i.i18n.registerUIStrings("panels/network/components/WebBundleInfoView.ts",Oe),Le=i.i18n.getLocalizedString.bind(void 0,Ve);class Ae extends m.LegacyWrapper.WrappableComponent{static litTagName=t.literal`devtools-web-bundle-info`;#e=this.attachShadow({mode:"open"});#fe;#be;constructor(e){super();const t=e.webBundleInfo();if(!t)throw new Error("Trying to render a Web Bundle info without providing data");this.#fe=t,this.#be=e.parsedURL.lastPathComponent,this.setAttribute("jslog",`${r.pane("webbundle").track({resize:!0})}`)}connectedCallback(){this.#e.adoptedStyleSheets=[Ee]}async render(){const e=this.#fe.resourceUrls?.map((e=>{const t=c.ResourceType.ResourceType.mimeFromURL(e)||null,r=c.ResourceType.ResourceType.fromMimeTypeOverride(t)||c.ResourceType.ResourceType.fromMimeType(t),s=k.iconDataForResourceType(r);return{cells:[{columnId:"url",value:null,renderer:()=>Ie`
                <div style="display: flex;">
                  <${l.Icon.Icon.litTagName} class="icon"
                    .data=${{...s,width:"20px"}}>
                  </${l.Icon.Icon.litTagName}>
                  <span>${e}</span>
                </div>`}]}}));Ce(Ie`
      <div class="header">
        <${l.Icon.Icon.litTagName} class="icon"
          .data=${{color:"var(--icon-default)",iconName:"bundle",width:"20px"}}>
        </${l.Icon.Icon.litTagName}>
        <span>${this.#be}</span>
        <x-link href="https://web.dev/web-bundles/#explaining-web-bundles"
          jslog=${r.link("webbundle-explainer").track({click:!0})}>
          <${l.Icon.Icon.litTagName} class="icon"
            .data=${{color:"var(--icon-default)",iconName:"help",width:"16px"}}>
          </${l.Icon.Icon.litTagName}>
        </x-link>
      </div>
      <div>
        <${y.DataGrid.DataGrid.litTagName}
          .data=${{columns:[{id:"url",title:Le(Oe.bundledResource),widthWeighting:1,visible:!0,hideable:!1}],rows:e,activeSort:null}}>
        </${y.DataGrid.DataGrid.litTagName}>
      </div>`,this.#e,{host:this})}}customElements.define("devtools-web-bundle-info",Ae);var De=Object.freeze({__proto__:null,WebBundleInfoView:Ae});export{T as EditableSpan,P as HeaderSectionRow,Y as RequestHeaderSection,fe as RequestHeadersView,qe as RequestTrustTokensView,de as ResponseHeaderSection,De as WebBundleInfoView};
