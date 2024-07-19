import*as e from"../../lit-html/lit-html.js";const t=new CSSStyleSheet;t.replaceSync(":host{display:block}.content{background-color:var(--sys-color-cdt-base-container);display:grid;grid-template-columns:min-content 1fr;user-select:text}.report-title{padding:12px 24px;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-bottom:1px solid var(--sys-color-divider);color:var(--sys-color-on-surface);background-color:var(--sys-color-cdt-base-container);grid-column-start:span 2}\n/*# sourceURL=report.css */\n");const o=new CSSStyleSheet;o.replaceSync(":host{line-height:28px;margin:0 0 8px}.key{color:var(--sys-color-on-surface-subtle);padding:0 6px;text-align:right;white-space:pre;user-select:none}\n/*# sourceURL=reportKey.css */\n");const s=new CSSStyleSheet;s.replaceSync(":host{grid-column-start:span 2;min-width:min-content}.section{padding:12px;margin-left:18px;display:flex;flex-direction:row;align-items:center;flex:auto;overflow-wrap:break-word;overflow:hidden}\n/*# sourceURL=reportSection.css */\n");const r=new CSSStyleSheet;r.replaceSync(":host{grid-column-start:span 2}.section-divider{border-bottom:1px solid var(--sys-color-divider)}\n/*# sourceURL=reportSectionDivider.css */\n");const l=new CSSStyleSheet;l.replaceSync(":host{grid-column-start:span 2}.section-header{padding:12px;margin-left:18px;display:flex;flex-direction:row;align-items:center;flex:auto;text-overflow:ellipsis;overflow:hidden;font-weight:bold;color:var(--sys-color-on-surface);user-select:none}\n/*# sourceURL=reportSectionHeader.css */\n");const i=new CSSStyleSheet;i.replaceSync(":host{line-height:28px;margin:0 0 8px;min-width:150px}.value{color:var(--sys-color-on-surface);margin-inline-start:0;padding:0 6px;overflow-wrap:break-word}\n/*# sourceURL=reportValue.css */\n");class n extends HTMLElement{static litTagName=e.literal`devtools-report`;#e=this.attachShadow({mode:"open"});#t="";set data({reportTitle:e}){this.#t=e,this.#o()}connectedCallback(){this.#e.adoptedStyleSheets=[t],this.#o()}#o(){e.render(e.html`
      <div class="content">
        ${this.#t?e.html`<div class="report-title">${this.#t}</div>`:e.nothing}
        <slot></slot>
      </div>
    `,this.#e,{host:this})}}class a extends HTMLElement{static litTagName=e.literal`devtools-report-section`;#e=this.attachShadow({mode:"open"});connectedCallback(){this.#e.adoptedStyleSheets=[s],this.#o()}#o(){e.render(e.html`
      <div class="section">
        <slot></slot>
      </div>
    `,this.#e,{host:this})}}class d extends HTMLElement{static litTagName=e.literal`devtools-report-section-header`;#e=this.attachShadow({mode:"open"});connectedCallback(){this.#e.adoptedStyleSheets=[l],this.#o()}#o(){e.render(e.html`
      <div class="section-header">
        <slot></slot>
      </div>
    `,this.#e,{host:this})}}class c extends HTMLElement{static litTagName=e.literal`devtools-report-divider`;#e=this.attachShadow({mode:"open"});connectedCallback(){this.#e.adoptedStyleSheets=[r],this.#o()}#o(){e.render(e.html`
      <div class="section-divider">
      </div>
    `,this.#e,{host:this})}}class h extends HTMLElement{static litTagName=e.literal`devtools-report-key`;#e=this.attachShadow({mode:"open"});connectedCallback(){this.#e.adoptedStyleSheets=[o],this.#o()}#o(){e.render(e.html`
      <div class="key"><slot></slot></div>
    `,this.#e,{host:this})}}class p extends HTMLElement{static litTagName=e.literal`devtools-report-value`;#e=this.attachShadow({mode:"open"});connectedCallback(){this.#e.adoptedStyleSheets=[i],this.#o()}#o(){e.render(e.html`
      <div class="value"><slot></slot></div>
    `,this.#e,{host:this})}}customElements.define("devtools-report",n),customElements.define("devtools-report-section",a),customElements.define("devtools-report-section-header",d),customElements.define("devtools-report-key",h),customElements.define("devtools-report-value",p),customElements.define("devtools-report-divider",c);var m=Object.freeze({__proto__:null,Report:n,ReportSection:a,ReportSectionHeader:d,ReportSectionDivider:c,ReportKey:h,ReportValue:p});export{m as ReportView};
