const isArray = (value) => {
    return Array.isArray(value);
};
const isString = (value) => {
    return typeof value === 'string';
};
const isNumber = (value) => {
    return typeof value === 'number';
};
const isBoolean = (value) => {
    return typeof value === 'boolean';
};

/*
 * @Author: Liboq 99778162+Liboq@users.noreply.github.com
 * @Date: 2023-03-20 09:57:02
 * @LastEditors: Liboq 99778162+Liboq@users.noreply.github.com
 * @LastEditTime: 2023-03-21 12:20:49
 */
const ShapeFlags = {
    ELEMENT: 1,
    TEXT: 1 << 1,
    FRAGMENT: 1 << 2,
    COMPONENT: 1 << 3,
    TEXT_CHILDREN: 1 << 4,
    ARRAY_CHILDREN: 1 << 5,
    CHILDREN: (1 << 4) | (1 << 5),
};
const Text = Symbol("Text");
const Fragment = Symbol("Fragment");
/**
 * @description:
 * @param {String | Object | Text | Fragement } type
 * @param {Object | null} props
 * @param {String | Array | Object | null} children
 * @return vnode
 */
const h = (type, props, children) => {
    let shapeFlag = 0;
    if (isString(type)) {
        shapeFlag = ShapeFlags.ELEMENT;
    }
    else if (type === Text) {
        shapeFlag = ShapeFlags.TEXT;
    }
    else if (type === Fragment) {
        shapeFlag = ShapeFlags.FRAGMENT;
    }
    else {
        shapeFlag = ShapeFlags.COMPONENT;
    }
    if (isString(children) || isNumber(children)) {
        shapeFlag |= ShapeFlags.TEXT_CHILDREN;
        children = children.toString();
    }
    else if (isArray(children)) {
        shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    }
    return {
        type,
        props,
        children,
        shapeFlag,
    };
};

/*
 * @Author: Liboq 99778162+Liboq@users.noreply.github.com
 * @Date: 2023-03-20 11:19:18
 * @LastEditors: Liboq 99778162+Liboq@users.noreply.github.com
 * @LastEditTime: 2023-03-21 12:23:12
 * @FilePath: \pikachu-mini-vue\src\runtime\render.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const render = (vnode, container) => {
    mount(vnode, container);
};
const mount = (vnode, container) => {
    const { shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.ELEMENT) {
        mountElement(vnode, container);
    }
    else if (shapeFlag & ShapeFlags.TEXT) {
        mountTextNode(vnode, container);
    }
    else if (shapeFlag & ShapeFlags.FRAGMENT) {
        mountFragment(vnode, container);
    }
    else ;
};
const mountElement = (vnode, container) => {
    const { props, type } = vnode;
    const el = document.createElement(type);
    mountProps(props, el);
    mountChildren(vnode, el);
    container.appendChild(el);
};
const mountTextNode = (vnode, container) => {
    const textNode = document.createTextNode(vnode.children);
    container.appendChild(textNode);
};
const mountFragment = (vnode, container) => {
    mountChildren(vnode, container);
};
const mountChildren = (vnode, container) => {
    const { shapeFlag, children } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        mountTextNode(vnode, container);
    }
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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
const mountProps = (props, el) => {
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
                }
                else if (domPropsRE.test(key)) {
                    if (value === "" && isBoolean(el[key])) {
                        value = true;
                    }
                    el[key] = value;
                }
                else {
                    if (value == null || value === false) {
                        el.removeAttribute(key);
                    }
                    else {
                        el.setAttribute(key, value);
                    }
                }
                break;
        }
    }
};

const vnode = h('div', {
    class: 'a b',
    style: {
        border: '1px solid',
        fontSize: '14px'
    },
    onClick: () => console.log('click'),
    id: 'foo',
    checked: '',
    custom: false
}, [
    h('ul', null, [
        h('li', { style: { color: 'red' } }, 1),
        h('li', null, 2),
        h('li', { style: { color: 'blue' } }, 3),
        h('Fragment', null, [
            h('li', null, null),
        ]),
        h('li', { style: { color: 'red' } }, 1),
    ])
]);
render(vnode, document.body);
//# sourceMappingURL=lbq-mini-vue.esm-bundler.js.map
