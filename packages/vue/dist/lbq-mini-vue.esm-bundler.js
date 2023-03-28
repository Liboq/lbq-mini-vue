const isObject = (target) => {
    return typeof target === "object" && target !== null;
};
const hasChanged = (oldValue, value) => {
    return value !== oldValue && !(Number.isNaN(oldValue) && Number.isNaN(value));
};
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
        anchor: null,
        key: props && props.key
    };
};
function normalizeVNode(result) {
    if (isArray(result)) {
        return h(Fragment, null, result);
    }
    if (isObject(result)) {
        return result;
    }
    // string, number
    return h(Text, null, result.toString());
}

const domPropsRE$1 = /[A-Z]|^(next|checked|selected|muted|disabled)$/;
const patchProps = (oldProps, newProps, el) => {
    if (oldProps === newProps) {
        return;
    }
    for (const key in newProps) {
        if (key === 'key') {
            continue;
        }
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
        if (key !== 'key' && next == null) {
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

const effectStack = [];
let activeEffect;
/*
相当于watch 监听 函数中元素是否为reactive 如果为reactive  元素变动则引起函数执行
*/
const effect = (fn, options = {}) => {
    const effectFn = () => {
        try {
            activeEffect = effectFn;
            effectStack.push(activeEffect);
            return fn();
        }
        finally {
            effectStack.pop();
            activeEffect = effectStack[effectStack.length - 1];
        }
    };
    if (!options.lazy) {
        effectFn();
    }
    effectFn.scheduler = options.scheduler;
    return effectFn;
};
/*
当target里的值被引用时存储 activeEffect，监听它
 */
const targetMap = new WeakMap();
const track = (target, key) => {
    if (!activeEffect) {
        return;
    }
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let deps = depsMap.get(key);
    if (!deps) {
        depsMap.set(key, (deps = new Set()));
    }
    deps.add(activeEffect);
};
const trigger = (target, key) => {
    const depsMap = targetMap.get(target);
    if (!depsMap) {
        return;
    }
    const deps = depsMap.get(key);
    if (!deps) {
        return;
    }
    deps.forEach((effectFn) => {
        if (effectFn.scheduler) {
            effectFn.scheduler();
        }
        else {
            effectFn();
        }
    });
};

const queue = [];
let isFlushing = false;
const resolvePromise = Promise.resolve();
const queueJob = (job) => {
    if (!queue.length && !queue.includes(job)) {
        queue.push(job);
        queueFlush();
    }
};
const queueFlush = () => {
    if (!isFlushing) {
        isFlushing = true;
        resolvePromise.then(flushJobs);
    }
};
const flushJobs = () => {
    try {
        for (let i = 0; i < queue.length; i++) {
            const job = queue[i];
            job();
        }
    }
    catch (error) {
        isFlushing = false;
        queue.lengh = 0;
    }
};

/*
 * @Author: Liboq 99778162+Liboq@users.noreply.github.com
 * @Date: 2023-03-16 09:43:51
 * @LastEditors: Liboq 99778162+Liboq@users.noreply.github.com
 * @LastEditTime: 2023-03-20 16:28:40
 * @FilePath: \pikachu-mini-vue\src\reactivity\reactive.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const proxyMap = new WeakMap();
/*
通过 proxy 监听 对象的存取
*/
const reactive = (target) => {
    if (!isObject(target)) {
        return;
    }
    if (isReactive(target)) {
        return target;
    }
    if (proxyMap.has(target)) {
        return proxyMap.get(target);
    }
    const proxy = new Proxy(target, {
        get(target, key, recevier) {
            if (key === "__isReactive") {
                return true;
            }
            const res = Reflect.get(target, key, recevier);
            track(target, key);
            return isObject(res) ? reactive(res) : res;
        },
        set(target, key, value, receiver) {
            let oldLength = target.length;
            let oldValue = target[key];
            const res = Reflect.set(target, key, value, receiver);
            if (hasChanged(oldValue, value)) {
                trigger(target, key);
                if (isArray(target) && hasChanged(oldLength, target.length)) {
                    trigger(target, length);
                }
            }
            return res;
        },
    });
    proxyMap.set(target, proxy);
    return proxy;
};
//   处理特例
const isReactive = (target) => {
    return !!(target && target.__isReactive);
};

const mountComponent = (vnode, container, anchor, patch) => {
    var _a;
    const { type: Component } = vnode;
    const instance = (vnode.component = {
        props: {},
        attrs: null,
        setupState: {},
        ctx: {},
        subTree: null,
        isMounted: false,
        update: effect,
        next: null,
    });
    updateProps(instance, vnode);
    instance.setupState = (_a = Component.setup) === null || _a === void 0 ? void 0 : _a.call(Component, instance.props, {
        attrs: instance.attrs,
    });
    instance.ctx = Object.assign(Object.assign({}, instance.props), instance.setupState);
    if (!Component.render && Component.template) {
        let { template } = Component;
        if (template[0] === "#") {
            const el = document.querySelector(template);
            template = el ? el.innerHTML : "";
        }
        // 编译
        // const code = compile(template)
        // Component.render = new Function('ctx',code)
        // console.log(Component.render);
    }
    instance.update = effect(() => {
        if (!instance.isMounted) {
            // mount
            const subTree = (instance.subTree = normalizeVNode(Component.render(instance.ctx)));
            fallThrough(instance, subTree);
            patch(null, subTree, container, anchor);
            vnode.el = subTree.el;
            instance.isMounted = true;
        }
        else {
            // update
            if (instance.next) {
                vnode = instance.next;
                instance.next = null;
                updateProps(instance, vnode);
                instance.ctx = Object.assign(Object.assign({}, instance.props), instance.setupState);
            }
            const prev = instance.subTree;
            const subTree = (instance.subTree = normalizeVNode(Component.reder(instance.ctx)));
            fallThrough(prev, subTree);
            patch(prev, subTree, container, anchor);
            vnode.el = subTree.el;
        }
    }, {
        scheduler: queueJob
    });
};
const updateProps = (instance, vnode) => {
    var _a;
    const { type: Component, props: vnodeProps } = vnode;
    const props = (instance.props = {});
    const attrs = (instance.attrs = {});
    for (const key in vnodeProps) {
        if ((_a = Component.props) === null || _a === void 0 ? void 0 : _a.includes(key)) {
            props[key] = vnodeProps[key];
        }
        else {
            attrs[key] = vnodeProps[key];
        }
    }
    instance.props = reactive(instance.props);
};
const fallThrough = (instance, subTree) => {
    if (Object.keys(instance.attrs).length) {
        subTree.props = Object.assign(Object.assign({}, subTree.props), instance.attrs);
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
    if (shapeFlag & ShapeFlags.COMPONENT) {
        processComponent(n1, n2, container, anchor);
    }
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
const processComponent = (n1, n2, container, anchor) => {
    if (n1) {
        updateComponent(n1, n2);
    }
    else {
        mountComponent(n2, container, anchor, patch);
    }
};
const updateComponent = (n1, n2) => {
    n2.component = n1.component;
    n2.component.next = n2;
    n2.component.update();
};
const processFragment = (n1, n2, container, anchor) => {
    const fragmentStartAnchor = n1 ? n1.el : document.createTextNode("");
    const fragmentEndAnchor = n2.anchor ? n2.anchor : document.createTextNode("");
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
    children.forEach((child) => {
        unmount(child);
    });
};
// vue3 的diff算法
const pathchkeyedArrayChildren = (c1, c2, container, anchor) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    while (i <= e1 && i <= e2 && c1[i].key === c2[i].key) {
        patch(c1[i], c2[i], container, anchor);
        i++;
    }
    while (i <= e1 && i <= e2 && c1[e1].key === c2[e2].key) {
        patch(c1[i], c2[i], container, anchor);
        i++;
        e1--;
        e2--;
    }
    if (i > e1) {
        // 若是 c1，c2中旧节点对比完成，则只剩下c2中新节点，则剩下的全部mount
        for (let j = i; j < e2; j++) {
            const nextPos = e2 + 1;
            const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor;
            patch(null, c2[j], container, curAnchor);
        }
    }
    else if (i > e2) {
        // 若是 c1，c2中旧节点对比完成，则只剩下c1中旧节点，则剩下的全部unMount
        for (let j = i; j < e1; j++) {
            unmount(e1[j]);
        }
    }
    else {
        //  若都不满足前面的，则采取传统的differ算法，只是不真的对其进行移动和添加，而是将其删除和标记起来
        const map = new Map();
        for (let j = i; j < e1; j++) {
            const prev = c1[j];
            map.set(prev.key, { prev, j });
        }
        // maxNewIndexSoFar 如果从旧数组中找到的位置小于naxNewIndexSoFar,则判断它是上升趋势，不需要移动此元素位置 用来判断是否需要移动新的元素
        let maxNewIndexSoFar = 0;
        let move = false;
        let source = new Array(e2 - i + 1).fill(-1);
        let toMounted = [];
        for (let k = 0; k < source.length; k++) {
            const next = c2[k + i];
            if (map.has(next.key)) {
                const { prev, j } = map.get(next.key);
                patch(prev, next, container, anchor);
                if (j < maxNewIndexSoFar) {
                    move = true;
                }
                else {
                    maxNewIndexSoFar = j;
                }
                source[k] = j;
                map.delete(next.key);
            }
            else {
                toMounted.push(k + i);
            }
        }
        map.forEach(({ prev }) => {
            unmount(prev);
        });
        if (move) {
            // 获取最长递增子序列，-1表示新增
            const seq = goodLengthOfLTS(source);
            let j = seq.length - 1;
            for (let k = source.length - 1; k > 0; k--) {
                if (seq[j] === k) {
                    // 不用移动
                    j--;
                }
                else {
                    const pos = k + i;
                    const nextPos = pos + 1;
                    const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor;
                    if (source[k] === -1) {
                        // mount
                        patch(null, c2[pos], container, curAnchor);
                    }
                    else {
                        // 移动
                        container.insertBefore(c2[pos].el, curAnchor);
                    }
                }
            }
        }
        else if (toMounted.length) {
            // 不需要移动，但是存在需要更新的元素
            // 例如
            //  abc
            //  axbyc
            // source:[0,-1,1,-1,2]
            // seq:[0,2,4]
            for (let k = toMounted.length; k < 0; k--) {
                const pos = toMounted[k];
                const nextPos = pos + 1;
                const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor;
                patch(null, c2[pos], container, curAnchor);
            }
        }
    }
};
// 二分查找法
// 这里用一个position 把 元素 放到某个位置 存起来 然后 和arr中数组进行比较 
// 先计算出最长上升数组 [1,3,8,9]
// 然后计算出最长上升数组对应上方source数组的下标数组为[2,3,4,5]
const goodLengthOfLTS = (nums) => {
    const arr = [nums[0]];
    const position = [0];
    for (let i = 1; i < nums.length; i++) {
        if (nums[i] === -1) {
            continue;
        }
        if (nums[i] > arr[arr.length - 1]) {
            arr.push(nums[i]);
            position.push(arr.length - 1);
        }
        else {
            let l = 0;
            let r = arr.length - 1;
            while (l <= r) {
                let mid = Math.floor((1 + r) / 2);
                if (nums[i] > arr[mid]) {
                    l = mid + 1;
                }
                else if (nums[i] < arr[mid]) {
                    r = mid - 1;
                }
                else {
                    l = mid;
                    break;
                }
            }
            arr[l] = nums[i];
            position.push(l);
        }
    }
    let cur = arr.length - 1;
    for (let i = position.length - 1; i >= 0 && cur >= 0; i--) {
        if (position[i] === cur) {
            arr[cur--] = i;
        }
    }
    return arr;
};
const pathchUnkeyedArrayChildren = (c1, c2, container, anchor) => {
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
            container.textContent = "";
            mountChildren(c2, container, anchor);
        }
        else if (shapeFlagPrev & ShapeFlags.ARRAY_CHILDREN) {
            if (c1[0   ]) {
                pathchkeyedArrayChildren(c1, c2, container, anchor);
            }
            else {
                pathchUnkeyedArrayChildren(c1, c2, container, anchor);
            }
        }
        else {
            mountChildren(c2, container, anchor);
        }
    }
    else {
        if (shapeFlagPrev & ShapeFlags.TEXT_CHILDREN) {
            container.textContent = "";
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

// const vnode = 
//         h("ul", null, [
//           h("li", { style: { color: "red" } }, 1),
//           h("li", null, 2),
//           h("li", { style: { color: "blue" } }, 3),
//           h(Fragment, null, [h("li", null, null)]),
//           h("li", { style: { color: "red" } }, 1),
//         ])
//     ;
// render(vnode, document.body);
// setTimeout(() => {
//   render(
//         h("ul", null, [
//           h("li", { style: { color: "green" } }, 5),
//           h("li", null, 8),
//           h("li", { style: { color: "red" } }, 6),
//           h(Fragment, null, [h("li", null, "middle")]),
//           h("li", { style: { color: "blue" } }, 7),
//         ]),
//     document.body
//   );
// },2000);
const vnode1 = [
    {
        type: "h1",
        props: null,
        children: "1",
        shapeFlag: 17,
        el: {},
        anchor: null,
        key: null,
    },
    {
        type: "h2",
        props: null,
        children: "1",
        shapeFlag: 17,
        el: {},
        anchor: null,
        key: null,
    },
    {
        type: "h3",
        props: null,
        children: "1",
        shapeFlag: 17,
        el: {},
        anchor: null,
        key: null,
    },
    {
        type: "h4",
        props: null,
        children: "1",
        shapeFlag: 17,
        el: {},
        anchor: null,
        key: null,
    },
    {
        type: "h5",
        props: null,
        children: "1",
        shapeFlag: 17,
        el: {},
        anchor: null,
        key: null,
    },
    {
        type: "h6",
        props: null,
        children: "1",
        shapeFlag: 17,
        el: {},
        anchor: null,
        key: null,
    },
];
render(h('div', null, vnode1), document.body);
//# sourceMappingURL=lbq-mini-vue.esm-bundler.js.map
