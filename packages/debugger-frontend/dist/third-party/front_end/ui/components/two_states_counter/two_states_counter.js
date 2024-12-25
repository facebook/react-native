import*as t from"../../lit-html/lit-html.js";import*as e from"../helpers/helpers.js";const i=new CSSStyleSheet;i.replaceSync(".active.split{border-radius:50% 0% 0% 50%}.inactive.split{border-radius:0% 50% 50% 0%}.counter{display:inline-flex;align-items:center;justify-content:center}.part{display:flex;border-radius:50%;align-items:center;justify-content:center;overflow:hidden}.active{color:var(--sys-color-on-primary);background-color:var(--sys-color-primary)}.inactive{color:var(--sys-color-state-disabled);background-color:var(--sys-color-state-disabled-container)}\n/*# sourceURL=twoStatesCounter.css */\n");const s=t=>void 0!==t;class r extends HTMLElement{static litTagName=t.literal`devtools-two-states-counter`;#t=this.#e.bind(this);#i=this.attachShadow({mode:"open"});#s=0;#r=0;#n="14px";#a="14px";#o;#c;connectedCallback(){this.#i.adoptedStyleSheets=[i],e.ScheduledRender.scheduleRender(this,this.#t)}set data(t){if(t.active<0||t.inactive<0)throw new Error("Values need to be greater or equal to zero.");this.#s=t.active,this.#r=t.inactive,this.#n=s(t.width)?t.width:this.#n,this.#a=s(t.height)?t.height:this.#a,this.#o=t.activeTitle,this.#c=t.inactiveTitle,e.ScheduledRender.scheduleRender(this,this.#t)}#e(){if(0===this.#s&&0===this.#r)return;const e={part:!0,split:this.#s>0&&this.#r>0},i={...e,active:!0},s={...e,inactive:!0};t.render(t.html`
    <div class='counter'>
      ${this.#h(this.#s,i,this.#o)}
      ${this.#h(this.#r,s,this.#c)}
    </div>
    `,this.#i,{host:this})}#h(e,i,s){const r={width:this.#n,height:this.#a};return e>0?t.html`
       <span class=${t.Directives.classMap(i)} style=${t.Directives.styleMap(r)} title=${s}>
          ${e}
       </span>
      `:t.nothing}}customElements.define("devtools-two-states-counter",r);var n=Object.freeze({__proto__:null,TwoStatesCounter:r});export{n as TwoStatesCounter};
