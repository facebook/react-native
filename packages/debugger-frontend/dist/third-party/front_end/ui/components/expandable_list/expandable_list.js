import*as e from"../../lit/lit.js";import*as t from"../../visual_logging/visual_logging.js";var i={cssText:`:host{overflow:hidden}div{line-height:1.7em}.arrow-icon-button{cursor:pointer;padding:1px 0;border:none;background:none;margin-right:2px}.arrow-icon{display:inline-block;mask-image:var(--image-file-triangle-right);background-color:var(--icon-default);margin-top:2px;height:14px;width:14px;transition:transform 200ms}.arrow-icon.expanded{transform:rotate(90deg)}.expandable-list-container{display:flex;margin-top:4px}.expandable-list-items{overflow:hidden}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}button.link{border:none;background:none;font-family:inherit;font-size:inherit}.text-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n/*# sourceURL=${import.meta.resolve("./expandableList.css")} */\n`};const n=new CSSStyleSheet;n.replaceSync(i.cssText);const{html:o,Directives:{ifDefined:s}}=e;class a extends HTMLElement{#e=this.attachShadow({mode:"open"});#t=!1;#i=[];#n;set data(e){this.#i=e.rows,this.#n=e.title,this.#o()}#s(){this.#t=!this.#t,this.#o()}connectedCallback(){this.#e.adoptedStyleSheets=[n]}#o(){this.#i.length<1||e.render(o`
      <div class="expandable-list-container">
        <div>
          ${this.#i.length>1?o`
              <button title='${s(this.#n)}' aria-label='${s(this.#n)}' aria-expanded=${this.#t?"true":"false"} @click=${()=>this.#s()} class="arrow-icon-button">
                <span class="arrow-icon ${this.#t?"expanded":""}"
                jslog=${t.expand().track({click:!0})}></span>
              </button>
            `:e.nothing}
        </div>
        <div class="expandable-list-items">
          ${this.#i.filter(((e,t)=>this.#t||0===t)).map((e=>o`
            ${e}
          `))}
        </div>
      </div>
    `,this.#e,{host:this})}}customElements.define("devtools-expandable-list",a);var r=Object.freeze({__proto__:null,ExpandableList:a});export{r as ExpandableList};
