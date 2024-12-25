import*as e from"../../core/common/common.js";import*as t from"../../core/i18n/i18n.js";import*as i from"../../core/sdk/sdk.js";import*as l from"../../models/autofill_manager/autofill_manager.js";import*as s from"../../ui/components/adorners/adorners.js";import*as r from"../../ui/components/data_grid/data_grid.js";import*as d from"../../ui/components/helpers/helpers.js";import*as a from"../../ui/components/input/input.js";import*as o from"../../ui/components/legacy_wrapper/legacy_wrapper.js";import*as n from"../../ui/lit-html/lit-html.js";import*as h from"../../ui/visual_logging/visual_logging.js";const c=new CSSStyleSheet;c.replaceSync("main{height:100%}.placeholder-container{height:calc(100% - 29px);display:flex;justify-content:center;align-items:center}.placeholder{font-size:15px}.address{padding:10px;margin-right:auto}.filled-fields-grid{border-top:1px solid var(--sys-color-divider);box-sizing:border-box}.content-container{display:flex;flex-flow:column;height:100%}.grid-wrapper{flex-grow:1}.checkbox-label{display:flex;align-items:center}.right-to-left{display:flex;flex-flow:row-reverse wrap;justify-content:flex-end}.label-container{padding:5px 5px 0}.top-right-corner{display:flex;justify-content:flex-end;padding:5px}.matches-filled-field{background-color:var(--sys-color-tonal-container)}.highlighted{background-color:var(--sys-color-state-focus-select)}\n/*# sourceURL=autofillView.css */\n");const u={noDataAvailable:"No Autofill event detected",value:"Value",predictedAutofillValue:"Predicted autofill value",formField:"Form field",autocompleteAttribute:"Autocomplete attribute",attr:"attr",inferredByHeuristics:"Inferred by heuristics",heur:"heur",autoShow:"Open panel on autofill",addressPreview:"Address preview",formInspector:"Form inspector"},g=t.i18n.registerUIStrings("panels/autofill/AutofillView.ts",u),p=t.i18n.getLocalizedString.bind(void 0,g);class m extends o.LegacyWrapper.WrappableComponent{static litTagName=n.literal`devtools-autofill-view`;#e=this.attachShadow({mode:"open"});#t=this.#i.bind(this);#l;#s="";#r=[];#d=[];#a=[];connectedCallback(){this.#e.adoptedStyleSheets=[a.checkboxStyles,c];const t=l.AutofillManager.AutofillManager.instance(),s=t.getLastFilledAddressForm();s&&({address:this.#s,filledFields:this.#r,matches:this.#d}=s),t.addEventListener("AddressFormFilled",this.#o,this),i.TargetManager.TargetManager.instance().addModelListener(i.ResourceTreeModel.ResourceTreeModel,i.ResourceTreeModel.Events.PrimaryPageChanged,this.#n,this),this.#l=e.Settings.Settings.instance().createSetting("auto-open-autofill-view-on-event",!0),d.ScheduledRender.scheduleRender(this,this.#t)}#n(){this.#s="",this.#r=[],this.#d=[],this.#a=[],d.ScheduledRender.scheduleRender(this,this.#t)}#o({data:e}){({address:this.#s,filledFields:this.#r,matches:this.#d}=e),this.#a=[],d.ScheduledRender.scheduleRender(this,this.#t)}async#i(){if(!d.ScheduledRender.isScheduledRender(this))throw new Error("AutofillView render was not scheduled");this.#s||this.#r.length?n.render(n.html`
      <main>
        <div class="content-container" jslog=${h.pane("autofill")}>
          <div class="right-to-left" role="region" aria-label=${p(u.addressPreview)}>
            <div class="label-container">
              <label class="checkbox-label">
                <input type="checkbox" ?checked=${this.#l?.get()} @change=${this.#h.bind(this)} jslog=${h.toggle("auto-open").track({change:!0})}>
                <span>${p(u.autoShow)}</span>
              </label>
            </div>
            ${this.#c()}
          </div>
          ${this.#u()}
        </div>
      </main>
    `,this.#e,{host:this}):n.render(n.html`
        <main>
          <div class="top-right-corner">
            <label class="checkbox-label">
              <input type="checkbox" ?checked=${this.#l?.get()} @change=${this.#h.bind(this)} jslog=${h.toggle("auto-open").track({change:!0})}>
              <span>${p(u.autoShow)}</span>
            </label>
          </div>
          <div class="placeholder-container" jslog=${h.pane("autofill-empty")}>
            <div class="placeholder">${p(u.noDataAvailable)}</h1>
          </div>
        </main>
      `,this.#e,{host:this})}#h(e){const{checked:t}=e.target;this.#l?.set(t)}#c(){if(!this.#s)return n.nothing;const e=(e,t)=>{const i=this.#s.substring(e,t).split("\n"),l=i.map(((e,t)=>t===i.length-1?e:n.html`${e}<br>`)),s=n.Directives.classMap({"matches-filled-field":this.#d.filter((t=>t.startIndex<=e&&t.endIndex>e)).length>0,highlighted:this.#a.filter((t=>t.startIndex<=e&&t.endIndex>e)).length>0});return n.html`
        <span
          class=${s}
          @mouseenter=${()=>this.#g(e)}
          @mouseleave=${this.#p}
        >${l}</span>`},t=[],i=new Set([0,this.#s.length]);for(const e of this.#d)i.add(e.startIndex),i.add(e.endIndex);const l=Array.from(i).sort(((e,t)=>e-t));for(let i=0;i<l.length-1;i++)t.push(e(l[i],l[i+1]));return n.html`
      <div class="address">
        ${t}
      </div>
    `}#g(e){this.#a=this.#d.filter((t=>t.startIndex<=e&&t.endIndex>e)),d.ScheduledRender.scheduleRender(this,this.#t)}#p(){this.#a=[],d.ScheduledRender.scheduleRender(this,this.#t)}#u(){if(!this.#r.length)return n.nothing;const e={columns:[{id:"name",title:p(u.formField),widthWeighting:50,hideable:!1,visible:!0,sortable:!0},{id:"autofill-type",title:p(u.predictedAutofillValue),widthWeighting:50,hideable:!1,visible:!0,sortable:!0},{id:"value",title:p(u.value),widthWeighting:50,hideable:!1,visible:!0,sortable:!0},{id:"filled-field-index",title:"filledFieldIndex",widthWeighting:50,hideable:!0,visible:!1}],rows:this.#m(),striped:!0};return n.html`
      <div class="grid-wrapper" role="region" aria-label=${p(u.formInspector)}>
        <${r.DataGridController.DataGridController.litTagName}
          @rowmouseenter=${this.#f}
          @rowmouseleave=${this.#v}
          class="filled-fields-grid"
          .data=${e}
        >
        </${r.DataGridController.DataGridController.litTagName}>
      </div>
    `}#f(e){const t=e.data.row.cells[3].value;if("number"!=typeof t)return;this.#a=this.#d.filter((e=>e.filledFieldIndex===t)),d.ScheduledRender.scheduleRender(this,this.#t);const l=this.#r[t].fieldId,s=i.FrameManager.FrameManager.instance().getFrame(this.#r[t].frameId)?.resourceTreeModel().target();if(s){const e=new i.DOMModel.DeferredDOMNode(s,l),t=s.model(i.DOMModel.DOMModel);e&&t&&t.overlayModel().highlightInOverlay({deferredNode:e},"all")}}#v(){this.#a=[],d.ScheduledRender.scheduleRender(this,this.#t),i.OverlayModel.OverlayModel.hideDOMNodeHighlight()}#m(){const e=new Set(this.#a.map((e=>e.filledFieldIndex)));return this.#r.map(((t,i)=>({cells:[{columnId:"name",value:`${t.name||`#${t.id}`} (${t.htmlType})`},{columnId:"autofill-type",value:t.autofillType,renderer:()=>this.#b(t.autofillType,t.fillingStrategy)},{columnId:"value",value:`"${t.value}"`},{columnId:"filled-field-index",value:i}],styles:{"font-family":"var(--monospace-font-family)","font-size":"var(--monospace-font-size)",...e.has(i)&&{"background-color":"var(--sys-color-state-hover-on-subtle)"}}})))}#b(e,t){const i=document.createElement("span");let l="";switch(t){case"autocompleteAttribute":i.textContent=p(u.attr),l=p(u.autocompleteAttribute);break;case"autofillInferred":i.textContent=p(u.heur),l=p(u.inferredByHeuristics)}return n.html`
      ${e}
      ${i.textContent?n.html`
          <${s.Adorner.Adorner.litTagName} title=${l} .data=${{name:t,content:i}}>
        `:n.nothing}
    `}}customElements.define("devtools-autofill-view",m);var f=Object.freeze({__proto__:null,i18nString:p,AutofillView:m});export{f as AutofillView};
