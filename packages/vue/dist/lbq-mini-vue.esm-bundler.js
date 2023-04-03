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
    return typeof value === "string";
};
const isNumber = (value) => {
    return typeof value === "number";
};
const isBoolean = (value) => {
    return typeof value === "boolean";
};
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
};
const capitalize = (str) => {
    return str[0].toUpperCase() + str.slice(1);
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
        key: props && props.key,
        component: null
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

const domPropsRE = /[A-Z]|^(next|checked|selected|muted|disabled)$/;
const patchProps = (oldProps, newProps, el) => {
    if (oldProps === newProps) {
        return;
    }
    for (const key in newProps) {
        if (key === 'key') {
            continue;
        }
        const next = newProps[key];
        let prev;
        if (oldProps && oldProps[key]) {
            prev = oldProps[key] || "";
        }
        if (next !== prev) {
            patchDomProp(prev, next, key, el);
        }
    }
    oldProps = oldProps || {};
    newProps = newProps || {};
    for (const key in oldProps) {
        const next = newProps[key];
        const prev = oldProps[key] || null;
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
            if (effectStack.length - 1 > 0) {
                activeEffect = effectStack[effectStack.length - 1];
            }
            else {
                activeEffect = null;
            }
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
            effectFn.scheduler(effectFn);
        }
        else {
            effectFn();
        }
    });
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

