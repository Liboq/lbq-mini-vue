import { ShapeFlags } from "./vnode";
import { isBoolean } from "../utils/index";
export const render = (vnode, container) => {
  mount(vnode, container);
};
export const mount = (vnode, container) => {
  const { ShapeFlag } = vnode;
  if (ShapeFlag & ShapeFlags.ELEMENT) {
    mountElement(vnode, container);
  } else if (ShapeFlag & ShapeFlags.TEXT) {
    mountTextNode(vnode, container);
  } else if (ShapeFlag & ShapeFlags.FRAGMENT) {
    mountFragment(vnode, container);
  } else {
    mountComponent(vnode, container);
  }
};
export const mountElement = (vnode, container) => {
  const { props, type } = vnode;
  const el = document.createElement(type);
  mountProps(props, el);
  mountChildren(vnode, el);
  container.appendChild(el);
};
export const mountTextNode = (vnode, container) => {
  const textNode = document.createTextNode(vnode);
  container.appendChild(textNode);
};
export const mountComponent = (vnode, container) => {};
export const mountFragment = (vnode, container) => {
  mountChildren(vnode, container);
};
export const mountChildren = (vnode, container) => {
  const { shapeFlag, children } = vnode;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountTextNode(vnode, container);
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    children.forEach((child) => {
      mount(child, container);
    });
  }
};
/* 
{
  class: 'a b',
  style: {
    color: 'red',
    fontSize: '14px',
  },
  onClick: () => console.log('click'),
  checked: '',
  custom: false
}
+. */
const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;

export const mountProps = (props, el) => {
  for (const key in props) {
    let value = props[key];
    switch (key) {
      case "class":
        el.className = "value";
        break;
      case "style":
        for (const styleName in value) {
          el.style[styleName] = value[styleName];
        }
        break;
      default:
        if (/^on[^a-z]/.test(key)) {
          const eventName = key.slice(2).toUpperCase();
          el.addEventListner(eventName, value);
        } else if (domPropsRE.test(key)) {
          if (value === "" && isBoolean(el[key])) {
            value = true;
          }
          el[key] = value;
        } else {
          if (value == null || value === false) {
            el.removeAttribute(key);
          } else {
            el.setAttribute(key, value);
          }
        }
        break;
    }
  }
};
