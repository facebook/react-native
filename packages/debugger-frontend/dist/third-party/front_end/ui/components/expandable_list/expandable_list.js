import*as e from"../../lit-html/lit-html.js";import*as t from"../../visual_logging/visual_logging.js";const i=new CSSStyleSheet;i.replaceSync(":host{overflow:hidden}div{line-height:1.7em}.arrow-icon-button{cursor:pointer;padding:1px 0;border:none;background:none;margin-right:2px}.arrow-icon{display:inline-block;mask-image:var(--image-file-triangle-right);background-color:var(--icon-default);margin-top:2px;height:14px;width:14px;transition:transform 200ms}.arrow-icon.expanded{transform:rotate(90deg)}.expandable-list-container{display:flex;margin-top:4px}.expandable-list-items{overflow:hidden}.link,\n.devtools-link{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer;outline-offset:2px}button.link{border:none;background:none;font-family:inherit;font-size:inherit}.text-ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n/*# sourceURL=expandableList.css */\n");class n extends HTMLElement{static litTagName=e.literal`devtools-expandable-list`;#e=this.attachShadow({mode:"open"});#t=!1;#i=[];#n;set data(e){this.#i=e.rows,this.#n=e.title,this.#o()}#a(){this.#t=!this.#t,this.#o()}connectedCallback(){this.#e.adoptedStyleSheets=[i]}#o(){this.#i.length<1||e.render(e.html`
      <div class="expandable-list-container">
        <div>
          ${this.#i.length>1?e.html`
              <button title='${this.#n}' aria-label='${this.#n}' aria-expanded=${this.#t?"true":"false"} @click=${()=>this.#a()} class="arrow-icon-button">
                <span class="arrow-icon ${this.#t?"expanded":""}"
                jslog=${t.expand().track({click:!0})}></span>
              </button>
            `:e.nothing}
        </div>
        <div class="expandable-list-items">
          ${this.#i.filter(((e,t)=>this.#t||0===t)).map((t=>e.html`
            ${t}
          `))}
        </div>
      </div>
    `,this.#e,{host:this})}}customElements.define("devtools-expandable-list",n);var o=Object.freeze({__proto__:null,ExpandableList:n});export{o as ExpandableList};