const ref = (value) => {
    if (isRef(value)) {
        return value;
    }
    return new RefImple(value);
};
/*
ref实现类
*/
class RefImple {
    constructor(value) {
        this.__isRef = true;
        this._value = convert(value);
    }
    get value() {
        track(this, "value");
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(this._value, newValue)) {
            this._value = convert(newValue);
            trigger(this, "value");
        }
    }
}
const convert = (value) => {
    return isObject(value) ? reactive(value) : value;
};
const isRef = (value) => {
    return !!(value && value.__isRef);
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

const NodeTypes = {
    ROOT: "ROOT",
    ELEMENT: "ELEMENT",
    TEXT: "TEXT",
    SIMPLE_EXPRESSION: 'SIMPLE_EXPRESSION',
    INTERPOLATION: "INTERPOLATION",
    ATTRIBUTE: "ATTRIBUTE",
    DIRECTIVE: "DIRECTIVE"
};
const ElementTypes = {
    ELEMENT: 'ELEMENT',
    COMPONENT: "COMPONENT"
};
const createRoot = (children) => {
    return {
        type: NodeTypes.ROOT,
        children
    };
};

const parse = (content) => {
    const context = createParseContext(content);
    const children = parseChildren(context);
    return createRoot(children);
};
const createParseContext = (content) => {
    return {
        options: {
            delimiters: ["{{", "}}"],
            isVoidTag,
            isNativeTag
        },
        source: content
    };
};
const parseChildren = (context) => {
    const nodes = [];
    // 判断是否是</开头
    while (!isEnd(context)) {
        const s = context.source;
        let node;
        if (s.startsWith(context.options.delimiters[0])) {
            node = parseInterpolation(context);
        }
        else if (s[0] === '<') {
            node = parseElement(context);
        }
        else {
            node = parseText(context);
        }
        nodes.push(node);
    }
    let removedWhitespaces = false;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.type === NodeTypes.TEXT) {
            // 区分文本节点是否全为空白
            if (/[^\t\r\f\n ]/.test(node.content)) {
                // 文本节点的一些字符
                node.content = node.content.replace(/[\t\r\f\n ]+/g, " ");
            }
            else {
                const prev = nodes[i - 1];
                const next = nodes[i + 1];
                if (!prev || !next || (prev.type === NodeTypes.ELEMENT && next.type === NodeTypes.ELEMENT && /[\r\n]/.test(node.content))) {
                    // 删除空白节点
                    removedWhitespaces = true;
                    nodes[i] = null;
                }
                else {
                    node.content = " ";
                }
            }
        }
    }
    return removedWhitespaces ? nodes.filter(Boolean) : nodes;
};
const parseText = (context) => {
    const endTokens = ["<", context.options.delimiters[0]];
    let endIndex = context.source.length;
    for (let i = 0; i < endTokens.length; i++) {
        let index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && index < endIndex) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: NodeTypes.TEXT,
        content
    };
};
const parseTextData = (context, length) => {
    const text = context.source.slice(0, length);
    advanceBy(context, length);
    return text;
};
const parseInterpolation = (context) => {
    const [open, close] = context.options.delimiters;
    advanceBy(context, open.length);
    const closeIndex = context.source.indexOf(close);
    const content = parseTextData(context, closeIndex).trim();
    advanceBy(context, close.length);
    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content,
            isStatic: false
        }
    };
};
const parseElement = (context) => {
    // start
    const element = parseTag(context);
    if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
        return element;
    }
    // parseChildren
    element.children = parseChildren(context);
    // end tag
    parseTag(context);
    return element;
};
const parseTag = (context) => {
    const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length);
    advanceSpaces(context);
    const { props, directives } = parseAttributes(context);
    const isSelfClosing = context.source.startsWith('/>');
    advanceBy(context, isSelfClosing ? 2 : 1);
    const tagType = isComponent(tag, context)
        ? ElementTypes.COMPONENT
        : ElementTypes.ELEMENT;
    return {
        type: NodeTypes.ELEMENT,
        tag,
        tagType,
        props,
        directives,
        isSelfClosing,
        children: [],
    };
};
function isComponent(tag, context) {
    return !context.options.isNativeTag(tag);
}
function parseAttributes(context) {
    const props = [];
    const directives = [];
    while (context.source.length &&
        !context.source.startsWith('>') &&
        !context.source.startsWith('/>')) {
        let attr = parseAttribute(context);
        if (attr.type === NodeTypes.DIRECTIVE) {
            directives.push(attr);
        }
        else {
            props.push(attr);
        }
    }
    return { props, directives };
}
function parseAttribute(context) {
    const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
    const name = match[0];
    advanceBy(context, name.length);
    advanceSpaces(context);
    let value;
    if (context.source[0] === '=') {
        advanceBy(context, 1);
        advanceSpaces(context);
        value = parseAttributeValue(context);
        advanceSpaces(context);
    }
    // Directive
    if (/^(:|@|v-)/.test(name)) {
        let dirName, argContent;
        if (name[0] === ':') {
            dirName = 'bind';
            argContent = name.slice(1);
        }
        else if (name[0] === '@') {
            dirName = 'on';
            argContent = name.slice(1);
        }
        else if (name.startsWith('v-')) {
            [dirName, argContent] = name.slice(2).split(':');
        }
        return {
            type: NodeTypes.DIRECTIVE,
            name: dirName,
            exp: value && {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: value.content,
                isStatic: false,
            },
            arg: argContent && {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: camelize(argContent),
                isStatic: true,
            }, // 表达式节点
        };
    }
    // Attribute
    return {
        type: NodeTypes.ATTRIBUTE,
        name,
        value: value && {
            type: NodeTypes.TEXT,
            content: value.content,
        },
    };
}
const parseAttributeValue = (context) => {
    const quote = context.source[0];
    advanceBy(context, 1);
    const endIndex = context.source.indexOf(quote);
    const content = parseTextData(context, endIndex);
    advanceBy(context, 1);
    return { content };
};
const advanceSpaces = (context) => {
    const match = /^[\t\r\n\f ]+/.exec(context.source);
    if (match) {
        advanceBy(context, match[0].length);
    }
};
const isEnd = (context) => {
    const s = context.source;
    return s.startsWith('</') || !s;
};
const advanceBy = (context, numberOfCharacters) => {
    context.source = context.source.slice(numberOfCharacters);
};

