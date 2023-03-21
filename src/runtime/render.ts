import { isBoolean } from "../utils/index";
import { patchProps } from "./patchProps";
import { ShapeFlags } from "./vnode";
export const render = (vnode, container) => {
  const prevVNode = container._vnode;
  if (!vnode) {
    if (prevVNode) {
      unmount(prevVNode);
    }
  } else {
    patch(prevVNode, vnode, container);
  }
};
export const unmount = (vnode) => {
  const { shapeFlag, el } = vnode;
  if (shapeFlag & ShapeFlags.COMPONENT) {
    unmountComponent(vnode);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    unmountFragment(vnode);
  } else {
    el.parentNode.removeChild(el);
  }
};
export const patch = (n1, n2, container) => {
  if (n1 && !isSameNode(n1, n2)) {
    unmount(n1);
    n1 = null;
  }
  const { shapeFlag } = n2;
  if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponent(n1, n2, container);
  } else if (shapeFlag & ShapeFlags.TEXT) {
    processText(n1, n2, container);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    processFragment(n1, n2, container);
  } else {
    processElement(n1, n2, container);
  }
};

export const processComponent = (n1, n2, container) => {};

export const unmountComponent = (vnode) => {};

export const processFragment = (n1, n2, container) => {
  if (n1) {
    patchChildren(n1,n2,container)
  } else {
    mountChildren(n2.children, container);
  }
};
export const unmountFragment = (vnode) => {};
export const processText = (n1, n2, container) => {
  if (n1) {
    n2.el = n1.el;
    n1.el.textContent = n2.children;
  } else {
    mountTextNode(n2, container);
  }
};
export const processElement = (n1, n2, container) => {
  if (n1) {
    patchElement(n1, n2);
  } else {
    mountElement(n2, container);
  }
};
export const patchElement = (n1, n2) => {
  n2.el = n1.el;
  patchProps(n1.props, n2.props, n2.el);
  patchChildren(n1, n2, n2.el);
};
export const unmountChildren = (children)=>{
  children.forEach(child=>{
    unmount(child)
  })
}
export const pathchArrayChildren = (c1,c2,container)=>{
  const oldLength = c1.length
  const newLength = c2.length 
  const commonLength = Math.min(oldLength,newLength)
  for(let i =0;i< commonLength;i++){
    patch(c1[i],c2[i],container)
  } 
  if(oldLength>newLength){
    unmountChildren(c1.slice(commonLength))
  }
  if(oldLength<newLength){
    unmountChildren(c2.slice(commonLength))
  }
}
export const patchChildren = (n1, n2, container) => {
  const {shapeFlage:shapeFlagePrev,children:c1} = n1
  const {shapeFlag,children:c2} = n2
  if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
    if(shapeFlagePrev & ShapeFlags.ARRAY_CHILDREN){
      unmountChildren(c1)
    }
    if(c1!==c2){
    container.textcontent =  c2
    }
  }else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
    if(shapeFlagePrev & ShapeFlags.TEXT_CHILDREN){
      container.textcontent =  ''
      mountChildren(c2,container)

    }else if(shapeFlagePrev & ShapeFlags.ARRAY_CHILDREN){
      pathchArrayChildren(c1,c2,container)
    }else{
      mountChildren(c2,container)
    }
  }else{
    if(shapeFlagePrev & ShapeFlags.TEXT_CHILDREN){
      container.textcontent =  ''
    }else if(shapeFlagePrev & ShapeFlags.ARRAY_CHILDREN){
      unmountChildren(c1)
    }
  }
};
export const isSameNode = (n1, n2) => {
  return n1.type === n2.type;
};
export const mountTextNode = (vnode, container) => {
  const textNode = document.createTextNode(vnode.children);
  container.appendChild(textNode);
};
export const mountFragment = (vnode, container) => {
  mountChildren(vnode, container);
};
export const mountChildren = (children, container) => {
  children.forEach((child) => {
    patch(null, child, container);
  });
};
export const mountElement = (vnode, container) => {
  const { shapeFlag, props, type, children } = vnode;
  const el = document.createElement(type);
  mountProps(props, el);
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountTextNode(vnode, el);
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el);
  }
  container.appendChild(el);
  vnode.el = el
};
const domPropsRE = /[A-Z]|^(next|checked|selected|muted|disabled)$/;

export const mountProps = (props, el) => {
  for (const key in props) {
    let next = props[key];
    switch (key) {
      case "class":
        el.className = next;
        break;
      case "style":
        for (const styleName in next) {
          el.style[styleName] = next[styleName];
        }
        break;
      default:
        if (/^on[^a-z]/.test(key)) {
          const eventName = key.slice(2).toLowerCase();
          el.addEventListener(eventName, next);
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
  }
};
