import*as e from"../../../models/emulation/emulation.js";import*as t from"../../../ui/components/helpers/helpers.js";import*as i from"../../../ui/lit-html/lit-html.js";import*as s from"../../../ui/legacy/legacy.js";class a extends Event{size;static eventName="sizechanged";constructor(e){super(a.eventName),this.size=e}}function n(e){return Number(e.target.value)}class l extends HTMLElement{#e=this.attachShadow({mode:"open"});#t=!1;#i="0";#s="";#a;static litTagName=i.literal`device-mode-emulation-size-input`;constructor(e){super(),this.#a=e}connectedCallback(){this.render()}set disabled(e){this.#t=e,this.render()}set size(e){this.#i=e,this.render()}set placeholder(e){this.#s=e,this.render()}render(){i.render(i.html` <style> input {
          /*
           * 4 characters for the maximum size of the value,
           * 2 characters for the width of the step-buttons,
           * 2 pixels padding between the characters and the
           * step-buttons.
           */
          width: calc(4ch + 2ch + 2px);
          max-height: 18px;
          margin: 0 2px;
          text-align: center;
          font-size: inherit;
          font-family: inherit;
        }

        input:disabled {
          user-select: none;
        }

        input:focus::-webkit-input-placeholder {
          color: transparent;
        } </style> <input type="number" max="${e.DeviceModeModel.MaxDeviceSize}" min="${e.DeviceModeModel.MinDeviceSize}" maxlength="4" title="${this.#a}" placeholder="${this.#s}" ?disabled="${this.#t}" .value="${this.#i}" @change="${this.#n}" @keydown="${this.#l}"> `,this.#e,{host:this})}#n(e){this.dispatchEvent(new a(n(e)))}#l(t){let i=s.UIUtils.modifiedFloatNumber(n(t),t);null!==i&&(i=Math.min(i,e.DeviceModeModel.MaxDeviceSize),i=Math.max(i,e.DeviceModeModel.MinDeviceSize),t.preventDefault(),t.target.value=String(i),this.dispatchEvent(new a(i)))}}t.CustomElements.defineComponent("device-mode-emulation-size-input",l);var r=Object.freeze({__proto__:null,SizeInputElement:l});export{r as DeviceSizeInputElement};