const generate = (ast) => {
    const returns = traverseNode(ast);
    const code = `with(ctx){
        const {h,Text,Fragment,readerList,withModel,resloveComponent} = miniVue;
        return  ${returns}
    }`;
    return code;
};
const traverseNode = (node, parent) => {
    switch (node.type) {
        case NodeTypes.ROOT:
            if (node.children.length === 1) {
                return traverseNode(node.children[0], node);
            }
            let result = traverseChildren(node);
            result = result.slice(1, -1);
            return result;
        case NodeTypes.ELEMENT:
            return resolveElementASTNode(node, parent);
        case NodeTypes.INTERPOLATION:
            return createTextVNode(node.content);
        case NodeTypes.TEXT:
            return createTextVNode(node);
    }
};
const traverseChildren = (node) => {
    const { children } = node;
    if (children.length === 1) {
        const child = children[0];
        if (child.type === NodeTypes.TEXT) {
            return createText(child);
        }
        if (child.type === NodeTypes.INTERPOLATION) {
            return createText(child.content);
        }
    }
    const results = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        results.push(traverseNode(child, node));
    }
    return `[${results.join(", ")}]`;
};
// 专门处理特殊指令
const resolveElementASTNode = (node, parent) => {
    const ifNode = pluck(node.directives, "if") || pluck(node.directives, "else-if");
    if (ifNode) {
        let consequent = resolveElementASTNode(node, parent);
        let alternate;
        const { children } = parent;
        let i = children.findIndex((child) => child === node) + 1;
        for (; i < children.length; i++) {
            const sibling = children[i];
            if (sibling.type === NodeTypes.TEXT && !sibling.content.trim()) {
                children.splice(i, 1);
                i--;
                continue;
            }
            if (sibling.type === NodeTypes.ELEMENT) {
                if (pluck(sibling.directives, "else") ||
                    pluck(sibling.directives, "else-if", false)) {
                    alternate = resolveElementASTNode(sibling, parent);
                    children.splice(i, 1);
                }
            }
            break;
        }
        const { exp } = ifNode;
        return `${exp.content} ? ${consequent} : ${alternate || createTextVNode()}`;
    }
    const forNode = pluck(node.directives, "for");
    if (forNode) {
        const { exp } = forNode;
        const [args, source] = exp.content.split(/\sin\s|\sof\s/);
        return `h(Fragment, null, renderList(${source.trim()}, ${args.trim()} => ${resolveElementASTNode(node, parent)}))`;
    }
    return createElementVNode(node);
};
const createElementVNode = (node) => {
    const { children, tagType } = node;
    const tag = tagType === NodeTypes.ELEMENT
        ? `"${node.tag}"`
        : `resolveComponent("${node.tag}")`;
    const propArr = createPropArr(node);
    let propStr = propArr.length ? `{ ${propArr.join(", ")} }` : "null";
    const vmodel = pluck(node.directives, "model");
    if (vmodel) {
        const getter = `()=>${createText(vmodel.exp)}`;
        const setter = `(value)=>${createText(vmodel.exp)} = value`;
        propStr = `withModle(${tag},${propStr},${getter},${setter})`;
    }
    if (!children.length) {
        if (propStr === "null") {
            return `h(${tag})`;
        }
        return `h(${tag}, ${propStr})`;
    }
    let childrenStr = traverseChildren(node);
    return `h(${tag}, ${propStr}, ${childrenStr})`;
};
const createPropArr = (node) => {
    const { props, directives } = node;
    return [
        ...props.map((prop) => `${prop.name}: ${createText(prop.value)}`),
        ...directives.map((dir) => {
            switch (dir.name) {
                case "bind":
                    return `${dir.arg.content}: ${createText(dir.exp)}`;
                case "on":
                    const eventName = `on${capitalize(dir.arg.content)}`;
                    let exp = dir.exp.content;
                    if (/\([^)]*?\)$/.test(exp) && !exp.includes("=>")) {
                        exp = `$event => (${exp})`;
                    }
                    return `${eventName}: ${exp}`;
                case "html":
                    return `innerHTML: ${createText(dir.exp)} `;
                default:
                    return `${dir.name}: ${createText(dir.exp)}`;
            }
        }),
    ];
};
const createTextVNode = (node) => {
    const child = createText(node);
    return `h(Text, null, ${child})`;
};
const createText = ({ isStatic = true, content = "" } = {}) => {
    return isStatic ? JSON.stringify(content) : content;
};
const pluck = (directives, name, remove = true) => {
    const index = directives.findIndex((dir) => dir.name === name);
    const dir = directives[index];
    if (index > -1 && remove) {
        directives.splice(index, 1);
    }
    return dir;
};

const compile = (template) => {
    const ast = parse(template);
    return generate(ast);
};

