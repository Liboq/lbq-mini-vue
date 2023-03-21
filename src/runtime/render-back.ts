/*
 * @Author: Liboq 99778162+Liboq@users.noreply.github.com
 * @Date: 2023-03-20 11:19:18
 * @LastEditors: Liboq 99778162+Liboq@users.noreply.github.com
 * @LastEditTime: 2023-03-21 12:23:12
 * @FilePath: \pikachu-mini-vue\src\runtime\render.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ShapeFlags } from "./vnode";
import { isBoolean } from "../utils/index";
export const render = (vnode, container) => {
  mount(vnode, container);
};
export const mount = (vnode, container) => {
  const { shapeFlag } = vnode;
  if (shapeFlag & ShapeFlags.ELEMENT) {
    mountElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.TEXT) {
    mountTextNode(vnode, container);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
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
  const textNode = document.createTextNode(vnode.children);
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
        el.className = value;
        break;
      case "style":
        for (const styleName in value) {
          el.style[styleName] = value[styleName];
        }
        break;
      default:
        if (/^on[^a-z]/.test(key)) {
          const eventName = key.slice(2).toLowerCase();
          el.addEventListener(eventName, value);
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
