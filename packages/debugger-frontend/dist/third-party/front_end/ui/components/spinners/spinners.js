import{render as e,html as i}from"../../lit/lit.js";var t={cssText:`:host{overflow:hidden;width:var(--sys-size-7);height:var(--sys-size-7);display:inline-block;font-size:0;letter-spacing:0;white-space:nowrap;animation:spinner-container-animation 1.5s linear infinite}.indeterminate-spinner{animation:indeterminate-spinner-animation 5332ms cubic-bezier(0.4,0,0.2,1) infinite both;width:100%;height:100%}.left-circle-graphic-container{width:50%;height:100%;display:inline-block;position:relative;overflow:hidden}.left-circle-graphic{width:200%;position:absolute;animation:indeterminate-left-circle-spinner-animation 1333ms cubic-bezier(0.4,0,0.2,1) infinite both}.center-circle-graphic-container{width:5%;height:100%;display:inline-block;position:absolute;overflow:hidden;top:0;left:47.5%;box-sizing:border-box}.center-circle-graphic{width:2000%;position:absolute;left:-900%;transform:rotate(180deg)}.right-circle-graphic-container{width:50%;height:100%;display:inline-block;position:relative;overflow:hidden}.right-circle-graphic{width:200%;position:absolute;left:-100%;animation:indeterminate-right-circle-spinner-animation 1333ms cubic-bezier(0.4,0,0.2,1) infinite both}circle{stroke:var(--sys-color-primary);stroke-width:var(--sys-size-6);fill:transparent;stroke-dasharray:290px;stroke-dashoffset:150px}@keyframes spinner-container-animation{100%{transform:rotate(360deg)}}@keyframes indeterminate-spinner-animation{12.5%{transform:rotate(135deg)}25%{transform:rotate(270deg)}37.5%{transform:rotate(405deg)}50%{transform:rotate(540deg)}62.5%{transform:rotate(675deg)}75%{transform:rotate(810deg)}87.5%{transform:rotate(945deg)}100%{transform:rotate(1080deg)}}@keyframes indeterminate-left-circle-spinner-animation{0%{transform:rotate(265deg)}50%{transform:rotate(130deg)}100%{transform:rotate(265deg)}}@keyframes indeterminate-right-circle-spinner-animation{0%{transform:rotate(-265deg)}50%{transform:rotate(-130deg)}100%{transform:rotate(-265deg)}}\n/*# sourceURL=${import.meta.resolve("./spinner.css")} */\n`};const r=new CSSStyleSheet;r.replaceSync(t.cssText);class n extends HTMLElement{#e=this.attachShadow({mode:"open"});connectedCallback(){this.#e.adoptedStyleSheets=[r],this.#i()}#i(){e(i`
      <div class="indeterminate-spinner">
        <div class="left-circle-graphic-container">
          <svg class="left-circle-graphic" viewBox="0 0 100 100">
            <circle cx="50%" cy="50%" r="2.75rem"></circle></svg>
        </div>
        <div class="center-circle-graphic-container">
          <svg class="center-circle-graphic" viewBox="0 0 100 100">
            <circle cx="50%" cy="50%" r="2.75rem"></circle></svg>
        </div>
        <div class="right-circle-graphic-container">
          <svg class="right-circle-graphic" viewBox="0 0 100 100">
            <circle cx="50%" cy="50%" r="2.75rem"></circle></svg>
        </div>
      </div>
    `,this.#e,{host:this})}}customElements.define("devtools-spinner",n);var a=Object.freeze({__proto__:null,Spinner:n});export{a as Spinner};
