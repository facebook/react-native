import"../../ui/components/icon_button/icon_button.js";import"../../ui/components/menus/menus.js";import*as e from"../../core/common/common.js";import*as t from"../../core/host/host.js";import*as o from"../../core/i18n/i18n.js";import*as r from"../../core/sdk/sdk.js";import"../../ui/components/buttons/buttons.js";import*as a from"../../ui/components/suggestion_input/suggestion_input.js";import*as s from"../../ui/legacy/legacy.js";import*as n from"../../ui/lit/lit.js";import{Directives as i,render as l,html as d}from"../../ui/lit/lit.js";import*as c from"../../ui/visual_logging/visual_logging.js";import*as p from"../elements/components/components.js";import"../../ui/legacy/components/data_grid/data_grid.js";import*as m from"../../core/platform/platform.js";import*as u from"../../core/protocol_client/protocol_client.js";import*as h from"../../models/bindings/bindings.js";import*as g from"../../models/text_utils/text_utils.js";import*as b from"../../ui/legacy/components/source_frame/source_frame.js";var v={cssText:`*{box-sizing:border-box;padding:0;margin:0;font-size:inherit}:host{display:flex;flex-direction:column;height:100%}.target-selector{max-width:var(--sys-size-21)}.warning-icon{margin-left:-18px;margin-right:4px}.row{flex-wrap:wrap}.row,\n.row-icons{display:flex;flex-direction:row;color:var(--sys-color-token-property-special);font-family:var(--monospace-font-family);font-size:var(--monospace-font-size);align-items:center;line-height:18px;margin-top:3px}.separator{margin-right:0.5em;color:var(--sys-color-on-surface)}ul{padding-left:2em}.optional-parameter{color:var(--sys-color-token-attribute-value);--override-color-recorder-input:var(--sys-color-on-surface)}.undefined-parameter{color:var(--sys-color-state-disabled)}.wrapper{padding-left:1em;overflow-x:hidden;height:100%;width:100%;padding-bottom:50px;padding-top:0.5em}.clear-button,\n.add-button,\n.delete-button{opacity:0%;transition:opacity 0.3s ease-in-out}.clear-button,\n.delete-button{margin-left:5px}.row:focus-within .delete-button,\n.row:focus-within .add-button,\n.row:focus-within .clear-button,\n.row:hover .delete-button,\n.row:hover .add-button,\n.row:hover .clear-button{opacity:100%}.protocol-monitor-sidebar-toolbar{border-top:1px solid var(--sys-color-divider)}\n/*# sourceURL=${import.meta.resolve("./JSONEditor.css")} */\n`};const{html:y,render:f,Directives:x,nothing:w}=n,{live:k,classMap:$,repeat:C}=x,T={deleteParameter:"Delete parameter",addParameter:"Add a parameter",resetDefaultValue:"Reset to default value",addCustomProperty:"Add custom property",sendCommandCtrlEnter:"Send command - Ctrl+Enter",sendCommandCmdEnter:"Send command - ⌘+Enter",copyCommand:"Copy command",selectTarget:"Select a target"},P=o.i18n.registerUIStrings("panels/protocol_monitor/JSONEditor.ts",T),j=o.i18n.getLocalizedString.bind(void 0,P),S=new Map([["string",""],["number",0],["boolean",!1]]),I="dummy",M="<empty_string>";function N(e,t){return e.toLowerCase().includes(t.toLowerCase())}class z extends(e.ObjectWrapper.eventMixin(s.Widget.VBox)){#e=new Map;#t=new Map;#o=new Map;#r=[];#a=[];#s="";#n;#i;constructor(e){super(!0,void 0,e),this.registerRequiredCSS(v),this.element.setAttribute("jslog",`${c.pane("command-editor").track({resize:!0})}`),this.contentElement.addEventListener("keydown",(e=>{"Enter"===e.key&&(e.ctrlKey||e.metaKey)&&(this.#l(e),this.#d())}))}get metadataByCommand(){return this.#e}set metadataByCommand(e){this.#e=e,this.requestUpdate()}get typesByName(){return this.#t}set typesByName(e){this.#t=e,this.requestUpdate()}get enumsByName(){return this.#o}set enumsByName(e){this.#o=e,this.requestUpdate()}get parameters(){return this.#r}set parameters(e){this.#r=e,this.requestUpdate()}get targets(){return this.#a}set targets(e){this.#a=e,this.requestUpdate()}get command(){return this.#s}set command(e){this.#s!==e&&(this.#s=e,this.requestUpdate())}get targetId(){return this.#n}set targetId(e){this.#n!==e&&(this.#n=e,this.requestUpdate())}wasShown(){super.wasShown(),this.#i=new s.PopoverHelper.PopoverHelper(this.contentElement,(e=>this.#c(e)),"protocol-monitor.hint"),this.#i.setDisableOnClick(!0),this.#i.setTimeout(300);r.TargetManager.TargetManager.instance().addEventListener("AvailableTargetsChanged",this.#p,this),this.#p(),this.requestUpdate()}willHide(){super.willHide(),this.#i?.hidePopover(),this.#i?.dispose();r.TargetManager.TargetManager.instance().removeEventListener("AvailableTargetsChanged",this.#p,this)}#p(){this.targets=r.TargetManager.TargetManager.instance().targets(),this.targets.length&&void 0===this.targetId&&(this.targetId=this.targets[0].id())}getParameters(){const e=t=>{if(void 0!==t.value)switch(t.type){case"number":return Number(t.value);case"boolean":return Boolean(t.value);case"object":{const o={};for(const r of t.value){void 0!==e(r)&&(o[r.name]=e(r))}if(0===Object.keys(o).length)return;return o}case"array":{const o=[];for(const r of t.value)o.push(e(r));return 0===o.length?[]:o}default:return t.value}},t={};for(const o of this.parameters)t[o.name]=e(o);return e({type:"object",name:I,optional:!0,value:this.parameters,description:""})}displayCommand(e,t,o){this.targetId=o,this.command=e;const r=this.metadataByCommand.get(this.command);if(!r?.parameters)return;this.populateParametersForCommandWithDefaultValues();const a=this.#m("",t,{typeRef:I,type:"object",name:"",description:"",optional:!0,value:[]},r.parameters).value,s=new Map(this.parameters.map((e=>[e.name,e])));for(const e of a){const t=s.get(e.name);t&&(t.value=e.value)}this.requestUpdate()}#m(e,t,o,r){const a=o?.type||typeof t,s=o?.description??"",n=o?.optional??!0;switch(a){case"string":case"boolean":case"number":return this.#u(e,t,o);case"object":return this.#h(e,t,o,r);case"array":return this.#g(e,t,o)}return{type:a,name:e,optional:n,typeRef:o?.typeRef,value:t,description:s}}#u(e,t,o){const r=o?.type||typeof t,a=o?.description??"";return{type:r,name:e,optional:o?.optional??!0,typeRef:o?.typeRef,value:t,description:a,isCorrectType:!o||this.#b(o,String(t))}}#h(e,t,o,r){const a=o?.description??"";if("object"!=typeof t||null===t)throw new Error("The value is not an object");const s=o?.typeRef;if(!s)throw new Error("Every object parameters should have a type ref");const n=s===I?r:this.typesByName.get(s);if(!n)throw new Error("No nested type for keys were found");const i=[];for(const e of Object.keys(t)){const o=n.find((t=>t.name===e));i.push(this.#m(e,t[e],o))}return{type:"object",name:e,optional:o.optional,typeRef:o.typeRef,value:i,description:a,isCorrectType:!0}}#g(e,t,o){const r=o?.description??"",a=o?.optional??!0,s=o?.typeRef;if(!s)throw new Error("Every array parameters should have a type ref");if(!Array.isArray(t))throw new Error("The value is not an array");const n=this.#v(s)?void 0:{optional:!0,type:"object",value:[],typeRef:s,description:"",name:""},i=[];for(let e=0;e<t.length;e++){const o=this.#m(`${e}`,t[e],n);i.push(o)}return{type:"array",name:e,optional:a,typeRef:o?.typeRef,value:i,description:r,isCorrectType:!0}}#c(e){const t=e.composedPath()[0],o=this.#y(t);if(!o?.description)return null;const[r,a]=(e=>{if(e.length>150){const[t,o]=e.split(".");return[t,o]}return[e,""]})(o.description),s=o.type,n=o.replyArgs;let i="";return i=n&&n.length>0?a+`Returns: ${n}<br>`:s?a+`<br>Type: ${s}<br>`:a,{box:t.boxInWindow(),show:async e=>{const t=new p.CSSHintDetailsView.CSSHintDetailsView({getMessage:()=>`<span>${r}</span>`,getPossibleFixMessage:()=>i,getLearnMoreLink:()=>`https://chromedevtools.github.io/devtools-protocol/tot/${this.command.split(".")[0]}/`});return e.contentElement.appendChild(t),!0}}}#y(e){if(e.matches(".command")){const e=this.metadataByCommand.get(this.command);if(e)return{description:e.description,replyArgs:e.replyArgs}}if(e.matches(".parameter")){const t=e.dataset.paramid;if(!t)return;const o=t.split("."),{parameter:r}=this.#f(o);if(!r.description)return;return{description:r.description,type:r.type}}}getCommandJson(){return""!==this.command?JSON.stringify({command:this.command,parameters:this.getParameters()}):""}#x(){const e=this.getCommandJson();t.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(e)}#d(){this.dispatchEventToListeners("submiteditor",{command:this.command,parameters:this.getParameters(),targetId:this.targetId})}populateParametersForCommandWithDefaultValues(){const e=this.metadataByCommand.get(this.command)?.parameters;e&&(this.parameters=e.map((e=>this.#w(e))))}#w(e){if("object"===e.type){let t=e.typeRef;t||(t=I);const o=(this.typesByName.get(t)??[]).map((e=>this.#w(e)));return{...e,value:e.optional?void 0:o,isCorrectType:!0}}return"array"===e.type?{...e,value:e?.optional?void 0:e.value?.map((e=>this.#w(e)))||[],isCorrectType:!0}:{...e,value:e.optional?void 0:S.get(e.type),isCorrectType:!0}}#f(e){let t,o=this.parameters;for(let r=0;r<e.length;r++){const a=e[r],s=o.find((e=>e.name===a));if(r===e.length-1)return{parameter:s,parentParameter:t};if("array"!==s?.type&&"object"!==s?.type)throw new Error("Parameter on the path in not an object or an array");s.value&&(o=s.value),t=s}throw new Error("Not found")}#b(e,t){if("number"===e.type&&isNaN(Number(t)))return!1;const o=this.#k(e);return!(0!==o.length&&!o.includes(t))}#$=e=>{if(!(e.target instanceof a.SuggestionInput.SuggestionInput))return;let t;if(e instanceof KeyboardEvent){const o=e.target.renderRoot.querySelector("devtools-editable-content");if(!o)return;t=o.innerText}else t=e.target.value;const o=e.target.getAttribute("data-paramid");if(!o)return;const r=o.split("."),s=this.#f(r).parameter;""===t?s.value=S.get(s.type):(s.value=t,s.isCorrectType=this.#b(s,t)),this.requestUpdate()};#C=e=>{if(!(e.target instanceof a.SuggestionInput.SuggestionInput))return;const t=e.target.value,o=e.target.getAttribute("data-paramid");if(!o)return;const r=o.split("."),{parameter:s}=this.#f(r);s.name=t,this.requestUpdate()};#l=e=>{e.target instanceof a.SuggestionInput.SuggestionInput&&"Enter"===e.key&&(e.ctrlKey||e.metaKey)&&this.#$(e)};#T(e){if(!(e.target instanceof a.SuggestionInput.SuggestionInput))return;const t=e.target.getAttribute("data-paramid");if(!t)return;const o=t.split(".");this.#f(o).parameter.isCorrectType=!0,this.requestUpdate()}#P=async e=>{e.target instanceof a.SuggestionInput.SuggestionInput&&(this.command=e.target.value),this.populateParametersForCommandWithDefaultValues()};#v(e){return"string"===e||"boolean"===e||"number"===e}#j(e,t){if("object"===e.type){let o=e.typeRef;o||(o=I);const r=(this.typesByName.get(o)??[]).map((e=>this.#j(e,e.name)));return{type:"object",name:t,optional:e.optional,typeRef:o,value:r,isCorrectType:!0,description:e.description}}return{type:e.type,name:t,optional:e.optional,isCorrectType:!0,typeRef:e.typeRef,value:e.optional?void 0:S.get(e.type),description:e.description}}#S(e){const t=e.split("."),{parameter:o,parentParameter:r}=this.#f(t);if(o){switch(o.type){case"array":{const e=o.typeRef;if(!e)throw new Error("Every array parameter must have a typeRef");const t=this.typesByName.get(e)??[],r=t.map((e=>this.#j(e,e.name)));let a=this.#v(e)?e:"object";0===t.length&&this.enumsByName.get(e)&&(a="string"),o.value||(o.value=[]),o.value.push({type:a,name:String(o.value.length),optional:!0,typeRef:e,value:0!==r.length?r:"",description:"",isCorrectType:!0});break}case"object":{let e=o.typeRef;if(e||(e=I),o.value||(o.value=[]),!this.typesByName.get(e)){o.value.push({type:"string",name:"",optional:!0,value:"",isCorrectType:!0,description:"",isKeyEditable:!0});break}const t=this.typesByName.get(e)??[],a=t.map((e=>this.#j(e,e.name))),s=t.map((e=>this.#w(e)));r?o.value.push({type:"object",name:"",optional:!0,typeRef:e,value:a,isCorrectType:!0,description:""}):o.value=s;break}default:o.value=S.get(o.type)}this.requestUpdate()}}#I(e,t){if(void 0!==e?.value){switch(e.type){case"object":if(e.optional&&!t){e.value=void 0;break}e.typeRef&&this.typesByName.get(e.typeRef)?e.value.forEach((e=>this.#I(e,t))):e.value=[];break;case"array":e.value=e.optional?void 0:[];break;default:e.value=e.optional?void 0:S.get(e.type),e.isCorrectType=!0}this.requestUpdate()}}#M(e,t){if(e&&Array.isArray(t.value)){if(t.value.splice(t.value.findIndex((t=>t===e)),1),"array"===t.type)for(let e=0;e<t.value.length;e++)t.value[e].name=String(e);this.requestUpdate()}}#N(){return y`
    <div class="row attribute padded">
      <div>target<span class="separator">:</span></div>
      <select class="target-selector"
              title=${j(T.selectTarget)}
              jslog=${c.dropDown("target-selector").track({change:!0})}
              @change=${this.#z}>
        ${this.targets.map((e=>y`
          <option jslog=${c.item("target").track({click:!0})}
                  value=${e.id()} ?selected=${e.id()===this.targetId}>
            ${e.name()} (${e.inspectedURL()})
          </option>`))}
      </select>
    </div>
  `}#z(e){e.target instanceof HTMLSelectElement&&(this.targetId=e.target.value),this.requestUpdate()}#k(e){if("string"===e.type){const t=this.enumsByName.get(`${e.typeRef}`)??{};return Object.values(t)}return"boolean"===e.type?["true","false"]:[]}#B(e){return y`
          <devtools-button
            title=${e.title}
            .size=${"SMALL"}
            .iconName=${e.iconName}
            .variant=${"icon"}
            class=${$(e.classMap)}
            @click=${e.onClick}
            .jslogContext=${e.jslogContext}
          ></devtools-button>
        `}#R(){return y`<devtools-icon
    .data=${{iconName:"warning-filled",color:"var(--icon-warning)",width:"14px",height:"14px"}}
    class=${$({"warning-icon":!0})}
  >
  </devtools-icon>`}#E(e,t,o,r){return e.sort(((e,t)=>Number(e.optional)-Number(t.optional))),y`
      <ul>
        ${C(e,(e=>{const a=o?`${r}.${e.name}`:e.name,s="array"===e.type||"object"===e.type?e.value??[]:[],n=e=>{this.#$(e)},i=e=>{this.#l(e)},l=e=>{this.#T(e)},d=this.#v(e.type),c="array"===e.type,p=o&&"array"===o.type,m=o&&"object"===o.type,u="object"===e.type,h=void 0===e.value,g=e.optional,b=u&&e.typeRef&&void 0!==this.typesByName.get(e.typeRef),v=e.isKeyEditable,f=u&&!b,x="string"===e.type||"boolean"===e.type,C=c&&!h&&0!==e.value?.length||u&&!h,P={"optional-parameter":e.optional,parameter:!0,"undefined-parameter":void 0===e.value&&e.optional};return y`
                <li class="row">
                  <div class="row-icons">
                      ${e.isCorrectType?w:y`${this.#R()}`}

                      <!-- If an object parameter has no predefined keys, show an input to enter the key, otherwise show the name of the parameter -->
                      <div class=${$(P)} data-paramId=${a}>
                          ${v?y`<devtools-suggestion-input
                              data-paramId=${a}
                              isKey=${!0}
                              .isCorrectInput=${k(e.isCorrectType)}
                              .options=${x?this.#k(e):[]}
                              .autocomplete=${!1}
                              .value=${k(e.name??"")}
                              .placeholder=${""===e.value?M:`<${S.get(e.type)}>`}
                              @blur=${e=>{this.#C(e)}}
                              @focus=${l}
                              @keydown=${i}
                            ></devtools-suggestion-input>`:y`${e.name}`} <span class="separator">:</span>
                      </div>

                      <!-- Render button to add values inside an array parameter -->
                      ${c?y`
                        ${this.#B({title:j(T.addParameter),iconName:"plus",onClick:()=>this.#S(a),classMap:{"add-button":!0},jslogContext:"protocol-monitor.add-parameter"})}
                      `:w}

                      <!-- Render button to complete reset an array parameter or an object parameter-->
                      ${C?this.#B({title:j(T.resetDefaultValue),iconName:"clear",onClick:()=>this.#I(e,p),classMap:{"clear-button":!0},jslogContext:"protocol-monitor.reset-to-default-value"}):w}

                      <!-- Render the buttons to change the value from undefined to empty string for optional primitive parameters -->
                      ${d&&!p&&g&&h?y`  ${this.#B({title:j(T.addParameter),iconName:"plus",onClick:()=>this.#S(a),classMap:{"add-button":!0},jslogContext:"protocol-monitor.add-parameter"})}`:w}

                      <!-- Render the buttons to change the value from undefined to populate the values inside object with their default values -->
                      ${u&&g&&h&&b?y`  ${this.#B({title:j(T.addParameter),iconName:"plus",onClick:()=>this.#S(a),classMap:{"add-button":!0},jslogContext:"protocol-monitor.add-parameter"})}`:w}
                  </div>

                  <div class="row-icons">
                      <!-- If an object has no predefined keys, show an input to enter the value, and a delete icon to delete the whole key/value pair -->
                      ${v&&m?y`
                      <!-- @ts-ignore -->
                      <devtools-suggestion-input
                          data-paramId=${a}
                          .isCorrectInput=${k(e.isCorrectType)}
                          .options=${x?this.#k(e):[]}
                          .autocomplete=${!1}
                          .value=${k(e.value??"")}
                          .placeholder=${""===e.value?M:`<${S.get(e.type)}>`}
                          .jslogContext=${"parameter-value"}
                          @blur=${n}
                          @focus=${l}
                          @keydown=${i}
                        ></devtools-suggestion-input>

                        ${this.#B({title:j(T.deleteParameter),iconName:"bin",onClick:()=>this.#M(e,o),classMap:{deleteButton:!0,deleteIcon:!0},jslogContext:"protocol-monitor.delete-parameter"})}`:w}

                    <!-- In case  the parameter is not optional or its value is not undefined render the input -->
                    ${!d||v||h&&g||p?w:y`
                        <!-- @ts-ignore -->
                        <devtools-suggestion-input
                          data-paramId=${a}
                          .strikethrough=${k(e.isCorrectType)}
                          .options=${x?this.#k(e):[]}
                          .autocomplete=${!1}
                          .value=${k(e.value??"")}
                          .placeholder=${""===e.value?M:`<${S.get(e.type)}>`}
                          .jslogContext=${"parameter-value"}
                          @blur=${n}
                          @focus=${l}
                          @keydown=${i}
                        ></devtools-suggestion-input>`}

                    <!-- Render the buttons to change the value from empty string to undefined for optional primitive parameters -->
                    ${!d||v||p||!g||h?w:y`  ${this.#B({title:j(T.resetDefaultValue),iconName:"clear",onClick:()=>this.#I(e),classMap:{"clear-button":!0},jslogContext:"protocol-monitor.reset-to-default-value"})}`}

                    <!-- If the parameter is an object with no predefined keys, renders a button to add key/value pairs to it's value -->
                    ${f?y`
                      ${this.#B({title:j(T.addCustomProperty),iconName:"plus",onClick:()=>this.#S(a),classMap:{"add-button":!0},jslogContext:"protocol-monitor.add-custom-property"})}
                    `:w}

                    <!-- In case the parameter is nested inside an array we render the input field as well as a delete button -->
                    ${p?y`
                    <!-- If the parameter is an object we don't want to display the input field we just want the delete button-->
                    ${u?w:y`
                    <!-- @ts-ignore -->
                    <devtools-suggestion-input
                      data-paramId=${a}
                      .options=${x?this.#k(e):[]}
                      .autocomplete=${!1}
                      .value=${k(e.value??"")}
                      .placeholder=${""===e.value?M:`<${S.get(e.type)}>`}
                      .jslogContext=${"parameter"}
                      @blur=${n}
                      @keydown=${i}
                      class=${$({"json-input":!0})}
                    ></devtools-suggestion-input>`}

                    ${this.#B({title:j(T.deleteParameter),iconName:"bin",onClick:()=>this.#M(e,o),classMap:{"delete-button":!0},jslogContext:"protocol-monitor.delete-parameter"})}`:w}
                  </div>
                </li>
                ${this.#E(s,t,e,a)}
              `}))}
      </ul>
    `}performUpdate(){f(y`
    <div class="wrapper">
      ${this.#N()}
      <div class="row attribute padded">
        <div class="command">command<span class="separator">:</span></div>
        <devtools-suggestion-input
          .options=${[...this.metadataByCommand.keys()]}
          .value=${this.command}
          .placeholder=${"Enter your command..."}
          .suggestionFilter=${N}
          .jslogContext=${"command"}
          @blur=${this.#P}
          class=${$({"json-input":!0})}
        ></devtools-suggestion-input>
      </div>
      ${this.parameters.length?y`
      <div class="row attribute padded">
        <div>parameters<span class="separator">:</span></div>
      </div>
        ${this.#E(this.parameters)}
      `:w}
    </div>
    <devtools-toolbar class="protocol-monitor-sidebar-toolbar">
      <devtools-button title=${j(T.copyCommand)}
                       .iconName=${"copy"}
                       .jslogContext=${"protocol-monitor.copy-command"}
                       .variant=${"toolbar"}
                       @click=${this.#x}></devtools-button>
        <div class=toolbar-spacer></div>
      <devtools-button title=${t.Platform.isMac()?j(T.sendCommandCmdEnter):j(T.sendCommandCtrlEnter)}
                       .iconName=${"send"}
                       jslogContext=${"protocol-monitor.send-command"}
                       .variant=${"primary_toolbar"}
                       @click=${this.#d}></devtools-button>
    </devtools-toolbar>`,this.contentElement,{host:this})}}var B=Object.freeze({__proto__:null,JSONEditor:z,suggestionFilter:N}),R=`*{box-sizing:border-box;min-width:0;min-height:0}:root{height:100%;overflow:hidden;interpolate-size:allow-keywords}body{height:100%;width:100%;position:relative;overflow:hidden;margin:0;cursor:default;font-family:var(--default-font-family);font-size:12px;tab-size:4;user-select:none;color:var(--sys-color-on-surface);background:var(--sys-color-cdt-base-container)}:focus{outline-width:0}.monospace{font-family:var(--monospace-font-family);font-size:var(\n    --monospace-font-size\n  )!important}.source-code{font-family:var(--source-code-font-family);font-size:var(\n    --source-code-font-size\n  )!important;white-space:pre-wrap;&:not(input)::selection{color:var(--sys-color-on-surface)}}.source-code.breakpoint{white-space:nowrap}.source-code .devtools-link.text-button{max-width:100%;overflow:hidden;text-overflow:ellipsis}img{-webkit-user-drag:none}iframe,\na img{border:none}.fill{position:absolute;inset:0}iframe.fill{width:100%;height:100%}.widget{position:relative;flex:auto;contain:style}.hbox{display:flex;flex-direction:row!important;position:relative}.vbox{display:flex;flex-direction:column!important;position:relative}.view-container > devtools-toolbar{border-bottom:1px solid var(--sys-color-divider)}.flex-auto{flex:auto}.flex-none{flex:none}.flex-centered{display:flex;align-items:center;justify-content:center}.overflow-auto{overflow:auto;background-color:var(--sys-color-cdt-base-container)}iframe.widget{position:absolute;width:100%;height:100%;inset:0}.hidden{display:none!important}.highlighted-search-result{border-radius:1px;background-color:var(--sys-color-yellow-container);outline:1px solid var(--sys-color-yellow-container)}.link{cursor:pointer;text-decoration:underline;color:var(--sys-color-primary);outline-offset:2px}button,\ninput,\nselect{font-family:inherit;font-size:inherit}select option,\nselect optgroup,\ninput{background-color:var(--sys-color-cdt-base-container)}input{color:inherit;&[type="checkbox"]{position:relative;outline:none;display:flex;align-items:center;justify-content:center;&:hover::after,\n    &:active::before{content:"";height:24px;width:24px;border-radius:var(--sys-shape-corner-full);position:absolute}&:not(.-theme-preserve){accent-color:var(--sys-color-primary-bright);color:var(--sys-color-on-primary)}&:not(:disabled):hover::after{background-color:var(--sys-color-state-hover-on-subtle)}&:not(:disabled):active::before{background-color:var(--sys-color-state-ripple-neutral-on-subtle)}&:not(:disabled):focus-visible::before{content:"";height:15px;width:15px;border-radius:5px;position:absolute;border:2px solid var(--sys-color-state-focus-ring)}&.small:hover::after,\n    &.small:active::before{height:12px;width:12px;border-radius:2px}}}input::placeholder{--override-input-placeholder-color:rgb(0 0 0/54%);color:var(--override-input-placeholder-color)}.theme-with-dark-background input::placeholder,\n:host-context(.theme-with-dark-background) input::placeholder{--override-input-placeholder-color:rgb(230 230 230/54%)}.harmony-input:not([type]),\n.harmony-input[type="number"],\n.harmony-input[type="text"]{padding:3px 6px;height:24px;border:1px solid var(--sys-color-neutral-outline);border-radius:4px;&.error-input,\n  &:invalid{border-color:var(--sys-color-error)}&:not(.error-input, :invalid):focus{border-color:var(--sys-color-state-focus-ring)}&:not(.error-input, :invalid):hover:not(:focus){background:var(--sys-color-state-hover-on-subtle)}}input[type="radio"]{height:17px;width:17px;min-width:17px;border-radius:8px;vertical-align:sub;margin:0 5px 5px 0;accent-color:var(--sys-color-primary-bright);color:var(--sys-color-on-primary);&:focus{box-shadow:var(--legacy-focus-ring-active-shadow)}}@media (forced-colors: active){input[type="radio"]{--gradient-start:ButtonFace;--gradient-end:ButtonFace;&:checked{--gradient-start:Highlight;--gradient-end:Highlight}}}input[type="range"]{appearance:none;margin:0;padding:0;height:10px;width:88px;outline:none;background:none}input[type="range"]::-webkit-slider-thumb,\n.-theme-preserve{appearance:none;margin:0;padding:0;border:0;width:12px;height:12px;margin-top:-5px;border-radius:50%;background-color:var(--sys-color-primary)}input[type="range"]::-webkit-slider-runnable-track{appearance:none;margin:0;padding:0;width:100%;height:2px;background-color:var(--sys-color-surface-variant)}input[type="range"]:focus::-webkit-slider-thumb{box-shadow:0 0 0 2px var(--sys-color-inverse-primary)}input[type="range"]:disabled::-webkit-slider-thumb{background-color:var(--sys-color-state-disabled)}@media (forced-colors: active){input[type="range"]{forced-color-adjust:none}}.highlighted-search-result.current-search-result{--override-current-search-result-background-color:rgb(255 127 0/80%);border-radius:1px;padding:1px;margin:-1px;background-color:var(--override-current-search-result-background-color)}.dimmed{opacity:60%}.editing{box-shadow:var(--drop-shadow);background-color:var(--sys-color-cdt-base-container);text-overflow:clip!important;padding-left:2px;margin-left:-2px;padding-right:2px;margin-right:-2px;margin-bottom:-1px;padding-bottom:1px;opacity:100%!important}.editing,\n.editing *{color:var(\n    --sys-color-on-surface\n  )!important;text-decoration:none!important}select{appearance:none;user-select:none;height:var(--sys-size-11);border:var(--sys-size-1) solid var(--sys-color-neutral-outline);border-radius:var(--sys-shape-corner-extra-small);color:var(--sys-color-on-surface);font:inherit;margin:0;outline:none;padding:0 var(--sys-size-9) 0 var(--sys-size-5);background-image:var(--combobox-dropdown-arrow);background-color:transparent;background-position:right center;background-repeat:no-repeat;&:disabled{opacity:100%;border-color:transparent;color:var(--sys-color-state-disabled);background-color:var(--sys-color-state-disabled-container);pointer-events:none}&:enabled{&:hover{background-color:var(--sys-color-state-hover-on-subtle)}&:active{background-color:var(--sys-color-state-ripple-neutral-on-subtle)}&:hover:active{background:var(--combobox-dropdown-arrow),linear-gradient(var(--sys-color-state-hover-on-subtle),var(--sys-color-state-hover-on-subtle)),linear-gradient(var(--sys-color-state-ripple-neutral-on-subtle),var(--sys-color-state-ripple-neutral-on-subtle));background-position:right center;background-repeat:no-repeat}&:focus{outline:var(--sys-size-2) solid var(--sys-color-state-focus-ring);outline-offset:-1px}}}@media (forced-colors: active) and (prefers-color-scheme: light){:root,\n  .theme-with-dark-background,\n  :host-context(.theme-with-dark-background){--combobox-dropdown-arrow:var(--image-file-arrow-drop-down-light)}}@media (forced-colors: active) and (prefers-color-scheme: dark){:root,\n  .theme-with-dark-background,\n  :host-context(.theme-with-dark-background){--combobox-dropdown-arrow:var(--image-file-arrow-drop-down-dark)}}.chrome-select-label{margin:0 var(--sys-size-10);flex:none;p p{margin-top:0;color:var(--sys-color-token-subtle)}.reload-warning{margin-left:var(--sys-size-5)}}.settings-select{margin:0}select optgroup,\nselect option{background-color:var(--sys-color-cdt-base-container);color:var(--sys-color-on-surface)}.gray-info-message{text-align:center;font-style:italic;padding:6px;color:var(--sys-color-token-subtle);white-space:nowrap}.empty-state{margin:var(--sys-size-5);display:flex;flex-grow:1;justify-content:center;align-items:center;flex-direction:column;text-align:center;min-height:fit-content;min-width:fit-content;> *{max-width:var(--sys-size-29)}.empty-state-header{font:var(--sys-typescale-headline5);margin-bottom:var(--sys-size-3)}.empty-state-description{font:var(--sys-typescale-body4-regular);color:var(--sys-color-on-surface-subtle);> x-link{white-space:nowrap;margin-left:var(--sys-size-3)}}> devtools-button{margin-top:var(--sys-size-7)}}dt-icon-label{flex:none}.full-widget-dimmed-banner a{color:inherit}.full-widget-dimmed-banner{color:var(--sys-color-token-subtle);background-color:var(--sys-color-cdt-base-container);display:flex;justify-content:center;align-items:center;text-align:center;padding:20px;position:absolute;inset:0;font-size:13px;overflow:auto;z-index:500}.dot::before{content:var(--image-file-empty);width:6px;height:6px;border-radius:50%;outline:1px solid var(--icon-gap-default);left:9px;position:absolute;top:9px;z-index:1}.green::before{background-color:var(--sys-color-green-bright)}.purple::before{background-color:var(--sys-color-purple-bright)}.expandable-inline-button{background-color:var(--sys-color-cdt-base-container);color:var(--sys-color-on-surface);cursor:pointer;border-radius:3px}.undisplayable-text,\n.expandable-inline-button{border:none;padding:1px 3px;margin:0 2px;font-size:11px;font-family:sans-serif;white-space:nowrap;display:inline-block}.undisplayable-text::after,\n.expandable-inline-button::after{content:attr(data-text)}.undisplayable-text{color:var(--sys-color-state-disabled);font-style:italic}.expandable-inline-button:hover,\n.expandable-inline-button:focus-visible{background-color:var(--sys-color-state-hover-on-subtle)}.expandable-inline-button:focus-visible{background-color:var(--sys-color-state-focus-highlight)}::selection{background-color:var(--sys-color-state-text-highlight);color:var(--sys-color-state-on-text-highlight)}button.link{border:none;background:none;padding:3px}button.link:focus-visible{outline:2px solid var(--sys-color-state-focus-ring);outline-offset:2px;border-radius:var(--sys-shape-corner-full)}.data-grid-data-grid-node button.link:focus-visible{border-radius:var(--sys-shape-corner-extra-small);padding:0;margin-top:3px}@media (forced-colors: active){.dimmed,\n  select:disabled{opacity:100%}.harmony-input:not([type]),\n  .harmony-input[type="number"],\n  .harmony-input[type="text"]{border:1px solid ButtonText}.harmony-input:not([type]):focus,\n  .harmony-input[type="number"]:focus,\n  .harmony-input[type="text"]:focus{border:1px solid Highlight}}input.custom-search-input::-webkit-search-cancel-button{appearance:none;width:16px;height:15px;margin-right:0;opacity:70%;mask-image:var(--image-file-cross-circle-filled);mask-position:center;mask-repeat:no-repeat;mask-size:99%;background-color:var(--icon-default)}input.custom-search-input::-webkit-search-cancel-button:hover{opacity:99%}.spinner::before{display:block;width:var(--dimension,24px);height:var(--dimension,24px);border:var(--override-spinner-size,3px) solid var(--override-spinner-color,var(--sys-color-token-subtle));border-radius:12px;clip:rect(0,var(--clip-size,15px),var(--clip-size,15px),0);content:"";position:absolute;animation:spinner-animation 1s linear infinite;box-sizing:border-box}@keyframes spinner-animation{from{transform:rotate(0)}to{transform:rotate(360deg)}}.adorner-container{display:inline-flex;vertical-align:middle}.adorner-container.hidden{display:none}.adorner-container devtools-adorner{margin-left:3px}:host-context(.theme-with-dark-background) devtools-adorner{--override-adorner-border-color:var(--sys-color-tonal-outline);--override-adorner-active-background-color:var(\n    --sys-color-state-riple-neutral-on-subtle\n  )}.panel{display:flex;overflow:hidden;position:absolute;inset:0;z-index:0;background-color:var(--sys-color-cdt-base-container)}.panel-sidebar{overflow-x:hidden;background-color:var(--sys-color-cdt-base-container)}iframe.extension{flex:auto;width:100%;height:100%}iframe.panel.extension{display:block;height:100%}@media (forced-colors: active){:root{--legacy-accent-color:Highlight;--legacy-focus-ring-inactive-shadow-color:ButtonText}}devtools-toolbar{& > *{position:relative;display:flex;background-color:transparent;flex:none;align-items:center;justify-content:center;height:var(--toolbar-height);border:none;white-space:pre;overflow:hidden;max-width:100%;color:var(--icon-default);cursor:default;& .devtools-link{color:var(--icon-default)}}.status-buttons{padding:0 var(--sys-size-2);gap:var(--sys-size-2)}& > :not(select){padding:0}& > devtools-issue-counter{margin-top:-4px;padding:0 1px}devtools-adorner.fix-perf-icon{--override-adorner-text-color:transparent;--override-adorner-border-color:transparent;--override-adorner-background-color:transparent}devtools-issue-counter.main-toolbar{margin-left:1px;margin-right:1px}.toolbar-dropdown-arrow{pointer-events:none;flex:none;top:2px}.toolbar-button.dark-text .toolbar-dropdown-arrow{color:var(--sys-color-on-surface)}.toolbar-button{white-space:nowrap;overflow:hidden;min-width:28px;background:transparent;border-radius:0;&[aria-haspopup="true"][aria-expanded="true"]{pointer-events:none}}.toolbar-item-search{min-width:5.2em;max-width:300px;flex:1 1 auto;justify-content:start;overflow:revert}.toolbar-text{margin:0 5px;flex:none;color:var(--ui-text)}.toolbar-text:empty{margin:0}.toolbar-has-dropdown{justify-content:space-between;height:var(--sys-size-9);padding:0 var(--sys-size-2) 0 var(--sys-size-4);margin:0 var(--sys-size-2);gap:var(--sys-size-2);border-radius:var(--sys-shape-corner-extra-small);&:hover::after,\n    &:active::before{content:"";height:100%;width:100%;border-radius:inherit;position:absolute;top:0;left:0}&:hover::after{background-color:var(--sys-color-state-hover-on-subtle)}&:active::before{background-color:var(--sys-color-state-ripple-neutral-on-subtle)}&:focus-visible{outline:var(--sys-size-2) solid var(--sys-color-state-focus-ring)}&[disabled]{pointer-events:none;background-color:var(--sys-color-state-disabled-container);color:var(--sys-color-state-disabled)}}.toolbar-has-dropdown-shrinkable{flex-shrink:1}.toolbar-has-dropdown .toolbar-text{margin:0;text-overflow:ellipsis;flex:auto;overflow:hidden;text-align:right}.toolbar-button:not(.toolbar-has-dropdown):focus-visible::before{position:absolute;inset:2px;background-color:var(--sys-color-state-focus-highlight);border-radius:2px;content:"";z-index:-1}.toolbar-glyph{flex:none}.toolbar-button:disabled{opacity:50%}.toolbar-button.copied-to-clipboard::after{content:attr(data-content);position:fixed;margin-top:calc(2 * var(--toolbar-height));padding:3px 5px;color:var(--sys-color-token-subtle);background:var(--sys-color-cdt-base-container);animation:2s fade-out;font-weight:normal;border:1px solid var(--sys-color-divider);border-radius:3px}.toolbar-button.toolbar-state-on .toolbar-glyph{color:var(--icon-toggled)}.toolbar-state-on.toolbar-toggle-with-dot .toolbar-text::after{content:"";position:absolute;bottom:2px;background-color:var(--sys-color-primary-bright);width:4.5px;height:4.5px;border:2px solid var(--override-toolbar-background-color,--sys-color-cdt-base-container);border-radius:50%;right:0}.toolbar-button.toolbar-state-on.toolbar-toggle-with-red-color .toolbar-glyph,\n  .toolbar-button.toolbar-state-off.toolbar-default-with-red-color\n    .toolbar-glyph{color:var(\n      --icon-error\n    )!important}.toolbar-button:not(\n      .toolbar-has-glyph,\n      .toolbar-has-dropdown,\n      .largeicon-menu,\n      .toolbar-button-secondary\n    ){font-weight:bold}.toolbar-button.dark-text .toolbar-text{color:var(\n      --sys-color-on-surface\n    )!important}.toolbar-button.toolbar-state-on .toolbar-text{color:var(--sys-color-primary)}.toolbar-button.toolbar-state-on:enabled:active .toolbar-text{color:var(--sys-color-primary-bright)}.toolbar-button:enabled:hover:not(:active) .toolbar-glyph{color:var(--sys-color-on-surface)}.toolbar-button:enabled:hover:not(:active) .toolbar-text{color:var(--sys-color-on-surface)}.toolbar-button.toolbar-state-on:enabled:hover:not(:active) .toolbar-glyph{color:var(--sys-color-primary)}.toolbar-button.toolbar-state-on:enabled:hover:not(:active) .toolbar-text{color:var(--sys-color-primary)}& > dt-checkbox{padding:0 5px 0 0}& > select{height:var(--sys-size-9);min-width:var(--sys-size-14)}.toolbar-input{box-shadow:inset 0 0 0 2px transparent;box-sizing:border-box;width:120px;height:var(--sys-size-9);padding:0 var(--sys-size-2) 0 var(--sys-size-5);margin:1px 3px;border-radius:100px;min-width:35px;position:relative;&.focused{box-shadow:inset 0 0 0 2px var(--sys-color-state-focus-ring)}&:not(:has(devtools-button:hover), .disabled):hover{background-color:var(--sys-color-state-hover-on-subtle)}&::before{content:"";box-sizing:inherit;height:100%;width:100%;position:absolute;left:0;background:var(--sys-color-cdt-base);z-index:-1}& > devtools-icon{color:var(--sys-color-on-surface-subtle);width:var(--sys-size-8);height:var(--sys-size-8);margin-right:var(--sys-size-3)}&.disabled > devtools-icon{color:var(--sys-color-state-disabled)}}.toolbar-filter .toolbar-input-clear-button{margin-right:var(--sys-size-4)}.toolbar-input-empty .toolbar-input-clear-button{display:none}.toolbar-prompt-proxy{flex:1}.toolbar-input-prompt{flex:1;overflow:hidden;white-space:nowrap;cursor:text;color:var(--sys-color-on-surface)}.toolbar-divider{background-color:var(--sys-color-divider);width:1px;margin:5px 4px;height:16px}.toolbar-spacer{flex:auto}.toolbar-button.emulate-active{background-color:var(--sys-color-surface-variant)}&:not([floating]) > :last-child:not(:first-child, select){flex-shrink:1;justify-content:left}&:not([floating]) > .toolbar-button:last-child:not(:first-child, select){justify-content:left;margin-right:2px}& > .highlight::before{content:"";position:absolute;inset:2px;border-radius:2px;background:var(--sys-color-neutral-container);z-index:-1}& > .highlight:focus-visible{background:var(--sys-color-tonal-container);& > .title{color:var(--sys-color-on-tonal-container)}}devtools-icon.leading-issue-icon{margin:0 7px}@media (forced-colors: active){.toolbar-button:disabled{opacity:100%;color:Graytext}devtools-toolbar > *,\n    .toolbar-text{color:ButtonText}.toolbar-button:disabled .toolbar-text{color:Graytext}devtools-toolbar > select:disabled{opacity:100%;color:Graytext}.toolbar-button.toolbar-state-on .toolbar-glyph{forced-color-adjust:none;color:Highlight}.toolbar-button.toolbar-state-on .toolbar-text{forced-color-adjust:none;color:Highlight}.toolbar-button:enabled:hover:not(:active) .toolbar-text,\n    .toolbar-button:enabled:focus:not(:active) .toolbar-text{color:HighlightText}.toolbar-button:disabled devtools-icon{color:GrayText}.toolbar-button:disabled .toolbar-glyph{color:GrayText}.toolbar-button:enabled.hover:not(:active) .toolbar-glyph{forced-color-adjust:none;color:Highlight}.toolbar-button:enabled:hover .toolbar-glyph,\n    .toolbar-button:enabled:focus .toolbar-glyph,\n    .toolbar-button:enabled:hover:not(:active) .toolbar-glyph,\n    .toolbar-button:enabled:hover devtools-icon,\n    .toolbar-button:enabled:focus devtools-icon{color:HighlightText}.toolbar-input{forced-color-adjust:none;background:canvas;box-shadow:var(--legacy-focus-ring-inactive-shadow)}.toolbar-input.focused,\n    .toolbar-input:not(.toolbar-input-empty){forced-color-adjust:none;background:canvas;box-shadow:var(--legacy-focus-ring-active-shadow)}.toolbar-input:hover{box-shadow:var(--legacy-focus-ring-active-shadow)}devtools-toolbar .devtools-link{color:linktext}.toolbar-has-dropdown{forced-color-adjust:none;background:ButtonFace;color:ButtonText}}}@keyframes fade-out{from{opacity:100%}to{opacity:0%}}.webkit-css-property{color:var(--webkit-css-property-color,var(--sys-color-token-property-special))}.webkit-html-comment{color:var(--sys-color-token-comment)}.webkit-html-tag{color:var(--sys-color-token-tag)}.webkit-html-tag-name,\n.webkit-html-close-tag-name{color:var(--sys-color-token-tag)}.webkit-html-pseudo-element{color:var(--sys-color-token-pseudo-element)}.webkit-html-js-node,\n.webkit-html-css-node{color:var(--text-primary);white-space:pre-wrap}.webkit-html-text-node{color:var(--text-primary);unicode-bidi:-webkit-isolate}.webkit-html-entity-value{background-color:rgb(0 0 0/15%);unicode-bidi:-webkit-isolate}.webkit-html-doctype{color:var(--text-secondary)}.webkit-html-attribute-name{color:var(--sys-color-token-attribute);unicode-bidi:-webkit-isolate}.webkit-html-attribute-value{color:var(--sys-color-token-attribute-value);unicode-bidi:-webkit-isolate;word-break:break-all}.devtools-link{color:var(--text-link);text-decoration:underline;outline-offset:2px;.elements-disclosure &{color:var(--text-link)}devtools-icon{vertical-align:baseline;color:var(--sys-color-primary)}:focus .selected & devtools-icon{color:var(--sys-color-tonal-container)}&:focus-visible{outline-width:unset}&.invalid-link{color:var(--text-disabled);text-decoration:none}&:not(.devtools-link-prevent-click, .invalid-link){cursor:pointer}@media (forced-colors: active){&:not(.devtools-link-prevent-click){forced-color-adjust:none;color:linktext}&:focus-visible{background:Highlight;color:HighlightText}}}\n/*# sourceURL=${import.meta.resolve("./inspectorCommon.css")} */\n`,E=`.protocol-monitor .protocol-monitor-toolbar{border-bottom:1px solid var(--sys-color-divider)}.protocol-monitor .protocol-monitor-bottom-toolbar{border-top:1px solid var(--sys-color-divider)}.target-selector{max-width:120px}\n/*# sourceURL=${import.meta.resolve("./protocolMonitor.css")} */\n`;const{styleMap:q}=i,{widgetConfig:D,widgetRef:V}=s.Widget,A={method:"Method",type:"Type",request:"Request",response:"Response",timestamp:"Timestamp",elapsedTime:"Elapsed time",target:"Target",record:"Record",clearAll:"Clear all",filter:"Filter",documentation:"Documentation",editAndResend:"Edit and resend",sMs:"{PH1} ms",noMessageSelected:"No message selected",selectAMessageToView:"Select a message to see its details",save:"Save",session:"Session",sendRawCDPCommand:"Send a raw `CDP` command",sendRawCDPCommandExplanation:"Format: `'Domain.commandName'` for a command without parameters, or `'{\"command\":\"Domain.commandName\", \"parameters\": {...}}'` as a JSON object for a command with parameters. `'cmd'`/`'method'` and `'args'`/`'params'`/`'arguments'` are also supported as alternative keys for the `JSON` object.",selectTarget:"Select a target",showCDPCommandEditor:"Show CDP command editor",hideCDPCommandEditor:"Hide  CDP command editor"},H=o.i18n.registerUIStrings("panels/protocol_monitor/ProtocolMonitor.ts",A),U=o.i18n.getLocalizedString.bind(void 0,H),O=e=>{const t=new Map;for(const o of e)for(const e of Object.keys(o.metadata))t.set(e,o.metadata[e]);return t},F=O(u.InspectorBackend.inspectorBackend.agentPrototypes.values()),W=u.InspectorBackend.inspectorBackend.typeMap,_=u.InspectorBackend.inspectorBackend.enumMap,L=(e,t,o)=>{l(d`
        <style>${R}</style>
        <style>${E}</style>
        <devtools-split-view name="protocol-monitor-split-container"
                             direction="column"
                             sidebar-initial-size="400"
                             sidebar-visibility=${e.sidebarVisible?"visible":"hidden"}
                             @change=${e.onSplitChange}>
          <div slot="main" class="vbox">
            <devtools-toolbar class="protocol-monitor-toolbar"
                               jslog=${c.toolbar("top")}>
               <devtools-button title=${U(A.record)}
                                .iconName=${"record-start"}
                                .toggledIconName=${"record-stop"}
                                .jslogContext=${"protocol-monitor.toggle-recording"}
                                .variant=${"icon_toggle"}
                                .toggleType=${"red-toggle"}
                                .toggled=${!0}
                                @click=${e.onRecord}></devtools-button>
              <devtools-button title=${U(A.clearAll)}
                               .iconName=${"clear"}
                               .variant=${"toolbar"}
                               .jslogContext=${"protocol-monitor.clear-all"}
                               @click=${e.onClear}></devtools-button>
              <devtools-button title=${U(A.save)}
                               .iconName=${"download"}
                               .variant=${"toolbar"}
                               .jslogContext=${"protocol-monitor.save"}
                               @click=${e.onSave}></devtools-button>
              <devtools-toolbar-input type="filter"
                                      list="filter-suggestions"
                                      style="flex-grow: 1"
                                      value=${e.filter}
                                      @change=${e.onFilterChanged}>
                <datalist id="filter-suggestions">
                  ${e.filterKeys.map((e=>d`
                        <option value=${e+":"}></option>
                        <option value=${"-"+e+":"}></option>`))}
                </datalist>
              </devtools-toolbar-input>
            </devtools-toolbar>
            <devtools-split-view direction="column" sidebar-position="second" name="protocol-monitor-panel-split" sidebar-initial-size="250">
              <devtools-data-grid
                  striped
                  slot="main"
                  @select=${e.onSelect}
                  @contextmenu=${e.onContextMenu}
                  .filters=${e.parseFilter(e.filter)}>
                <table>
                    <tr>
                      <th id="type" sortable style="text-align: center" hideable weight="1">${U(A.type)}</th>
                      <th id="method" weight="5">${U(A.method)}</th>
                      <th id="request" hideable weight="5">${U(A.request)}</th>
                      <th id="response" hideable weight="5">${U(A.response)}</th>
                      <th id="elapsed-time" sortable hideable weight="2">${U(A.elapsedTime)}</th>
                      <th id="timestamp" sortable hideable weight="5">${U(A.timestamp)}</th>
                      <th id="target" sortable hideable weight="5">${U(A.target)}</th>
                      <th id="session" sortable hideable weight="5">${U(A.session)}</th>
                    </tr>
                    ${e.messages.map(((e,t)=>d`
                      <tr data-index=${t}
                          style="--override-data-grid-row-background-color: var(--sys-color-surface3)">
                        ${"id"in e?d`
                          <td title="sent">
                            <devtools-icon name="arrow-up-down" style="color: var(--icon-request-response); width: 16px; height: 16px;">
                            </devtools-icon>
                          </td>`:d`
                          <td title="received">
                            <devtools-icon name="arrow-down" style="color: var(--icon-request); width: 16px; height: 16px;">
                            </devtools-icon>
                          </td>`}
                        <td>${e.method}</td>
                        <td>${e.params?d`<code>${JSON.stringify(e.params)}</code>`:""}</td>
                        <td>
                          ${e.result?d`<code>${JSON.stringify(e.result)}</code>`:e.error?d`<code>${JSON.stringify(e.error)}</code>`:"id"in e?"(pending)":""}
                        </td>
                        <td data-value=${e.elapsedTime||0}>
                          ${"id"in e?e.elapsedTime?U(A.sMs,{PH1:String(e.elapsedTime)}):"(pending)":""}
                        </td>
                        <td data-value=${e.requestTime}>${U(A.sMs,{PH1:String(e.requestTime)})}</td>
                        <td>${function(e){if(!e)return"";return e.decorateLabel(`${e.name()} ${e===r.TargetManager.TargetManager.instance().rootTarget()?"":e.id()}`)}(e.target)}</td>
                        <td>${e.sessionId||""}</td>
                      </tr>`))}
                  </table>
              </devtools-data-grid>
              <devtools-widget .widgetConfig=${D(G,{request:e.selectedMessage?.params,response:e.selectedMessage?.result||e.selectedMessage?.error,type:e.selectedMessage?"id"in e?.selectedMessage?"sent":"received":void 0})}
                  class="protocol-monitor-info"
                  slot="sidebar"></devtools-widget>
            </devtools-split-view>
            <devtools-toolbar class="protocol-monitor-bottom-toolbar"
               jslog=${c.toolbar("bottom")}>
              <devtools-button .title=${e.sidebarVisible?U(A.hideCDPCommandEditor):U(A.showCDPCommandEditor)}
                               .iconName=${e.sidebarVisible?"left-panel-close":"left-panel-open"}
                               .variant=${"toolbar"}
                               .jslogContext=${"protocol-monitor.toggle-command-editor"}
                               @click=${e.onToggleSidebar}></devtools-button>
              </devtools-button>
              <devtools-toolbar-input id="command-input"
                                      style=${q({"flex-grow":1,display:e.sidebarVisible?"none":"flex"})}
                                      value=${e.command}
                                      list="command-input-suggestions"
                                      placeholder=${U(A.sendRawCDPCommand)}
                                      title=${U(A.sendRawCDPCommandExplanation)}
                                      @change=${e.onCommandChange}
                                      @submit=${e.onCommandSubmitted}>
                <datalist id="command-input-suggestions">
                  ${e.commandSuggestions.map((e=>d`<option value=${e}></option>`))}
                </datalist>
              </devtools-toolbar-input>
              <select class="target-selector"
                      title=${U(A.selectTarget)}
                      style=${q({display:e.sidebarVisible?"none":"flex"})}
                      jslog=${c.dropDown("target-selector").track({change:!0})}
                      @change=${e.onTargetChange}>
                ${e.targets.map((t=>d`
                  <option jslog=${c.item("target").track({click:!0})}
                          value=${t.id()} ?selected=${t.id()===e.selectedTargetId}>
                    ${t.name()} (${t.inspectedURL()})
                  </option>`))}
              </select>
            </devtools-toolbar>
          </div>
          <devtools-widget slot="sidebar"
              .widgetConfig=${D(z,{metadataByCommand:F,typesByName:W,enumsByName:_})}
              ${V(z,(e=>{t.editorWidget=e}))}>
          </devtools-widget>
        </devtools-split-view>`,o,{host:e})};class J extends s.Panel.Panel{started;startTime;messageForId=new Map;filterParser;#q=["method","request","response","target","session"];#D=new K;#V;#s="";#A=!1;#H;#U=[];#O;#F="";#W;constructor(e=L){super("protocol-monitor",!0),this.#H=e,this.started=!1,this.startTime=0,this.contentElement.classList.add("protocol-monitor"),this.#q=["method","request","response","type","target","session"],this.filterParser=new g.TextUtils.FilterParser(this.#q),this.#V="main",this.performUpdate(),this.#W.addEventListener("submiteditor",(e=>{this.onCommandSend(e.data.command,e.data.parameters,e.data.targetId)})),r.TargetManager.TargetManager.instance().addEventListener("AvailableTargetsChanged",(()=>{this.requestUpdate()}))}#_(){const e=this.#W.getCommandJson(),t=this.#W.targetId;t&&(this.#V=t),e&&(this.#s=e,this.requestUpdate())}performUpdate(){const e={messages:this.#U,selectedMessage:this.#O,sidebarVisible:this.#A,command:this.#s,commandSuggestions:this.#D.allSuggestions(),filterKeys:this.#q,filter:this.#F,parseFilter:this.filterParser.parse.bind(this.filterParser),onSplitChange:e=>{if("OnlyMain"===e.detail)this.#_(),this.#A=!1;else{const{command:e,parameters:t}=Q(this.#s);this.#W.displayCommand(e,t,this.#V),this.#A=!0}this.requestUpdate()},onRecord:e=>{this.setRecording(e.target.toggled)},onClear:()=>{this.#U=[],this.messageForId.clear(),this.requestUpdate()},onSave:()=>{this.saveAsFile()},onSelect:e=>{const t=parseInt(e.detail?.dataset?.index??"",10);this.#O=isNaN(t)?void 0:this.#U[t],this.requestUpdate()},onContextMenu:e=>{const t=this.#U[parseInt(e.detail?.element?.dataset?.index||"",10)];t&&this.#L(e.detail.menu,t)},onCommandChange:e=>{this.#s=e.detail},onCommandSubmitted:e=>{this.#D.addEntry(e.detail);const{command:t,parameters:o}=Q(e.detail);this.onCommandSend(t,o,this.#V)},onFilterChanged:e=>{this.#F=e.detail,this.requestUpdate()},onTargetChange:e=>{e.target instanceof HTMLSelectElement&&(this.#V=e.target.value)},onToggleSidebar:e=>{this.#A=!this.#A,this.requestUpdate()},targets:r.TargetManager.TargetManager.instance().targets(),selectedTargetId:this.#V},t=this,o={set editorWidget(e){t.#W=e}};this.#H(e,o,this.contentElement)}#L(e,o){e.editSection().appendItem(U(A.editAndResend),(()=>{if(!this.#O)return;const e=this.#O.params,t=this.#O.target?.id()||"",r=o.method;this.#s=JSON.stringify({command:r,parameters:e}),this.#A?this.#W.displayCommand(r,e,t):(this.#A=!0,this.requestUpdate())}),{jslogContext:"edit-and-resend",disabled:!("id"in o)}),e.editSection().appendItem(U(A.filter),(()=>{this.#F=`method:${o.method}`,this.requestUpdate()}),{jslogContext:"filter"}),e.footerSection().appendItem(U(A.documentation),(()=>{const[e,r]=o.method.split("."),a="id"in o?"method":"event";t.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(`https://chromedevtools.github.io/devtools-protocol/tot/${e}#${a}-${r}`)}),{jslogContext:"documentation"})}onCommandSend(e,t,o){const a=u.InspectorBackend.test,s=r.TargetManager.TargetManager.instance(),n=o?s.targetById(o):null,i=n?n.sessionId:"";a.sendRawMessage(e,t,(()=>{}),i)}wasShown(){this.started||(this.started=!0,this.startTime=Date.now(),this.setRecording(!0))}setRecording(e){const t=u.InspectorBackend.test;e?(t.onMessageSent=this.messageSent.bind(this),t.onMessageReceived=this.messageReceived.bind(this)):(t.onMessageSent=null,t.onMessageReceived=null)}messageReceived(e,t){if("id"in e&&e.id){const t=this.messageForId.get(e.id);if(!t)return;return t.result=e.result,t.error=e.error,t.elapsedTime=Date.now()-this.startTime-t.requestTime,this.messageForId.delete(e.id),void this.requestUpdate()}this.#U.push({method:e.method,sessionId:e.sessionId,target:t??void 0,requestTime:Date.now()-this.startTime,result:e.params}),this.requestUpdate()}messageSent(e,t){const o={method:e.method,params:e.params,id:e.id,sessionId:e.sessionId,target:t??void 0,requestTime:Date.now()-this.startTime};this.#U.push(o),this.requestUpdate(),this.messageForId.set(e.id,o)}async saveAsFile(){const e=new Date,t="ProtocolMonitor-"+m.DateUtilities.toISO8601Compact(e)+".json",o=new h.FileUtils.FileOutputStream;if(!await o.open(t))return;const r=this.#U.map((e=>({...e,target:e.target?.id()})));o.write(JSON.stringify(r,null,"  ")),o.close()}}class K{#J=200;#K=new Set;constructor(e){void 0!==e&&(this.#J=e)}allSuggestions(){const e=[...this.#K].reverse();return e.push(...F.keys()),e}buildTextPromptCompletions=async(e,t,o)=>{if(!t&&!o&&e)return[];return this.allSuggestions().filter((e=>e.startsWith(t))).map((e=>({text:e})))};addEntry(e){if(this.#K.has(e)&&this.#K.delete(e),this.#K.add(e),this.#K.size>this.#J){const e=this.#K.values().next().value;this.#K.delete(e)}}}class G extends s.Widget.VBox{tabbedPane;request;response;type;selectedTab;constructor(e){super(void 0,void 0,e),this.tabbedPane=new s.TabbedPane.TabbedPane,this.tabbedPane.appendTab("request",U(A.request),new s.Widget.Widget),this.tabbedPane.appendTab("response",U(A.response),new s.Widget.Widget),this.tabbedPane.show(this.contentElement),this.tabbedPane.selectTab("response"),this.request={}}performUpdate(){if(!this.request&&!this.response)return this.tabbedPane.changeTabView("request",new s.EmptyWidget.EmptyWidget(U(A.noMessageSelected),U(A.selectAMessageToView))),void this.tabbedPane.changeTabView("response",new s.EmptyWidget.EmptyWidget(U(A.noMessageSelected),U(A.selectAMessageToView)));const e=this.type&&"sent"===this.type;this.tabbedPane.setTabEnabled("request",Boolean(e)),e||this.tabbedPane.selectTab("response"),this.tabbedPane.changeTabView("request",b.JSONView.JSONView.createViewSync(this.request||null)),this.tabbedPane.changeTabView("response",b.JSONView.JSONView.createViewSync(this.response||null)),this.selectedTab&&this.tabbedPane.selectTab(this.selectedTab)}}function Q(e){let t=null;try{t=JSON.parse(e)}catch{}return{command:t?t.command||t.method||t.cmd||"":e,parameters:t?.parameters||t?.params||t?.args||t?.arguments||{}}}var X=Object.freeze({__proto__:null,CommandAutocompleteSuggestionProvider:K,DEFAULT_VIEW:L,InfoWidget:G,ProtocolMonitorImpl:J,buildProtocolMetadata:O,parseCommandInput:Q});export{B as JSONEditor,X as ProtocolMonitor};
