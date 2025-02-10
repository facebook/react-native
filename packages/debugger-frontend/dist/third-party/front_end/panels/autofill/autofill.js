import*as e from"../../core/common/common.js";import*as t from"../../core/i18n/i18n.js";import*as i from"../../core/sdk/sdk.js";import*as l from"../../models/autofill_manager/autofill_manager.js";import*as s from"../../ui/components/adorners/adorners.js";import*as r from"../../ui/components/data_grid/data_grid.js";import*as a from"../../ui/components/helpers/helpers.js";import*as o from"../../ui/components/input/input.js";import*as n from"../../ui/components/legacy_wrapper/legacy_wrapper.js";import*as d from"../../ui/lit-html/lit-html.js";import*as h from"../../ui/visual_logging/visual_logging.js";const c=new CSSStyleSheet;c.replaceSync("main{height:100%}.placeholder-container{height:calc(100% - 29px);display:flex;justify-content:center;align-items:center}.placeholder{font-size:15px;text-align:center}.address{padding:10px;margin-right:auto}.filled-fields-grid{border-top:1px solid var(--sys-color-divider);box-sizing:border-box}.content-container{display:flex;flex-flow:column;height:100%}.grid-wrapper{flex-grow:1}.checkbox-label{display:flex;align-items:center}.right-to-left{display:flex;flex-flow:row-reverse wrap;justify-content:flex-end}.label-container{padding:5px 5px 0;display:flex;align-items:flex-start}.top-right-corner{display:flex;justify-content:flex-end;padding:5px}.matches-filled-field{background-color:var(--sys-color-tonal-container)}.highlighted{background-color:var(--sys-color-state-focus-select)}.link{color:var(--sys-color-primary);text-decoration-line:underline}.feedback{margin:1.5px 3px 0 5px}\n/*# sourceURL=autofillView.css */\n");const u={toStartDebugging:"To start debugging autofill, use Chrome's autofill menu to fill an address form.",value:"Value",predictedAutofillValue:"Predicted autofill value",formField:"Form field",autocompleteAttribute:"Autocomplete attribute",attr:"attr",inferredByHeuristics:"Inferred by heuristics",heur:"heur",autoShow:"Automatically open this panel",autoShowTooltip:"Open the autofill panel automatically when an autofill activity is detected.",addressPreview:"Address preview",formInspector:"Form inspector",learnMore:"Learn more",sendFeedback:"Send feedback"},g="https://crbug.com/329106326",m=t.i18n.registerUIStrings("panels/autofill/AutofillView.ts",u),p=t.i18n.getLocalizedString.bind(void 0,m);class f extends n.LegacyWrapper.WrappableComponent{static litTagName=d.literal`devtools-autofill-view`;#e=this.attachShadow({mode:"open"});#t=this.#i.bind(this);#l;#s="";#r=[];#a=[];#o=[];constructor(){super(),this.#l=e.Settings.Settings.instance().createSetting("auto-open-autofill-view-on-event",!0)}connectedCallback(){this.#e.adoptedStyleSheets=[o.checkboxStyles,c];const e=l.AutofillManager.AutofillManager.instance(),t=e.getLastFilledAddressForm();t&&({address:this.#s,filledFields:this.#r,matches:this.#a}=t),e.addEventListener("AddressFormFilled",this.#n,this),i.TargetManager.TargetManager.instance().addModelListener(i.ResourceTreeModel.ResourceTreeModel,i.ResourceTreeModel.Events.PrimaryPageChanged,this.#d,this),a.ScheduledRender.scheduleRender(this,this.#t)}#d(){this.#s="",this.#r=[],this.#a=[],this.#o=[],a.ScheduledRender.scheduleRender(this,this.#t)}#n({data:e}){({address:this.#s,filledFields:this.#r,matches:this.#a}=e),this.#o=[],a.ScheduledRender.scheduleRender(this,this.#t)}async#i(){if(!a.ScheduledRender.isScheduledRender(this))throw new Error("AutofillView render was not scheduled");this.#s||this.#r.length?d.render(d.html`
      <main>
        <div class="content-container" jslog=${h.pane("autofill")}>
          <div class="right-to-left" role="region" aria-label=${p(u.addressPreview)}>
            <div class="label-container">
              <label class="checkbox-label" title=${p(u.autoShowTooltip)}>
                <input
                  type="checkbox"
                  ?checked=${this.#l.get()}
                  @change=${this.#h.bind(this)}
                  jslog=${h.toggle(this.#l.name).track({change:!0})}
                >
                <span>${p(u.autoShow)}</span>
              </label>
              <x-link href=${g} class="feedback link" jslog=${h.link("feedback").track({click:!0})}>${p(u.sendFeedback)}</x-link>
            </div>
            ${this.#c()}
          </div>
          ${this.#u()}
        </div>
      </main>
    `,this.#e,{host:this}):d.render(d.html`
        <main>
          <div class="top-right-corner">
            <label class="checkbox-label" title=${p(u.autoShowTooltip)}>
              <input
                type="checkbox"
                ?checked=${this.#l.get()}
                @change=${this.#h.bind(this)}
                jslog=${h.toggle(this.#l.name).track({change:!0})}
              >
              <span>${p(u.autoShow)}</span>
            </label>
            <x-link href=${g} class="feedback link" jslog=${h.link("feedback").track({click:!0})}>${p(u.sendFeedback)}</x-link>
          </div>
          <div class="placeholder-container" jslog=${h.pane("autofill-empty")}>
            <div class="placeholder">
              <div>${p(u.toStartDebugging)}</div>
              <x-link href=${"https://goo.gle/devtools-autofill-panel"} class="link" jslog=${h.link("learn-more").track({click:!0})}>${p(u.learnMore)}</x-link>
            </div>
          </div>
        </main>
      `,this.#e,{host:this})}#h(e){const{checked:t}=e.target;this.#l.set(t)}#c(){if(!this.#s)return d.nothing;const e=(e,t)=>{const i=this.#s.substring(e,t).split("\n"),l=i.map(((e,t)=>t===i.length-1?e:d.html`${e}<br>`)),s=this.#a.some((t=>t.startIndex<=e&&t.endIndex>e));if(!s)return d.html`<span>${l}</span>`;const r=d.Directives.classMap({"matches-filled-field":s,highlighted:this.#o.some((t=>t.startIndex<=e&&t.endIndex>e))});return d.html`
        <span
          class=${r}
          @mouseenter=${()=>this.#g(e)}
          @mouseleave=${this.#m}
          jslog=${h.item("matched-address-item").track({hover:!0})}
        >${l}</span>`},t=[],i=new Set([0,this.#s.length]);for(const e of this.#a)i.add(e.startIndex),i.add(e.endIndex);const l=Array.from(i).sort(((e,t)=>e-t));for(let i=0;i<l.length-1;i++)t.push(e(l[i],l[i+1]));return d.html`
      <div class="address">
        ${t}
      </div>
    `}#g(e){this.#o=this.#a.filter((t=>t.startIndex<=e&&t.endIndex>e)),a.ScheduledRender.scheduleRender(this,this.#t)}#m(){this.#o=[],a.ScheduledRender.scheduleRender(this,this.#t)}#u(){if(!this.#r.length)return d.nothing;const e={columns:[{id:"name",title:p(u.formField),widthWeighting:50,hideable:!1,visible:!0,sortable:!0},{id:"autofill-type",title:p(u.predictedAutofillValue),widthWeighting:50,hideable:!1,visible:!0,sortable:!0},{id:"value",title:p(u.value),widthWeighting:50,hideable:!1,visible:!0,sortable:!0},{id:"filled-field-index",title:"filledFieldIndex",widthWeighting:50,hideable:!0,visible:!1}],rows:this.#p(),striped:!0};return d.html`
      <div class="grid-wrapper" role="region" aria-label=${p(u.formInspector)}>
        <${r.DataGridController.DataGridController.litTagName}
          @rowmouseenter=${this.#f}
          @rowmouseleave=${this.#v}
          class="filled-fields-grid"
          .data=${e}
        >
        </${r.DataGridController.DataGridController.litTagName}>
      </div>
    `}#f(e){const t=e.data.row.cells[3].value;if("number"!=typeof t)return;this.#o=this.#a.filter((e=>e.filledFieldIndex===t)),a.ScheduledRender.scheduleRender(this,this.#t);const l=this.#r[t].fieldId,s=i.FrameManager.FrameManager.instance().getFrame(this.#r[t].frameId)?.resourceTreeModel().target();if(s){const e=new i.DOMModel.DeferredDOMNode(s,l),t=s.model(i.DOMModel.DOMModel);e&&t&&t.overlayModel().highlightInOverlay({deferredNode:e},"all")}}#v(){this.#o=[],a.ScheduledRender.scheduleRender(this,this.#t),i.OverlayModel.OverlayModel.hideDOMNodeHighlight()}#p(){const e=new Set(this.#o.map((e=>e.filledFieldIndex)));return this.#r.map(((t,i)=>({cells:[{columnId:"name",value:`${t.name||`#${t.id}`} (${t.htmlType})`},{columnId:"autofill-type",value:t.autofillType,renderer:()=>this.#b(t.autofillType,t.fillingStrategy)},{columnId:"value",value:`"${t.value}"`},{columnId:"filled-field-index",value:i}],styles:{"font-family":"var(--monospace-font-family)","font-size":"var(--monospace-font-size)",...e.has(i)&&{"background-color":"var(--sys-color-state-hover-on-subtle)"}}})))}#b(e,t){const i=document.createElement("span");let l="";switch(t){case"autocompleteAttribute":i.textContent=p(u.attr),l=p(u.autocompleteAttribute);break;case"autofillInferred":i.textContent=p(u.heur),l=p(u.inferredByHeuristics)}return d.html`
      ${e}
      ${i.textContent?d.html`
          <${s.Adorner.Adorner.litTagName} title=${l} .data=${{name:t,content:i}}>
        `:d.nothing}
    `}}customElements.define("devtools-autofill-view",f);var v=Object.freeze({__proto__:null,i18nString:p,AutofillView:f});export{v as AutofillView};
