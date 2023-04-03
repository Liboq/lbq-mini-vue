import { isBoolean } from "../utils/index";
const domPropsRE = /[A-Z]|^(next|checked|selected|muted|disabled)$/;
export const patchProps = (oldProps, newProps, el) => {
    if (oldProps === newProps) {
      return;
    }
    for (const key in newProps) {
      if(key === 'key'){
        continue
      }
      const next = newProps[key];
      let prev
      if(oldProps&&oldProps[key]){
         prev = oldProps[key] || "";
      }
      if (next !== prev) {
        patchDomProp(prev, next, key, el);
      } 
    }
    oldProps = oldProps || {}
    newProps = newProps || {}
    for(const key in oldProps){
      const next = newProps[key];
      const prev = oldProps[key] || null;
      if (key !== 'key'&&next  == null) {
        patchDomProp(prev, null, key, el);
      } 
    }
  };
  // 属性比较
  export const patchDomProp = (prev, next, key, el) => {
    switch (key) {
      case "class":
        el.className = next || "";
        break;
      case "style":
        if(next == null){
          el.removeAttribute("style")
        }
        for (const styleName in next) {
          el.style[styleName] = next[styleName];
        }
        if (prev) {
          for (const styleName in prev) {
            if (next[styleName] == null) {
              el.style[styleName] = "";
            }
          }
        }
        break;
      default:
        if (/^on[^a-z]/.test(key)) {
          const eventName = key.slice(2).toLowerCase();
          if (prev) {
            el.removeEventListener(eventName, prev);
          }
          if (next) {
            el.addEventListener(eventName, next);
          }
        } else if (domPropsRE.test(key)) {
          if (next === "" && isBoolean(el[key])) {
            next = true;
          }
          el[key] = next;
        } else {
          if (next == null || next === false) {
            el.removeAttribute(key);
          } else {
            el.setAttribute(key, next);
          }
        }
        break;
    }
  };