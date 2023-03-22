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
    patch(prevVNode, vnode, container,null);
  }
  container._vnode = vnode
};
export const unmount = (vnode) => {
  const { shapeFlag, el } = vnode;
  if (shapeFlag & ShapeFlags.COMPONENT) {
    unmountComponent(vnode);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    unmountFragment(vnode);
  } else {
    console.dir(el);
    console.log(vnode);
    
    console.dir(el.parentNode);
    
    el.parentNode.removeChild(el);
  }
};
export const patch = (n1, n2, container,anchor) => {
  if (n1 && !isSameNode(n1, n2)) {
    anchor = (n1.anchor||n1.el).nextSibling
    unmount(n1);
    n1 = null;
  }
  const { shapeFlag } = n2;
  if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponent(n1, n2, container,anchor);
  } else if (shapeFlag & ShapeFlags.TEXT) {
    processText(n1, n2, container,anchor);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    processFragment(n1, n2, container,anchor);
  } else {
    processElement(n1, n2, container,anchor);
  }
};

export const processComponent = (n1, n2, container,anchor) => {};

export const unmountComponent = (vnode) => {

};

export const processFragment = (n1, n2, container,anchor) => {
  const fragmentStartAnchor = n1?n1.el:document.createTextNode('')
  const fragmentEndAnchor = n2.anchor?n2.anchor:document.createTextNode('')
  if (n1) {
    patchChildren(n1,n2,container,anchor)
  } else {
    container.insertBefore(fragmentStartAnchor,anchor)
    container.insertBefore(fragmentEndAnchor,anchor)
    mountChildren(n2.children, container,fragmentEndAnchor);
  }
};
export const unmountFragment = (vnode) => {
  let {el:cur,anchor:end} = vnode
  const {prarentNode} = cur
  while(cur!==end){
    const next = cur.nextSibling
    prarentNode.removeChild(cur)
    cur = next
  }
};
export const processText = (n1, n2, container,anchor) => {
  if (n1) {
    n2.el = n1.el;
    n1.el.textContent = n2.children;
  } else {
    mountTextNode(n2, container,anchor);
  }
};
export const processElement = (n1, n2, container,anchor) => {
  if (n1) {
    patchElement(n1, n2,anchor);
  } else {
    mountElement(n2, container,anchor);
  }
};
export const patchElement = (n1, n2,anchor) => {
  n2.el = n1.el;
  patchProps(n1.props, n2.props, n2.el);
  patchChildren(n1, n2, n2.el,anchor);
};
export const unmountChildren = (children)=>{
  children.forEach(child=>{
    unmount(child)
  })
}
export const pathchArrayChildren = (c1,c2,container,anchor)=>{
  const oldLength = c1.length
  const newLength = c2.length 
  const commonLength = Math.min(oldLength,newLength)
  for(let i =0;i< commonLength;i++){
    patch(c1[i],c2[i],container,anchor)
  } 
  if(oldLength>newLength){
    unmountChildren(c1.slice(commonLength))
  }
  if(oldLength<newLength){
    unmountChildren(c2.slice(commonLength))
  }
}
export const patchChildren = (n1, n2, container,anchor) => {
  
  const {shapeFlag:shapeFlagPrev,children:c1} = n1
  const {shapeFlag,children:c2} = n2
  if(shapeFlag & ShapeFlags.TEXT_CHILDREN){
    if(shapeFlagPrev & ShapeFlags.ARRAY_CHILDREN){
      unmountChildren(c1)
    }
    if(c1!==c2){
    container.textContent =  c2
    }
  }else if(shapeFlag & ShapeFlags.ARRAY_CHILDREN){
    if(shapeFlagPrev & ShapeFlags.TEXT_CHILDREN){
      container.textContent =  ''
      mountChildren(c2,container,anchor)
    }else if(shapeFlagPrev & ShapeFlags.ARRAY_CHILDREN){
      pathchArrayChildren(c1,c2,container,anchor)
    }else{
      mountChildren(c2,container,anchor)
    }
  }else{
    if(shapeFlagPrev & ShapeFlags.TEXT_CHILDREN){
      container.textContent =  ''
    }else if(shapeFlagPrev & ShapeFlags.ARRAY_CHILDREN){
      unmountChildren(c1)
    }
  }
};
export const isSameNode = (n1, n2) => {
  return n1.type === n2.type;
};
export const mountTextNode = (vnode, container,anchor) => {
  const textNode = document.createTextNode(vnode.children);
  // container.appendChild(textNode);
  container.insertBefore(textNode,anchor)
  vnode.el = textNode
};
export const mountFragment = (vnode, container,anchor) => {
  mountChildren(vnode, container,anchor);
};
export const mountChildren = (children, container,anchor) => {
  children.forEach((child) => {
    patch(null, child, container,anchor);
  });
};
export const mountElement = (vnode, container,anchor) => {
  const { shapeFlag, props, type, children } = vnode;
  const el = document.createElement(type);
  mountProps(props, el);
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountTextNode(vnode, el,anchor);
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el,anchor);
  }
  // if (props) {
  //   patchProps(null, props, el);
  // }
  // container.appendChild(el);
  container.insertBefore(el,anchor)
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
