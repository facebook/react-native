import{render as e,html as t}from"../../../ui/lit/lit.js";import*as n from"../../../ui/visual_logging/visual_logging.js";import*as o from"../../../core/common/common.js";import*as s from"../../../core/i18n/i18n.js";import"../../../ui/components/buttons/buttons.js";import*as i from"../../../ui/legacy/legacy.js";var l={cssText:`.element-reveal-icon{display:inline-block;width:20px;height:20px;mask-image:var(--image-file-select-element);background-color:var(--icon-default)}\n/*# sourceURL=${import.meta.resolve("././elementsPanelLink.css")} */\n`};const a=new CSSStyleSheet;a.replaceSync(l.cssText);class c extends HTMLElement{#e=this.attachShadow({mode:"open"});#t=()=>{};#n=()=>{};#o=()=>{};set data(e){this.#t=e.onElementRevealIconClick,this.#n=e.onElementRevealIconMouseEnter,this.#o=e.onElementRevealIconMouseLeave,this.#s()}#s(){this.#i()}connectedCallback(){this.#e.adoptedStyleSheets=[a]}#i(){e(t`
      <span
        class="element-reveal-icon"
        jslog=${n.link("elements-panel").track({click:!0})}
        @click=${this.#t}
        @mouseenter=${this.#n}
        @mouseleave=${this.#o}></span>
      `,this.#e,{host:this})}}customElements.define("devtools-elements-panel-link",c);var m=Object.freeze({__proto__:null,ElementsPanelLink:c}),r={cssText:`.hide-issues-menu-btn{position:relative;display:flex;background-color:transparent;flex:none;align-items:center;justify-content:center;padding:0;margin:0 -2px 0 4px;overflow:hidden;border-radius:0;border:none;&:hover > devtools-icon{color:var(--icon-default-hover)}}\n/*# sourceURL=${import.meta.resolve("././hideIssuesMenu.css")} */\n`};const d=new CSSStyleSheet;d.replaceSync(r.cssText);const u={tooltipTitle:"Hide issues"},h=s.i18n.registerUIStrings("panels/issues/components/HideIssuesMenu.ts",u),p=s.i18n.getLocalizedString.bind(void 0,h);class v extends HTMLElement{#e=this.attachShadow({mode:"open"});#l=o.UIString.LocalizedEmptyString;#a=()=>{};set data(e){this.#l=e.menuItemLabel,this.#a=e.menuItemAction,this.#i()}connectedCallback(){this.#e.adoptedStyleSheets=[d]}onMenuOpen(e){e.stopPropagation();const t=this.#e.querySelector("devtools-button"),n=new i.ContextMenu.ContextMenu(e,{x:t?.getBoundingClientRect().left,y:t?.getBoundingClientRect().bottom});n.headerSection().appendItem(this.#l,(()=>this.#a()),{jslogContext:"toggle-similar-issues"}),n.show()}#i(){e(t`
    <devtools-button
      .data=${{variant:"icon",iconName:"dots-vertical",title:p(u.tooltipTitle)}}
      .jslogContext=${"hide-issues"}
      class="hide-issues-menu-btn"
      @click=${this.onMenuOpen}></devtools-button>
    `,this.#e,{host:this})}}customElements.define("devtools-hide-issues-menu",v);var g=Object.freeze({__proto__:null,HideIssuesMenu:v});export{m as ElementsPanelLink,g as HideIssuesMenu};
