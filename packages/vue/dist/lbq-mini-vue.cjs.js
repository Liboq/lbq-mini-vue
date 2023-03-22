'use strict';

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
 * @LastEditTime: 2023-03-21 17:32:53
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
        el: null,
        anchor: null
    };
};

const domPropsRE$1 = /[A-Z]|^(next|checked|selected|muted|disabled)$/;
const patchProps = (oldProps, newProps, el) => {
    if (oldProps === newProps) {
        return;
    }
    for (const key in newProps) {
        const next = newProps[key];
        const prev = oldProps[key];
        if (next !== prev) {
            patchDomProp(prev, next, key, el);
        }
    }
    oldProps = oldProps || {};
    newProps = newProps || {};
    for (const key in oldProps) {
        const next = newProps[key];
        const prev = oldProps[key];
        if (next == null) {
            patchDomProp(prev, null, key, el);
        }
    }
};
// 属性比较
const patchDomProp = (prev, next, key, el) => {
    switch (key) {
        case "class":
            el.className = next || "";
            break;
        case "style":
            if (next == null) {
                el.removeAttribute("style");
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
            }
            else if (domPropsRE$1.test(key)) {
                if (next === "" && isBoolean(el[key])) {
                    next = true;
                }
                el[key] = next;
            }
            else {
                if (next == null || next === false) {
                    el.removeAttribute(key);
                }
                else {
                    el.setAttribute(key, next);
                }
            }
            break;
    }
};

