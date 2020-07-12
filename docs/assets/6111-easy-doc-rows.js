const HOOK_MOUNT=1,HOOK_MOUNTED=2,HOOK_UPDATE=3,HOOK_UPDATED=4,HOOK_UNMOUNT=5,HOOK_CURRENT={};function update(e,t){e[0]&&(e[1]=e[0](e[1],t))}function updateAll(e,t){for(let n in e)update(e[n],t)}function useHook(e,t){if(HOOK_CURRENT.ref.hook)return HOOK_CURRENT.ref.hook.use(e,t)[1]}function useRender(){return HOOK_CURRENT.ref.render}function createHooks(e,t){let n,r={},s={use:function(e,t){let n,s=HOOK_CURRENT.index++;r[s]||(r[s]=[null,t],n=1);return r[s][0]=e,update(r[s],n?1:3),r[s]},load:function(e,t){HOOK_CURRENT.index=0,HOOK_CURRENT.ref=i;let n=e(t);return HOOK_CURRENT.ref=0,n},updated:function(){let e=n?4:2;n=1,updateAll(r,e)},unmount:function(){updateAll(r,5)}},i={hook:s,host:t,render:e};return s}function isEqualArray(e,t){let n=e.length;if(n!==t.length)return!1;for(let r=0;r<n;r++)if(e[r]!==t[r])return!1;return!0}const isFunction=e=>"function"==typeof e,isObject=e=>"object"==typeof e,KEY=Symbol(""),GLOBAL_ID=Symbol(""),FROM_PROP={id:1,className:1,checked:1,value:1,selected:1},WITH_ATTR={list:1,type:1,size:1,form:1,width:1,height:1,src:1},EMPTY_PROPS={},EMPTY_CHILDREN=[],TYPE_TEXT=3,TYPE_ELEMENT=1,$=document;function h(e,t,...n){return(n=flat((t=t||EMPTY_PROPS).children||n)).length||(n=EMPTY_CHILDREN),{type:e,props:t,children:n,key:t.key,shadow:t.shadowDom,raw:1==e.nodeType}}function render(e,t,n=GLOBAL_ID){diff(n,t,e)}function diff(e,t,n,r){let s;if(t&&t[e]&&t[e].vnode==n)return t;if((null!=n||!t)&&(r=r||"svg"==n.type,s="host"!=n.type&&(n.raw?t!=n.type:t?t.localName!=n.type:!t),s)){let e;if(null==n.type)return $.createTextNode(n+"");if(n.type.nodeType)return n.type;e=r?$.createElementNS("http://www.w3.org/2000/svg",n.type):$.createElement(n.type,n.is?{is:n.is}:null),t=e}if(3==t.nodeType)return n+="",t.data!=n&&(t.data=n||""),t;let i=t[e]?t[e].vnode:EMPTY_PROPS,l=i.props||EMPTY_PROPS,o=i.children||EMPTY_CHILDREN,u=s||!t[e]?{}:t[e].handlers;if(n.shadow&&(t.shadowRoot||t.attachShadow({mode:"open"})),n.props!=l&&diffProps(t,l,n.props,u,r),n.children!=o){diffChildren(e,n.shadow?t.shadowRoot:t,n.children,r)}return t[e]={vnode:n,handlers:u},t}function diffChildren(e,t,n,r){let s=n._,i=n.length,l=t.childNodes,o=l.length,u=s?0:o>i?i:o;for(;u<o;u++){let e=l[u];if(s){let t=e[KEY];if(s.has(t)){s.set(t,e);continue}}u--,o--,e.remove()}for(let o=0;o<i;o++){let i=n[o],u=l[o],a=s?i.key:o,c=s?s.get(a):u;if(s&&c&&c!=u&&t.insertBefore(c,u),s&&!i.key)continue;let f=diff(e,c,i,r);c?f!=c&&t.replaceChild(f,c):l[o]?t.insertBefore(f,l[o]):t.appendChild(f)}}function diffProps(e,t,n,r,s){for(let i in t)i in n||setProperty(e,i,t[i],null,s,r);for(let i in n)setProperty(e,i,t[i],n[i],s,r)}function setProperty(e,t,n,r,s,i){if(n=null==n?null:n,r=null==r?null:r,(t="class"!=t||s?t:"className")in e&&FROM_PROP[t]&&(n=e[t]),r!==n&&"shadowDom"!=t)if("o"==t[0]&&"n"==t[1]&&(isFunction(r)||isFunction(n)))setEvent(e,t,r,i);else if("key"==t)e[KEY]=r;else if("ref"==t)r&&(r.current=e);else if("style"==t){let t=e.style;r=r||"";let s=isObject(n=n||""),i=isObject(r);if(s)for(let e in n){if(!i)break;e in r||setPropertyStyle(t,e,null)}if(i)for(let e in r){let i=r[e];s&&n[e]===i||setPropertyStyle(t,e,i)}else t.cssText=r}else s||WITH_ATTR[t]||!(t in e)?null==r?e.removeAttribute(t):e.setAttribute(t,isObject(r)?JSON.stringify(r):r):e[t]=null==r?"":r}function setEvent(e,t,n,r){t=t.slice("-"==t[2]?3:2),r.handleEvent||(r.handleEvent=t=>r[t.type].call(e,t)),n?(r[t]||e.addEventListener(t,r),r[t]=n):r[t]&&(e.removeEventListener(t,r),delete r[t])}function setPropertyStyle(e,t,n){let r="setProperty";null==n&&(r="removeProperty",n=null),~t.indexOf("-")?e[r](t,n):e[t]=n}function flat(e,t=[]){for(let n=0;n<e.length;n++){let r=e[n];if(r){if(Array.isArray(r)){flat(r,t);continue}null!=r.key&&(t._||(t._=new Map),t._.set(r.key))}let s=typeof r;r=null==r||"boolean"==s||"function"==s?"":r,t.push(r)}return t}const Any=null;class BaseElement extends HTMLElement{constructor(){super(),this._create()}async _update(){if(!this._prevent){let e;this._prevent=!0,this.updated=new Promise(t=>e=t),await this.mounted,this._prevent=!1,this.update(),e()}}static get observedAttributes(){let{props:e={}}=this,t=[],n=[];for(let r in e)setProxy(this.prototype,r,e[r],n,t);return this.prototype._create=function(){this._attrs={},this._props={},t.forEach(e=>e(this)),this.mounted=new Promise(e=>this.mount=e),this.unmounted=new Promise(e=>this.unmount=e),this.create&&this.create(),this._update()},n}attributeChangedCallback(e,t,n){e!==this._ignoreAttr&&t!==n&&(this[this._attrs[e]]=n)}connectedCallback(){this.mount()}disconnectedCallback(){this.unmount()}}const dispatchEvent=(e,t,n)=>e.dispatchEvent(new CustomEvent(t,isObject(n)?n:null)),TRUE_VALUES=[!0,1,"","1","true"],NOT_CALLABLE=[Function,Any],getAttr=e=>e.replace(/([A-Z])/g,"-$1").toLowerCase(),reflectValue=(e,t,n,r)=>null==r||t==Boolean&&!r?e.removeAttribute(n):e.setAttribute(n,isObject(r)?JSON.stringify(r):t==Boolean?"":r);function setProxy(e,t,n,r,s){if(!(t in e)){let{type:i,reflect:l,event:o,value:u,attr:a=getAttr(t)}=isObject(n)&&n!=Any?n:{type:n},c=!NOT_CALLABLE.includes(i);r.push(a),Object.defineProperty(e,t,{set:function(e){let n=this[t],{error:r,value:s}=filterValue(i,c&&isFunction(e)?e(n):e);if(r&&null!=s)throw`The value defined for prop '${t}' must be of type '${i.name}'`;n!=s&&(this._props[t]=s,this._update(),this.updated.then(()=>{o&&dispatchEvent(this,o),l&&(this._ignoreAttr=a,reflectValue(this,i,a,this[t]),this._ignoreAttr=null)}))},get(){return this._props[t]}}),s.push(e=>{null!=u&&(e[t]=u),e._attrs[a]=t})}}function filterValue(e,t){if(e==Any)return{value:t};try{if(e==Boolean?t=TRUE_VALUES.includes(t):"string"==typeof t&&(t=e==Number?Number(t):e==Object||e==Array?JSON.parse(t):t),{}.toString.call(t)==`[object ${e.name}]`)return{value:t,error:e==Number&&Number.isNaN(t)}}catch(e){}return{value:t,error:!0}}function createCustomElement(e){let t=class extends BaseElement{async create(){let t=Symbol();this.update=()=>{render(n.load(e,{...this._props}),this,t),n.updated()};let n=createHooks(()=>this._update(),this);await this.unmounted,n.unmount()}};return t.props=e.props,t}const customElement=(e,t)=>isFunction(e)?createCustomElement(e):customElements.define(e,createCustomElement(t));function useHost(){return useHook(0,{current:HOOK_CURRENT.ref.host})}function useState(e){let t=useRender();return useHook((n,r)=>(1==r&&(n[0]=isFunction(e)?e():e,n[1]=e=>{(e=isFunction(e)?e(n[0]):e)!=n[0]&&(n[0]=e,t())}),n),[])}function useEffect(e,t){let n;useHook((r,s)=>{switch(null==n&&(n=!t||!r[0]||!isEqualArray(t,r[0]),r[0]=t),s){case 3:case 5:(n||5==s)&&r[1]&&(r[1](),r[1]=0),5==s&&(r[0]=null);break;case 2:case 4:(n||2==s)&&(r[1]=e())}return r},[])}const RESIZE_OBSERVER=Symbol("ResizeObserver"),CACHE_SIZES={};function useResizeObserver(e,t){let[n,r]=useState();return useEffect(()=>{let{current:n}=e;if(!n[RESIZE_OBSERVER]){let e,t=[],r=new ResizeObserver(([n])=>{r.entry=n,e||(e=!0,requestAnimationFrame(()=>{t.forEach(e=>e(n)),e=!1}))});r.handlers=t,r.observe(n),n[RESIZE_OBSERVER]=r}let{handlers:s,entry:i}=n[RESIZE_OBSERVER],l=e=>(t||r)(e);return s.push(l),i&&l(i),()=>{s.splice(s.indexOf(l)>>>0,1),s.length||(n[RESIZE_OBSERVER].disconnect(),delete n[RESIZE_OBSERVER])}},[e]),n}function useSize(e,t){let n=e=>{if(e){let{contentRect:{width:t,height:n}}=e;return[t,n]}return[]},r=t?e=>t(n(e)):null,s=useResizeObserver(e,r);return!r&&n(s)}function useStateSize(e,t){let n=getSizes(e),r=n.w&&n.h,[s,i]=useState(r?[]:null);return useSize(t,([e,t])=>i(s=>{let i=([e,t])=>{let r=e.find(([,e])=>e>=t);return r?r[0]:n.default},l=[n.w,e],o=[n.h,t];if(!r)return n.w?[l].map(i).find(e=>e):n.h?[o].map(i).find(e=>e):n.default;{let e=[l,o].map(i);if(!Array.isArray(s)||e.some((e,t)=>s[t]!==e))return e}return s})),s}function getSizes(e){if(CACHE_SIZES[e])return CACHE_SIZES[e];let t={};e.split(/ *, */).forEach(e=>{let n=e.match(/(.+)\s+(\d+)(w|h)$/);if(n){let[,e,r,s]=n;r=Number(r),t[s]=t[s]||[],t[s].push([e,r])}else t.default=e});let n=([,e],[,t])=>e>t?1:-1;for(let e in t)Array.isArray(t[e])&&t[e].sort(n);return CACHE_SIZES[e]=t}let style="\n    :host{display:grid};\n    slot{display:block;flex:0%}\n";function EasyDocRow({columns:e,gap:t}){let n=useHost();e=useStateSize(e,n),t=useStateSize(t,n);let{current:r}=n,s=[...r.children].map((e,t)=>{let n="slot-"+t;return e.setAttribute("slot",n),n});return h("host",{shadowDom:!0},h("style",null,style,`:host{${e?`grid-template-columns:${e};`:""}${t?`grid-gap:${t};`:""}}`),s.map(e=>h("slot",{name:e})))}EasyDocRow.props={columns:{type:String,value:"1fr 1fr 1fr, 1fr 1fr 720w, 1fr 520w"},gap:{type:String,value:"3rem"}},customElement("easy-doc-rows",EasyDocRow);
