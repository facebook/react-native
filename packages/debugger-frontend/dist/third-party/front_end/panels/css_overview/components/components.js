import"../../../ui/components/panel_feedback/panel_feedback.js";import"../../../ui/components/panel_introduction_steps/panel_introduction_steps.js";import*as e from"../../../core/i18n/i18n.js";import"../../../ui/components/buttons/buttons.js";import{render as t,html as s}from"../../../ui/lit/lit.js";var o={cssText:`h1{font-weight:normal}.css-overview-start-view{padding:24px;display:flex;flex-direction:column;background-color:var(--sys-color-cdt-base-container);overflow:auto}.start-capture-wrapper{width:fit-content}.preview-feature{padding:12px 16px;border:1px solid var(--sys-color-neutral-outline);color:var(--sys-color-on-surface);font-size:13px;line-height:20px;border-radius:12px;margin:42px 0;letter-spacing:0.01em}.preview-header{color:var(--sys-color-primary);font-size:13px;line-height:20px;letter-spacing:0.01em;margin:9px 0 14px}.preview-icon{vertical-align:middle}.feedback-prompt{margin-bottom:24px}.feedback-prompt .devtools-link{color:-webkit-link;cursor:pointer;text-decoration:underline}.resources{display:flex;flex-direction:row}.thumbnail-wrapper{width:144px;height:92px;margin-right:20px}.video-doc-header{font-size:13px;line-height:20px;letter-spacing:0.04em;color:var(--sys-color-on-surface);margin-bottom:2px}devtools-feedback-button{align-self:flex-end}.resources .devtools-link{font-size:14px;line-height:22px;letter-spacing:0.04em;text-decoration-line:underline;color:var(--sys-color-primary)}\n/*# sourceURL=${import.meta.resolve("./cssOverviewStartView.css")} */\n`};const r=new CSSStyleSheet;r.replaceSync(o.cssText);const i={captureOverview:"Capture overview",identifyCSSImprovements:"Identify potential CSS improvements",capturePageCSSOverview:"Capture an overview of your page’s CSS",identifyCSSImprovementsWithExampleIssues:"Identify potential CSS improvements (e.g. low contrast issues, unused declarations, color or font mismatches)",locateAffectedElements:"Locate the affected elements in the Elements panel",quickStartWithCSSOverview:"Quick start: get started with the new CSS overview panel"},a=e.i18n.registerUIStrings("panels/css_overview/components/CSSOverviewStartView.ts",i),n=e.i18n.getLocalizedString.bind(void 0,a),c="https://g.co/devtools/css-overview-feedback";class l extends Event{static eventName="overviewstartrequested";constructor(){super(l.eventName)}}class p extends HTMLElement{#e=this.attachShadow({mode:"open"});connectedCallback(){this.#e.adoptedStyleSheets=[r],this.#t()}show(){this.classList.remove("hidden")}hide(){this.classList.add("hidden")}#s(){this.dispatchEvent(new l)}#t(){t(s`
      <div class="css-overview-start-view">
        <devtools-panel-introduction-steps>
          <span slot="title">${n(i.identifyCSSImprovements)}</span>
          <span slot="step-1">${n(i.capturePageCSSOverview)}</span>
          <span slot="step-2">${n(i.identifyCSSImprovementsWithExampleIssues)}</span>
          <span slot="step-3">${n(i.locateAffectedElements)}</span>
        </devtools-panel-introduction-steps>
        <div class="start-capture-wrapper">
          <devtools-button
            class="start-capture"
            .variant=${"primary"}
            .jslogContext=${"css-overview.capture-overview"}
            @click=${this.#s}>
            ${n(i.captureOverview)}
          </devtools-button>
        </div>
        <devtools-panel-feedback .data=${{feedbackUrl:c,quickStartUrl:"https://developer.chrome.com/docs/devtools/css-overview",quickStartLinkText:n(i.quickStartWithCSSOverview)}}>
        </devtools-panel-feedback>
        <devtools-feedback-button .data=${{feedbackUrl:c}}>
        </devtools-feedback-button>
      </div>
    `,this.#e,{host:this});const e=this.#e.querySelector(".start-capture");e&&e.focus()}}customElements.define("devtools-css-overview-start-view",p);var d=Object.freeze({__proto__:null,CSSOverviewStartView:p,OverviewStartRequestedEvent:l});export{d as CSSOverviewStartView};
