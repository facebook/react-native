import{render as e,html as s,nothing as i}from"../../lit/lit.js";var a=`:host{display:flex;max-width:var(--sys-size-35);width:100%}:host([hidden]){display:none}#card{break-inside:avoid;min-width:var(--sys-size-31);margin:var(--sys-size-3) var(--sys-size-6) var(--sys-size-5) var(--sys-size-5);flex:1;#heading{display:flex;white-space:nowrap;margin-bottom:var(--sys-size-5);[role="heading"]{color:var(--sys-color-on-surface);font:var(--sys-typescale-body2-medium)}[name="heading-prefix"]::slotted(*){margin-right:var(--sys-size-3)}[name="heading-suffix"]::slotted(*){margin-left:auto}}#content{border-radius:var(--sys-shape-corner-small);box-shadow:var(--sys-elevation-level2);display:flex;flex-direction:column;background:var(--app-color-card-background);&::slotted(*){padding:var(--sys-size-4) var(--sys-size-6)}&::slotted(*:not(:first-child)){border-top:var(--sys-size-1) solid var(--app-color-card-divider)}}}\n/*# sourceURL=${import.meta.resolve("./card.css")} */\n`;class t extends HTMLElement{static observedAttributes=["heading"];#e=this.attachShadow({mode:"open"});constructor(){super(),this.#s()}get heading(){return this.getAttribute("heading")}set heading(e){e?this.setAttribute("heading",e):this.removeAttribute("heading")}attributeChangedCallback(e,s,i){s!==i&&this.#s()}#s(){e(s`
        <style>${a}</style>
        <div id="card">
          <div id="heading">
            <slot name="heading-prefix"></slot>
            <div role="heading" aria-level="2">${this.heading??i}</div>
            <slot name="heading-suffix"></slot>
          </div>
          <slot id="content"></slot>
        </div>`,this.#e,{host:this})}}customElements.define("devtools-card",t);var r=Object.freeze({__proto__:null,Card:t});export{r as Card};