const HTML_TAGS = 'html,body,base,head,link,meta,style,title,address,article,aside,footer,' +
    'header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,div,dd,dl,dt,figcaption,' +
    'figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,' +
    'data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,s,samp,small,span,strong,sub,sup,' +
    'time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,' +
    'canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,' +
    'th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,' +
    'option,output,progress,select,textarea,details,dialog,menu,' +
    'summary,template,blockquote,iframe,tfoot';
const VOID_TAGS = 'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr';
function makeMap(str) {
    const map = str
        .split(',')
        .reduce((map, item) => ((map[item] = true), map), Object.create(null));
    return (val) => !!map[val];
}
const isVoidTag = makeMap(VOID_TAGS);
const isNativeTag = makeMap(HTML_TAGS);

function mountComponent(vnode, container, anchor, patch) {
    var _a;
    const { type: Component } = vnode;
    const instance = (vnode.component = {
        props: null,
        attrs: null,
        setupState: null,
        ctx: null,
        subTree: null,
        isMounted: false,
        update: null,
        next: null,
    });
    updateProps(instance, vnode);
    instance.setupState = (_a = Component.setup) === null || _a === void 0 ? void 0 : _a.call(Component, instance.props, {
        attrs: instance.attrs,
    });
    instance.ctx = Object.assign(Object.assign({}, instance.props), instance.setupState);
    if (!Component.render && Component.template) {
        let { template } = Component;
        if (template[0] === '#') {
            const el = document.querySelector(template);
            template = el ? el.innerHTML : '';
        }
        const code = compile(template);
        Component.render = new Function('ctx', code);
        console.log(Component.render);
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
                // 被动更新
                vnode = instance.next;
                instance.next = null;
                updateProps(instance, vnode);
                instance.ctx = Object.assign(Object.assign({}, instance.props), instance.setupState);
            }
            const prev = instance.subTree;
            const subTree = (instance.subTree = normalizeVNode(Component.render(instance.ctx)));
            fallThrough(instance, subTree);
            patch(prev, subTree, container, anchor);
            vnode.el = subTree.el;
        }
    }, {
        scheduler: queueJob,
    });
}
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
    if (shapeFlag & ShapeFlags.COMPONENT) {
        unmountComponent(vnode);
    }
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
const unmountComponent = (vnode) => {
    unmount(vnode.component.subTree);
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
const patchUnkeyedChildren = (c1, c2, container, anchor) => {
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
        mountChildren(c2.slice(commonLength), container, anchor);
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
            if (c1[0] && c1[0].key != null && c2[0] && c2[0].key != null) {
                pathchkeyedArrayChildren(c1, c2, container, anchor);
            }
            else {
                patchUnkeyedChildren(c1, c2, container, anchor);
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
    if (anchor && anchor.textContent == '') {
        container.appendChild(textNode);
    }
    else {
        container.insertBefore(textNode, anchor);
    }
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
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        mountTextNode(vnode, el, anchor);
    }
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(children, el, anchor);
    }
    if (props) {
        patchProps(null, props, el);
    }
    // container.appendChild(el);
    container.insertBefore(el, anchor);
    vnode.el = el;
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
// const Comp = {
//   props: ['text'],
//   render(ctx) {
//     return h('div', null, ctx.text);
//   },
// };
// render(
//   h(Fragment, null, [
//     h(Comp, { text: 'text1' },'1'),
//     h(Comp, { text: 'text2' },'2'),
//     h(Comp, { id: 'id' },'3'),
//   ]),
//   document.body
// );
// render(
//   h('div', null, [h(Fragment, null, [h('h1',null,''), h(Text, null, 'child')])]),
//   document.body
// );
// const Comp = {
//   render() {
//     return h('p', null, 'comp');
//   },
// };
// render(h('div', null, [h(Comp,null,'')]), document.body);
const value = ref(true);
let childVnode1;
let childVnode2;
const Parent = {
    render: () => {
        // let Parent first rerender
        return (h(Child));
    },
};
const Child = {
    render: () => {
        return value.value
            ? (childVnode1 = h('div', null, `${value.value}`))
            : (childVnode2 = h('span', null, 2));
    },
};
setTimeout(() => {
    value.value = false;
    console.log(value.value);
    console.dir(childVnode1, childVnode2);
}, 5000);
render(h(Parent), document.body);
console.dir(childVnode1, childVnode2);
//# sourceMappingURL=lbq-mini-vue.esm-bundler.js.map
