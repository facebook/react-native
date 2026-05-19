import"../data_grid/data_grid.js";import*as e from"../../../../core/common/common.js";import*as t from"../../../../core/i18n/i18n.js";import*as i from"../../../../core/root/root.js";import*as o from"../../../../core/sdk/sdk.js";import*as s from"../../../../models/issues_manager/issues_manager.js";import*as a from"../../../../panels/network/forward/forward.js";import*as n from"../../../components/icon_button/icon_button.js";import{Directives as r,render as l,html as d}from"../../../lit/lit.js";import*as h from"../../legacy.js";var c={cssText:`devtools-data-grid{flex:auto}.cookies-table devtools-icon{margin-right:4px}\n/*# sourceURL=${import.meta.resolve("./cookiesTable.css")} */\n`};const{repeat:p,ifDefined:u}=r,m={session:"Session",name:"Name",value:"Value",size:"Size",editableCookies:"Editable Cookies",cookies:"Cookies",na:"N/A",showRequestsWithThisCookie:"Show requests with this cookie",showIssueAssociatedWithThis:"Show issue associated with this cookie",sourcePortTooltip:"Shows the source port (range 1-65535) the cookie was set on. If the port is unknown, this shows -1.",sourceSchemeTooltip:"Shows the source scheme (`Secure`, `NonSecure`) the cookie was set on. If the scheme is unknown, this shows `Unset`.",timeAfter:"after {date}",timeAfterTooltip:"The expiration timestamp is {seconds}, which corresponds to a date after {date}",opaquePartitionKey:"(opaque)"},k=t.i18n.registerUIStrings("ui/legacy/components/cookie_table/CookiesTable.ts",m),b=t.i18n.getLocalizedString.bind(void 0,k),g=t.i18n.getLazilyComputedLocalizedString.bind(void 0,k)(m.session);class y extends h.Widget.VBox{saveCallback;refreshCallback;selectedCallback;deleteCallback;lastEditedColumnId;data=[];cookies=[];cookieDomain;cookieToBlockedReasons;cookieToExemptionReason;view;selectedKey;editable;renderInline;schemeBindingEnabled;portBindingEnabled;constructor(e,t,o,s,a,n){super(),n||(n=(e,t,i)=>{l(d`
          <devtools-data-grid
               name=${e.editable?b(m.editableCookies):b(m.cookies)}
               id="cookies-table"
               striped
               ?inline=${e.renderInline}
               @edit=${e.onEdit}
               @create=${e.onCreate}
               @refresh=${e.onRefresh}
               @delete=${e.onDelete}
               @contextmenu=${e.onContextMenu}
               @select=${e.onSelect}
          >
            <table>
               <tr>
                 <th id=${"name"} sortable ?disclosure=${e.editable} ?editable=${e.editable} long weight="24">
                   ${b(m.name)}
                 </th>
                 <th id=${"value"} sortable ?editable=${e.editable} long weight="34">
                   ${b(m.value)}
                 </th>
                 <th id=${"domain"} sortable weight="7" ?editable=${e.editable}>
                   Domain
                 </th>
                 <th id=${"path"} sortable weight="7" ?editable=${e.editable}>
                   Path
                 </th>
                 <th id=${"expires"} sortable weight="7" ?editable=${e.editable}>
                   Expires / Max-Age
                 </th>
                 <th id=${"size"} sortable align="right" weight="7">
                   ${b(m.size)}
                 </th>
                 <th id=${"http-only"} sortable align="center" weight="7" ?editable=${e.editable} type="boolean">
                   HttpOnly
                 </th>
                 <th id=${"secure"} sortable align="center" weight="7" ?editable=${e.editable} type="boolean">
                   Secure
                 </th>
                 <th id=${"same-site"} sortable weight="7" ?editable=${e.editable}>
                   SameSite
                 </th>
                 <th id=${"partition-key-site"} sortable weight="7" ?editable=${e.editable}>
                   Partition Key Site
                 </th>
                 <th id=${"has-cross-site-ancestor"} sortable align="center" weight="7" ?editable=${e.editable} type="boolean">
                   Cross Site
                 </th>
                 <th id=${"priority"} sortable weight="7" ?editable=${e.editable}>
                   Priority
                 </th>
                 ${e.schemeBindingEnabled?d`
                 <th id=${"source-scheme"} sortable align="center" weight="7" ?editable=${e.editable} type="string">
                   SourceScheme
                 </th>`:""}
                 ${e.portBindingEnabled?d`
                <th id=${"source-port"} sortable align="center" weight="7" ?editable=${e.editable} type="number">
                   SourcePort
                </th>`:""}
              </tr>
              ${p(this.data,(e=>e.key),(t=>d`<tr data-key=${u(t.key)}
                    ?selected=${t.key===e.selectedKey}
                    ?inactive=${t.inactive}
                    ?dirty=${t.dirty}
                    ?highlighted=${t.flagged}>
                  <td>${t.icons?.name}${t.name}</td>
                  <td>${t.value}</td>
                  <td>${t.icons?.domain}${t.domain}</td>
                  <td>${t.icons?.path}${t.path}</td>
                  <td title=${u(t.expiresTooltip)}>${t.expires}</td>
                  <td>${t.size}</td>
                  <td data-value=${Boolean(t["http-only"])}></td>
                  <td data-value=${Boolean(t.secure)}>${t.icons?.secure}</td>
                  <td>${t.icons?.["same-site"]}${t["same-site"]}</td>
                  <td>${t["partition-key-site"]}</td>
                  <td data-value=${Boolean(t["has-cross-site-ancestor"])}></td>
                  <td data-value=${u(t.priorityValue)}>${t.priority}</td>
                  ${e.schemeBindingEnabled?d`
                    <td title=${b(m.sourceSchemeTooltip)}>${t["source-scheme"]}</td>`:""}
                  ${e.portBindingEnabled?d`
                    <td title=${b(m.sourcePortTooltip)}>${t["source-port"]}</td>`:""}
                </tr>`))}
                ${e.editable?d`<tr placeholder><tr>`:""}
              </table>
            </devtools-data-grid>`,i,{host:i})}),this.registerRequiredCSS(c),this.element.classList.add("cookies-table"),this.saveCallback=t,this.refreshCallback=o,this.deleteCallback=a,this.editable=Boolean(t);const{devToolsEnableOriginBoundCookies:r}=i.Runtime.hostConfig;this.schemeBindingEnabled=Boolean(r?.schemeBindingEnabled),this.portBindingEnabled=Boolean(r?.portBindingEnabled),this.view=n,this.renderInline=Boolean(e),this.selectedCallback=s,this.lastEditedColumnId=null,this.data=[],this.cookieDomain="",this.cookieToBlockedReasons=null,this.cookieToExemptionReason=null,this.requestUpdate()}setCookies(e,t,i){this.cookieToBlockedReasons=t||null,this.cookieToExemptionReason=i||null,this.cookies=e;const o=this.data.find((e=>e.key===this.selectedKey)),s=this.cookies.find((e=>e.key()===this.selectedKey));this.data=e.sort(((e,t)=>e.name().localeCompare(t.name()))).map(this.createCookieData.bind(this)),o&&this.lastEditedColumnId&&!s&&(o.inactive=!0,this.data.push(o)),this.requestUpdate()}setCookieDomain(e){this.cookieDomain=e}selectedCookie(){return this.cookies.find((e=>e.key()===this.selectedKey))||null}willHide(){this.lastEditedColumnId=null}performUpdate(){const e={data:this.data,selectedKey:this.selectedKey,editable:this.editable,renderInline:this.renderInline,schemeBindingEnabled:this.schemeBindingEnabled,portBindingEnabled:this.portBindingEnabled,onEdit:e=>this.onUpdateCookie(e.detail.node,e.detail.columnId,e.detail.valueBeforeEditing,e.detail.newText),onCreate:e=>this.onCreateCookie(e.detail),onRefresh:()=>this.refresh(),onDelete:e=>this.onDeleteCookie(e.detail),onSelect:e=>this.onSelect(e.detail),onContextMenu:e=>this.populateContextMenu(e.detail.menu,e.detail.element)};this.view(e,{},this.element)}onSelect(e){this.selectedKey=e?.dataset?.key,this.selectedCallback?.()}onDeleteCookie(e){const t=this.cookies.find((t=>t.key()===e.dataset.key));t&&this.deleteCallback&&this.deleteCallback(t,(()=>this.refresh()))}onUpdateCookie(e,t,i,o){const s=this.cookies.find((t=>t.key()===e.dataset.key)),a=this.data.find((t=>t.key===e.dataset.key));if(!a||!s)return;const n={...a,[t]:o};if(!this.isValidCookieData(n))return n.dirty=!0,void this.requestUpdate();this.lastEditedColumnId=t,this.saveCookie(n,s)}onCreateCookie(e){this.setDefaults(e),this.isValidCookieData(e)?this.saveCookie(e):(e.dirty=!0,this.requestUpdate())}setDefaults(e){void 0===e.name&&(e.name=""),void 0===e.value&&(e.value=""),void 0===e.domain&&(e.domain=this.cookieDomain),void 0===e.path&&(e.path="/"),void 0===e.expires&&(e.expires=g()),void 0===e["partition-key"]&&(e["partition-key"]="")}saveCookie(e,t){if(!this.saveCallback)return;const i=this.createCookieFromData(e);this.saveCallback(i,t??null).then((t=>{t||(e.dirty=!0),this.refresh()}))}createCookieFromData(e){const t=new o.Cookie.Cookie(e.name||"",e.value||"",null,e.priority);for(const i of["domain","path","http-only","secure","same-site","source-scheme"])i in e&&t.addAttribute(i,e[i]);return e.expires&&e.expires!==g()&&t.addAttribute("expires",new Date(e.expires).toUTCString()),"source-port"in e&&t.addAttribute("source-port",Number.parseInt(e["source-port"]||"",10)||void 0),e["partition-key-site"]&&t.setPartitionKey(e["partition-key-site"],Boolean(!!e["has-cross-site-ancestor"]&&e["has-cross-site-ancestor"])),t.setSize(e.name.length+e.value.length),t}createCookieData(e){const i=864e13,o=0===e.type(),a={name:e.name(),value:e.value()};for(const t of["http-only","secure","same-site","source-scheme","source-port"])e.hasAttribute(t)&&(a[t]=String(e.getAttribute(t)??!0));a.domain=e.domain()||(o?b(m.na):""),a.path=e.path()||(o?b(m.na):""),a.expires=e.maxAge()?t.TimeUtilities.secondsToString(Math.floor(e.maxAge())):e.expires()<0?g():e.expires()>i?b(m.timeAfter,{date:new Date(i).toISOString()}):e.expires()>0?new Date(e.expires()).toISOString():o?b(m.na):g(),e.expires()>i&&(a.expiresTooltip=b(m.timeAfterTooltip,{seconds:e.expires(),date:new Date(i).toISOString()})),a["partition-key-site"]=e.partitionKeyOpaque()?b(m.opaquePartitionKey):e.topLevelSite(),a["has-cross-site-ancestor"]=e.hasCrossSiteAncestor()?"true":"",a.size=String(e.size()),a.priority=e.priority(),a.priorityValue=["Low","Medium","High"].indexOf(e.priority());const r=this.cookieToBlockedReasons?.get(e)||[];for(const t of r){a.flagged=!0;const i=t.attribute||"name";a.icons=a.icons||{},i in a.icons?a.icons[i]&&(a.icons[i].title+="\n"+t.uiString):(a.icons[i]=new n.Icon.Icon,"name"===i&&s.RelatedIssue.hasThirdPartyPhaseoutCookieIssue(e)?(a.icons[i].name="warning-filled",a.icons[i].style.color="var(--icon-warning)",a.icons[i].style.width="14px",a.icons[i].style.height="14px",a.icons[i].onclick=()=>s.RelatedIssue.reveal(e),a.icons[i].style.cursor="pointer"):(a.icons[i].name="info",a.icons[i].style.width="14px",a.icons[i].style.height="14px"),a.icons[i].title=t.uiString)}const l=this.cookieToExemptionReason?.get(e)?.uiString;return l&&(a.icons=a.icons||{},a.flagged=!0,a.icons.name=new n.Icon.Icon,a.icons.name.name="info",a.icons.name.style.width="14px",a.icons.name.style.height="14px",a.icons.name.title=l),a.key=e.key(),a}isValidCookieData(e){return(Boolean(e.name)||Boolean(e.value))&&this.isValidDomain(e.domain)&&this.isValidPath(e.path)&&this.isValidDate(e.expires)&&this.isValidPartitionKey(e["partition-key-site"])}isValidDomain(t){if(!t)return!0;const i=e.ParsedURL.ParsedURL.fromString("http://"+t);return null!==i&&i.domain()===t}isValidPath(t){if(!t)return!0;const i=e.ParsedURL.ParsedURL.fromString("http://example.com"+t);return null!==i&&i.path===t}isValidDate(e){return!e||e===g()||!isNaN(Date.parse(e))}isValidPartitionKey(t){if(!t)return!0;return null!==e.ParsedURL.ParsedURL.fromString(t)}refresh(){this.refreshCallback&&this.refreshCallback()}populateContextMenu(t,i){const o=this.cookies.find((e=>e.key()===i.dataset.key));if(!o)return;const n=o;t.revealSection().appendItem(b(m.showRequestsWithThisCookie),(()=>{const t=a.UIFilter.UIRequestFilter.filters([{filterType:a.UIFilter.FilterType.CookieDomain,filterValue:n.domain()},{filterType:a.UIFilter.FilterType.CookieName,filterValue:n.name()}]);e.Revealer.reveal(t)}),{jslogContext:"show-requests-with-this-cookie"}),s.RelatedIssue.hasIssues(n)&&t.revealSection().appendItem(b(m.showIssueAssociatedWithThis),(()=>{s.RelatedIssue.reveal(n)}),{jslogContext:"show-issue-associated-with-this"})}}var f=Object.freeze({__proto__:null,CookiesTable:y});export{f as CookiesTable};