const render = (vnode, container) => {
    const prevVNode = container._vnode;
    if (!vnode) {
        if (prevVNode) {
            unmount(prevVNode);
        }
    }
    else {
        patch(prevVNode, vnode, container, null);
    }
    container._vnode = vnode;
};
const unmount = (vnode) => {
    const { shapeFlag, el } = vnode;
    if (shapeFlag & ShapeFlags.COMPONENT) ;
    else if (shapeFlag & ShapeFlags.FRAGMENT) {
        unmountFragment(vnode);
    }
    else {
        console.dir(el);
        console.log(vnode);
        console.dir(el.parentNode);
        el.parentNode.removeChild(el);
    }
};
const patch = (n1, n2, container, anchor) => {
    if (n1 && !isSameNode(n1, n2)) {
        anchor = (n1.anchor || n1.el).nextSibling;
        unmount(n1);
        n1 = null;
    }
    const { shapeFlag } = n2;
    if (shapeFlag & ShapeFlags.COMPONENT) ;
    else if (shapeFlag & ShapeFlags.TEXT) {
        processText(n1, n2, container, anchor);
    }
    else if (shapeFlag & ShapeFlags.FRAGMENT) {
        processFragment(n1, n2, container, anchor);
    }
    else {
        processElement(n1, n2, container, anchor);
    }
};
const processFragment = (n1, n2, container, anchor) => {
    const fragmentStartAnchor = n1 ? n1.el : document.createTextNode('');
    const fragmentEndAnchor = n2.anchor ? n2.anchor : document.createTextNode('');
    if (n1) {
        patchChildren(n1, n2, container, anchor);
    }
    else {
        container.insertBefore(fragmentStartAnchor, anchor);
        container.insertBefore(fragmentEndAnchor, anchor);
        mountChildren(n2.children, container, fragmentEndAnchor);
    }
};
const unmountFragment = (vnode) => {
    let { el: cur, anchor: end } = vnode;
    const { prarentNode } = cur;
    while (cur !== end) {
        const next = cur.nextSibling;
        prarentNode.removeChild(cur);
        cur = next;
    }
};
const processText = (n1, n2, container, anchor) => {
    if (n1) {
        n2.el = n1.el;
        n1.el.textContent = n2.children;
    }
    else {
        mountTextNode(n2, container, anchor);
    }
};
const processElement = (n1, n2, container, anchor) => {
    if (n1) {
        patchElement(n1, n2, anchor);
    }
    else {
        mountElement(n2, container, anchor);
    }
};
const patchElement = (n1, n2, anchor) => {
    n2.el = n1.el;
    patchProps(n1.props, n2.props, n2.el);
    patchChildren(n1, n2, n2.el, anchor);
};
const unmountChildren = (children) => {
    children.forEach(child => {
        unmount(child);
    });
};
const pathchArrayChildren = (c1, c2, container, anchor) => {
    const oldLength = c1.length;
    const newLength = c2.length;
    const commonLength = Math.min(oldLength, newLength);
    for (let i = 0; i < commonLength; i++) {
        patch(c1[i], c2[i], container, anchor);
    }
    if (oldLength > newLength) {
        unmountChildren(c1.slice(commonLength));
    }
    if (oldLength < newLength) {
        unmountChildren(c2.slice(commonLength));
    }
};
const patchChildren = (n1, n2, container, anchor) => {
    const { shapeFlag: shapeFlagPrev, children: c1 } = n1;
    const { shapeFlag, children: c2 } = n2;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        if (shapeFlagPrev & ShapeFlags.ARRAY_CHILDREN) {
            unmountChildren(c1);
        }
        if (c1 !== c2) {
            container.textContent = c2;
        }
    }
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlagPrev & ShapeFlags.TEXT_CHILDREN) {
            container.textContent = '';
            mountChildren(c2, container, anchor);
        }
        else if (shapeFlagPrev & ShapeFlags.ARRAY_CHILDREN) {
            pathchArrayChildren(c1, c2, container, anchor);
        }
        else {
            mountChildren(c2, container, anchor);
        }
    }
    else {
        if (shapeFlagPrev & ShapeFlags.TEXT_CHILDREN) {
            container.textContent = '';
        }
        else if (shapeFlagPrev & ShapeFlags.ARRAY_CHILDREN) {
            unmountChildren(c1);
        }
    }
};
const isSameNode = (n1, n2) => {
    return n1.type === n2.type;
};
const mountTextNode = (vnode, container, anchor) => {
    const textNode = document.createTextNode(vnode.children);
    // container.appendChild(textNode);
    container.insertBefore(textNode, anchor);
    vnode.el = textNode;
};
const mountChildren = (children, container, anchor) => {
    children.forEach((child) => {
        patch(null, child, container, anchor);
    });
};
const mountElement = (vnode, container, anchor) => {
    const { shapeFlag, props, type, children } = vnode;
    const el = document.createElement(type);
    mountProps(props, el);
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        mountTextNode(vnode, el, anchor);
    }
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(children, el, anchor);
    }
    // if (props) {
    //   patchProps(null, props, el);
    // }
    // container.appendChild(el);
    container.insertBefore(el, anchor);
    vnode.el = el;
};
const domPropsRE = /[A-Z]|^(next|checked|selected|muted|disabled)$/;
const mountProps = (props, el) => {
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
                }
                else if (domPropsRE.test(key)) {
                    if (next === "" && isBoolean(el[key])) {
                        next = true;
                    }
                    el[key] = next;
                }
                else {
                    if (next == null || next === false) {
                        el.removeAttribute(key);
                    }
                    else {
                        el.setAttribute(key, next);
                    }
                }
                break;
        }
    }
};

const vnode = h("ul", null, [
    h("li", { style: { color: "red" } }, 1),
    h("li", null, 2),
    h("li", { style: { color: "blue" } }, 3),
    h(Fragment, null, [h("li", null, null)]),
    h("li", { style: { color: "red" } }, 1),
]);
render(vnode, document.body);
setTimeout(() => {
    render(h("ul", null, [
        h("li", { style: { color: "green" } }, 5),
        h("li", null, 8),
        h("li", { style: { color: "red" } }, 6),
        h(Fragment, null, [h("li", null, "middle")]),
        h("li", { style: { color: "blue" } }, 7),
    ]), document.body);
}, 2000);
//# sourceMappingURL=lbq-mini-vue.cjs.js.map
