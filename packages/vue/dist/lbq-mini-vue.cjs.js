'use strict';

var require$$0$1 = require('os');
var require$$1$1 = require('tty');
var require$$0$2 = require('util');

const isArray$2 = (value) => {
    return Array.isArray(value);
};
const isString$3 = (value) => {
    return typeof value === 'string';
};
const isNumber$2 = (value) => {
    return typeof value === 'number';
};
const isBoolean$2 = (value) => {
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
    if (isString$3(type)) {
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
    if (isString$3(children) || isNumber$2(children)) {
        shapeFlag |= ShapeFlags.TEXT_CHILDREN;
        children = children.toString();
    }
    else if (isArray$2(children)) {
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
                if (next === "" && isBoolean$2(el[key])) {
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
            const seq = getSequence();
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
const getSequence = (source) => {
    return [];
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
                    if (next === "" && isBoolean$2(el[key])) {
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

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getAugmentedNamespace(n) {
  if (n.__esModule) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			if (this instanceof a) {
				var args = [null];
				args.push.apply(args, arguments);
				var Ctor = Function.bind.apply(f, args);
				return new Ctor();
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var matchers = {};

var toBeInTheDom = {};

var utils = {};

var interopRequireDefaultExports = {};
var interopRequireDefault = {
  get exports(){ return interopRequireDefaultExports; },
  set exports(v){ interopRequireDefaultExports = v; },
};

(function (module) {
	function _interopRequireDefault(obj) {
	  return obj && obj.__esModule ? obj : {
	    "default": obj
	  };
	}
	module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;
} (interopRequireDefault));

var minIndent;
var hasRequiredMinIndent;

function requireMinIndent () {
	if (hasRequiredMinIndent) return minIndent;
	hasRequiredMinIndent = 1;
	minIndent = string => {
		const match = string.match(/^[ \t]*(?=\S)/gm);

		if (!match) {
			return 0;
		}

		return match.reduce((r, a) => Math.min(r, a.length), Infinity);
	};
	return minIndent;
}

var stripIndent;
var hasRequiredStripIndent;

function requireStripIndent () {
	if (hasRequiredStripIndent) return stripIndent;
	hasRequiredStripIndent = 1;
	const minIndent = requireMinIndent();

	stripIndent = string => {
		const indent = minIndent(string);

		if (indent === 0) {
			return string;
		}

		const regex = new RegExp(`^[ \\t]{${indent}}`, 'gm');

		return string.replace(regex, '');
	};
	return stripIndent;
}

var indentString;
var hasRequiredIndentString;

function requireIndentString () {
	if (hasRequiredIndentString) return indentString;
	hasRequiredIndentString = 1;

	indentString = (string, count = 1, options) => {
		options = {
			indent: ' ',
			includeEmptyLines: false,
			...options
		};

		if (typeof string !== 'string') {
			throw new TypeError(
				`Expected \`input\` to be a \`string\`, got \`${typeof string}\``
			);
		}

		if (typeof count !== 'number') {
			throw new TypeError(
				`Expected \`count\` to be a \`number\`, got \`${typeof count}\``
			);
		}

		if (typeof options.indent !== 'string') {
			throw new TypeError(
				`Expected \`options.indent\` to be a \`string\`, got \`${typeof options.indent}\``
			);
		}

		if (count === 0) {
			return string;
		}

		const regex = options.includeEmptyLines ? /^/gm : /^(?!\s*$)/gm;

		return string.replace(regex, options.indent.repeat(count));
	};
	return indentString;
}

var redent;
var hasRequiredRedent;

function requireRedent () {
	if (hasRequiredRedent) return redent;
	hasRequiredRedent = 1;
	const stripIndent = requireStripIndent();
	const indentString = requireIndentString();

	redent = (string, count = 0, options) => indentString(stripIndent(string), count, options);
	return redent;
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */

var _listCacheClear;
var hasRequired_listCacheClear;

function require_listCacheClear () {
	if (hasRequired_listCacheClear) return _listCacheClear;
	hasRequired_listCacheClear = 1;
	function listCacheClear() {
	  this.__data__ = [];
	  this.size = 0;
	}

	_listCacheClear = listCacheClear;
	return _listCacheClear;
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */

var eq_1;
var hasRequiredEq;

function requireEq () {
	if (hasRequiredEq) return eq_1;
	hasRequiredEq = 1;
	function eq(value, other) {
	  return value === other || (value !== value && other !== other);
	}

	eq_1 = eq;
	return eq_1;
}

var _assocIndexOf;
var hasRequired_assocIndexOf;

function require_assocIndexOf () {
	if (hasRequired_assocIndexOf) return _assocIndexOf;
	hasRequired_assocIndexOf = 1;
	var eq = requireEq();

	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
	  var length = array.length;
	  while (length--) {
	    if (eq(array[length][0], key)) {
	      return length;
	    }
	  }
	  return -1;
	}

	_assocIndexOf = assocIndexOf;
	return _assocIndexOf;
}

var _listCacheDelete;
var hasRequired_listCacheDelete;

function require_listCacheDelete () {
	if (hasRequired_listCacheDelete) return _listCacheDelete;
	hasRequired_listCacheDelete = 1;
	var assocIndexOf = require_assocIndexOf();

	/** Used for built-in method references. */
	var arrayProto = Array.prototype;

	/** Built-in value references. */
	var splice = arrayProto.splice;

	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  if (index < 0) {
	    return false;
	  }
	  var lastIndex = data.length - 1;
	  if (index == lastIndex) {
	    data.pop();
	  } else {
	    splice.call(data, index, 1);
	  }
	  --this.size;
	  return true;
	}

	_listCacheDelete = listCacheDelete;
	return _listCacheDelete;
}

var _listCacheGet;
var hasRequired_listCacheGet;

function require_listCacheGet () {
	if (hasRequired_listCacheGet) return _listCacheGet;
	hasRequired_listCacheGet = 1;
	var assocIndexOf = require_assocIndexOf();

	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet(key) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  return index < 0 ? undefined : data[index][1];
	}

	_listCacheGet = listCacheGet;
	return _listCacheGet;
}

var _listCacheHas;
var hasRequired_listCacheHas;

function require_listCacheHas () {
	if (hasRequired_listCacheHas) return _listCacheHas;
	hasRequired_listCacheHas = 1;
	var assocIndexOf = require_assocIndexOf();

	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas(key) {
	  return assocIndexOf(this.__data__, key) > -1;
	}

	_listCacheHas = listCacheHas;
	return _listCacheHas;
}

var _listCacheSet;
var hasRequired_listCacheSet;

function require_listCacheSet () {
	if (hasRequired_listCacheSet) return _listCacheSet;
	hasRequired_listCacheSet = 1;
	var assocIndexOf = require_assocIndexOf();

	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet(key, value) {
	  var data = this.__data__,
	      index = assocIndexOf(data, key);

	  if (index < 0) {
	    ++this.size;
	    data.push([key, value]);
	  } else {
	    data[index][1] = value;
	  }
	  return this;
	}

	_listCacheSet = listCacheSet;
	return _listCacheSet;
}

var _ListCache;
var hasRequired_ListCache;

function require_ListCache () {
	if (hasRequired_ListCache) return _ListCache;
	hasRequired_ListCache = 1;
	var listCacheClear = require_listCacheClear(),
	    listCacheDelete = require_listCacheDelete(),
	    listCacheGet = require_listCacheGet(),
	    listCacheHas = require_listCacheHas(),
	    listCacheSet = require_listCacheSet();

	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `ListCache`.
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;

	_ListCache = ListCache;
	return _ListCache;
}

var _stackClear;
var hasRequired_stackClear;

function require_stackClear () {
	if (hasRequired_stackClear) return _stackClear;
	hasRequired_stackClear = 1;
	var ListCache = require_ListCache();

	/**
	 * Removes all key-value entries from the stack.
	 *
	 * @private
	 * @name clear
	 * @memberOf Stack
	 */
	function stackClear() {
	  this.__data__ = new ListCache;
	  this.size = 0;
	}

	_stackClear = stackClear;
	return _stackClear;
}

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */

var _stackDelete;
var hasRequired_stackDelete;

function require_stackDelete () {
	if (hasRequired_stackDelete) return _stackDelete;
	hasRequired_stackDelete = 1;
	function stackDelete(key) {
	  var data = this.__data__,
	      result = data['delete'](key);

	  this.size = data.size;
	  return result;
	}

	_stackDelete = stackDelete;
	return _stackDelete;
}

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */

var _stackGet;
var hasRequired_stackGet;

function require_stackGet () {
	if (hasRequired_stackGet) return _stackGet;
	hasRequired_stackGet = 1;
	function stackGet(key) {
	  return this.__data__.get(key);
	}

	_stackGet = stackGet;
	return _stackGet;
}

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */

var _stackHas;
var hasRequired_stackHas;

function require_stackHas () {
	if (hasRequired_stackHas) return _stackHas;
	hasRequired_stackHas = 1;
	function stackHas(key) {
	  return this.__data__.has(key);
	}

	_stackHas = stackHas;
	return _stackHas;
}

/** Detect free variable `global` from Node.js. */

var _freeGlobal;
var hasRequired_freeGlobal;

function require_freeGlobal () {
	if (hasRequired_freeGlobal) return _freeGlobal;
	hasRequired_freeGlobal = 1;
	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

	_freeGlobal = freeGlobal;
	return _freeGlobal;
}

var _root;
var hasRequired_root;

function require_root () {
	if (hasRequired_root) return _root;
	hasRequired_root = 1;
	var freeGlobal = require_freeGlobal();

	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function('return this')();

	_root = root;
	return _root;
}

var _Symbol;
var hasRequired_Symbol;

function require_Symbol () {
	if (hasRequired_Symbol) return _Symbol;
	hasRequired_Symbol = 1;
	var root = require_root();

	/** Built-in value references. */
	var Symbol = root.Symbol;

	_Symbol = Symbol;
	return _Symbol;
}

var _getRawTag;
var hasRequired_getRawTag;

function require_getRawTag () {
	if (hasRequired_getRawTag) return _getRawTag;
	hasRequired_getRawTag = 1;
	var Symbol = require_Symbol();

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = objectProto.toString;

	/** Built-in value references. */
	var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

	/**
	 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the raw `toStringTag`.
	 */
	function getRawTag(value) {
	  var isOwn = hasOwnProperty.call(value, symToStringTag),
	      tag = value[symToStringTag];

	  try {
	    value[symToStringTag] = undefined;
	    var unmasked = true;
	  } catch (e) {}

	  var result = nativeObjectToString.call(value);
	  if (unmasked) {
	    if (isOwn) {
	      value[symToStringTag] = tag;
	    } else {
	      delete value[symToStringTag];
	    }
	  }
	  return result;
	}

	_getRawTag = getRawTag;
	return _getRawTag;
}

/** Used for built-in method references. */

var _objectToString;
var hasRequired_objectToString;

function require_objectToString () {
	if (hasRequired_objectToString) return _objectToString;
	hasRequired_objectToString = 1;
	var objectProto = Object.prototype;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var nativeObjectToString = objectProto.toString;

	/**
	 * Converts `value` to a string using `Object.prototype.toString`.
	 *
	 * @private
	 * @param {*} value The value to convert.
	 * @returns {string} Returns the converted string.
	 */
	function objectToString(value) {
	  return nativeObjectToString.call(value);
	}

	_objectToString = objectToString;
	return _objectToString;
}

var _baseGetTag;
var hasRequired_baseGetTag;

function require_baseGetTag () {
	if (hasRequired_baseGetTag) return _baseGetTag;
	hasRequired_baseGetTag = 1;
	var Symbol = require_Symbol(),
	    getRawTag = require_getRawTag(),
	    objectToString = require_objectToString();

	/** `Object#toString` result references. */
	var nullTag = '[object Null]',
	    undefinedTag = '[object Undefined]';

	/** Built-in value references. */
	var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

	/**
	 * The base implementation of `getTag` without fallbacks for buggy environments.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	function baseGetTag(value) {
	  if (value == null) {
	    return value === undefined ? undefinedTag : nullTag;
	  }
	  return (symToStringTag && symToStringTag in Object(value))
	    ? getRawTag(value)
	    : objectToString(value);
	}

	_baseGetTag = baseGetTag;
	return _baseGetTag;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */

var isObject_1;
var hasRequiredIsObject;

function requireIsObject () {
	if (hasRequiredIsObject) return isObject_1;
	hasRequiredIsObject = 1;
	function isObject(value) {
	  var type = typeof value;
	  return value != null && (type == 'object' || type == 'function');
	}

	isObject_1 = isObject;
	return isObject_1;
}

var isFunction_1;
var hasRequiredIsFunction;

function requireIsFunction () {
	if (hasRequiredIsFunction) return isFunction_1;
	hasRequiredIsFunction = 1;
	var baseGetTag = require_baseGetTag(),
	    isObject = requireIsObject();

	/** `Object#toString` result references. */
	var asyncTag = '[object AsyncFunction]',
	    funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    proxyTag = '[object Proxy]';

	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	  if (!isObject(value)) {
	    return false;
	  }
	  // The use of `Object#toString` avoids issues with the `typeof` operator
	  // in Safari 9 which returns 'object' for typed arrays and other constructors.
	  var tag = baseGetTag(value);
	  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
	}

	isFunction_1 = isFunction;
	return isFunction_1;
}

var _coreJsData;
var hasRequired_coreJsData;

function require_coreJsData () {
	if (hasRequired_coreJsData) return _coreJsData;
	hasRequired_coreJsData = 1;
	var root = require_root();

	/** Used to detect overreaching core-js shims. */
	var coreJsData = root['__core-js_shared__'];

	_coreJsData = coreJsData;
	return _coreJsData;
}

var _isMasked;
var hasRequired_isMasked;

function require_isMasked () {
	if (hasRequired_isMasked) return _isMasked;
	hasRequired_isMasked = 1;
	var coreJsData = require_coreJsData();

	/** Used to detect methods masquerading as native. */
	var maskSrcKey = (function() {
	  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
	  return uid ? ('Symbol(src)_1.' + uid) : '';
	}());

	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked(func) {
	  return !!maskSrcKey && (maskSrcKey in func);
	}

	_isMasked = isMasked;
	return _isMasked;
}

/** Used for built-in method references. */

var _toSource;
var hasRequired_toSource;

function require_toSource () {
	if (hasRequired_toSource) return _toSource;
	hasRequired_toSource = 1;
	var funcProto = Function.prototype;

	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;

	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to convert.
	 * @returns {string} Returns the source code.
	 */
	function toSource(func) {
	  if (func != null) {
	    try {
	      return funcToString.call(func);
	    } catch (e) {}
	    try {
	      return (func + '');
	    } catch (e) {}
	  }
	  return '';
	}

	_toSource = toSource;
	return _toSource;
}

var _baseIsNative;
var hasRequired_baseIsNative;

function require_baseIsNative () {
	if (hasRequired_baseIsNative) return _baseIsNative;
	hasRequired_baseIsNative = 1;
	var isFunction = requireIsFunction(),
	    isMasked = require_isMasked(),
	    isObject = requireIsObject(),
	    toSource = require_toSource();

	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;

	/** Used for built-in method references. */
	var funcProto = Function.prototype,
	    objectProto = Object.prototype;

	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
	  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);

	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative(value) {
	  if (!isObject(value) || isMasked(value)) {
	    return false;
	  }
	  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
	  return pattern.test(toSource(value));
	}

	_baseIsNative = baseIsNative;
	return _baseIsNative;
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */

var _getValue;
var hasRequired_getValue;

function require_getValue () {
	if (hasRequired_getValue) return _getValue;
	hasRequired_getValue = 1;
	function getValue(object, key) {
	  return object == null ? undefined : object[key];
	}

	_getValue = getValue;
	return _getValue;
}

var _getNative;
var hasRequired_getNative;

function require_getNative () {
	if (hasRequired_getNative) return _getNative;
	hasRequired_getNative = 1;
	var baseIsNative = require_baseIsNative(),
	    getValue = require_getValue();

	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	  var value = getValue(object, key);
	  return baseIsNative(value) ? value : undefined;
	}

	_getNative = getNative;
	return _getNative;
}

var _Map;
var hasRequired_Map;

function require_Map () {
	if (hasRequired_Map) return _Map;
	hasRequired_Map = 1;
	var getNative = require_getNative(),
	    root = require_root();

	/* Built-in method references that are verified to be native. */
	var Map = getNative(root, 'Map');

	_Map = Map;
	return _Map;
}

var _nativeCreate;
var hasRequired_nativeCreate;

function require_nativeCreate () {
	if (hasRequired_nativeCreate) return _nativeCreate;
	hasRequired_nativeCreate = 1;
	var getNative = require_getNative();

	/* Built-in method references that are verified to be native. */
	var nativeCreate = getNative(Object, 'create');

	_nativeCreate = nativeCreate;
	return _nativeCreate;
}

var _hashClear;
var hasRequired_hashClear;

function require_hashClear () {
	if (hasRequired_hashClear) return _hashClear;
	hasRequired_hashClear = 1;
	var nativeCreate = require_nativeCreate();

	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear() {
	  this.__data__ = nativeCreate ? nativeCreate(null) : {};
	  this.size = 0;
	}

	_hashClear = hashClear;
	return _hashClear;
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */

var _hashDelete;
var hasRequired_hashDelete;

function require_hashDelete () {
	if (hasRequired_hashDelete) return _hashDelete;
	hasRequired_hashDelete = 1;
	function hashDelete(key) {
	  var result = this.has(key) && delete this.__data__[key];
	  this.size -= result ? 1 : 0;
	  return result;
	}

	_hashDelete = hashDelete;
	return _hashDelete;
}

var _hashGet;
var hasRequired_hashGet;

function require_hashGet () {
	if (hasRequired_hashGet) return _hashGet;
	hasRequired_hashGet = 1;
	var nativeCreate = require_nativeCreate();

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(key) {
	  var data = this.__data__;
	  if (nativeCreate) {
	    var result = data[key];
	    return result === HASH_UNDEFINED ? undefined : result;
	  }
	  return hasOwnProperty.call(data, key) ? data[key] : undefined;
	}

	_hashGet = hashGet;
	return _hashGet;
}

var _hashHas;
var hasRequired_hashHas;

function require_hashHas () {
	if (hasRequired_hashHas) return _hashHas;
	hasRequired_hashHas = 1;
	var nativeCreate = require_nativeCreate();

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(key) {
	  var data = this.__data__;
	  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
	}

	_hashHas = hashHas;
	return _hashHas;
}

var _hashSet;
var hasRequired_hashSet;

function require_hashSet () {
	if (hasRequired_hashSet) return _hashSet;
	hasRequired_hashSet = 1;
	var nativeCreate = require_nativeCreate();

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';

	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet(key, value) {
	  var data = this.__data__;
	  this.size += this.has(key) ? 0 : 1;
	  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
	  return this;
	}

	_hashSet = hashSet;
	return _hashSet;
}

var _Hash;
var hasRequired_Hash;

function require_Hash () {
	if (hasRequired_Hash) return _Hash;
	hasRequired_Hash = 1;
	var hashClear = require_hashClear(),
	    hashDelete = require_hashDelete(),
	    hashGet = require_hashGet(),
	    hashHas = require_hashHas(),
	    hashSet = require_hashSet();

	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `Hash`.
	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;

	_Hash = Hash;
	return _Hash;
}

var _mapCacheClear;
var hasRequired_mapCacheClear;

function require_mapCacheClear () {
	if (hasRequired_mapCacheClear) return _mapCacheClear;
	hasRequired_mapCacheClear = 1;
	var Hash = require_Hash(),
	    ListCache = require_ListCache(),
	    Map = require_Map();

	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear() {
	  this.size = 0;
	  this.__data__ = {
	    'hash': new Hash,
	    'map': new (Map || ListCache),
	    'string': new Hash
	  };
	}

	_mapCacheClear = mapCacheClear;
	return _mapCacheClear;
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */

var _isKeyable;
var hasRequired_isKeyable;

function require_isKeyable () {
	if (hasRequired_isKeyable) return _isKeyable;
	hasRequired_isKeyable = 1;
	function isKeyable(value) {
	  var type = typeof value;
	  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
	    ? (value !== '__proto__')
	    : (value === null);
	}

	_isKeyable = isKeyable;
	return _isKeyable;
}

var _getMapData;
var hasRequired_getMapData;

function require_getMapData () {
	if (hasRequired_getMapData) return _getMapData;
	hasRequired_getMapData = 1;
	var isKeyable = require_isKeyable();

	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData(map, key) {
	  var data = map.__data__;
	  return isKeyable(key)
	    ? data[typeof key == 'string' ? 'string' : 'hash']
	    : data.map;
	}

	_getMapData = getMapData;
	return _getMapData;
}

var _mapCacheDelete;
var hasRequired_mapCacheDelete;

function require_mapCacheDelete () {
	if (hasRequired_mapCacheDelete) return _mapCacheDelete;
	hasRequired_mapCacheDelete = 1;
	var getMapData = require_getMapData();

	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete(key) {
	  var result = getMapData(this, key)['delete'](key);
	  this.size -= result ? 1 : 0;
	  return result;
	}

	_mapCacheDelete = mapCacheDelete;
	return _mapCacheDelete;
}

var _mapCacheGet;
var hasRequired_mapCacheGet;

function require_mapCacheGet () {
	if (hasRequired_mapCacheGet) return _mapCacheGet;
	hasRequired_mapCacheGet = 1;
	var getMapData = require_getMapData();

	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet(key) {
	  return getMapData(this, key).get(key);
	}

	_mapCacheGet = mapCacheGet;
	return _mapCacheGet;
}

var _mapCacheHas;
var hasRequired_mapCacheHas;

function require_mapCacheHas () {
	if (hasRequired_mapCacheHas) return _mapCacheHas;
	hasRequired_mapCacheHas = 1;
	var getMapData = require_getMapData();

	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas(key) {
	  return getMapData(this, key).has(key);
	}

	_mapCacheHas = mapCacheHas;
	return _mapCacheHas;
}

var _mapCacheSet;
var hasRequired_mapCacheSet;

function require_mapCacheSet () {
	if (hasRequired_mapCacheSet) return _mapCacheSet;
	hasRequired_mapCacheSet = 1;
	var getMapData = require_getMapData();

	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet(key, value) {
	  var data = getMapData(this, key),
	      size = data.size;

	  data.set(key, value);
	  this.size += data.size == size ? 0 : 1;
	  return this;
	}

	_mapCacheSet = mapCacheSet;
	return _mapCacheSet;
}

var _MapCache;
var hasRequired_MapCache;

function require_MapCache () {
	if (hasRequired_MapCache) return _MapCache;
	hasRequired_MapCache = 1;
	var mapCacheClear = require_mapCacheClear(),
	    mapCacheDelete = require_mapCacheDelete(),
	    mapCacheGet = require_mapCacheGet(),
	    mapCacheHas = require_mapCacheHas(),
	    mapCacheSet = require_mapCacheSet();

	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache(entries) {
	  var index = -1,
	      length = entries == null ? 0 : entries.length;

	  this.clear();
	  while (++index < length) {
	    var entry = entries[index];
	    this.set(entry[0], entry[1]);
	  }
	}

	// Add methods to `MapCache`.
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;

	_MapCache = MapCache;
	return _MapCache;
}

var _stackSet;
var hasRequired_stackSet;

function require_stackSet () {
	if (hasRequired_stackSet) return _stackSet;
	hasRequired_stackSet = 1;
	var ListCache = require_ListCache(),
	    Map = require_Map(),
	    MapCache = require_MapCache();

	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE = 200;

	/**
	 * Sets the stack `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Stack
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the stack cache instance.
	 */
	function stackSet(key, value) {
	  var data = this.__data__;
	  if (data instanceof ListCache) {
	    var pairs = data.__data__;
	    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
	      pairs.push([key, value]);
	      this.size = ++data.size;
	      return this;
	    }
	    data = this.__data__ = new MapCache(pairs);
	  }
	  data.set(key, value);
	  this.size = data.size;
	  return this;
	}

	_stackSet = stackSet;
	return _stackSet;
}

var _Stack;
var hasRequired_Stack;

function require_Stack () {
	if (hasRequired_Stack) return _Stack;
	hasRequired_Stack = 1;
	var ListCache = require_ListCache(),
	    stackClear = require_stackClear(),
	    stackDelete = require_stackDelete(),
	    stackGet = require_stackGet(),
	    stackHas = require_stackHas(),
	    stackSet = require_stackSet();

	/**
	 * Creates a stack cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Stack(entries) {
	  var data = this.__data__ = new ListCache(entries);
	  this.size = data.size;
	}

	// Add methods to `Stack`.
	Stack.prototype.clear = stackClear;
	Stack.prototype['delete'] = stackDelete;
	Stack.prototype.get = stackGet;
	Stack.prototype.has = stackHas;
	Stack.prototype.set = stackSet;

	_Stack = Stack;
	return _Stack;
}

/** Used to stand-in for `undefined` hash values. */

var _setCacheAdd;
var hasRequired_setCacheAdd;

function require_setCacheAdd () {
	if (hasRequired_setCacheAdd) return _setCacheAdd;
	hasRequired_setCacheAdd = 1;
	var HASH_UNDEFINED = '__lodash_hash_undefined__';

	/**
	 * Adds `value` to the array cache.
	 *
	 * @private
	 * @name add
	 * @memberOf SetCache
	 * @alias push
	 * @param {*} value The value to cache.
	 * @returns {Object} Returns the cache instance.
	 */
	function setCacheAdd(value) {
	  this.__data__.set(value, HASH_UNDEFINED);
	  return this;
	}

	_setCacheAdd = setCacheAdd;
	return _setCacheAdd;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */

var _setCacheHas;
var hasRequired_setCacheHas;

function require_setCacheHas () {
	if (hasRequired_setCacheHas) return _setCacheHas;
	hasRequired_setCacheHas = 1;
	function setCacheHas(value) {
	  return this.__data__.has(value);
	}

	_setCacheHas = setCacheHas;
	return _setCacheHas;
}

var _SetCache;
var hasRequired_SetCache;

function require_SetCache () {
	if (hasRequired_SetCache) return _SetCache;
	hasRequired_SetCache = 1;
	var MapCache = require_MapCache(),
	    setCacheAdd = require_setCacheAdd(),
	    setCacheHas = require_setCacheHas();

	/**
	 *
	 * Creates an array cache object to store unique values.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [values] The values to cache.
	 */
	function SetCache(values) {
	  var index = -1,
	      length = values == null ? 0 : values.length;

	  this.__data__ = new MapCache;
	  while (++index < length) {
	    this.add(values[index]);
	  }
	}

	// Add methods to `SetCache`.
	SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
	SetCache.prototype.has = setCacheHas;

	_SetCache = SetCache;
	return _SetCache;
}

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */

var _arraySome;
var hasRequired_arraySome;

function require_arraySome () {
	if (hasRequired_arraySome) return _arraySome;
	hasRequired_arraySome = 1;
	function arraySome(array, predicate) {
	  var index = -1,
	      length = array == null ? 0 : array.length;

	  while (++index < length) {
	    if (predicate(array[index], index, array)) {
	      return true;
	    }
	  }
	  return false;
	}

	_arraySome = arraySome;
	return _arraySome;
}

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */

var _cacheHas;
var hasRequired_cacheHas;

function require_cacheHas () {
	if (hasRequired_cacheHas) return _cacheHas;
	hasRequired_cacheHas = 1;
	function cacheHas(cache, key) {
	  return cache.has(key);
	}

	_cacheHas = cacheHas;
	return _cacheHas;
}

var _equalArrays;
var hasRequired_equalArrays;

function require_equalArrays () {
	if (hasRequired_equalArrays) return _equalArrays;
	hasRequired_equalArrays = 1;
	var SetCache = require_SetCache(),
	    arraySome = require_arraySome(),
	    cacheHas = require_cacheHas();

	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1,
	    COMPARE_UNORDERED_FLAG = 2;

	/**
	 * A specialized version of `baseIsEqualDeep` for arrays with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Array} array The array to compare.
	 * @param {Array} other The other array to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `array` and `other` objects.
	 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
	 */
	function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
	  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
	      arrLength = array.length,
	      othLength = other.length;

	  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
	    return false;
	  }
	  // Check that cyclic values are equal.
	  var arrStacked = stack.get(array);
	  var othStacked = stack.get(other);
	  if (arrStacked && othStacked) {
	    return arrStacked == other && othStacked == array;
	  }
	  var index = -1,
	      result = true,
	      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

	  stack.set(array, other);
	  stack.set(other, array);

	  // Ignore non-index properties.
	  while (++index < arrLength) {
	    var arrValue = array[index],
	        othValue = other[index];

	    if (customizer) {
	      var compared = isPartial
	        ? customizer(othValue, arrValue, index, other, array, stack)
	        : customizer(arrValue, othValue, index, array, other, stack);
	    }
	    if (compared !== undefined) {
	      if (compared) {
	        continue;
	      }
	      result = false;
	      break;
	    }
	    // Recursively compare arrays (susceptible to call stack limits).
	    if (seen) {
	      if (!arraySome(other, function(othValue, othIndex) {
	            if (!cacheHas(seen, othIndex) &&
	                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
	              return seen.push(othIndex);
	            }
	          })) {
	        result = false;
	        break;
	      }
	    } else if (!(
	          arrValue === othValue ||
	            equalFunc(arrValue, othValue, bitmask, customizer, stack)
	        )) {
	      result = false;
	      break;
	    }
	  }
	  stack['delete'](array);
	  stack['delete'](other);
	  return result;
	}

	_equalArrays = equalArrays;
	return _equalArrays;
}

var _Uint8Array;
var hasRequired_Uint8Array;

function require_Uint8Array () {
	if (hasRequired_Uint8Array) return _Uint8Array;
	hasRequired_Uint8Array = 1;
	var root = require_root();

	/** Built-in value references. */
	var Uint8Array = root.Uint8Array;

	_Uint8Array = Uint8Array;
	return _Uint8Array;
}

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */

var _mapToArray;
var hasRequired_mapToArray;

function require_mapToArray () {
	if (hasRequired_mapToArray) return _mapToArray;
	hasRequired_mapToArray = 1;
	function mapToArray(map) {
	  var index = -1,
	      result = Array(map.size);

	  map.forEach(function(value, key) {
	    result[++index] = [key, value];
	  });
	  return result;
	}

	_mapToArray = mapToArray;
	return _mapToArray;
}

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */

var _setToArray;
var hasRequired_setToArray;

function require_setToArray () {
	if (hasRequired_setToArray) return _setToArray;
	hasRequired_setToArray = 1;
	function setToArray(set) {
	  var index = -1,
	      result = Array(set.size);

	  set.forEach(function(value) {
	    result[++index] = value;
	  });
	  return result;
	}

	_setToArray = setToArray;
	return _setToArray;
}

var _equalByTag;
var hasRequired_equalByTag;

function require_equalByTag () {
	if (hasRequired_equalByTag) return _equalByTag;
	hasRequired_equalByTag = 1;
	var Symbol = require_Symbol(),
	    Uint8Array = require_Uint8Array(),
	    eq = requireEq(),
	    equalArrays = require_equalArrays(),
	    mapToArray = require_mapToArray(),
	    setToArray = require_setToArray();

	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1,
	    COMPARE_UNORDERED_FLAG = 2;

	/** `Object#toString` result references. */
	var boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    symbolTag = '[object Symbol]';

	var arrayBufferTag = '[object ArrayBuffer]',
	    dataViewTag = '[object DataView]';

	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : undefined,
	    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

	/**
	 * A specialized version of `baseIsEqualDeep` for comparing objects of
	 * the same `toStringTag`.
	 *
	 * **Note:** This function only supports comparing values with tags of
	 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {string} tag The `toStringTag` of the objects to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
	  switch (tag) {
	    case dataViewTag:
	      if ((object.byteLength != other.byteLength) ||
	          (object.byteOffset != other.byteOffset)) {
	        return false;
	      }
	      object = object.buffer;
	      other = other.buffer;

	    case arrayBufferTag:
	      if ((object.byteLength != other.byteLength) ||
	          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
	        return false;
	      }
	      return true;

	    case boolTag:
	    case dateTag:
	    case numberTag:
	      // Coerce booleans to `1` or `0` and dates to milliseconds.
	      // Invalid dates are coerced to `NaN`.
	      return eq(+object, +other);

	    case errorTag:
	      return object.name == other.name && object.message == other.message;

	    case regexpTag:
	    case stringTag:
	      // Coerce regexes to strings and treat strings, primitives and objects,
	      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
	      // for more details.
	      return object == (other + '');

	    case mapTag:
	      var convert = mapToArray;

	    case setTag:
	      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
	      convert || (convert = setToArray);

	      if (object.size != other.size && !isPartial) {
	        return false;
	      }
	      // Assume cyclic values are equal.
	      var stacked = stack.get(object);
	      if (stacked) {
	        return stacked == other;
	      }
	      bitmask |= COMPARE_UNORDERED_FLAG;

	      // Recursively compare objects (susceptible to call stack limits).
	      stack.set(object, other);
	      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
	      stack['delete'](object);
	      return result;

	    case symbolTag:
	      if (symbolValueOf) {
	        return symbolValueOf.call(object) == symbolValueOf.call(other);
	      }
	  }
	  return false;
	}

	_equalByTag = equalByTag;
	return _equalByTag;
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */

var _arrayPush;
var hasRequired_arrayPush;

function require_arrayPush () {
	if (hasRequired_arrayPush) return _arrayPush;
	hasRequired_arrayPush = 1;
	function arrayPush(array, values) {
	  var index = -1,
	      length = values.length,
	      offset = array.length;

	  while (++index < length) {
	    array[offset + index] = values[index];
	  }
	  return array;
	}

	_arrayPush = arrayPush;
	return _arrayPush;
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */

var isArray_1;
var hasRequiredIsArray;

function requireIsArray () {
	if (hasRequiredIsArray) return isArray_1;
	hasRequiredIsArray = 1;
	var isArray = Array.isArray;

	isArray_1 = isArray;
	return isArray_1;
}

var _baseGetAllKeys;
var hasRequired_baseGetAllKeys;

function require_baseGetAllKeys () {
	if (hasRequired_baseGetAllKeys) return _baseGetAllKeys;
	hasRequired_baseGetAllKeys = 1;
	var arrayPush = require_arrayPush(),
	    isArray = requireIsArray();

	/**
	 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
	 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
	 * symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Function} keysFunc The function to get the keys of `object`.
	 * @param {Function} symbolsFunc The function to get the symbols of `object`.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function baseGetAllKeys(object, keysFunc, symbolsFunc) {
	  var result = keysFunc(object);
	  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
	}

	_baseGetAllKeys = baseGetAllKeys;
	return _baseGetAllKeys;
}

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */

var _arrayFilter;
var hasRequired_arrayFilter;

function require_arrayFilter () {
	if (hasRequired_arrayFilter) return _arrayFilter;
	hasRequired_arrayFilter = 1;
	function arrayFilter(array, predicate) {
	  var index = -1,
	      length = array == null ? 0 : array.length,
	      resIndex = 0,
	      result = [];

	  while (++index < length) {
	    var value = array[index];
	    if (predicate(value, index, array)) {
	      result[resIndex++] = value;
	    }
	  }
	  return result;
	}

	_arrayFilter = arrayFilter;
	return _arrayFilter;
}

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */

var stubArray_1;
var hasRequiredStubArray;

function requireStubArray () {
	if (hasRequiredStubArray) return stubArray_1;
	hasRequiredStubArray = 1;
	function stubArray() {
	  return [];
	}

	stubArray_1 = stubArray;
	return stubArray_1;
}

var _getSymbols;
var hasRequired_getSymbols;

function require_getSymbols () {
	if (hasRequired_getSymbols) return _getSymbols;
	hasRequired_getSymbols = 1;
	var arrayFilter = require_arrayFilter(),
	    stubArray = requireStubArray();

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Built-in value references. */
	var propertyIsEnumerable = objectProto.propertyIsEnumerable;

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeGetSymbols = Object.getOwnPropertySymbols;

	/**
	 * Creates an array of the own enumerable symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of symbols.
	 */
	var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
	  if (object == null) {
	    return [];
	  }
	  object = Object(object);
	  return arrayFilter(nativeGetSymbols(object), function(symbol) {
	    return propertyIsEnumerable.call(object, symbol);
	  });
	};

	_getSymbols = getSymbols;
	return _getSymbols;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */

var _baseTimes;
var hasRequired_baseTimes;

function require_baseTimes () {
	if (hasRequired_baseTimes) return _baseTimes;
	hasRequired_baseTimes = 1;
	function baseTimes(n, iteratee) {
	  var index = -1,
	      result = Array(n);

	  while (++index < n) {
	    result[index] = iteratee(index);
	  }
	  return result;
	}

	_baseTimes = baseTimes;
	return _baseTimes;
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */

var isObjectLike_1;
var hasRequiredIsObjectLike;

function requireIsObjectLike () {
	if (hasRequiredIsObjectLike) return isObjectLike_1;
	hasRequiredIsObjectLike = 1;
	function isObjectLike(value) {
	  return value != null && typeof value == 'object';
	}

	isObjectLike_1 = isObjectLike;
	return isObjectLike_1;
}

var _baseIsArguments;
var hasRequired_baseIsArguments;

function require_baseIsArguments () {
	if (hasRequired_baseIsArguments) return _baseIsArguments;
	hasRequired_baseIsArguments = 1;
	var baseGetTag = require_baseGetTag(),
	    isObjectLike = requireIsObjectLike();

	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]';

	/**
	 * The base implementation of `_.isArguments`.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 */
	function baseIsArguments(value) {
	  return isObjectLike(value) && baseGetTag(value) == argsTag;
	}

	_baseIsArguments = baseIsArguments;
	return _baseIsArguments;
}

var isArguments_1;
var hasRequiredIsArguments;

function requireIsArguments () {
	if (hasRequiredIsArguments) return isArguments_1;
	hasRequiredIsArguments = 1;
	var baseIsArguments = require_baseIsArguments(),
	    isObjectLike = requireIsObjectLike();

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/** Built-in value references. */
	var propertyIsEnumerable = objectProto.propertyIsEnumerable;

	/**
	 * Checks if `value` is likely an `arguments` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
	 *  else `false`.
	 * @example
	 *
	 * _.isArguments(function() { return arguments; }());
	 * // => true
	 *
	 * _.isArguments([1, 2, 3]);
	 * // => false
	 */
	var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
	  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
	    !propertyIsEnumerable.call(value, 'callee');
	};

	isArguments_1 = isArguments;
	return isArguments_1;
}

var isBufferExports = {};
var isBuffer$1 = {
  get exports(){ return isBufferExports; },
  set exports(v){ isBufferExports = v; },
};

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */

var stubFalse_1;
var hasRequiredStubFalse;

function requireStubFalse () {
	if (hasRequiredStubFalse) return stubFalse_1;
	hasRequiredStubFalse = 1;
	function stubFalse() {
	  return false;
	}

	stubFalse_1 = stubFalse;
	return stubFalse_1;
}

var hasRequiredIsBuffer;

function requireIsBuffer () {
	if (hasRequiredIsBuffer) return isBufferExports;
	hasRequiredIsBuffer = 1;
	(function (module, exports) {
		var root = require_root(),
		    stubFalse = requireStubFalse();

		/** Detect free variable `exports`. */
		var freeExports = exports && !exports.nodeType && exports;

		/** Detect free variable `module`. */
		var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

		/** Detect the popular CommonJS extension `module.exports`. */
		var moduleExports = freeModule && freeModule.exports === freeExports;

		/** Built-in value references. */
		var Buffer = moduleExports ? root.Buffer : undefined;

		/* Built-in method references for those with the same name as other `lodash` methods. */
		var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

		/**
		 * Checks if `value` is a buffer.
		 *
		 * @static
		 * @memberOf _
		 * @since 4.3.0
		 * @category Lang
		 * @param {*} value The value to check.
		 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
		 * @example
		 *
		 * _.isBuffer(new Buffer(2));
		 * // => true
		 *
		 * _.isBuffer(new Uint8Array(2));
		 * // => false
		 */
		var isBuffer = nativeIsBuffer || stubFalse;

		module.exports = isBuffer;
} (isBuffer$1, isBufferExports));
	return isBufferExports;
}

/** Used as references for various `Number` constants. */

var _isIndex;
var hasRequired_isIndex;

function require_isIndex () {
	if (hasRequired_isIndex) return _isIndex;
	hasRequired_isIndex = 1;
	var MAX_SAFE_INTEGER = 9007199254740991;

	/** Used to detect unsigned integer values. */
	var reIsUint = /^(?:0|[1-9]\d*)$/;

	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	  var type = typeof value;
	  length = length == null ? MAX_SAFE_INTEGER : length;

	  return !!length &&
	    (type == 'number' ||
	      (type != 'symbol' && reIsUint.test(value))) &&
	        (value > -1 && value % 1 == 0 && value < length);
	}

	_isIndex = isIndex;
	return _isIndex;
}

/** Used as references for various `Number` constants. */

var isLength_1;
var hasRequiredIsLength;

function requireIsLength () {
	if (hasRequiredIsLength) return isLength_1;
	hasRequiredIsLength = 1;
	var MAX_SAFE_INTEGER = 9007199254740991;

	/**
	 * Checks if `value` is a valid array-like length.
	 *
	 * **Note:** This method is loosely based on
	 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
	 * @example
	 *
	 * _.isLength(3);
	 * // => true
	 *
	 * _.isLength(Number.MIN_VALUE);
	 * // => false
	 *
	 * _.isLength(Infinity);
	 * // => false
	 *
	 * _.isLength('3');
	 * // => false
	 */
	function isLength(value) {
	  return typeof value == 'number' &&
	    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
	}

	isLength_1 = isLength;
	return isLength_1;
}

var _baseIsTypedArray;
var hasRequired_baseIsTypedArray;

function require_baseIsTypedArray () {
	if (hasRequired_baseIsTypedArray) return _baseIsTypedArray;
	hasRequired_baseIsTypedArray = 1;
	var baseGetTag = require_baseGetTag(),
	    isLength = requireIsLength(),
	    isObjectLike = requireIsObjectLike();

	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    boolTag = '[object Boolean]',
	    dateTag = '[object Date]',
	    errorTag = '[object Error]',
	    funcTag = '[object Function]',
	    mapTag = '[object Map]',
	    numberTag = '[object Number]',
	    objectTag = '[object Object]',
	    regexpTag = '[object RegExp]',
	    setTag = '[object Set]',
	    stringTag = '[object String]',
	    weakMapTag = '[object WeakMap]';

	var arrayBufferTag = '[object ArrayBuffer]',
	    dataViewTag = '[object DataView]',
	    float32Tag = '[object Float32Array]',
	    float64Tag = '[object Float64Array]',
	    int8Tag = '[object Int8Array]',
	    int16Tag = '[object Int16Array]',
	    int32Tag = '[object Int32Array]',
	    uint8Tag = '[object Uint8Array]',
	    uint8ClampedTag = '[object Uint8ClampedArray]',
	    uint16Tag = '[object Uint16Array]',
	    uint32Tag = '[object Uint32Array]';

	/** Used to identify `toStringTag` values of typed arrays. */
	var typedArrayTags = {};
	typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
	typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
	typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
	typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
	typedArrayTags[uint32Tag] = true;
	typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
	typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
	typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
	typedArrayTags[errorTag] = typedArrayTags[funcTag] =
	typedArrayTags[mapTag] = typedArrayTags[numberTag] =
	typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
	typedArrayTags[setTag] = typedArrayTags[stringTag] =
	typedArrayTags[weakMapTag] = false;

	/**
	 * The base implementation of `_.isTypedArray` without Node.js optimizations.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 */
	function baseIsTypedArray(value) {
	  return isObjectLike(value) &&
	    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
	}

	_baseIsTypedArray = baseIsTypedArray;
	return _baseIsTypedArray;
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */

var _baseUnary;
var hasRequired_baseUnary;

function require_baseUnary () {
	if (hasRequired_baseUnary) return _baseUnary;
	hasRequired_baseUnary = 1;
	function baseUnary(func) {
	  return function(value) {
	    return func(value);
	  };
	}

	_baseUnary = baseUnary;
	return _baseUnary;
}

var _nodeUtilExports = {};
var _nodeUtil = {
  get exports(){ return _nodeUtilExports; },
  set exports(v){ _nodeUtilExports = v; },
};

var hasRequired_nodeUtil;

function require_nodeUtil () {
	if (hasRequired_nodeUtil) return _nodeUtilExports;
	hasRequired_nodeUtil = 1;
	(function (module, exports) {
		var freeGlobal = require_freeGlobal();

		/** Detect free variable `exports`. */
		var freeExports = exports && !exports.nodeType && exports;

		/** Detect free variable `module`. */
		var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

		/** Detect the popular CommonJS extension `module.exports`. */
		var moduleExports = freeModule && freeModule.exports === freeExports;

		/** Detect free variable `process` from Node.js. */
		var freeProcess = moduleExports && freeGlobal.process;

		/** Used to access faster Node.js helpers. */
		var nodeUtil = (function() {
		  try {
		    // Use `util.types` for Node.js 10+.
		    var types = freeModule && freeModule.require && freeModule.require('util').types;

		    if (types) {
		      return types;
		    }

		    // Legacy `process.binding('util')` for Node.js < 10.
		    return freeProcess && freeProcess.binding && freeProcess.binding('util');
		  } catch (e) {}
		}());

		module.exports = nodeUtil;
} (_nodeUtil, _nodeUtilExports));
	return _nodeUtilExports;
}

var isTypedArray_1;
var hasRequiredIsTypedArray;

function requireIsTypedArray () {
	if (hasRequiredIsTypedArray) return isTypedArray_1;
	hasRequiredIsTypedArray = 1;
	var baseIsTypedArray = require_baseIsTypedArray(),
	    baseUnary = require_baseUnary(),
	    nodeUtil = require_nodeUtil();

	/* Node.js helper references. */
	var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

	/**
	 * Checks if `value` is classified as a typed array.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
	 * @example
	 *
	 * _.isTypedArray(new Uint8Array);
	 * // => true
	 *
	 * _.isTypedArray([]);
	 * // => false
	 */
	var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

	isTypedArray_1 = isTypedArray;
	return isTypedArray_1;
}

var _arrayLikeKeys;
var hasRequired_arrayLikeKeys;

function require_arrayLikeKeys () {
	if (hasRequired_arrayLikeKeys) return _arrayLikeKeys;
	hasRequired_arrayLikeKeys = 1;
	var baseTimes = require_baseTimes(),
	    isArguments = requireIsArguments(),
	    isArray = requireIsArray(),
	    isBuffer = requireIsBuffer(),
	    isIndex = require_isIndex(),
	    isTypedArray = requireIsTypedArray();

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Creates an array of the enumerable property names of the array-like `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @param {boolean} inherited Specify returning inherited property names.
	 * @returns {Array} Returns the array of property names.
	 */
	function arrayLikeKeys(value, inherited) {
	  var isArr = isArray(value),
	      isArg = !isArr && isArguments(value),
	      isBuff = !isArr && !isArg && isBuffer(value),
	      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
	      skipIndexes = isArr || isArg || isBuff || isType,
	      result = skipIndexes ? baseTimes(value.length, String) : [],
	      length = result.length;

	  for (var key in value) {
	    if ((inherited || hasOwnProperty.call(value, key)) &&
	        !(skipIndexes && (
	           // Safari 9 has enumerable `arguments.length` in strict mode.
	           key == 'length' ||
	           // Node.js 0.10 has enumerable non-index properties on buffers.
	           (isBuff && (key == 'offset' || key == 'parent')) ||
	           // PhantomJS 2 has enumerable non-index properties on typed arrays.
	           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
	           // Skip index properties.
	           isIndex(key, length)
	        ))) {
	      result.push(key);
	    }
	  }
	  return result;
	}

	_arrayLikeKeys = arrayLikeKeys;
	return _arrayLikeKeys;
}

/** Used for built-in method references. */

var _isPrototype;
var hasRequired_isPrototype;

function require_isPrototype () {
	if (hasRequired_isPrototype) return _isPrototype;
	hasRequired_isPrototype = 1;
	var objectProto = Object.prototype;

	/**
	 * Checks if `value` is likely a prototype object.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
	 */
	function isPrototype(value) {
	  var Ctor = value && value.constructor,
	      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

	  return value === proto;
	}

	_isPrototype = isPrototype;
	return _isPrototype;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */

var _overArg;
var hasRequired_overArg;

function require_overArg () {
	if (hasRequired_overArg) return _overArg;
	hasRequired_overArg = 1;
	function overArg(func, transform) {
	  return function(arg) {
	    return func(transform(arg));
	  };
	}

	_overArg = overArg;
	return _overArg;
}

var _nativeKeys;
var hasRequired_nativeKeys;

function require_nativeKeys () {
	if (hasRequired_nativeKeys) return _nativeKeys;
	hasRequired_nativeKeys = 1;
	var overArg = require_overArg();

	/* Built-in method references for those with the same name as other `lodash` methods. */
	var nativeKeys = overArg(Object.keys, Object);

	_nativeKeys = nativeKeys;
	return _nativeKeys;
}

var _baseKeys;
var hasRequired_baseKeys;

function require_baseKeys () {
	if (hasRequired_baseKeys) return _baseKeys;
	hasRequired_baseKeys = 1;
	var isPrototype = require_isPrototype(),
	    nativeKeys = require_nativeKeys();

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 */
	function baseKeys(object) {
	  if (!isPrototype(object)) {
	    return nativeKeys(object);
	  }
	  var result = [];
	  for (var key in Object(object)) {
	    if (hasOwnProperty.call(object, key) && key != 'constructor') {
	      result.push(key);
	    }
	  }
	  return result;
	}

	_baseKeys = baseKeys;
	return _baseKeys;
}

var isArrayLike_1;
var hasRequiredIsArrayLike;

function requireIsArrayLike () {
	if (hasRequiredIsArrayLike) return isArrayLike_1;
	hasRequiredIsArrayLike = 1;
	var isFunction = requireIsFunction(),
	    isLength = requireIsLength();

	/**
	 * Checks if `value` is array-like. A value is considered array-like if it's
	 * not a function and has a `value.length` that's an integer greater than or
	 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
	 * @example
	 *
	 * _.isArrayLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isArrayLike(document.body.children);
	 * // => true
	 *
	 * _.isArrayLike('abc');
	 * // => true
	 *
	 * _.isArrayLike(_.noop);
	 * // => false
	 */
	function isArrayLike(value) {
	  return value != null && isLength(value.length) && !isFunction(value);
	}

	isArrayLike_1 = isArrayLike;
	return isArrayLike_1;
}

var keys_1;
var hasRequiredKeys;

function requireKeys () {
	if (hasRequiredKeys) return keys_1;
	hasRequiredKeys = 1;
	var arrayLikeKeys = require_arrayLikeKeys(),
	    baseKeys = require_baseKeys(),
	    isArrayLike = requireIsArrayLike();

	/**
	 * Creates an array of the own enumerable property names of `object`.
	 *
	 * **Note:** Non-object values are coerced to objects. See the
	 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
	 * for more details.
	 *
	 * @static
	 * @since 0.1.0
	 * @memberOf _
	 * @category Object
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names.
	 * @example
	 *
	 * function Foo() {
	 *   this.a = 1;
	 *   this.b = 2;
	 * }
	 *
	 * Foo.prototype.c = 3;
	 *
	 * _.keys(new Foo);
	 * // => ['a', 'b'] (iteration order is not guaranteed)
	 *
	 * _.keys('hi');
	 * // => ['0', '1']
	 */
	function keys(object) {
	  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
	}

	keys_1 = keys;
	return keys_1;
}

var _getAllKeys;
var hasRequired_getAllKeys;

function require_getAllKeys () {
	if (hasRequired_getAllKeys) return _getAllKeys;
	hasRequired_getAllKeys = 1;
	var baseGetAllKeys = require_baseGetAllKeys(),
	    getSymbols = require_getSymbols(),
	    keys = requireKeys();

	/**
	 * Creates an array of own enumerable property names and symbols of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @returns {Array} Returns the array of property names and symbols.
	 */
	function getAllKeys(object) {
	  return baseGetAllKeys(object, keys, getSymbols);
	}

	_getAllKeys = getAllKeys;
	return _getAllKeys;
}

var _equalObjects;
var hasRequired_equalObjects;

function require_equalObjects () {
	if (hasRequired_equalObjects) return _equalObjects;
	hasRequired_equalObjects = 1;
	var getAllKeys = require_getAllKeys();

	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1;

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * A specialized version of `baseIsEqualDeep` for objects with support for
	 * partial deep comparisons.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} stack Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
	  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
	      objProps = getAllKeys(object),
	      objLength = objProps.length,
	      othProps = getAllKeys(other),
	      othLength = othProps.length;

	  if (objLength != othLength && !isPartial) {
	    return false;
	  }
	  var index = objLength;
	  while (index--) {
	    var key = objProps[index];
	    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
	      return false;
	    }
	  }
	  // Check that cyclic values are equal.
	  var objStacked = stack.get(object);
	  var othStacked = stack.get(other);
	  if (objStacked && othStacked) {
	    return objStacked == other && othStacked == object;
	  }
	  var result = true;
	  stack.set(object, other);
	  stack.set(other, object);

	  var skipCtor = isPartial;
	  while (++index < objLength) {
	    key = objProps[index];
	    var objValue = object[key],
	        othValue = other[key];

	    if (customizer) {
	      var compared = isPartial
	        ? customizer(othValue, objValue, key, other, object, stack)
	        : customizer(objValue, othValue, key, object, other, stack);
	    }
	    // Recursively compare objects (susceptible to call stack limits).
	    if (!(compared === undefined
	          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
	          : compared
	        )) {
	      result = false;
	      break;
	    }
	    skipCtor || (skipCtor = key == 'constructor');
	  }
	  if (result && !skipCtor) {
	    var objCtor = object.constructor,
	        othCtor = other.constructor;

	    // Non `Object` object instances with different constructors are not equal.
	    if (objCtor != othCtor &&
	        ('constructor' in object && 'constructor' in other) &&
	        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
	          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
	      result = false;
	    }
	  }
	  stack['delete'](object);
	  stack['delete'](other);
	  return result;
	}

	_equalObjects = equalObjects;
	return _equalObjects;
}

var _DataView;
var hasRequired_DataView;

function require_DataView () {
	if (hasRequired_DataView) return _DataView;
	hasRequired_DataView = 1;
	var getNative = require_getNative(),
	    root = require_root();

	/* Built-in method references that are verified to be native. */
	var DataView = getNative(root, 'DataView');

	_DataView = DataView;
	return _DataView;
}

var _Promise;
var hasRequired_Promise;

function require_Promise () {
	if (hasRequired_Promise) return _Promise;
	hasRequired_Promise = 1;
	var getNative = require_getNative(),
	    root = require_root();

	/* Built-in method references that are verified to be native. */
	var Promise = getNative(root, 'Promise');

	_Promise = Promise;
	return _Promise;
}

var _Set;
var hasRequired_Set;

function require_Set () {
	if (hasRequired_Set) return _Set;
	hasRequired_Set = 1;
	var getNative = require_getNative(),
	    root = require_root();

	/* Built-in method references that are verified to be native. */
	var Set = getNative(root, 'Set');

	_Set = Set;
	return _Set;
}

var _WeakMap;
var hasRequired_WeakMap;

function require_WeakMap () {
	if (hasRequired_WeakMap) return _WeakMap;
	hasRequired_WeakMap = 1;
	var getNative = require_getNative(),
	    root = require_root();

	/* Built-in method references that are verified to be native. */
	var WeakMap = getNative(root, 'WeakMap');

	_WeakMap = WeakMap;
	return _WeakMap;
}

var _getTag;
var hasRequired_getTag;

function require_getTag () {
	if (hasRequired_getTag) return _getTag;
	hasRequired_getTag = 1;
	var DataView = require_DataView(),
	    Map = require_Map(),
	    Promise = require_Promise(),
	    Set = require_Set(),
	    WeakMap = require_WeakMap(),
	    baseGetTag = require_baseGetTag(),
	    toSource = require_toSource();

	/** `Object#toString` result references. */
	var mapTag = '[object Map]',
	    objectTag = '[object Object]',
	    promiseTag = '[object Promise]',
	    setTag = '[object Set]',
	    weakMapTag = '[object WeakMap]';

	var dataViewTag = '[object DataView]';

	/** Used to detect maps, sets, and weakmaps. */
	var dataViewCtorString = toSource(DataView),
	    mapCtorString = toSource(Map),
	    promiseCtorString = toSource(Promise),
	    setCtorString = toSource(Set),
	    weakMapCtorString = toSource(WeakMap);

	/**
	 * Gets the `toStringTag` of `value`.
	 *
	 * @private
	 * @param {*} value The value to query.
	 * @returns {string} Returns the `toStringTag`.
	 */
	var getTag = baseGetTag;

	// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
	if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
	    (Map && getTag(new Map) != mapTag) ||
	    (Promise && getTag(Promise.resolve()) != promiseTag) ||
	    (Set && getTag(new Set) != setTag) ||
	    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
	  getTag = function(value) {
	    var result = baseGetTag(value),
	        Ctor = result == objectTag ? value.constructor : undefined,
	        ctorString = Ctor ? toSource(Ctor) : '';

	    if (ctorString) {
	      switch (ctorString) {
	        case dataViewCtorString: return dataViewTag;
	        case mapCtorString: return mapTag;
	        case promiseCtorString: return promiseTag;
	        case setCtorString: return setTag;
	        case weakMapCtorString: return weakMapTag;
	      }
	    }
	    return result;
	  };
	}

	_getTag = getTag;
	return _getTag;
}

var _baseIsEqualDeep;
var hasRequired_baseIsEqualDeep;

function require_baseIsEqualDeep () {
	if (hasRequired_baseIsEqualDeep) return _baseIsEqualDeep;
	hasRequired_baseIsEqualDeep = 1;
	var Stack = require_Stack(),
	    equalArrays = require_equalArrays(),
	    equalByTag = require_equalByTag(),
	    equalObjects = require_equalObjects(),
	    getTag = require_getTag(),
	    isArray = requireIsArray(),
	    isBuffer = requireIsBuffer(),
	    isTypedArray = requireIsTypedArray();

	/** Used to compose bitmasks for value comparisons. */
	var COMPARE_PARTIAL_FLAG = 1;

	/** `Object#toString` result references. */
	var argsTag = '[object Arguments]',
	    arrayTag = '[object Array]',
	    objectTag = '[object Object]';

	/** Used for built-in method references. */
	var objectProto = Object.prototype;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * A specialized version of `baseIsEqual` for arrays and objects which performs
	 * deep comparisons and tracks traversed objects enabling objects with circular
	 * references to be compared.
	 *
	 * @private
	 * @param {Object} object The object to compare.
	 * @param {Object} other The other object to compare.
	 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
	 * @param {Function} customizer The function to customize comparisons.
	 * @param {Function} equalFunc The function to determine equivalents of values.
	 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
	 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
	 */
	function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
	  var objIsArr = isArray(object),
	      othIsArr = isArray(other),
	      objTag = objIsArr ? arrayTag : getTag(object),
	      othTag = othIsArr ? arrayTag : getTag(other);

	  objTag = objTag == argsTag ? objectTag : objTag;
	  othTag = othTag == argsTag ? objectTag : othTag;

	  var objIsObj = objTag == objectTag,
	      othIsObj = othTag == objectTag,
	      isSameTag = objTag == othTag;

	  if (isSameTag && isBuffer(object)) {
	    if (!isBuffer(other)) {
	      return false;
	    }
	    objIsArr = true;
	    objIsObj = false;
	  }
	  if (isSameTag && !objIsObj) {
	    stack || (stack = new Stack);
	    return (objIsArr || isTypedArray(object))
	      ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
	      : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
	  }
	  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
	    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
	        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

	    if (objIsWrapped || othIsWrapped) {
	      var objUnwrapped = objIsWrapped ? object.value() : object,
	          othUnwrapped = othIsWrapped ? other.value() : other;

	      stack || (stack = new Stack);
	      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
	    }
	  }
	  if (!isSameTag) {
	    return false;
	  }
	  stack || (stack = new Stack);
	  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
	}

	_baseIsEqualDeep = baseIsEqualDeep;
	return _baseIsEqualDeep;
}

var _baseIsEqual;
var hasRequired_baseIsEqual;

function require_baseIsEqual () {
	if (hasRequired_baseIsEqual) return _baseIsEqual;
	hasRequired_baseIsEqual = 1;
	var baseIsEqualDeep = require_baseIsEqualDeep(),
	    isObjectLike = requireIsObjectLike();

	/**
	 * The base implementation of `_.isEqual` which supports partial comparisons
	 * and tracks traversed objects.
	 *
	 * @private
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @param {boolean} bitmask The bitmask flags.
	 *  1 - Unordered comparison
	 *  2 - Partial comparison
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 */
	function baseIsEqual(value, other, bitmask, customizer, stack) {
	  if (value === other) {
	    return true;
	  }
	  if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
	    return value !== value && other !== other;
	  }
	  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
	}

	_baseIsEqual = baseIsEqual;
	return _baseIsEqual;
}

var isEqual_1;
var hasRequiredIsEqual;

function requireIsEqual () {
	if (hasRequiredIsEqual) return isEqual_1;
	hasRequiredIsEqual = 1;
	var baseIsEqual = require_baseIsEqual();

	/**
	 * Performs a deep comparison between two values to determine if they are
	 * equivalent.
	 *
	 * **Note:** This method supports comparing arrays, array buffers, booleans,
	 * date objects, error objects, maps, numbers, `Object` objects, regexes,
	 * sets, strings, symbols, and typed arrays. `Object` objects are compared
	 * by their own, not inherited, enumerable properties. Functions and DOM
	 * nodes are compared by strict equality, i.e. `===`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.isEqual(object, other);
	 * // => true
	 *
	 * object === other;
	 * // => false
	 */
	function isEqual(value, other) {
	  return baseIsEqual(value, other);
	}

	isEqual_1 = isEqual;
	return isEqual_1;
}

var cssToolsExports = {};
var cssTools = {
  get exports(){ return cssToolsExports; },
  set exports(v){ cssToolsExports = v; },
};

var hasRequiredCssTools;

function requireCssTools () {
	if (hasRequiredCssTools) return cssToolsExports;
	hasRequiredCssTools = 1;
	(()=>{var t={831:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0});class s extends Error{constructor(t,e,s,i,n){super(t+":"+s+":"+i+": "+e),this.reason=e,this.filename=t,this.line=s,this.column=i,this.source=n;}}e.default=s;},711:(t,e)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.default=class{constructor(t,e,s){this.start=t,this.end=e,this.source=s;}};},607:function(t,e,s){var i=this&&this.__createBinding||(Object.create?function(t,e,s,i){void 0===i&&(i=s);var n=Object.getOwnPropertyDescriptor(e,s);n&&!("get"in n?!e.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return e[s]}}),Object.defineProperty(t,i,n);}:function(t,e,s,i){void 0===i&&(i=s),t[i]=e[s];}),n=this&&this.__exportStar||function(t,e){for(var s in t)"default"===s||Object.prototype.hasOwnProperty.call(e,s)||i(e,t,s);};Object.defineProperty(e,"__esModule",{value:!0}),e.stringify=e.parse=void 0;var r=s(654);Object.defineProperty(e,"parse",{enumerable:!0,get:function(){return r.default}});var o=s(373);Object.defineProperty(e,"stringify",{enumerable:!0,get:function(){return o.default}}),n(s(371),e),n(s(831),e),n(s(711),e);},654:(t,e,s)=>{Object.defineProperty(e,"__esModule",{value:!0}),e.parse=void 0;const i=s(831),n=s(711),r=s(371),o=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;function c(t){return t?t.trim():""}function a(t,e){const s=t&&"string"==typeof t.type,i=s?t:e;for(const e in t){const s=t[e];Array.isArray(s)?s.forEach((t=>{a(t,i);})):s&&"object"==typeof s&&a(s,i);}return s&&Object.defineProperty(t,"parent",{configurable:!0,writable:!0,enumerable:!1,value:e||null}),t}e.parse=(t,e)=>{e=e||{};let s=1,u=1;function m(){const t={line:s,column:u};return function(i){return i.position=new n.default(t,{line:s,column:u},(null==e?void 0:e.source)||""),g(),i}}const h=[];function p(n){const r=new i.default((null==e?void 0:e.source)||"",n,s,u,t);if(!(null==e?void 0:e.silent))throw r;h.push(r);}function l(){return y(/^{\s*/)}function f(){return y(/^}/)}function d(){let e;const s=[];for(g(),v(s);t.length&&"}"!==t.charAt(0)&&(e=M()||P());)e&&(s.push(e),v(s));return s}function y(e){const i=e.exec(t);if(!i)return;const n=i[0];return function(t){const e=t.match(/\n/g);e&&(s+=e.length);const i=t.lastIndexOf("\n");u=~i?t.length-i:u+t.length;}(n),t=t.slice(n.length),i}function g(){y(/^\s*/);}function v(t){let e;for(t=t||[];e=C();)e&&t.push(e);return t}function C(){const e=m();if("/"!==t.charAt(0)||"*"!==t.charAt(1))return;const s=y(/^\/\*[^]*?\*\//);return s?e({type:r.CssTypes.comment,comment:s[0].slice(2,-2)}):p("End of comment missing")}function T(){const t=y(/^([^{]+)/);if(!t)return;const e=c(t[0]).replace(/\/\*[^]*?\*\//gm,"");return -1===e.indexOf(",")?[e]:e.replace(/("|')(?:\\\1|.)*?\1|\(.*?\)/g,(t=>t.replace(/,/g,"‌"))).split(",").map((t=>c(t.replace(/\u200C/g,","))))}function V(){const t=m(),e=y(/^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);if(!e)return;const s=c(e[0]);if(!y(/^:\s*/))return p("property missing ':'");const i=y(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/),n=t({type:r.CssTypes.declaration,property:s.replace(o,""),value:i?c(i[0]).replace(o,""):""});return y(/^[;\s]*/),n}function b(){const t=[];if(!l())return p("missing '{'");let e;for(v(t);e=V();)e&&(t.push(e),v(t));return f()?t:p("missing '}'")}function j(){let t;const e=[],s=m();for(;t=y(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/);)e.push(t[1]),y(/^,\s*/);if(e.length)return s({type:r.CssTypes.keyframe,values:e,declarations:b()||[]})}const k=w("import"),_=w("charset"),O=w("namespace");function w(t){const e=new RegExp("^@"+t+"\\s*((:?[^;'\"]|\"(?:\\\\\"|[^\"])*?\"|'(?:\\\\'|[^'])*?')+);");return function(){const s=m(),i=y(e);if(!i)return;const n={type:t};return n[t]=i[1].trim(),s(n)}}function M(){if("@"===t[0])return function(){const t=m(),e=y(/^@([-\w]+)?keyframes\s*/);if(!e)return;const s=e[1],i=y(/^([-\w]+)\s*/);if(!i)return p("@keyframes missing name");const n=i[1];if(!l())return p("@keyframes missing '{'");let o,c=v();for(;o=j();)c.push(o),c=c.concat(v());return f()?t({type:r.CssTypes.keyframes,name:n,vendor:s,keyframes:c}):p("@keyframes missing '}'")}()||function(){const t=m(),e=y(/^@media *([^{]+)/);if(!e)return;const s=c(e[1]);if(!l())return p("@media missing '{'");const i=v().concat(d());return f()?t({type:r.CssTypes.media,media:s,rules:i}):p("@media missing '}'")}()||function(){const t=m(),e=y(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);if(e)return t({type:r.CssTypes.customMedia,name:c(e[1]),media:c(e[2])})}()||function(){const t=m(),e=y(/^@supports *([^{]+)/);if(!e)return;const s=c(e[1]);if(!l())return p("@supports missing '{'");const i=v().concat(d());return f()?t({type:r.CssTypes.supports,supports:s,rules:i}):p("@supports missing '}'")}()||k()||_()||O()||function(){const t=m(),e=y(/^@([-\w]+)?document *([^{]+)/);if(!e)return;const s=c(e[1]),i=c(e[2]);if(!l())return p("@document missing '{'");const n=v().concat(d());return f()?t({type:r.CssTypes.document,document:i,vendor:s,rules:n}):p("@document missing '}'")}()||function(){const t=m();if(!y(/^@page */))return;const e=T()||[];if(!l())return p("@page missing '{'");let s,i=v();for(;s=V();)i.push(s),i=i.concat(v());return f()?t({type:r.CssTypes.page,selectors:e,declarations:i}):p("@page missing '}'")}()||function(){const t=m();if(!y(/^@host\s*/))return;if(!l())return p("@host missing '{'");const e=v().concat(d());return f()?t({type:r.CssTypes.host,rules:e}):p("@host missing '}'")}()||function(){const t=m();if(!y(/^@font-face\s*/))return;if(!l())return p("@font-face missing '{'");let e,s=v();for(;e=V();)s.push(e),s=s.concat(v());return f()?t({type:r.CssTypes.fontFace,declarations:s}):p("@font-face missing '}'")}()||function(){const t=m(),e=y(/^@container *([^{]+)/);if(!e)return;const s=c(e[1]);if(!l())return p("@container missing '{'");const i=v().concat(d());return f()?t({type:r.CssTypes.container,container:s,rules:i}):p("@container missing '}'")}()||function(){const t=m(),e=y(/^@layer *([^{;@]+)/);if(!e)return;const s=c(e[1]);if(!l())return y(/^[;\s]*/),t({type:r.CssTypes.layer,layer:s});const i=v().concat(d());return f()?t({type:r.CssTypes.layer,layer:s,rules:i}):p("@layer missing '}'")}()}function P(){const t=m(),e=T();return e?(v(),t({type:r.CssTypes.rule,selectors:e,declarations:b()||[]})):p("selector missing")}return a(function(){const t=d();return {type:r.CssTypes.stylesheet,stylesheet:{source:null==e?void 0:e.source,rules:t,parsingErrors:h}}}())},e.default=e.parse;},854:(t,e,s)=>{Object.defineProperty(e,"__esModule",{value:!0});const i=s(371);e.default=class{constructor(t){this.level=0,this.indentation="  ",this.compress=!1,"string"==typeof(null==t?void 0:t.indent)&&(this.indentation=null==t?void 0:t.indent),(null==t?void 0:t.compress)&&(this.compress=!0);}emit(t,e){return t}indent(t){return this.level=this.level||1,t?(this.level+=t,""):Array(this.level).join(this.indentation)}visit(t){switch(t.type){case i.CssTypes.stylesheet:return this.stylesheet(t);case i.CssTypes.rule:return this.rule(t);case i.CssTypes.declaration:return this.declaration(t);case i.CssTypes.comment:return this.comment(t);case i.CssTypes.container:return this.container(t);case i.CssTypes.charset:return this.charset(t);case i.CssTypes.document:return this.document(t);case i.CssTypes.customMedia:return this.customMedia(t);case i.CssTypes.fontFace:return this.fontFace(t);case i.CssTypes.host:return this.host(t);case i.CssTypes.import:return this.import(t);case i.CssTypes.keyframes:return this.keyframes(t);case i.CssTypes.keyframe:return this.keyframe(t);case i.CssTypes.layer:return this.layer(t);case i.CssTypes.media:return this.media(t);case i.CssTypes.namespace:return this.namespace(t);case i.CssTypes.page:return this.page(t);case i.CssTypes.supports:return this.supports(t)}}mapVisit(t,e){let s="";e=e||"";for(let i=0,n=t.length;i<n;i++)s+=this.visit(t[i]),e&&i<n-1&&(s+=this.emit(e));return s}compile(t){return this.compress?t.stylesheet.rules.map(this.visit,this).join(""):this.stylesheet(t)}stylesheet(t){return this.mapVisit(t.stylesheet.rules,"\n\n")}comment(t){return this.compress?this.emit("",t.position):this.emit(this.indent()+"/*"+t.comment+"*/",t.position)}container(t){return this.compress?this.emit("@container "+t.container,t.position)+this.emit("{")+this.mapVisit(t.rules)+this.emit("}"):this.emit(this.indent()+"@container "+t.container,t.position)+this.emit(" {\n"+this.indent(1))+this.mapVisit(t.rules,"\n\n")+this.emit("\n"+this.indent(-1)+this.indent()+"}")}layer(t){return this.compress?this.emit("@layer "+t.layer,t.position)+(t.rules?this.emit("{")+this.mapVisit(t.rules)+this.emit("}"):";"):this.emit(this.indent()+"@layer "+t.layer,t.position)+(t.rules?this.emit(" {\n"+this.indent(1))+this.mapVisit(t.rules,"\n\n")+this.emit("\n"+this.indent(-1)+this.indent()+"}"):";")}import(t){return this.emit("@import "+t.import+";",t.position)}media(t){return this.compress?this.emit("@media "+t.media,t.position)+this.emit("{")+this.mapVisit(t.rules)+this.emit("}"):this.emit(this.indent()+"@media "+t.media,t.position)+this.emit(" {\n"+this.indent(1))+this.mapVisit(t.rules,"\n\n")+this.emit("\n"+this.indent(-1)+this.indent()+"}")}document(t){const e="@"+(t.vendor||"")+"document "+t.document;return this.compress?this.emit(e,t.position)+this.emit("{")+this.mapVisit(t.rules)+this.emit("}"):this.emit(e,t.position)+this.emit("  {\n"+this.indent(1))+this.mapVisit(t.rules,"\n\n")+this.emit(this.indent(-1)+"\n}")}charset(t){return this.emit("@charset "+t.charset+";",t.position)}namespace(t){return this.emit("@namespace "+t.namespace+";",t.position)}supports(t){return this.compress?this.emit("@supports "+t.supports,t.position)+this.emit("{")+this.mapVisit(t.rules)+this.emit("}"):this.emit(this.indent()+"@supports "+t.supports,t.position)+this.emit(" {\n"+this.indent(1))+this.mapVisit(t.rules,"\n\n")+this.emit("\n"+this.indent(-1)+this.indent()+"}")}keyframes(t){return this.compress?this.emit("@"+(t.vendor||"")+"keyframes "+t.name,t.position)+this.emit("{")+this.mapVisit(t.keyframes)+this.emit("}"):this.emit("@"+(t.vendor||"")+"keyframes "+t.name,t.position)+this.emit(" {\n"+this.indent(1))+this.mapVisit(t.keyframes,"\n")+this.emit(this.indent(-1)+"}")}keyframe(t){const e=t.declarations;return this.compress?this.emit(t.values.join(","),t.position)+this.emit("{")+this.mapVisit(e)+this.emit("}"):this.emit(this.indent())+this.emit(t.values.join(", "),t.position)+this.emit(" {\n"+this.indent(1))+this.mapVisit(e,"\n")+this.emit(this.indent(-1)+"\n"+this.indent()+"}\n")}page(t){if(this.compress){const e=t.selectors.length?t.selectors.join(", "):"";return this.emit("@page "+e,t.position)+this.emit("{")+this.mapVisit(t.declarations)+this.emit("}")}const e=t.selectors.length?t.selectors.join(", ")+" ":"";return this.emit("@page "+e,t.position)+this.emit("{\n")+this.emit(this.indent(1))+this.mapVisit(t.declarations,"\n")+this.emit(this.indent(-1))+this.emit("\n}")}fontFace(t){return this.compress?this.emit("@font-face",t.position)+this.emit("{")+this.mapVisit(t.declarations)+this.emit("}"):this.emit("@font-face ",t.position)+this.emit("{\n")+this.emit(this.indent(1))+this.mapVisit(t.declarations,"\n")+this.emit(this.indent(-1))+this.emit("\n}")}host(t){return this.compress?this.emit("@host",t.position)+this.emit("{")+this.mapVisit(t.rules)+this.emit("}"):this.emit("@host",t.position)+this.emit(" {\n"+this.indent(1))+this.mapVisit(t.rules,"\n\n")+this.emit(this.indent(-1)+"\n}")}customMedia(t){return this.emit("@custom-media "+t.name+" "+t.media+";",t.position)}rule(t){const e=t.declarations;if(!e.length)return "";if(this.compress)return this.emit(t.selectors.join(","),t.position)+this.emit("{")+this.mapVisit(e)+this.emit("}");const s=this.indent();return this.emit(t.selectors.map((t=>s+t)).join(",\n"),t.position)+this.emit(" {\n")+this.emit(this.indent(1))+this.mapVisit(e,"\n")+this.emit(this.indent(-1))+this.emit("\n"+this.indent()+"}")}declaration(t){return this.compress?this.emit(t.property+":"+t.value,t.position)+this.emit(";"):this.emit(this.indent())+this.emit(t.property+": "+t.value,t.position)+this.emit(";")}};},373:(t,e,s)=>{Object.defineProperty(e,"__esModule",{value:!0});const i=s(854);e.default=(t,e)=>new i.default(e||{}).compile(t);},371:(t,e)=>{var s;Object.defineProperty(e,"__esModule",{value:!0}),e.CssTypes=void 0,(s=e.CssTypes||(e.CssTypes={})).stylesheet="stylesheet",s.rule="rule",s.declaration="declaration",s.comment="comment",s.container="container",s.charset="charset",s.document="document",s.customMedia="custom-media",s.fontFace="font-face",s.host="host",s.import="import",s.keyframes="keyframes",s.keyframe="keyframe",s.layer="layer",s.media="media",s.namespace="namespace",s.page="page",s.supports="supports";}},e={},s=function s(i){var n=e[i];if(void 0!==n)return n.exports;var r=e[i]={exports:{}};return t[i].call(r.exports,r,r.exports,s),r.exports}(607);cssTools.exports=s;})();
	
	return cssToolsExports;
}

var _interopRequireDefault$e = interopRequireDefaultExports;

Object.defineProperty(utils, "__esModule", {
  value: true
});
utils.NodeTypeError = utils.HtmlElementTypeError = void 0;
utils.checkHtmlElement = checkHtmlElement;
utils.checkNode = checkNode;
utils.compareArraysAsSet = compareArraysAsSet;
utils.deprecate = deprecate;
utils.getMessage = getMessage;
utils.getSingleElementValue = getSingleElementValue;
utils.getTag = getTag;
utils.matches = matches;
utils.normalize = normalize;
utils.parseCSS = parseCSS;
utils.toSentence = toSentence;

var _redent = _interopRequireDefault$e(requireRedent());

var _isEqual = _interopRequireDefault$e(requireIsEqual());

var _cssTools = requireCssTools();

class GenericTypeError extends Error {
  constructor(expectedString, received, matcherFn, context) {
    super();
    /* istanbul ignore next */

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, matcherFn);
    }

    let withType = '';

    try {
      withType = context.utils.printWithType('Received', received, context.utils.printReceived);
    } catch (e) {// Can throw for Document:
      // https://github.com/jsdom/jsdom/issues/2304
    }

    this.message = [context.utils.matcherHint(`${context.isNot ? '.not' : ''}.${matcherFn.name}`, 'received', ''), '', // eslint-disable-next-line @babel/new-cap
    `${context.utils.RECEIVED_COLOR('received')} value must ${expectedString}.`, withType].join('\n');
  }

}

class HtmlElementTypeError extends GenericTypeError {
  constructor(...args) {
    super('be an HTMLElement or an SVGElement', ...args);
  }

}

utils.HtmlElementTypeError = HtmlElementTypeError;

class NodeTypeError extends GenericTypeError {
  constructor(...args) {
    super('be a Node', ...args);
  }

}

utils.NodeTypeError = NodeTypeError;

function checkHasWindow(htmlElement, ErrorClass, ...args) {
  if (!htmlElement || !htmlElement.ownerDocument || !htmlElement.ownerDocument.defaultView) {
    throw new ErrorClass(htmlElement, ...args);
  }
}

function checkNode(node, ...args) {
  checkHasWindow(node, NodeTypeError, ...args);
  const window = node.ownerDocument.defaultView;

  if (!(node instanceof window.Node)) {
    throw new NodeTypeError(node, ...args);
  }
}

function checkHtmlElement(htmlElement, ...args) {
  checkHasWindow(htmlElement, HtmlElementTypeError, ...args);
  const window = htmlElement.ownerDocument.defaultView;

  if (!(htmlElement instanceof window.HTMLElement) && !(htmlElement instanceof window.SVGElement)) {
    throw new HtmlElementTypeError(htmlElement, ...args);
  }
}

class InvalidCSSError extends Error {
  constructor(received, matcherFn, context) {
    super();
    /* istanbul ignore next */

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, matcherFn);
    }

    this.message = [received.message, '', // eslint-disable-next-line @babel/new-cap
    context.utils.RECEIVED_COLOR(`Failing css:`), // eslint-disable-next-line @babel/new-cap
    context.utils.RECEIVED_COLOR(`${received.css}`)].join('\n');
  }

}

function parseCSS(css, ...args) {
  const ast = (0, _cssTools.parse)(`selector { ${css} }`, {
    silent: true
  }).stylesheet;

  if (ast.parsingErrors && ast.parsingErrors.length > 0) {
    const {
      reason,
      line
    } = ast.parsingErrors[0];
    throw new InvalidCSSError({
      css,
      message: `Syntax error parsing expected css: ${reason} on line: ${line}`
    }, ...args);
  }

  const parsedRules = ast.rules[0].declarations.filter(d => d.type === 'declaration').reduce((obj, {
    property,
    value
  }) => Object.assign(obj, {
    [property]: value
  }), {});
  return parsedRules;
}

function display(context, value) {
  return typeof value === 'string' ? value : context.utils.stringify(value);
}

function getMessage(context, matcher, expectedLabel, expectedValue, receivedLabel, receivedValue) {
  return [`${matcher}\n`, // eslint-disable-next-line @babel/new-cap
  `${expectedLabel}:\n${context.utils.EXPECTED_COLOR((0, _redent.default)(display(context, expectedValue), 2))}`, // eslint-disable-next-line @babel/new-cap
  `${receivedLabel}:\n${context.utils.RECEIVED_COLOR((0, _redent.default)(display(context, receivedValue), 2))}`].join('\n');
}

function matches(textToMatch, matcher) {
  if (matcher instanceof RegExp) {
    return matcher.test(textToMatch);
  } else {
    return textToMatch.includes(String(matcher));
  }
}

function deprecate(name, replacementText) {
  // Notify user that they are using deprecated functionality.
  // eslint-disable-next-line no-console
  console.warn(`Warning: ${name} has been deprecated and will be removed in future updates.`, replacementText);
}

function normalize(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function getTag(element) {
  return element.tagName && element.tagName.toLowerCase();
}

function getSelectValue({
  multiple,
  options
}) {
  const selectedOptions = [...options].filter(option => option.selected);

  if (multiple) {
    return [...selectedOptions].map(opt => opt.value);
  }
  /* istanbul ignore if */


  if (selectedOptions.length === 0) {
    return undefined; // Couldn't make this happen, but just in case
  }

  return selectedOptions[0].value;
}

function getInputValue(inputElement) {
  switch (inputElement.type) {
    case 'number':
      return inputElement.value === '' ? null : Number(inputElement.value);

    case 'checkbox':
      return inputElement.checked;

    default:
      return inputElement.value;
  }
}

function getSingleElementValue(element) {
  /* istanbul ignore if */
  if (!element) {
    return undefined;
  }

  switch (element.tagName.toLowerCase()) {
    case 'input':
      return getInputValue(element);

    case 'select':
      return getSelectValue(element);

    default:
      return element.value;
  }
}

function compareArraysAsSet(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return (0, _isEqual.default)(new Set(a), new Set(b));
  }

  return undefined;
}

function toSentence(array, {
  wordConnector = ', ',
  lastWordConnector = ' and '
} = {}) {
  return [array.slice(0, -1).join(wordConnector), array[array.length - 1]].join(array.length > 1 ? lastWordConnector : '');
}

Object.defineProperty(toBeInTheDom, "__esModule", {
  value: true
});
toBeInTheDom.toBeInTheDOM = toBeInTheDOM;

var _utils$n = utils;

function toBeInTheDOM(element, container) {
  (0, _utils$n.deprecate)('toBeInTheDOM', 'Please use toBeInTheDocument for searching the entire document and toContainElement for searching a specific container.');

  if (element) {
    (0, _utils$n.checkHtmlElement)(element, toBeInTheDOM, this);
  }

  if (container) {
    (0, _utils$n.checkHtmlElement)(container, toBeInTheDOM, this);
  }

  return {
    pass: container ? container.contains(element) : !!element,
    message: () => {
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toBeInTheDOM`, 'element', ''), '', 'Received:', `  ${this.utils.printReceived(element ? element.cloneNode(false) : element)}`].join('\n');
    }
  };
}

var toBeInTheDocument$1 = {};

Object.defineProperty(toBeInTheDocument$1, "__esModule", {
  value: true
});
toBeInTheDocument$1.toBeInTheDocument = toBeInTheDocument;

var _utils$m = utils;

function toBeInTheDocument(element) {
  if (element !== null || !this.isNot) {
    (0, _utils$m.checkHtmlElement)(element, toBeInTheDocument, this);
  }

  const pass = element === null ? false : element.ownerDocument === element.getRootNode({
    composed: true
  });

  const errorFound = () => {
    return `expected document not to contain element, found ${this.utils.stringify(element.cloneNode(true))} instead`;
  };

  const errorNotFound = () => {
    return `element could not be found in the document`;
  };

  return {
    pass,
    message: () => {
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toBeInTheDocument`, 'element', ''), '', // eslint-disable-next-line @babel/new-cap
      this.utils.RECEIVED_COLOR(this.isNot ? errorFound() : errorNotFound())].join('\n');
    }
  };
}

var toBeEmpty$1 = {};

Object.defineProperty(toBeEmpty$1, "__esModule", {
  value: true
});
toBeEmpty$1.toBeEmpty = toBeEmpty;

var _utils$l = utils;

function toBeEmpty(element) {
  (0, _utils$l.deprecate)('toBeEmpty', 'Please use instead toBeEmptyDOMElement for finding empty nodes in the DOM.');
  (0, _utils$l.checkHtmlElement)(element, toBeEmpty, this);
  return {
    pass: element.innerHTML === '',
    message: () => {
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toBeEmpty`, 'element', ''), '', 'Received:', `  ${this.utils.printReceived(element.innerHTML)}`].join('\n');
    }
  };
}

var toBeEmptyDomElement = {};

Object.defineProperty(toBeEmptyDomElement, "__esModule", {
  value: true
});
toBeEmptyDomElement.toBeEmptyDOMElement = toBeEmptyDOMElement;

var _utils$k = utils;

function toBeEmptyDOMElement(element) {
  (0, _utils$k.checkHtmlElement)(element, toBeEmptyDOMElement, this);
  return {
    pass: isEmptyElement(element),
    message: () => {
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toBeEmptyDOMElement`, 'element', ''), '', 'Received:', `  ${this.utils.printReceived(element.innerHTML)}`].join('\n');
    }
  };
}
/**
 * Identifies if an element doesn't contain child nodes (excluding comments)
 * ℹ Node.COMMENT_NODE can't be used because of the following issue 
 * https://github.com/jsdom/jsdom/issues/2220
 *
 * @param {*} element an HtmlElement or SVGElement
 * @return {*} true if the element only contains comments or none
 */


function isEmptyElement(element) {
  const nonCommentChildNodes = [...element.childNodes].filter(node => node.nodeType !== 8);
  return nonCommentChildNodes.length === 0;
}

var toContainElement$1 = {};

Object.defineProperty(toContainElement$1, "__esModule", {
  value: true
});
toContainElement$1.toContainElement = toContainElement;

var _utils$j = utils;

function toContainElement(container, element) {
  (0, _utils$j.checkHtmlElement)(container, toContainElement, this);

  if (element !== null) {
    (0, _utils$j.checkHtmlElement)(element, toContainElement, this);
  }

  return {
    pass: container.contains(element),
    message: () => {
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toContainElement`, 'element', 'element'), '', // eslint-disable-next-line @babel/new-cap
      this.utils.RECEIVED_COLOR(`${this.utils.stringify(container.cloneNode(false))} ${this.isNot ? 'contains:' : 'does not contain:'} ${this.utils.stringify(element ? element.cloneNode(false) : element)}
        `)].join('\n');
    }
  };
}

var toContainHtml = {};

Object.defineProperty(toContainHtml, "__esModule", {
  value: true
});
toContainHtml.toContainHTML = toContainHTML;

var _utils$i = utils;

function getNormalizedHtml(container, htmlText) {
  const div = container.ownerDocument.createElement('div');
  div.innerHTML = htmlText;
  return div.innerHTML;
}

function toContainHTML(container, htmlText) {
  (0, _utils$i.checkHtmlElement)(container, toContainHTML, this);

  if (typeof htmlText !== 'string') {
    throw new Error(`.toContainHTML() expects a string value, got ${htmlText}`);
  }

  return {
    pass: container.outerHTML.includes(getNormalizedHtml(container, htmlText)),
    message: () => {
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toContainHTML`, 'element', ''), 'Expected:', // eslint-disable-next-line @babel/new-cap
      `  ${this.utils.EXPECTED_COLOR(htmlText)}`, 'Received:', `  ${this.utils.printReceived(container.cloneNode(true))}`].join('\n');
    }
  };
}

var toHaveTextContent$1 = {};

Object.defineProperty(toHaveTextContent$1, "__esModule", {
  value: true
});
toHaveTextContent$1.toHaveTextContent = toHaveTextContent;

var _utils$h = utils;

function toHaveTextContent(node, checkWith, options = {
  normalizeWhitespace: true
}) {
  (0, _utils$h.checkNode)(node, toHaveTextContent, this);
  const textContent = options.normalizeWhitespace ? (0, _utils$h.normalize)(node.textContent) : node.textContent.replace(/\u00a0/g, ' '); // Replace &nbsp; with normal spaces

  const checkingWithEmptyString = textContent !== '' && checkWith === '';
  return {
    pass: !checkingWithEmptyString && (0, _utils$h.matches)(textContent, checkWith),
    message: () => {
      const to = this.isNot ? 'not to' : 'to';
      return (0, _utils$h.getMessage)(this, this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toHaveTextContent`, 'element', ''), checkingWithEmptyString ? `Checking with empty string will always match, use .toBeEmptyDOMElement() instead` : `Expected element ${to} have text content`, checkWith, 'Received', textContent);
    }
  };
}

var toHaveAccessibleDescription$1 = {};

var dist = {};

/**
 * @source {https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#Polyfill}
 * but without thisArg (too hard to type, no need to `this`)
 */
var toStr$a = Object.prototype.toString;
function isCallable$2(fn) {
  return typeof fn === "function" || toStr$a.call(fn) === "[object Function]";
}
function toInteger(value) {
  var number = Number(value);
  if (isNaN(number)) {
    return 0;
  }
  if (number === 0 || !isFinite(number)) {
    return number;
  }
  return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
}
var maxSafeInteger = Math.pow(2, 53) - 1;
function toLength(value) {
  var len = toInteger(value);
  return Math.min(Math.max(len, 0), maxSafeInteger);
}
/**
 * Creates an array from an iterable object.
 * @param iterable An iterable object to convert to an array.
 */

/**
 * Creates an array from an iterable object.
 * @param iterable An iterable object to convert to an array.
 * @param mapfn A mapping function to call on every element of the array.
 * @param thisArg Value of 'this' used to invoke the mapfn.
 */
function arrayFrom(arrayLike, mapFn) {
  // 1. Let C be the this value.
  // edit(@eps1lon): we're not calling it as Array.from
  var C = Array;

  // 2. Let items be ToObject(arrayLike).
  var items = Object(arrayLike);

  // 3. ReturnIfAbrupt(items).
  if (arrayLike == null) {
    throw new TypeError("Array.from requires an array-like object - not null or undefined");
  }

  // 4. If mapfn is undefined, then let mapping be false.
  // const mapFn = arguments.length > 1 ? arguments[1] : void undefined;

  if (typeof mapFn !== "undefined") {
    // 5. else
    // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
    if (!isCallable$2(mapFn)) {
      throw new TypeError("Array.from: when provided, the second argument must be a function");
    }
  }

  // 10. Let lenValue be Get(items, "length").
  // 11. Let len be ToLength(lenValue).
  var len = toLength(items.length);

  // 13. If IsConstructor(C) is true, then
  // 13. a. Let A be the result of calling the [[Construct]] internal method
  // of C with an argument list containing the single item len.
  // 14. a. Else, Let A be ArrayCreate(len).
  var A = isCallable$2(C) ? Object(new C(len)) : new Array(len);

  // 16. Let k be 0.
  var k = 0;
  // 17. Repeat, while k < len… (also steps a - h)
  var kValue;
  while (k < len) {
    kValue = items[k];
    if (mapFn) {
      A[k] = mapFn(kValue, k);
    } else {
      A[k] = kValue;
    }
    k += 1;
  }
  // 18. Let putStatus be Put(A, "length", len, true).
  A.length = len;
  // 20. Return A.
  return A;
}

function _typeof$2(obj) { "@babel/helpers - typeof"; return _typeof$2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof$2(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey$1(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty$2(obj, key, value) { key = _toPropertyKey$1(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey$1(arg) { var key = _toPrimitive$1(arg, "string"); return _typeof$2(key) === "symbol" ? key : String(key); }
function _toPrimitive$1(input, hint) { if (_typeof$2(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof$2(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
// for environments without Set we fallback to arrays with unique members
var SetLike = /*#__PURE__*/function () {
  function SetLike() {
    var items = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    _classCallCheck(this, SetLike);
    _defineProperty$2(this, "items", void 0);
    this.items = items;
  }
  _createClass(SetLike, [{
    key: "add",
    value: function add(value) {
      if (this.has(value) === false) {
        this.items.push(value);
      }
      return this;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.items = [];
    }
  }, {
    key: "delete",
    value: function _delete(value) {
      var previousLength = this.items.length;
      this.items = this.items.filter(function (item) {
        return item !== value;
      });
      return previousLength !== this.items.length;
    }
  }, {
    key: "forEach",
    value: function forEach(callbackfn) {
      var _this = this;
      this.items.forEach(function (item) {
        callbackfn(item, item, _this);
      });
    }
  }, {
    key: "has",
    value: function has(value) {
      return this.items.indexOf(value) !== -1;
    }
  }, {
    key: "size",
    get: function get() {
      return this.items.length;
    }
  }]);
  return SetLike;
}();
var SetLike$1 = typeof Set === "undefined" ? Set : SetLike;

// https://w3c.github.io/html-aria/#document-conformance-requirements-for-use-of-aria-attributes-in-html

/**
 * Safe Element.localName for all supported environments
 * @param element
 */
function getLocalName(element) {
  var _element$localName;
  return (// eslint-disable-next-line no-restricted-properties -- actual guard for environments without localName
    (_element$localName = element.localName) !== null && _element$localName !== void 0 ? _element$localName :
    // eslint-disable-next-line no-restricted-properties -- required for the fallback
    element.tagName.toLowerCase()
  );
}
var localNameToRoleMappings = {
  article: "article",
  aside: "complementary",
  button: "button",
  datalist: "listbox",
  dd: "definition",
  details: "group",
  dialog: "dialog",
  dt: "term",
  fieldset: "group",
  figure: "figure",
  // WARNING: Only with an accessible name
  form: "form",
  footer: "contentinfo",
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  header: "banner",
  hr: "separator",
  html: "document",
  legend: "legend",
  li: "listitem",
  math: "math",
  main: "main",
  menu: "list",
  nav: "navigation",
  ol: "list",
  optgroup: "group",
  // WARNING: Only in certain context
  option: "option",
  output: "status",
  progress: "progressbar",
  // WARNING: Only with an accessible name
  section: "region",
  summary: "button",
  table: "table",
  tbody: "rowgroup",
  textarea: "textbox",
  tfoot: "rowgroup",
  // WARNING: Only in certain context
  td: "cell",
  th: "columnheader",
  thead: "rowgroup",
  tr: "row",
  ul: "list"
};
var prohibitedAttributes = {
  caption: new Set(["aria-label", "aria-labelledby"]),
  code: new Set(["aria-label", "aria-labelledby"]),
  deletion: new Set(["aria-label", "aria-labelledby"]),
  emphasis: new Set(["aria-label", "aria-labelledby"]),
  generic: new Set(["aria-label", "aria-labelledby", "aria-roledescription"]),
  insertion: new Set(["aria-label", "aria-labelledby"]),
  paragraph: new Set(["aria-label", "aria-labelledby"]),
  presentation: new Set(["aria-label", "aria-labelledby"]),
  strong: new Set(["aria-label", "aria-labelledby"]),
  subscript: new Set(["aria-label", "aria-labelledby"]),
  superscript: new Set(["aria-label", "aria-labelledby"])
};

/**
 *
 * @param element
 * @param role The role used for this element. This is specified to control whether you want to use the implicit or explicit role.
 */
function hasGlobalAriaAttributes(element, role) {
  // https://rawgit.com/w3c/aria/stable/#global_states
  // commented attributes are deprecated
  return ["aria-atomic", "aria-busy", "aria-controls", "aria-current", "aria-describedby", "aria-details",
  // "disabled",
  "aria-dropeffect",
  // "errormessage",
  "aria-flowto", "aria-grabbed",
  // "haspopup",
  "aria-hidden",
  // "invalid",
  "aria-keyshortcuts", "aria-label", "aria-labelledby", "aria-live", "aria-owns", "aria-relevant", "aria-roledescription"].some(function (attributeName) {
    var _prohibitedAttributes;
    return element.hasAttribute(attributeName) && !((_prohibitedAttributes = prohibitedAttributes[role]) !== null && _prohibitedAttributes !== void 0 && _prohibitedAttributes.has(attributeName));
  });
}
function ignorePresentationalRole(element, implicitRole) {
  // https://rawgit.com/w3c/aria/stable/#conflict_resolution_presentation_none
  return hasGlobalAriaAttributes(element, implicitRole);
}
function getRole(element) {
  var explicitRole = getExplicitRole(element);
  if (explicitRole === null || explicitRole === "presentation") {
    var implicitRole = getImplicitRole(element);
    if (explicitRole !== "presentation" || ignorePresentationalRole(element, implicitRole || "")) {
      return implicitRole;
    }
  }
  return explicitRole;
}
function getImplicitRole(element) {
  var mappedByTag = localNameToRoleMappings[getLocalName(element)];
  if (mappedByTag !== undefined) {
    return mappedByTag;
  }
  switch (getLocalName(element)) {
    case "a":
    case "area":
    case "link":
      if (element.hasAttribute("href")) {
        return "link";
      }
      break;
    case "img":
      if (element.getAttribute("alt") === "" && !ignorePresentationalRole(element, "img")) {
        return "presentation";
      }
      return "img";
    case "input":
      {
        var _ref = element,
          type = _ref.type;
        switch (type) {
          case "button":
          case "image":
          case "reset":
          case "submit":
            return "button";
          case "checkbox":
          case "radio":
            return type;
          case "range":
            return "slider";
          case "email":
          case "tel":
          case "text":
          case "url":
            if (element.hasAttribute("list")) {
              return "combobox";
            }
            return "textbox";
          case "search":
            if (element.hasAttribute("list")) {
              return "combobox";
            }
            return "searchbox";
          case "number":
            return "spinbutton";
          default:
            return null;
        }
      }
    case "select":
      if (element.hasAttribute("multiple") || element.size > 1) {
        return "listbox";
      }
      return "combobox";
  }
  return null;
}
function getExplicitRole(element) {
  var role = element.getAttribute("role");
  if (role !== null) {
    var explicitRole = role.trim().split(" ")[0];
    // String.prototype.split(sep, limit) will always return an array with at least one member
    // as long as limit is either undefined or > 0
    if (explicitRole.length > 0) {
      return explicitRole;
    }
  }
  return null;
}

var getRole$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    default: getRole,
    getLocalName: getLocalName
});

function isElement$1(node) {
  return node !== null && node.nodeType === node.ELEMENT_NODE;
}
function isHTMLTableCaptionElement(node) {
  return isElement$1(node) && getLocalName(node) === "caption";
}
function isHTMLInputElement(node) {
  return isElement$1(node) && getLocalName(node) === "input";
}
function isHTMLOptGroupElement(node) {
  return isElement$1(node) && getLocalName(node) === "optgroup";
}
function isHTMLSelectElement(node) {
  return isElement$1(node) && getLocalName(node) === "select";
}
function isHTMLTableElement(node) {
  return isElement$1(node) && getLocalName(node) === "table";
}
function isHTMLTextAreaElement(node) {
  return isElement$1(node) && getLocalName(node) === "textarea";
}
function safeWindow(node) {
  var _ref = node.ownerDocument === null ? node : node.ownerDocument,
    defaultView = _ref.defaultView;
  if (defaultView === null) {
    throw new TypeError("no window available");
  }
  return defaultView;
}
function isHTMLFieldSetElement(node) {
  return isElement$1(node) && getLocalName(node) === "fieldset";
}
function isHTMLLegendElement(node) {
  return isElement$1(node) && getLocalName(node) === "legend";
}
function isHTMLSlotElement(node) {
  return isElement$1(node) && getLocalName(node) === "slot";
}
function isSVGElement(node) {
  return isElement$1(node) && node.ownerSVGElement !== undefined;
}
function isSVGSVGElement(node) {
  return isElement$1(node) && getLocalName(node) === "svg";
}
function isSVGTitleElement(node) {
  return isSVGElement(node) && getLocalName(node) === "title";
}

/**
 *
 * @param {Node} node -
 * @param {string} attributeName -
 * @returns {Element[]} -
 */
function queryIdRefs(node, attributeName) {
  if (isElement$1(node) && node.hasAttribute(attributeName)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- safe due to hasAttribute check
    var ids = node.getAttribute(attributeName).split(" ");

    // Browsers that don't support shadow DOM won't have getRootNode
    var root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
    return ids.map(function (id) {
      return root.getElementById(id);
    }).filter(function (element) {
      return element !== null;
    }
    // TODO: why does this not narrow?
    );
  }

  return [];
}
function hasAnyConcreteRoles(node, roles) {
  if (isElement$1(node)) {
    return roles.indexOf(getRole(node)) !== -1;
  }
  return false;
}

/**
 * implements https://w3c.github.io/accname/
 */

/**
 *  A string of characters where all carriage returns, newlines, tabs, and form-feeds are replaced with a single space, and multiple spaces are reduced to a single space. The string contains only character data; it does not contain any markup.
 */

/**
 *
 * @param {string} string -
 * @returns {FlatString} -
 */
function asFlatString(s) {
  return s.trim().replace(/\s\s+/g, " ");
}

/**
 *
 * @param node -
 * @param options - These are not optional to prevent accidentally calling it without options in `computeAccessibleName`
 * @returns {boolean} -
 */
function isHidden(node, getComputedStyleImplementation) {
  if (!isElement$1(node)) {
    return false;
  }
  if (node.hasAttribute("hidden") || node.getAttribute("aria-hidden") === "true") {
    return true;
  }
  var style = getComputedStyleImplementation(node);
  return style.getPropertyValue("display") === "none" || style.getPropertyValue("visibility") === "hidden";
}

/**
 * @param {Node} node -
 * @returns {boolean} - As defined in step 2E of https://w3c.github.io/accname/#mapping_additional_nd_te
 */
function isControl(node) {
  return hasAnyConcreteRoles(node, ["button", "combobox", "listbox", "textbox"]) || hasAbstractRole(node, "range");
}
function hasAbstractRole(node, role) {
  if (!isElement$1(node)) {
    return false;
  }
  switch (role) {
    case "range":
      return hasAnyConcreteRoles(node, ["meter", "progressbar", "scrollbar", "slider", "spinbutton"]);
    default:
      throw new TypeError("No knowledge about abstract role '".concat(role, "'. This is likely a bug :("));
  }
}

/**
 * element.querySelectorAll but also considers owned tree
 * @param element
 * @param selectors
 */
function querySelectorAllSubtree(element, selectors) {
  var elements = arrayFrom(element.querySelectorAll(selectors));
  queryIdRefs(element, "aria-owns").forEach(function (root) {
    // babel transpiles this assuming an iterator
    elements.push.apply(elements, arrayFrom(root.querySelectorAll(selectors)));
  });
  return elements;
}
function querySelectedOptions(listbox) {
  if (isHTMLSelectElement(listbox)) {
    // IE11 polyfill
    return listbox.selectedOptions || querySelectorAllSubtree(listbox, "[selected]");
  }
  return querySelectorAllSubtree(listbox, '[aria-selected="true"]');
}
function isMarkedPresentational(node) {
  return hasAnyConcreteRoles(node, ["none", "presentation"]);
}

/**
 * Elements specifically listed in html-aam
 *
 * We don't need this for `label` or `legend` elements.
 * Their implicit roles already allow "naming from content".
 *
 * sources:
 *
 * - https://w3c.github.io/html-aam/#table-element
 */
function isNativeHostLanguageTextAlternativeElement(node) {
  return isHTMLTableCaptionElement(node);
}

/**
 * https://w3c.github.io/aria/#namefromcontent
 */
function allowsNameFromContent(node) {
  return hasAnyConcreteRoles(node, ["button", "cell", "checkbox", "columnheader", "gridcell", "heading", "label", "legend", "link", "menuitem", "menuitemcheckbox", "menuitemradio", "option", "radio", "row", "rowheader", "switch", "tab", "tooltip", "treeitem"]);
}

/**
 * TODO https://github.com/eps1lon/dom-accessibility-api/issues/100
 */
function isDescendantOfNativeHostLanguageTextAlternativeElement(
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- not implemented yet
node) {
  return false;
}
function getValueOfTextbox(element) {
  if (isHTMLInputElement(element) || isHTMLTextAreaElement(element)) {
    return element.value;
  }
  // https://github.com/eps1lon/dom-accessibility-api/issues/4
  return element.textContent || "";
}
function getTextualContent(declaration) {
  var content = declaration.getPropertyValue("content");
  if (/^["'].*["']$/.test(content)) {
    return content.slice(1, -1);
  }
  return "";
}

/**
 * https://html.spec.whatwg.org/multipage/forms.html#category-label
 * TODO: form-associated custom elements
 * @param element
 */
function isLabelableElement(element) {
  var localName = getLocalName(element);
  return localName === "button" || localName === "input" && element.getAttribute("type") !== "hidden" || localName === "meter" || localName === "output" || localName === "progress" || localName === "select" || localName === "textarea";
}

/**
 * > [...], then the first such descendant in tree order is the label element's labeled control.
 * -- https://html.spec.whatwg.org/multipage/forms.html#labeled-control
 * @param element
 */
function findLabelableElement(element) {
  if (isLabelableElement(element)) {
    return element;
  }
  var labelableElement = null;
  element.childNodes.forEach(function (childNode) {
    if (labelableElement === null && isElement$1(childNode)) {
      var descendantLabelableElement = findLabelableElement(childNode);
      if (descendantLabelableElement !== null) {
        labelableElement = descendantLabelableElement;
      }
    }
  });
  return labelableElement;
}

/**
 * Polyfill of HTMLLabelElement.control
 * https://html.spec.whatwg.org/multipage/forms.html#labeled-control
 * @param label
 */
function getControlOfLabel(label) {
  if (label.control !== undefined) {
    return label.control;
  }
  var htmlFor = label.getAttribute("for");
  if (htmlFor !== null) {
    return label.ownerDocument.getElementById(htmlFor);
  }
  return findLabelableElement(label);
}

/**
 * Polyfill of HTMLInputElement.labels
 * https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/labels
 * @param element
 */
function getLabels(element) {
  var labelsProperty = element.labels;
  if (labelsProperty === null) {
    return labelsProperty;
  }
  if (labelsProperty !== undefined) {
    return arrayFrom(labelsProperty);
  }

  // polyfill
  if (!isLabelableElement(element)) {
    return null;
  }
  var document = element.ownerDocument;
  return arrayFrom(document.querySelectorAll("label")).filter(function (label) {
    return getControlOfLabel(label) === element;
  });
}

/**
 * Gets the contents of a slot used for computing the accname
 * @param slot
 */
function getSlotContents(slot) {
  // Computing the accessible name for elements containing slots is not
  // currently defined in the spec. This implementation reflects the
  // behavior of NVDA 2020.2/Firefox 81 and iOS VoiceOver/Safari 13.6.
  var assignedNodes = slot.assignedNodes();
  if (assignedNodes.length === 0) {
    // if no nodes are assigned to the slot, it displays the default content
    return arrayFrom(slot.childNodes);
  }
  return assignedNodes;
}

/**
 * implements https://w3c.github.io/accname/#mapping_additional_nd_te
 * @param root
 * @param options
 * @returns
 */
function computeTextAlternative(root) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var consultedNodes = new SetLike$1();
  var window = safeWindow(root);
  var _options$compute = options.compute,
    compute = _options$compute === void 0 ? "name" : _options$compute,
    _options$computedStyl = options.computedStyleSupportsPseudoElements,
    computedStyleSupportsPseudoElements = _options$computedStyl === void 0 ? options.getComputedStyle !== undefined : _options$computedStyl,
    _options$getComputedS = options.getComputedStyle,
    getComputedStyle = _options$getComputedS === void 0 ? window.getComputedStyle.bind(window) : _options$getComputedS,
    _options$hidden = options.hidden,
    hidden = _options$hidden === void 0 ? false : _options$hidden;

  // 2F.i
  function computeMiscTextAlternative(node, context) {
    var accumulatedText = "";
    if (isElement$1(node) && computedStyleSupportsPseudoElements) {
      var pseudoBefore = getComputedStyle(node, "::before");
      var beforeContent = getTextualContent(pseudoBefore);
      accumulatedText = "".concat(beforeContent, " ").concat(accumulatedText);
    }

    // FIXME: Including aria-owns is not defined in the spec
    // But it is required in the web-platform-test
    var childNodes = isHTMLSlotElement(node) ? getSlotContents(node) : arrayFrom(node.childNodes).concat(queryIdRefs(node, "aria-owns"));
    childNodes.forEach(function (child) {
      var result = computeTextAlternative(child, {
        isEmbeddedInLabel: context.isEmbeddedInLabel,
        isReferenced: false,
        recursion: true
      });
      // TODO: Unclear why display affects delimiter
      // see https://github.com/w3c/accname/issues/3
      var display = isElement$1(child) ? getComputedStyle(child).getPropertyValue("display") : "inline";
      var separator = display !== "inline" ? " " : "";
      // trailing separator for wpt tests
      accumulatedText += "".concat(separator).concat(result).concat(separator);
    });
    if (isElement$1(node) && computedStyleSupportsPseudoElements) {
      var pseudoAfter = getComputedStyle(node, "::after");
      var afterContent = getTextualContent(pseudoAfter);
      accumulatedText = "".concat(accumulatedText, " ").concat(afterContent);
    }
    return accumulatedText.trim();
  }

  /**
   *
   * @param element
   * @param attributeName
   * @returns A string non-empty string or `null`
   */
  function useAttribute(element, attributeName) {
    var attribute = element.getAttributeNode(attributeName);
    if (attribute !== null && !consultedNodes.has(attribute) && attribute.value.trim() !== "") {
      consultedNodes.add(attribute);
      return attribute.value;
    }
    return null;
  }
  function computeTooltipAttributeValue(node) {
    if (!isElement$1(node)) {
      return null;
    }
    return useAttribute(node, "title");
  }
  function computeElementTextAlternative(node) {
    if (!isElement$1(node)) {
      return null;
    }

    // https://w3c.github.io/html-aam/#fieldset-and-legend-elements
    if (isHTMLFieldSetElement(node)) {
      consultedNodes.add(node);
      var children = arrayFrom(node.childNodes);
      for (var i = 0; i < children.length; i += 1) {
        var child = children[i];
        if (isHTMLLegendElement(child)) {
          return computeTextAlternative(child, {
            isEmbeddedInLabel: false,
            isReferenced: false,
            recursion: false
          });
        }
      }
    } else if (isHTMLTableElement(node)) {
      // https://w3c.github.io/html-aam/#table-element
      consultedNodes.add(node);
      var _children = arrayFrom(node.childNodes);
      for (var _i = 0; _i < _children.length; _i += 1) {
        var _child = _children[_i];
        if (isHTMLTableCaptionElement(_child)) {
          return computeTextAlternative(_child, {
            isEmbeddedInLabel: false,
            isReferenced: false,
            recursion: false
          });
        }
      }
    } else if (isSVGSVGElement(node)) {
      // https://www.w3.org/TR/svg-aam-1.0/
      consultedNodes.add(node);
      var _children2 = arrayFrom(node.childNodes);
      for (var _i2 = 0; _i2 < _children2.length; _i2 += 1) {
        var _child2 = _children2[_i2];
        if (isSVGTitleElement(_child2)) {
          return _child2.textContent;
        }
      }
      return null;
    } else if (getLocalName(node) === "img" || getLocalName(node) === "area") {
      // https://w3c.github.io/html-aam/#area-element
      // https://w3c.github.io/html-aam/#img-element
      var nameFromAlt = useAttribute(node, "alt");
      if (nameFromAlt !== null) {
        return nameFromAlt;
      }
    } else if (isHTMLOptGroupElement(node)) {
      var nameFromLabel = useAttribute(node, "label");
      if (nameFromLabel !== null) {
        return nameFromLabel;
      }
    }
    if (isHTMLInputElement(node) && (node.type === "button" || node.type === "submit" || node.type === "reset")) {
      // https://w3c.github.io/html-aam/#input-type-text-input-type-password-input-type-search-input-type-tel-input-type-email-input-type-url-and-textarea-element-accessible-description-computation
      var nameFromValue = useAttribute(node, "value");
      if (nameFromValue !== null) {
        return nameFromValue;
      }

      // TODO: l10n
      if (node.type === "submit") {
        return "Submit";
      }
      // TODO: l10n
      if (node.type === "reset") {
        return "Reset";
      }
    }
    var labels = getLabels(node);
    if (labels !== null && labels.length !== 0) {
      consultedNodes.add(node);
      return arrayFrom(labels).map(function (element) {
        return computeTextAlternative(element, {
          isEmbeddedInLabel: true,
          isReferenced: false,
          recursion: true
        });
      }).filter(function (label) {
        return label.length > 0;
      }).join(" ");
    }

    // https://w3c.github.io/html-aam/#input-type-image-accessible-name-computation
    // TODO: wpt test consider label elements but html-aam does not mention them
    // We follow existing implementations over spec
    if (isHTMLInputElement(node) && node.type === "image") {
      var _nameFromAlt = useAttribute(node, "alt");
      if (_nameFromAlt !== null) {
        return _nameFromAlt;
      }
      var nameFromTitle = useAttribute(node, "title");
      if (nameFromTitle !== null) {
        return nameFromTitle;
      }

      // TODO: l10n
      return "Submit Query";
    }
    if (hasAnyConcreteRoles(node, ["button"])) {
      // https://www.w3.org/TR/html-aam-1.0/#button-element
      var nameFromSubTree = computeMiscTextAlternative(node, {
        isEmbeddedInLabel: false,
        isReferenced: false
      });
      if (nameFromSubTree !== "") {
        return nameFromSubTree;
      }
    }
    return null;
  }
  function computeTextAlternative(current, context) {
    if (consultedNodes.has(current)) {
      return "";
    }

    // 2A
    if (!hidden && isHidden(current, getComputedStyle) && !context.isReferenced) {
      consultedNodes.add(current);
      return "";
    }

    // 2B
    var labelAttributeNode = isElement$1(current) ? current.getAttributeNode("aria-labelledby") : null;
    // TODO: Do we generally need to block query IdRefs of attributes we have already consulted?
    var labelElements = labelAttributeNode !== null && !consultedNodes.has(labelAttributeNode) ? queryIdRefs(current, "aria-labelledby") : [];
    if (compute === "name" && !context.isReferenced && labelElements.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- Can't be null here otherwise labelElements would be empty
      consultedNodes.add(labelAttributeNode);
      return labelElements.map(function (element) {
        // TODO: Chrome will consider repeated values i.e. use a node multiple times while we'll bail out in computeTextAlternative.
        return computeTextAlternative(element, {
          isEmbeddedInLabel: context.isEmbeddedInLabel,
          isReferenced: true,
          // this isn't recursion as specified, otherwise we would skip
          // `aria-label` in
          // <input id="myself" aria-label="foo" aria-labelledby="myself"
          recursion: false
        });
      }).join(" ");
    }

    // 2C
    // Changed from the spec in anticipation of https://github.com/w3c/accname/issues/64
    // spec says we should only consider skipping if we have a non-empty label
    var skipToStep2E = context.recursion && isControl(current) && compute === "name";
    if (!skipToStep2E) {
      var ariaLabel = (isElement$1(current) && current.getAttribute("aria-label") || "").trim();
      if (ariaLabel !== "" && compute === "name") {
        consultedNodes.add(current);
        return ariaLabel;
      }

      // 2D
      if (!isMarkedPresentational(current)) {
        var elementTextAlternative = computeElementTextAlternative(current);
        if (elementTextAlternative !== null) {
          consultedNodes.add(current);
          return elementTextAlternative;
        }
      }
    }

    // special casing, cheating to make tests pass
    // https://github.com/w3c/accname/issues/67
    if (hasAnyConcreteRoles(current, ["menu"])) {
      consultedNodes.add(current);
      return "";
    }

    // 2E
    if (skipToStep2E || context.isEmbeddedInLabel || context.isReferenced) {
      if (hasAnyConcreteRoles(current, ["combobox", "listbox"])) {
        consultedNodes.add(current);
        var selectedOptions = querySelectedOptions(current);
        if (selectedOptions.length === 0) {
          // defined per test `name_heading_combobox`
          return isHTMLInputElement(current) ? current.value : "";
        }
        return arrayFrom(selectedOptions).map(function (selectedOption) {
          return computeTextAlternative(selectedOption, {
            isEmbeddedInLabel: context.isEmbeddedInLabel,
            isReferenced: false,
            recursion: true
          });
        }).join(" ");
      }
      if (hasAbstractRole(current, "range")) {
        consultedNodes.add(current);
        if (current.hasAttribute("aria-valuetext")) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- safe due to hasAttribute guard
          return current.getAttribute("aria-valuetext");
        }
        if (current.hasAttribute("aria-valuenow")) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- safe due to hasAttribute guard
          return current.getAttribute("aria-valuenow");
        }
        // Otherwise, use the value as specified by a host language attribute.
        return current.getAttribute("value") || "";
      }
      if (hasAnyConcreteRoles(current, ["textbox"])) {
        consultedNodes.add(current);
        return getValueOfTextbox(current);
      }
    }

    // 2F: https://w3c.github.io/accname/#step2F
    if (allowsNameFromContent(current) || isElement$1(current) && context.isReferenced || isNativeHostLanguageTextAlternativeElement(current) || isDescendantOfNativeHostLanguageTextAlternativeElement()) {
      var accumulatedText2F = computeMiscTextAlternative(current, {
        isEmbeddedInLabel: context.isEmbeddedInLabel,
        isReferenced: false
      });
      if (accumulatedText2F !== "") {
        consultedNodes.add(current);
        return accumulatedText2F;
      }
    }
    if (current.nodeType === current.TEXT_NODE) {
      consultedNodes.add(current);
      return current.textContent || "";
    }
    if (context.recursion) {
      consultedNodes.add(current);
      return computeMiscTextAlternative(current, {
        isEmbeddedInLabel: context.isEmbeddedInLabel,
        isReferenced: false
      });
    }
    var tooltipAttributeValue = computeTooltipAttributeValue(current);
    if (tooltipAttributeValue !== null) {
      consultedNodes.add(current);
      return tooltipAttributeValue;
    }

    // TODO should this be reachable?
    consultedNodes.add(current);
    return "";
  }
  return asFlatString(computeTextAlternative(root, {
    isEmbeddedInLabel: false,
    // by spec computeAccessibleDescription starts with the referenced elements as roots
    isReferenced: compute === "description",
    recursion: false
  }));
}

function _typeof$1(obj) { "@babel/helpers - typeof"; return _typeof$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof$1(obj); }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty$1(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty$1(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof$1(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof$1(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof$1(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

/**
 * @param root
 * @param options
 * @returns
 */
function computeAccessibleDescription(root) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var description = queryIdRefs(root, "aria-describedby").map(function (element) {
    return computeTextAlternative(element, _objectSpread(_objectSpread({}, options), {}, {
      compute: "description"
    }));
  }).join(" ");

  // TODO: Technically we need to make sure that node wasn't used for the accessible name
  //       This causes `description_1.0_combobox-focusable-manual` to fail
  //
  // https://www.w3.org/TR/html-aam-1.0/#accessible-name-and-description-computation
  // says for so many elements to use the `title` that we assume all elements are considered
  if (description === "") {
    var title = root.getAttribute("title");
    description = title === null ? "" : title;
  }
  return description;
}

var accessibleDescription = /*#__PURE__*/Object.freeze({
    __proto__: null,
    computeAccessibleDescription: computeAccessibleDescription
});

var require$$0 = /*@__PURE__*/getAugmentedNamespace(accessibleDescription);

/**
 * https://w3c.github.io/aria/#namefromprohibited
 */
function prohibitsNaming(node) {
  return hasAnyConcreteRoles(node, ["caption", "code", "deletion", "emphasis", "generic", "insertion", "paragraph", "presentation", "strong", "subscript", "superscript"]);
}

/**
 * implements https://w3c.github.io/accname/#mapping_additional_nd_name
 * @param root
 * @param options
 * @returns
 */
function computeAccessibleName(root) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (prohibitsNaming(root)) {
    return "";
  }
  return computeTextAlternative(root, options);
}

var accessibleName = /*#__PURE__*/Object.freeze({
    __proto__: null,
    computeAccessibleName: computeAccessibleName
});

var require$$1 = /*@__PURE__*/getAugmentedNamespace(accessibleName);

var require$$2 = /*@__PURE__*/getAugmentedNamespace(getRole$1);

/**
 * Partial implementation https://www.w3.org/TR/wai-aria-1.2/#tree_exclusion
 * which should only be used for elements with a non-presentational role i.e.
 * `role="none"` and `role="presentation"` will not be excluded.
 *
 * Implements aria-hidden semantics (i.e. parent overrides child)
 * Ignores "Child Presentational: True" characteristics
 *
 * @param element
 * @param options
 * @returns {boolean} true if excluded, otherwise false
 */
function isInaccessible(element) {
  var _element$ownerDocumen;
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _options$getComputedS = options.getComputedStyle,
    getComputedStyle = _options$getComputedS === void 0 ? (_element$ownerDocumen = element.ownerDocument.defaultView) === null || _element$ownerDocumen === void 0 ? void 0 : _element$ownerDocumen.getComputedStyle : _options$getComputedS,
    _options$isSubtreeIna = options.isSubtreeInaccessible,
    isSubtreeInaccessibleImpl = _options$isSubtreeIna === void 0 ? isSubtreeInaccessible : _options$isSubtreeIna;
  if (typeof getComputedStyle !== "function") {
    throw new TypeError("Owner document of the element needs to have an associated window.");
  }
  // since visibility is inherited we can exit early
  if (getComputedStyle(element).visibility === "hidden") {
    return true;
  }
  var currentElement = element;
  while (currentElement) {
    if (isSubtreeInaccessibleImpl(currentElement, {
      getComputedStyle: getComputedStyle
    })) {
      return true;
    }
    currentElement = currentElement.parentElement;
  }
  return false;
}
/**
 *
 * @param element
 * @param options
 * @returns {boolean} - `true` if every child of the element is inaccessible
 */
function isSubtreeInaccessible(element) {
  var _element$ownerDocumen2;
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var _options$getComputedS2 = options.getComputedStyle,
    getComputedStyle = _options$getComputedS2 === void 0 ? (_element$ownerDocumen2 = element.ownerDocument.defaultView) === null || _element$ownerDocumen2 === void 0 ? void 0 : _element$ownerDocumen2.getComputedStyle : _options$getComputedS2;
  if (typeof getComputedStyle !== "function") {
    throw new TypeError("Owner document of the element needs to have an associated window.");
  }
  if (element.hidden === true) {
    return true;
  }
  if (element.getAttribute("aria-hidden") === "true") {
    return true;
  }
  if (getComputedStyle(element).display === "none") {
    return true;
  }
  return false;
}

var isInaccessible$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    isInaccessible: isInaccessible,
    isSubtreeInaccessible: isSubtreeInaccessible
});

var require$$3 = /*@__PURE__*/getAugmentedNamespace(isInaccessible$1);

(function (exports) {

	exports.__esModule = true;
	var _exportNames = {
	  computeAccessibleDescription: true,
	  computeAccessibleName: true,
	  getRole: true
	};
	exports.getRole = exports.computeAccessibleName = exports.computeAccessibleDescription = void 0;
	var _accessibleDescription = require$$0;
	exports.computeAccessibleDescription = _accessibleDescription.computeAccessibleDescription;
	var _accessibleName = require$$1;
	exports.computeAccessibleName = _accessibleName.computeAccessibleName;
	var _getRole = _interopRequireDefault(require$$2);
	exports.getRole = _getRole.default;
	var _isInaccessible = require$$3;
	Object.keys(_isInaccessible).forEach(function (key) {
	  if (key === "default" || key === "__esModule") return;
	  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
	  if (key in exports && exports[key] === _isInaccessible[key]) return;
	  exports[key] = _isInaccessible[key];
	});
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
} (dist));

Object.defineProperty(toHaveAccessibleDescription$1, "__esModule", {
  value: true
});
toHaveAccessibleDescription$1.toHaveAccessibleDescription = toHaveAccessibleDescription;

var _domAccessibilityApi$1 = dist;

var _utils$g = utils;

function toHaveAccessibleDescription(htmlElement, expectedAccessibleDescription) {
  (0, _utils$g.checkHtmlElement)(htmlElement, toHaveAccessibleDescription, this);
  const actualAccessibleDescription = (0, _domAccessibilityApi$1.computeAccessibleDescription)(htmlElement);
  const missingExpectedValue = arguments.length === 1;
  let pass = false;

  if (missingExpectedValue) {
    // When called without an expected value we only want to validate that the element has an
    // accessible description, whatever it may be.
    pass = actualAccessibleDescription !== '';
  } else {
    pass = expectedAccessibleDescription instanceof RegExp ? expectedAccessibleDescription.test(actualAccessibleDescription) : this.equals(actualAccessibleDescription, expectedAccessibleDescription);
  }

  return {
    pass,
    message: () => {
      const to = this.isNot ? 'not to' : 'to';
      return (0, _utils$g.getMessage)(this, this.utils.matcherHint(`${this.isNot ? '.not' : ''}.${toHaveAccessibleDescription.name}`, 'element', ''), `Expected element ${to} have accessible description`, expectedAccessibleDescription, 'Received', actualAccessibleDescription);
    }
  };
}

var toHaveAccessibleName$1 = {};

Object.defineProperty(toHaveAccessibleName$1, "__esModule", {
  value: true
});
toHaveAccessibleName$1.toHaveAccessibleName = toHaveAccessibleName;

var _domAccessibilityApi = dist;

var _utils$f = utils;

function toHaveAccessibleName(htmlElement, expectedAccessibleName) {
  (0, _utils$f.checkHtmlElement)(htmlElement, toHaveAccessibleName, this);
  const actualAccessibleName = (0, _domAccessibilityApi.computeAccessibleName)(htmlElement);
  const missingExpectedValue = arguments.length === 1;
  let pass = false;

  if (missingExpectedValue) {
    // When called without an expected value we only want to validate that the element has an
    // accessible name, whatever it may be.
    pass = actualAccessibleName !== '';
  } else {
    pass = expectedAccessibleName instanceof RegExp ? expectedAccessibleName.test(actualAccessibleName) : this.equals(actualAccessibleName, expectedAccessibleName);
  }

  return {
    pass,
    message: () => {
      const to = this.isNot ? 'not to' : 'to';
      return (0, _utils$f.getMessage)(this, this.utils.matcherHint(`${this.isNot ? '.not' : ''}.${toHaveAccessibleName.name}`, 'element', ''), `Expected element ${to} have accessible name`, expectedAccessibleName, 'Received', actualAccessibleName);
    }
  };
}

var toHaveAttribute$1 = {};

Object.defineProperty(toHaveAttribute$1, "__esModule", {
  value: true
});
toHaveAttribute$1.toHaveAttribute = toHaveAttribute;

var _utils$e = utils;

function printAttribute(stringify, name, value) {
  return value === undefined ? name : `${name}=${stringify(value)}`;
}

function getAttributeComment(stringify, name, value) {
  return value === undefined ? `element.hasAttribute(${stringify(name)})` : `element.getAttribute(${stringify(name)}) === ${stringify(value)}`;
}

function toHaveAttribute(htmlElement, name, expectedValue) {
  (0, _utils$e.checkHtmlElement)(htmlElement, toHaveAttribute, this);
  const isExpectedValuePresent = expectedValue !== undefined;
  const hasAttribute = htmlElement.hasAttribute(name);
  const receivedValue = htmlElement.getAttribute(name);
  return {
    pass: isExpectedValuePresent ? hasAttribute && this.equals(receivedValue, expectedValue) : hasAttribute,
    message: () => {
      const to = this.isNot ? 'not to' : 'to';
      const receivedAttribute = hasAttribute ? printAttribute(this.utils.stringify, name, receivedValue) : null;
      const matcher = this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toHaveAttribute`, 'element', this.utils.printExpected(name), {
        secondArgument: isExpectedValuePresent ? this.utils.printExpected(expectedValue) : undefined,
        comment: getAttributeComment(this.utils.stringify, name, expectedValue)
      });
      return (0, _utils$e.getMessage)(this, matcher, `Expected the element ${to} have attribute`, printAttribute(this.utils.stringify, name, expectedValue), 'Received', receivedAttribute);
    }
  };
}

var toHaveClass$1 = {};

Object.defineProperty(toHaveClass$1, "__esModule", {
  value: true
});
toHaveClass$1.toHaveClass = toHaveClass;

var _utils$d = utils;

function getExpectedClassNamesAndOptions(params) {
  const lastParam = params.pop();
  let expectedClassNames, options;

  if (typeof lastParam === 'object') {
    expectedClassNames = params;
    options = lastParam;
  } else {
    expectedClassNames = params.concat(lastParam);
    options = {
      exact: false
    };
  }

  return {
    expectedClassNames,
    options
  };
}

function splitClassNames(str) {
  if (!str) {
    return [];
  }

  return str.split(/\s+/).filter(s => s.length > 0);
}

function isSubset$1(subset, superset) {
  return subset.every(item => superset.includes(item));
}

function toHaveClass(htmlElement, ...params) {
  (0, _utils$d.checkHtmlElement)(htmlElement, toHaveClass, this);
  const {
    expectedClassNames,
    options
  } = getExpectedClassNamesAndOptions(params);
  const received = splitClassNames(htmlElement.getAttribute('class'));
  const expected = expectedClassNames.reduce((acc, className) => acc.concat(splitClassNames(className)), []);

  if (options.exact) {
    return {
      pass: isSubset$1(expected, received) && expected.length === received.length,
      message: () => {
        const to = this.isNot ? 'not to' : 'to';
        return (0, _utils$d.getMessage)(this, this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toHaveClass`, 'element', this.utils.printExpected(expected.join(' '))), `Expected the element ${to} have EXACTLY defined classes`, expected.join(' '), 'Received', received.join(' '));
      }
    };
  }

  return expected.length > 0 ? {
    pass: isSubset$1(expected, received),
    message: () => {
      const to = this.isNot ? 'not to' : 'to';
      return (0, _utils$d.getMessage)(this, this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toHaveClass`, 'element', this.utils.printExpected(expected.join(' '))), `Expected the element ${to} have class`, expected.join(' '), 'Received', received.join(' '));
    }
  } : {
    pass: this.isNot ? received.length > 0 : false,
    message: () => this.isNot ? (0, _utils$d.getMessage)(this, this.utils.matcherHint('.not.toHaveClass', 'element', ''), 'Expected the element to have classes', '(none)', 'Received', received.join(' ')) : [this.utils.matcherHint(`.toHaveClass`, 'element'), 'At least one expected class must be provided.'].join('\n')
  };
}

var toHaveStyle$1 = {};

var ansiStylesExports = {};
var ansiStyles = {
  get exports(){ return ansiStylesExports; },
  set exports(v){ ansiStylesExports = v; },
};

var colorName;
var hasRequiredColorName;

function requireColorName () {
	if (hasRequiredColorName) return colorName;
	hasRequiredColorName = 1;

	colorName = {
		"aliceblue": [240, 248, 255],
		"antiquewhite": [250, 235, 215],
		"aqua": [0, 255, 255],
		"aquamarine": [127, 255, 212],
		"azure": [240, 255, 255],
		"beige": [245, 245, 220],
		"bisque": [255, 228, 196],
		"black": [0, 0, 0],
		"blanchedalmond": [255, 235, 205],
		"blue": [0, 0, 255],
		"blueviolet": [138, 43, 226],
		"brown": [165, 42, 42],
		"burlywood": [222, 184, 135],
		"cadetblue": [95, 158, 160],
		"chartreuse": [127, 255, 0],
		"chocolate": [210, 105, 30],
		"coral": [255, 127, 80],
		"cornflowerblue": [100, 149, 237],
		"cornsilk": [255, 248, 220],
		"crimson": [220, 20, 60],
		"cyan": [0, 255, 255],
		"darkblue": [0, 0, 139],
		"darkcyan": [0, 139, 139],
		"darkgoldenrod": [184, 134, 11],
		"darkgray": [169, 169, 169],
		"darkgreen": [0, 100, 0],
		"darkgrey": [169, 169, 169],
		"darkkhaki": [189, 183, 107],
		"darkmagenta": [139, 0, 139],
		"darkolivegreen": [85, 107, 47],
		"darkorange": [255, 140, 0],
		"darkorchid": [153, 50, 204],
		"darkred": [139, 0, 0],
		"darksalmon": [233, 150, 122],
		"darkseagreen": [143, 188, 143],
		"darkslateblue": [72, 61, 139],
		"darkslategray": [47, 79, 79],
		"darkslategrey": [47, 79, 79],
		"darkturquoise": [0, 206, 209],
		"darkviolet": [148, 0, 211],
		"deeppink": [255, 20, 147],
		"deepskyblue": [0, 191, 255],
		"dimgray": [105, 105, 105],
		"dimgrey": [105, 105, 105],
		"dodgerblue": [30, 144, 255],
		"firebrick": [178, 34, 34],
		"floralwhite": [255, 250, 240],
		"forestgreen": [34, 139, 34],
		"fuchsia": [255, 0, 255],
		"gainsboro": [220, 220, 220],
		"ghostwhite": [248, 248, 255],
		"gold": [255, 215, 0],
		"goldenrod": [218, 165, 32],
		"gray": [128, 128, 128],
		"green": [0, 128, 0],
		"greenyellow": [173, 255, 47],
		"grey": [128, 128, 128],
		"honeydew": [240, 255, 240],
		"hotpink": [255, 105, 180],
		"indianred": [205, 92, 92],
		"indigo": [75, 0, 130],
		"ivory": [255, 255, 240],
		"khaki": [240, 230, 140],
		"lavender": [230, 230, 250],
		"lavenderblush": [255, 240, 245],
		"lawngreen": [124, 252, 0],
		"lemonchiffon": [255, 250, 205],
		"lightblue": [173, 216, 230],
		"lightcoral": [240, 128, 128],
		"lightcyan": [224, 255, 255],
		"lightgoldenrodyellow": [250, 250, 210],
		"lightgray": [211, 211, 211],
		"lightgreen": [144, 238, 144],
		"lightgrey": [211, 211, 211],
		"lightpink": [255, 182, 193],
		"lightsalmon": [255, 160, 122],
		"lightseagreen": [32, 178, 170],
		"lightskyblue": [135, 206, 250],
		"lightslategray": [119, 136, 153],
		"lightslategrey": [119, 136, 153],
		"lightsteelblue": [176, 196, 222],
		"lightyellow": [255, 255, 224],
		"lime": [0, 255, 0],
		"limegreen": [50, 205, 50],
		"linen": [250, 240, 230],
		"magenta": [255, 0, 255],
		"maroon": [128, 0, 0],
		"mediumaquamarine": [102, 205, 170],
		"mediumblue": [0, 0, 205],
		"mediumorchid": [186, 85, 211],
		"mediumpurple": [147, 112, 219],
		"mediumseagreen": [60, 179, 113],
		"mediumslateblue": [123, 104, 238],
		"mediumspringgreen": [0, 250, 154],
		"mediumturquoise": [72, 209, 204],
		"mediumvioletred": [199, 21, 133],
		"midnightblue": [25, 25, 112],
		"mintcream": [245, 255, 250],
		"mistyrose": [255, 228, 225],
		"moccasin": [255, 228, 181],
		"navajowhite": [255, 222, 173],
		"navy": [0, 0, 128],
		"oldlace": [253, 245, 230],
		"olive": [128, 128, 0],
		"olivedrab": [107, 142, 35],
		"orange": [255, 165, 0],
		"orangered": [255, 69, 0],
		"orchid": [218, 112, 214],
		"palegoldenrod": [238, 232, 170],
		"palegreen": [152, 251, 152],
		"paleturquoise": [175, 238, 238],
		"palevioletred": [219, 112, 147],
		"papayawhip": [255, 239, 213],
		"peachpuff": [255, 218, 185],
		"peru": [205, 133, 63],
		"pink": [255, 192, 203],
		"plum": [221, 160, 221],
		"powderblue": [176, 224, 230],
		"purple": [128, 0, 128],
		"rebeccapurple": [102, 51, 153],
		"red": [255, 0, 0],
		"rosybrown": [188, 143, 143],
		"royalblue": [65, 105, 225],
		"saddlebrown": [139, 69, 19],
		"salmon": [250, 128, 114],
		"sandybrown": [244, 164, 96],
		"seagreen": [46, 139, 87],
		"seashell": [255, 245, 238],
		"sienna": [160, 82, 45],
		"silver": [192, 192, 192],
		"skyblue": [135, 206, 235],
		"slateblue": [106, 90, 205],
		"slategray": [112, 128, 144],
		"slategrey": [112, 128, 144],
		"snow": [255, 250, 250],
		"springgreen": [0, 255, 127],
		"steelblue": [70, 130, 180],
		"tan": [210, 180, 140],
		"teal": [0, 128, 128],
		"thistle": [216, 191, 216],
		"tomato": [255, 99, 71],
		"turquoise": [64, 224, 208],
		"violet": [238, 130, 238],
		"wheat": [245, 222, 179],
		"white": [255, 255, 255],
		"whitesmoke": [245, 245, 245],
		"yellow": [255, 255, 0],
		"yellowgreen": [154, 205, 50]
	};
	return colorName;
}

/* MIT license */

var conversions;
var hasRequiredConversions;

function requireConversions () {
	if (hasRequiredConversions) return conversions;
	hasRequiredConversions = 1;
	/* eslint-disable no-mixed-operators */
	const cssKeywords = requireColorName();

	// NOTE: conversions should only return primitive values (i.e. arrays, or
	//       values that give correct `typeof` results).
	//       do not use box values types (i.e. Number(), String(), etc.)

	const reverseKeywords = {};
	for (const key of Object.keys(cssKeywords)) {
		reverseKeywords[cssKeywords[key]] = key;
	}

	const convert = {
		rgb: {channels: 3, labels: 'rgb'},
		hsl: {channels: 3, labels: 'hsl'},
		hsv: {channels: 3, labels: 'hsv'},
		hwb: {channels: 3, labels: 'hwb'},
		cmyk: {channels: 4, labels: 'cmyk'},
		xyz: {channels: 3, labels: 'xyz'},
		lab: {channels: 3, labels: 'lab'},
		lch: {channels: 3, labels: 'lch'},
		hex: {channels: 1, labels: ['hex']},
		keyword: {channels: 1, labels: ['keyword']},
		ansi16: {channels: 1, labels: ['ansi16']},
		ansi256: {channels: 1, labels: ['ansi256']},
		hcg: {channels: 3, labels: ['h', 'c', 'g']},
		apple: {channels: 3, labels: ['r16', 'g16', 'b16']},
		gray: {channels: 1, labels: ['gray']}
	};

	conversions = convert;

	// Hide .channels and .labels properties
	for (const model of Object.keys(convert)) {
		if (!('channels' in convert[model])) {
			throw new Error('missing channels property: ' + model);
		}

		if (!('labels' in convert[model])) {
			throw new Error('missing channel labels property: ' + model);
		}

		if (convert[model].labels.length !== convert[model].channels) {
			throw new Error('channel and label counts mismatch: ' + model);
		}

		const {channels, labels} = convert[model];
		delete convert[model].channels;
		delete convert[model].labels;
		Object.defineProperty(convert[model], 'channels', {value: channels});
		Object.defineProperty(convert[model], 'labels', {value: labels});
	}

	convert.rgb.hsl = function (rgb) {
		const r = rgb[0] / 255;
		const g = rgb[1] / 255;
		const b = rgb[2] / 255;
		const min = Math.min(r, g, b);
		const max = Math.max(r, g, b);
		const delta = max - min;
		let h;
		let s;

		if (max === min) {
			h = 0;
		} else if (r === max) {
			h = (g - b) / delta;
		} else if (g === max) {
			h = 2 + (b - r) / delta;
		} else if (b === max) {
			h = 4 + (r - g) / delta;
		}

		h = Math.min(h * 60, 360);

		if (h < 0) {
			h += 360;
		}

		const l = (min + max) / 2;

		if (max === min) {
			s = 0;
		} else if (l <= 0.5) {
			s = delta / (max + min);
		} else {
			s = delta / (2 - max - min);
		}

		return [h, s * 100, l * 100];
	};

	convert.rgb.hsv = function (rgb) {
		let rdif;
		let gdif;
		let bdif;
		let h;
		let s;

		const r = rgb[0] / 255;
		const g = rgb[1] / 255;
		const b = rgb[2] / 255;
		const v = Math.max(r, g, b);
		const diff = v - Math.min(r, g, b);
		const diffc = function (c) {
			return (v - c) / 6 / diff + 1 / 2;
		};

		if (diff === 0) {
			h = 0;
			s = 0;
		} else {
			s = diff / v;
			rdif = diffc(r);
			gdif = diffc(g);
			bdif = diffc(b);

			if (r === v) {
				h = bdif - gdif;
			} else if (g === v) {
				h = (1 / 3) + rdif - bdif;
			} else if (b === v) {
				h = (2 / 3) + gdif - rdif;
			}

			if (h < 0) {
				h += 1;
			} else if (h > 1) {
				h -= 1;
			}
		}

		return [
			h * 360,
			s * 100,
			v * 100
		];
	};

	convert.rgb.hwb = function (rgb) {
		const r = rgb[0];
		const g = rgb[1];
		let b = rgb[2];
		const h = convert.rgb.hsl(rgb)[0];
		const w = 1 / 255 * Math.min(r, Math.min(g, b));

		b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));

		return [h, w * 100, b * 100];
	};

	convert.rgb.cmyk = function (rgb) {
		const r = rgb[0] / 255;
		const g = rgb[1] / 255;
		const b = rgb[2] / 255;

		const k = Math.min(1 - r, 1 - g, 1 - b);
		const c = (1 - r - k) / (1 - k) || 0;
		const m = (1 - g - k) / (1 - k) || 0;
		const y = (1 - b - k) / (1 - k) || 0;

		return [c * 100, m * 100, y * 100, k * 100];
	};

	function comparativeDistance(x, y) {
		/*
			See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
		*/
		return (
			((x[0] - y[0]) ** 2) +
			((x[1] - y[1]) ** 2) +
			((x[2] - y[2]) ** 2)
		);
	}

	convert.rgb.keyword = function (rgb) {
		const reversed = reverseKeywords[rgb];
		if (reversed) {
			return reversed;
		}

		let currentClosestDistance = Infinity;
		let currentClosestKeyword;

		for (const keyword of Object.keys(cssKeywords)) {
			const value = cssKeywords[keyword];

			// Compute comparative distance
			const distance = comparativeDistance(rgb, value);

			// Check if its less, if so set as closest
			if (distance < currentClosestDistance) {
				currentClosestDistance = distance;
				currentClosestKeyword = keyword;
			}
		}

		return currentClosestKeyword;
	};

	convert.keyword.rgb = function (keyword) {
		return cssKeywords[keyword];
	};

	convert.rgb.xyz = function (rgb) {
		let r = rgb[0] / 255;
		let g = rgb[1] / 255;
		let b = rgb[2] / 255;

		// Assume sRGB
		r = r > 0.04045 ? (((r + 0.055) / 1.055) ** 2.4) : (r / 12.92);
		g = g > 0.04045 ? (((g + 0.055) / 1.055) ** 2.4) : (g / 12.92);
		b = b > 0.04045 ? (((b + 0.055) / 1.055) ** 2.4) : (b / 12.92);

		const x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
		const y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
		const z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

		return [x * 100, y * 100, z * 100];
	};

	convert.rgb.lab = function (rgb) {
		const xyz = convert.rgb.xyz(rgb);
		let x = xyz[0];
		let y = xyz[1];
		let z = xyz[2];

		x /= 95.047;
		y /= 100;
		z /= 108.883;

		x = x > 0.008856 ? (x ** (1 / 3)) : (7.787 * x) + (16 / 116);
		y = y > 0.008856 ? (y ** (1 / 3)) : (7.787 * y) + (16 / 116);
		z = z > 0.008856 ? (z ** (1 / 3)) : (7.787 * z) + (16 / 116);

		const l = (116 * y) - 16;
		const a = 500 * (x - y);
		const b = 200 * (y - z);

		return [l, a, b];
	};

	convert.hsl.rgb = function (hsl) {
		const h = hsl[0] / 360;
		const s = hsl[1] / 100;
		const l = hsl[2] / 100;
		let t2;
		let t3;
		let val;

		if (s === 0) {
			val = l * 255;
			return [val, val, val];
		}

		if (l < 0.5) {
			t2 = l * (1 + s);
		} else {
			t2 = l + s - l * s;
		}

		const t1 = 2 * l - t2;

		const rgb = [0, 0, 0];
		for (let i = 0; i < 3; i++) {
			t3 = h + 1 / 3 * -(i - 1);
			if (t3 < 0) {
				t3++;
			}

			if (t3 > 1) {
				t3--;
			}

			if (6 * t3 < 1) {
				val = t1 + (t2 - t1) * 6 * t3;
			} else if (2 * t3 < 1) {
				val = t2;
			} else if (3 * t3 < 2) {
				val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
			} else {
				val = t1;
			}

			rgb[i] = val * 255;
		}

		return rgb;
	};

	convert.hsl.hsv = function (hsl) {
		const h = hsl[0];
		let s = hsl[1] / 100;
		let l = hsl[2] / 100;
		let smin = s;
		const lmin = Math.max(l, 0.01);

		l *= 2;
		s *= (l <= 1) ? l : 2 - l;
		smin *= lmin <= 1 ? lmin : 2 - lmin;
		const v = (l + s) / 2;
		const sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

		return [h, sv * 100, v * 100];
	};

	convert.hsv.rgb = function (hsv) {
		const h = hsv[0] / 60;
		const s = hsv[1] / 100;
		let v = hsv[2] / 100;
		const hi = Math.floor(h) % 6;

		const f = h - Math.floor(h);
		const p = 255 * v * (1 - s);
		const q = 255 * v * (1 - (s * f));
		const t = 255 * v * (1 - (s * (1 - f)));
		v *= 255;

		switch (hi) {
			case 0:
				return [v, t, p];
			case 1:
				return [q, v, p];
			case 2:
				return [p, v, t];
			case 3:
				return [p, q, v];
			case 4:
				return [t, p, v];
			case 5:
				return [v, p, q];
		}
	};

	convert.hsv.hsl = function (hsv) {
		const h = hsv[0];
		const s = hsv[1] / 100;
		const v = hsv[2] / 100;
		const vmin = Math.max(v, 0.01);
		let sl;
		let l;

		l = (2 - s) * v;
		const lmin = (2 - s) * vmin;
		sl = s * vmin;
		sl /= (lmin <= 1) ? lmin : 2 - lmin;
		sl = sl || 0;
		l /= 2;

		return [h, sl * 100, l * 100];
	};

	// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
	convert.hwb.rgb = function (hwb) {
		const h = hwb[0] / 360;
		let wh = hwb[1] / 100;
		let bl = hwb[2] / 100;
		const ratio = wh + bl;
		let f;

		// Wh + bl cant be > 1
		if (ratio > 1) {
			wh /= ratio;
			bl /= ratio;
		}

		const i = Math.floor(6 * h);
		const v = 1 - bl;
		f = 6 * h - i;

		if ((i & 0x01) !== 0) {
			f = 1 - f;
		}

		const n = wh + f * (v - wh); // Linear interpolation

		let r;
		let g;
		let b;
		/* eslint-disable max-statements-per-line,no-multi-spaces */
		switch (i) {
			default:
			case 6:
			case 0: r = v;  g = n;  b = wh; break;
			case 1: r = n;  g = v;  b = wh; break;
			case 2: r = wh; g = v;  b = n; break;
			case 3: r = wh; g = n;  b = v; break;
			case 4: r = n;  g = wh; b = v; break;
			case 5: r = v;  g = wh; b = n; break;
		}
		/* eslint-enable max-statements-per-line,no-multi-spaces */

		return [r * 255, g * 255, b * 255];
	};

	convert.cmyk.rgb = function (cmyk) {
		const c = cmyk[0] / 100;
		const m = cmyk[1] / 100;
		const y = cmyk[2] / 100;
		const k = cmyk[3] / 100;

		const r = 1 - Math.min(1, c * (1 - k) + k);
		const g = 1 - Math.min(1, m * (1 - k) + k);
		const b = 1 - Math.min(1, y * (1 - k) + k);

		return [r * 255, g * 255, b * 255];
	};

	convert.xyz.rgb = function (xyz) {
		const x = xyz[0] / 100;
		const y = xyz[1] / 100;
		const z = xyz[2] / 100;
		let r;
		let g;
		let b;

		r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
		g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
		b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

		// Assume sRGB
		r = r > 0.0031308
			? ((1.055 * (r ** (1.0 / 2.4))) - 0.055)
			: r * 12.92;

		g = g > 0.0031308
			? ((1.055 * (g ** (1.0 / 2.4))) - 0.055)
			: g * 12.92;

		b = b > 0.0031308
			? ((1.055 * (b ** (1.0 / 2.4))) - 0.055)
			: b * 12.92;

		r = Math.min(Math.max(0, r), 1);
		g = Math.min(Math.max(0, g), 1);
		b = Math.min(Math.max(0, b), 1);

		return [r * 255, g * 255, b * 255];
	};

	convert.xyz.lab = function (xyz) {
		let x = xyz[0];
		let y = xyz[1];
		let z = xyz[2];

		x /= 95.047;
		y /= 100;
		z /= 108.883;

		x = x > 0.008856 ? (x ** (1 / 3)) : (7.787 * x) + (16 / 116);
		y = y > 0.008856 ? (y ** (1 / 3)) : (7.787 * y) + (16 / 116);
		z = z > 0.008856 ? (z ** (1 / 3)) : (7.787 * z) + (16 / 116);

		const l = (116 * y) - 16;
		const a = 500 * (x - y);
		const b = 200 * (y - z);

		return [l, a, b];
	};

	convert.lab.xyz = function (lab) {
		const l = lab[0];
		const a = lab[1];
		const b = lab[2];
		let x;
		let y;
		let z;

		y = (l + 16) / 116;
		x = a / 500 + y;
		z = y - b / 200;

		const y2 = y ** 3;
		const x2 = x ** 3;
		const z2 = z ** 3;
		y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
		x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
		z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;

		x *= 95.047;
		y *= 100;
		z *= 108.883;

		return [x, y, z];
	};

	convert.lab.lch = function (lab) {
		const l = lab[0];
		const a = lab[1];
		const b = lab[2];
		let h;

		const hr = Math.atan2(b, a);
		h = hr * 360 / 2 / Math.PI;

		if (h < 0) {
			h += 360;
		}

		const c = Math.sqrt(a * a + b * b);

		return [l, c, h];
	};

	convert.lch.lab = function (lch) {
		const l = lch[0];
		const c = lch[1];
		const h = lch[2];

		const hr = h / 360 * 2 * Math.PI;
		const a = c * Math.cos(hr);
		const b = c * Math.sin(hr);

		return [l, a, b];
	};

	convert.rgb.ansi16 = function (args, saturation = null) {
		const [r, g, b] = args;
		let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation; // Hsv -> ansi16 optimization

		value = Math.round(value / 50);

		if (value === 0) {
			return 30;
		}

		let ansi = 30
			+ ((Math.round(b / 255) << 2)
			| (Math.round(g / 255) << 1)
			| Math.round(r / 255));

		if (value === 2) {
			ansi += 60;
		}

		return ansi;
	};

	convert.hsv.ansi16 = function (args) {
		// Optimization here; we already know the value and don't need to get
		// it converted for us.
		return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
	};

	convert.rgb.ansi256 = function (args) {
		const r = args[0];
		const g = args[1];
		const b = args[2];

		// We use the extended greyscale palette here, with the exception of
		// black and white. normal palette only has 4 greyscale shades.
		if (r === g && g === b) {
			if (r < 8) {
				return 16;
			}

			if (r > 248) {
				return 231;
			}

			return Math.round(((r - 8) / 247) * 24) + 232;
		}

		const ansi = 16
			+ (36 * Math.round(r / 255 * 5))
			+ (6 * Math.round(g / 255 * 5))
			+ Math.round(b / 255 * 5);

		return ansi;
	};

	convert.ansi16.rgb = function (args) {
		let color = args % 10;

		// Handle greyscale
		if (color === 0 || color === 7) {
			if (args > 50) {
				color += 3.5;
			}

			color = color / 10.5 * 255;

			return [color, color, color];
		}

		const mult = (~~(args > 50) + 1) * 0.5;
		const r = ((color & 1) * mult) * 255;
		const g = (((color >> 1) & 1) * mult) * 255;
		const b = (((color >> 2) & 1) * mult) * 255;

		return [r, g, b];
	};

	convert.ansi256.rgb = function (args) {
		// Handle greyscale
		if (args >= 232) {
			const c = (args - 232) * 10 + 8;
			return [c, c, c];
		}

		args -= 16;

		let rem;
		const r = Math.floor(args / 36) / 5 * 255;
		const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
		const b = (rem % 6) / 5 * 255;

		return [r, g, b];
	};

	convert.rgb.hex = function (args) {
		const integer = ((Math.round(args[0]) & 0xFF) << 16)
			+ ((Math.round(args[1]) & 0xFF) << 8)
			+ (Math.round(args[2]) & 0xFF);

		const string = integer.toString(16).toUpperCase();
		return '000000'.substring(string.length) + string;
	};

	convert.hex.rgb = function (args) {
		const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
		if (!match) {
			return [0, 0, 0];
		}

		let colorString = match[0];

		if (match[0].length === 3) {
			colorString = colorString.split('').map(char => {
				return char + char;
			}).join('');
		}

		const integer = parseInt(colorString, 16);
		const r = (integer >> 16) & 0xFF;
		const g = (integer >> 8) & 0xFF;
		const b = integer & 0xFF;

		return [r, g, b];
	};

	convert.rgb.hcg = function (rgb) {
		const r = rgb[0] / 255;
		const g = rgb[1] / 255;
		const b = rgb[2] / 255;
		const max = Math.max(Math.max(r, g), b);
		const min = Math.min(Math.min(r, g), b);
		const chroma = (max - min);
		let grayscale;
		let hue;

		if (chroma < 1) {
			grayscale = min / (1 - chroma);
		} else {
			grayscale = 0;
		}

		if (chroma <= 0) {
			hue = 0;
		} else
		if (max === r) {
			hue = ((g - b) / chroma) % 6;
		} else
		if (max === g) {
			hue = 2 + (b - r) / chroma;
		} else {
			hue = 4 + (r - g) / chroma;
		}

		hue /= 6;
		hue %= 1;

		return [hue * 360, chroma * 100, grayscale * 100];
	};

	convert.hsl.hcg = function (hsl) {
		const s = hsl[1] / 100;
		const l = hsl[2] / 100;

		const c = l < 0.5 ? (2.0 * s * l) : (2.0 * s * (1.0 - l));

		let f = 0;
		if (c < 1.0) {
			f = (l - 0.5 * c) / (1.0 - c);
		}

		return [hsl[0], c * 100, f * 100];
	};

	convert.hsv.hcg = function (hsv) {
		const s = hsv[1] / 100;
		const v = hsv[2] / 100;

		const c = s * v;
		let f = 0;

		if (c < 1.0) {
			f = (v - c) / (1 - c);
		}

		return [hsv[0], c * 100, f * 100];
	};

	convert.hcg.rgb = function (hcg) {
		const h = hcg[0] / 360;
		const c = hcg[1] / 100;
		const g = hcg[2] / 100;

		if (c === 0.0) {
			return [g * 255, g * 255, g * 255];
		}

		const pure = [0, 0, 0];
		const hi = (h % 1) * 6;
		const v = hi % 1;
		const w = 1 - v;
		let mg = 0;

		/* eslint-disable max-statements-per-line */
		switch (Math.floor(hi)) {
			case 0:
				pure[0] = 1; pure[1] = v; pure[2] = 0; break;
			case 1:
				pure[0] = w; pure[1] = 1; pure[2] = 0; break;
			case 2:
				pure[0] = 0; pure[1] = 1; pure[2] = v; break;
			case 3:
				pure[0] = 0; pure[1] = w; pure[2] = 1; break;
			case 4:
				pure[0] = v; pure[1] = 0; pure[2] = 1; break;
			default:
				pure[0] = 1; pure[1] = 0; pure[2] = w;
		}
		/* eslint-enable max-statements-per-line */

		mg = (1.0 - c) * g;

		return [
			(c * pure[0] + mg) * 255,
			(c * pure[1] + mg) * 255,
			(c * pure[2] + mg) * 255
		];
	};

	convert.hcg.hsv = function (hcg) {
		const c = hcg[1] / 100;
		const g = hcg[2] / 100;

		const v = c + g * (1.0 - c);
		let f = 0;

		if (v > 0.0) {
			f = c / v;
		}

		return [hcg[0], f * 100, v * 100];
	};

	convert.hcg.hsl = function (hcg) {
		const c = hcg[1] / 100;
		const g = hcg[2] / 100;

		const l = g * (1.0 - c) + 0.5 * c;
		let s = 0;

		if (l > 0.0 && l < 0.5) {
			s = c / (2 * l);
		} else
		if (l >= 0.5 && l < 1.0) {
			s = c / (2 * (1 - l));
		}

		return [hcg[0], s * 100, l * 100];
	};

	convert.hcg.hwb = function (hcg) {
		const c = hcg[1] / 100;
		const g = hcg[2] / 100;
		const v = c + g * (1.0 - c);
		return [hcg[0], (v - c) * 100, (1 - v) * 100];
	};

	convert.hwb.hcg = function (hwb) {
		const w = hwb[1] / 100;
		const b = hwb[2] / 100;
		const v = 1 - b;
		const c = v - w;
		let g = 0;

		if (c < 1) {
			g = (v - c) / (1 - c);
		}

		return [hwb[0], c * 100, g * 100];
	};

	convert.apple.rgb = function (apple) {
		return [(apple[0] / 65535) * 255, (apple[1] / 65535) * 255, (apple[2] / 65535) * 255];
	};

	convert.rgb.apple = function (rgb) {
		return [(rgb[0] / 255) * 65535, (rgb[1] / 255) * 65535, (rgb[2] / 255) * 65535];
	};

	convert.gray.rgb = function (args) {
		return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
	};

	convert.gray.hsl = function (args) {
		return [0, 0, args[0]];
	};

	convert.gray.hsv = convert.gray.hsl;

	convert.gray.hwb = function (gray) {
		return [0, 100, gray[0]];
	};

	convert.gray.cmyk = function (gray) {
		return [0, 0, 0, gray[0]];
	};

	convert.gray.lab = function (gray) {
		return [gray[0], 0, 0];
	};

	convert.gray.hex = function (gray) {
		const val = Math.round(gray[0] / 100 * 255) & 0xFF;
		const integer = (val << 16) + (val << 8) + val;

		const string = integer.toString(16).toUpperCase();
		return '000000'.substring(string.length) + string;
	};

	convert.rgb.gray = function (rgb) {
		const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
		return [val / 255 * 100];
	};
	return conversions;
}

var route;
var hasRequiredRoute;

function requireRoute () {
	if (hasRequiredRoute) return route;
	hasRequiredRoute = 1;
	const conversions = requireConversions();

	/*
		This function routes a model to all other models.

		all functions that are routed have a property `.conversion` attached
		to the returned synthetic function. This property is an array
		of strings, each with the steps in between the 'from' and 'to'
		color models (inclusive).

		conversions that are not possible simply are not included.
	*/

	function buildGraph() {
		const graph = {};
		// https://jsperf.com/object-keys-vs-for-in-with-closure/3
		const models = Object.keys(conversions);

		for (let len = models.length, i = 0; i < len; i++) {
			graph[models[i]] = {
				// http://jsperf.com/1-vs-infinity
				// micro-opt, but this is simple.
				distance: -1,
				parent: null
			};
		}

		return graph;
	}

	// https://en.wikipedia.org/wiki/Breadth-first_search
	function deriveBFS(fromModel) {
		const graph = buildGraph();
		const queue = [fromModel]; // Unshift -> queue -> pop

		graph[fromModel].distance = 0;

		while (queue.length) {
			const current = queue.pop();
			const adjacents = Object.keys(conversions[current]);

			for (let len = adjacents.length, i = 0; i < len; i++) {
				const adjacent = adjacents[i];
				const node = graph[adjacent];

				if (node.distance === -1) {
					node.distance = graph[current].distance + 1;
					node.parent = current;
					queue.unshift(adjacent);
				}
			}
		}

		return graph;
	}

	function link(from, to) {
		return function (args) {
			return to(from(args));
		};
	}

	function wrapConversion(toModel, graph) {
		const path = [graph[toModel].parent, toModel];
		let fn = conversions[graph[toModel].parent][toModel];

		let cur = graph[toModel].parent;
		while (graph[cur].parent) {
			path.unshift(graph[cur].parent);
			fn = link(conversions[graph[cur].parent][cur], fn);
			cur = graph[cur].parent;
		}

		fn.conversion = path;
		return fn;
	}

	route = function (fromModel) {
		const graph = deriveBFS(fromModel);
		const conversion = {};

		const models = Object.keys(graph);
		for (let len = models.length, i = 0; i < len; i++) {
			const toModel = models[i];
			const node = graph[toModel];

			if (node.parent === null) {
				// No possible conversion, or this node is the source model.
				continue;
			}

			conversion[toModel] = wrapConversion(toModel, graph);
		}

		return conversion;
	};
	return route;
}

var colorConvert;
var hasRequiredColorConvert;

function requireColorConvert () {
	if (hasRequiredColorConvert) return colorConvert;
	hasRequiredColorConvert = 1;
	const conversions = requireConversions();
	const route = requireRoute();

	const convert = {};

	const models = Object.keys(conversions);

	function wrapRaw(fn) {
		const wrappedFn = function (...args) {
			const arg0 = args[0];
			if (arg0 === undefined || arg0 === null) {
				return arg0;
			}

			if (arg0.length > 1) {
				args = arg0;
			}

			return fn(args);
		};

		// Preserve .conversion property if there is one
		if ('conversion' in fn) {
			wrappedFn.conversion = fn.conversion;
		}

		return wrappedFn;
	}

	function wrapRounded(fn) {
		const wrappedFn = function (...args) {
			const arg0 = args[0];

			if (arg0 === undefined || arg0 === null) {
				return arg0;
			}

			if (arg0.length > 1) {
				args = arg0;
			}

			const result = fn(args);

			// We're assuming the result is an array here.
			// see notice in conversions.js; don't use box types
			// in conversion functions.
			if (typeof result === 'object') {
				for (let len = result.length, i = 0; i < len; i++) {
					result[i] = Math.round(result[i]);
				}
			}

			return result;
		};

		// Preserve .conversion property if there is one
		if ('conversion' in fn) {
			wrappedFn.conversion = fn.conversion;
		}

		return wrappedFn;
	}

	models.forEach(fromModel => {
		convert[fromModel] = {};

		Object.defineProperty(convert[fromModel], 'channels', {value: conversions[fromModel].channels});
		Object.defineProperty(convert[fromModel], 'labels', {value: conversions[fromModel].labels});

		const routes = route(fromModel);
		const routeModels = Object.keys(routes);

		routeModels.forEach(toModel => {
			const fn = routes[toModel];

			convert[fromModel][toModel] = wrapRounded(fn);
			convert[fromModel][toModel].raw = wrapRaw(fn);
		});
	});

	colorConvert = convert;
	return colorConvert;
}

var hasRequiredAnsiStyles;

function requireAnsiStyles () {
	if (hasRequiredAnsiStyles) return ansiStylesExports;
	hasRequiredAnsiStyles = 1;
	(function (module) {

		const wrapAnsi16 = (fn, offset) => (...args) => {
			const code = fn(...args);
			return `\u001B[${code + offset}m`;
		};

		const wrapAnsi256 = (fn, offset) => (...args) => {
			const code = fn(...args);
			return `\u001B[${38 + offset};5;${code}m`;
		};

		const wrapAnsi16m = (fn, offset) => (...args) => {
			const rgb = fn(...args);
			return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
		};

		const ansi2ansi = n => n;
		const rgb2rgb = (r, g, b) => [r, g, b];

		const setLazyProperty = (object, property, get) => {
			Object.defineProperty(object, property, {
				get: () => {
					const value = get();

					Object.defineProperty(object, property, {
						value,
						enumerable: true,
						configurable: true
					});

					return value;
				},
				enumerable: true,
				configurable: true
			});
		};

		/** @type {typeof import('color-convert')} */
		let colorConvert;
		const makeDynamicStyles = (wrap, targetSpace, identity, isBackground) => {
			if (colorConvert === undefined) {
				colorConvert = requireColorConvert();
			}

			const offset = isBackground ? 10 : 0;
			const styles = {};

			for (const [sourceSpace, suite] of Object.entries(colorConvert)) {
				const name = sourceSpace === 'ansi16' ? 'ansi' : sourceSpace;
				if (sourceSpace === targetSpace) {
					styles[name] = wrap(identity, offset);
				} else if (typeof suite === 'object') {
					styles[name] = wrap(suite[targetSpace], offset);
				}
			}

			return styles;
		};

		function assembleStyles() {
			const codes = new Map();
			const styles = {
				modifier: {
					reset: [0, 0],
					// 21 isn't widely supported and 22 does the same thing
					bold: [1, 22],
					dim: [2, 22],
					italic: [3, 23],
					underline: [4, 24],
					inverse: [7, 27],
					hidden: [8, 28],
					strikethrough: [9, 29]
				},
				color: {
					black: [30, 39],
					red: [31, 39],
					green: [32, 39],
					yellow: [33, 39],
					blue: [34, 39],
					magenta: [35, 39],
					cyan: [36, 39],
					white: [37, 39],

					// Bright color
					blackBright: [90, 39],
					redBright: [91, 39],
					greenBright: [92, 39],
					yellowBright: [93, 39],
					blueBright: [94, 39],
					magentaBright: [95, 39],
					cyanBright: [96, 39],
					whiteBright: [97, 39]
				},
				bgColor: {
					bgBlack: [40, 49],
					bgRed: [41, 49],
					bgGreen: [42, 49],
					bgYellow: [43, 49],
					bgBlue: [44, 49],
					bgMagenta: [45, 49],
					bgCyan: [46, 49],
					bgWhite: [47, 49],

					// Bright color
					bgBlackBright: [100, 49],
					bgRedBright: [101, 49],
					bgGreenBright: [102, 49],
					bgYellowBright: [103, 49],
					bgBlueBright: [104, 49],
					bgMagentaBright: [105, 49],
					bgCyanBright: [106, 49],
					bgWhiteBright: [107, 49]
				}
			};

			// Alias bright black as gray (and grey)
			styles.color.gray = styles.color.blackBright;
			styles.bgColor.bgGray = styles.bgColor.bgBlackBright;
			styles.color.grey = styles.color.blackBright;
			styles.bgColor.bgGrey = styles.bgColor.bgBlackBright;

			for (const [groupName, group] of Object.entries(styles)) {
				for (const [styleName, style] of Object.entries(group)) {
					styles[styleName] = {
						open: `\u001B[${style[0]}m`,
						close: `\u001B[${style[1]}m`
					};

					group[styleName] = styles[styleName];

					codes.set(style[0], style[1]);
				}

				Object.defineProperty(styles, groupName, {
					value: group,
					enumerable: false
				});
			}

			Object.defineProperty(styles, 'codes', {
				value: codes,
				enumerable: false
			});

			styles.color.close = '\u001B[39m';
			styles.bgColor.close = '\u001B[49m';

			setLazyProperty(styles.color, 'ansi', () => makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, false));
			setLazyProperty(styles.color, 'ansi256', () => makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, false));
			setLazyProperty(styles.color, 'ansi16m', () => makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, false));
			setLazyProperty(styles.bgColor, 'ansi', () => makeDynamicStyles(wrapAnsi16, 'ansi16', ansi2ansi, true));
			setLazyProperty(styles.bgColor, 'ansi256', () => makeDynamicStyles(wrapAnsi256, 'ansi256', ansi2ansi, true));
			setLazyProperty(styles.bgColor, 'ansi16m', () => makeDynamicStyles(wrapAnsi16m, 'rgb', rgb2rgb, true));

			return styles;
		}

		// Make the export immutable
		Object.defineProperty(module, 'exports', {
			enumerable: true,
			get: assembleStyles
		});
} (ansiStyles));
	return ansiStylesExports;
}

var hasFlag;
var hasRequiredHasFlag;

function requireHasFlag () {
	if (hasRequiredHasFlag) return hasFlag;
	hasRequiredHasFlag = 1;

	hasFlag = (flag, argv = process.argv) => {
		const prefix = flag.startsWith('-') ? '' : (flag.length === 1 ? '-' : '--');
		const position = argv.indexOf(prefix + flag);
		const terminatorPosition = argv.indexOf('--');
		return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
	};
	return hasFlag;
}

var supportsColor_1;
var hasRequiredSupportsColor;

function requireSupportsColor () {
	if (hasRequiredSupportsColor) return supportsColor_1;
	hasRequiredSupportsColor = 1;
	const os = require$$0$1;
	const tty = require$$1$1;
	const hasFlag = requireHasFlag();

	const {env} = process;

	let forceColor;
	if (hasFlag('no-color') ||
		hasFlag('no-colors') ||
		hasFlag('color=false') ||
		hasFlag('color=never')) {
		forceColor = 0;
	} else if (hasFlag('color') ||
		hasFlag('colors') ||
		hasFlag('color=true') ||
		hasFlag('color=always')) {
		forceColor = 1;
	}

	if ('FORCE_COLOR' in env) {
		if (env.FORCE_COLOR === 'true') {
			forceColor = 1;
		} else if (env.FORCE_COLOR === 'false') {
			forceColor = 0;
		} else {
			forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
		}
	}

	function translateLevel(level) {
		if (level === 0) {
			return false;
		}

		return {
			level,
			hasBasic: true,
			has256: level >= 2,
			has16m: level >= 3
		};
	}

	function supportsColor(haveStream, streamIsTTY) {
		if (forceColor === 0) {
			return 0;
		}

		if (hasFlag('color=16m') ||
			hasFlag('color=full') ||
			hasFlag('color=truecolor')) {
			return 3;
		}

		if (hasFlag('color=256')) {
			return 2;
		}

		if (haveStream && !streamIsTTY && forceColor === undefined) {
			return 0;
		}

		const min = forceColor || 0;

		if (env.TERM === 'dumb') {
			return min;
		}

		if (process.platform === 'win32') {
			// Windows 10 build 10586 is the first Windows release that supports 256 colors.
			// Windows 10 build 14931 is the first release that supports 16m/TrueColor.
			const osRelease = os.release().split('.');
			if (
				Number(osRelease[0]) >= 10 &&
				Number(osRelease[2]) >= 10586
			) {
				return Number(osRelease[2]) >= 14931 ? 3 : 2;
			}

			return 1;
		}

		if ('CI' in env) {
			if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI', 'GITHUB_ACTIONS', 'BUILDKITE'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
				return 1;
			}

			return min;
		}

		if ('TEAMCITY_VERSION' in env) {
			return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
		}

		if (env.COLORTERM === 'truecolor') {
			return 3;
		}

		if ('TERM_PROGRAM' in env) {
			const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

			switch (env.TERM_PROGRAM) {
				case 'iTerm.app':
					return version >= 3 ? 3 : 2;
				case 'Apple_Terminal':
					return 2;
				// No default
			}
		}

		if (/-256(color)?$/i.test(env.TERM)) {
			return 2;
		}

		if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
			return 1;
		}

		if ('COLORTERM' in env) {
			return 1;
		}

		return min;
	}

	function getSupportLevel(stream) {
		const level = supportsColor(stream, stream && stream.isTTY);
		return translateLevel(level);
	}

	supportsColor_1 = {
		supportsColor: getSupportLevel,
		stdout: translateLevel(supportsColor(true, tty.isatty(1))),
		stderr: translateLevel(supportsColor(true, tty.isatty(2)))
	};
	return supportsColor_1;
}

var util;
var hasRequiredUtil;

function requireUtil () {
	if (hasRequiredUtil) return util;
	hasRequiredUtil = 1;

	const stringReplaceAll = (string, substring, replacer) => {
		let index = string.indexOf(substring);
		if (index === -1) {
			return string;
		}

		const substringLength = substring.length;
		let endIndex = 0;
		let returnValue = '';
		do {
			returnValue += string.substr(endIndex, index - endIndex) + substring + replacer;
			endIndex = index + substringLength;
			index = string.indexOf(substring, endIndex);
		} while (index !== -1);

		returnValue += string.substr(endIndex);
		return returnValue;
	};

	const stringEncaseCRLFWithFirstIndex = (string, prefix, postfix, index) => {
		let endIndex = 0;
		let returnValue = '';
		do {
			const gotCR = string[index - 1] === '\r';
			returnValue += string.substr(endIndex, (gotCR ? index - 1 : index) - endIndex) + prefix + (gotCR ? '\r\n' : '\n') + postfix;
			endIndex = index + 1;
			index = string.indexOf('\n', endIndex);
		} while (index !== -1);

		returnValue += string.substr(endIndex);
		return returnValue;
	};

	util = {
		stringReplaceAll,
		stringEncaseCRLFWithFirstIndex
	};
	return util;
}

var templates;
var hasRequiredTemplates;

function requireTemplates () {
	if (hasRequiredTemplates) return templates;
	hasRequiredTemplates = 1;
	const TEMPLATE_REGEX = /(?:\\(u(?:[a-f\d]{4}|\{[a-f\d]{1,6}\})|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
	const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
	const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
	const ESCAPE_REGEX = /\\(u(?:[a-f\d]{4}|\{[a-f\d]{1,6}\})|x[a-f\d]{2}|.)|([^\\])/gi;

	const ESCAPES = new Map([
		['n', '\n'],
		['r', '\r'],
		['t', '\t'],
		['b', '\b'],
		['f', '\f'],
		['v', '\v'],
		['0', '\0'],
		['\\', '\\'],
		['e', '\u001B'],
		['a', '\u0007']
	]);

	function unescape(c) {
		const u = c[0] === 'u';
		const bracket = c[1] === '{';

		if ((u && !bracket && c.length === 5) || (c[0] === 'x' && c.length === 3)) {
			return String.fromCharCode(parseInt(c.slice(1), 16));
		}

		if (u && bracket) {
			return String.fromCodePoint(parseInt(c.slice(2, -1), 16));
		}

		return ESCAPES.get(c) || c;
	}

	function parseArguments(name, arguments_) {
		const results = [];
		const chunks = arguments_.trim().split(/\s*,\s*/g);
		let matches;

		for (const chunk of chunks) {
			const number = Number(chunk);
			if (!Number.isNaN(number)) {
				results.push(number);
			} else if ((matches = chunk.match(STRING_REGEX))) {
				results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, character) => escape ? unescape(escape) : character));
			} else {
				throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
			}
		}

		return results;
	}

	function parseStyle(style) {
		STYLE_REGEX.lastIndex = 0;

		const results = [];
		let matches;

		while ((matches = STYLE_REGEX.exec(style)) !== null) {
			const name = matches[1];

			if (matches[2]) {
				const args = parseArguments(name, matches[2]);
				results.push([name].concat(args));
			} else {
				results.push([name]);
			}
		}

		return results;
	}

	function buildStyle(chalk, styles) {
		const enabled = {};

		for (const layer of styles) {
			for (const style of layer.styles) {
				enabled[style[0]] = layer.inverse ? null : style.slice(1);
			}
		}

		let current = chalk;
		for (const [styleName, styles] of Object.entries(enabled)) {
			if (!Array.isArray(styles)) {
				continue;
			}

			if (!(styleName in current)) {
				throw new Error(`Unknown Chalk style: ${styleName}`);
			}

			current = styles.length > 0 ? current[styleName](...styles) : current[styleName];
		}

		return current;
	}

	templates = (chalk, temporary) => {
		const styles = [];
		const chunks = [];
		let chunk = [];

		// eslint-disable-next-line max-params
		temporary.replace(TEMPLATE_REGEX, (m, escapeCharacter, inverse, style, close, character) => {
			if (escapeCharacter) {
				chunk.push(unescape(escapeCharacter));
			} else if (style) {
				const string = chunk.join('');
				chunk = [];
				chunks.push(styles.length === 0 ? string : buildStyle(chalk, styles)(string));
				styles.push({inverse, styles: parseStyle(style)});
			} else if (close) {
				if (styles.length === 0) {
					throw new Error('Found extraneous } in Chalk template literal');
				}

				chunks.push(buildStyle(chalk, styles)(chunk.join('')));
				chunk = [];
				styles.pop();
			} else {
				chunk.push(character);
			}
		});

		chunks.push(chunk.join(''));

		if (styles.length > 0) {
			const errMsg = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? '' : 's'} (\`}\`)`;
			throw new Error(errMsg);
		}

		return chunks.join('');
	};
	return templates;
}

var source;
var hasRequiredSource;

function requireSource () {
	if (hasRequiredSource) return source;
	hasRequiredSource = 1;
	const ansiStyles = requireAnsiStyles();
	const {stdout: stdoutColor, stderr: stderrColor} = requireSupportsColor();
	const {
		stringReplaceAll,
		stringEncaseCRLFWithFirstIndex
	} = requireUtil();

	// `supportsColor.level` → `ansiStyles.color[name]` mapping
	const levelMapping = [
		'ansi',
		'ansi',
		'ansi256',
		'ansi16m'
	];

	const styles = Object.create(null);

	const applyOptions = (object, options = {}) => {
		if (options.level > 3 || options.level < 0) {
			throw new Error('The `level` option should be an integer from 0 to 3');
		}

		// Detect level if not set manually
		const colorLevel = stdoutColor ? stdoutColor.level : 0;
		object.level = options.level === undefined ? colorLevel : options.level;
	};

	class ChalkClass {
		constructor(options) {
			return chalkFactory(options);
		}
	}

	const chalkFactory = options => {
		const chalk = {};
		applyOptions(chalk, options);

		chalk.template = (...arguments_) => chalkTag(chalk.template, ...arguments_);

		Object.setPrototypeOf(chalk, Chalk.prototype);
		Object.setPrototypeOf(chalk.template, chalk);

		chalk.template.constructor = () => {
			throw new Error('`chalk.constructor()` is deprecated. Use `new chalk.Instance()` instead.');
		};

		chalk.template.Instance = ChalkClass;

		return chalk.template;
	};

	function Chalk(options) {
		return chalkFactory(options);
	}

	for (const [styleName, style] of Object.entries(ansiStyles)) {
		styles[styleName] = {
			get() {
				const builder = createBuilder(this, createStyler(style.open, style.close, this._styler), this._isEmpty);
				Object.defineProperty(this, styleName, {value: builder});
				return builder;
			}
		};
	}

	styles.visible = {
		get() {
			const builder = createBuilder(this, this._styler, true);
			Object.defineProperty(this, 'visible', {value: builder});
			return builder;
		}
	};

	const usedModels = ['rgb', 'hex', 'keyword', 'hsl', 'hsv', 'hwb', 'ansi', 'ansi256'];

	for (const model of usedModels) {
		styles[model] = {
			get() {
				const {level} = this;
				return function (...arguments_) {
					const styler = createStyler(ansiStyles.color[levelMapping[level]][model](...arguments_), ansiStyles.color.close, this._styler);
					return createBuilder(this, styler, this._isEmpty);
				};
			}
		};
	}

	for (const model of usedModels) {
		const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
		styles[bgModel] = {
			get() {
				const {level} = this;
				return function (...arguments_) {
					const styler = createStyler(ansiStyles.bgColor[levelMapping[level]][model](...arguments_), ansiStyles.bgColor.close, this._styler);
					return createBuilder(this, styler, this._isEmpty);
				};
			}
		};
	}

	const proto = Object.defineProperties(() => {}, {
		...styles,
		level: {
			enumerable: true,
			get() {
				return this._generator.level;
			},
			set(level) {
				this._generator.level = level;
			}
		}
	});

	const createStyler = (open, close, parent) => {
		let openAll;
		let closeAll;
		if (parent === undefined) {
			openAll = open;
			closeAll = close;
		} else {
			openAll = parent.openAll + open;
			closeAll = close + parent.closeAll;
		}

		return {
			open,
			close,
			openAll,
			closeAll,
			parent
		};
	};

	const createBuilder = (self, _styler, _isEmpty) => {
		const builder = (...arguments_) => {
			// Single argument is hot path, implicit coercion is faster than anything
			// eslint-disable-next-line no-implicit-coercion
			return applyStyle(builder, (arguments_.length === 1) ? ('' + arguments_[0]) : arguments_.join(' '));
		};

		// `__proto__` is used because we must return a function, but there is
		// no way to create a function with a different prototype
		builder.__proto__ = proto; // eslint-disable-line no-proto

		builder._generator = self;
		builder._styler = _styler;
		builder._isEmpty = _isEmpty;

		return builder;
	};

	const applyStyle = (self, string) => {
		if (self.level <= 0 || !string) {
			return self._isEmpty ? '' : string;
		}

		let styler = self._styler;

		if (styler === undefined) {
			return string;
		}

		const {openAll, closeAll} = styler;
		if (string.indexOf('\u001B') !== -1) {
			while (styler !== undefined) {
				// Replace any instances already present with a re-opening code
				// otherwise only the part of the string until said closing code
				// will be colored, and the rest will simply be 'plain'.
				string = stringReplaceAll(string, styler.close, styler.open);

				styler = styler.parent;
			}
		}

		// We can move both next actions out of loop, because remaining actions in loop won't have
		// any/visible effect on parts we add here. Close the styling before a linebreak and reopen
		// after next line to fix a bleed issue on macOS: https://github.com/chalk/chalk/pull/92
		const lfIndex = string.indexOf('\n');
		if (lfIndex !== -1) {
			string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
		}

		return openAll + string + closeAll;
	};

	let template;
	const chalkTag = (chalk, ...strings) => {
		const [firstString] = strings;

		if (!Array.isArray(firstString)) {
			// If chalk() was called by itself or with a string,
			// return the string itself as a string.
			return strings.join(' ');
		}

		const arguments_ = strings.slice(1);
		const parts = [firstString.raw[0]];

		for (let i = 1; i < firstString.length; i++) {
			parts.push(
				String(arguments_[i - 1]).replace(/[{}\\]/g, '\\$&'),
				String(firstString.raw[i])
			);
		}

		if (template === undefined) {
			template = requireTemplates();
		}

		return template(chalk, parts.join(''));
	};

	Object.defineProperties(Chalk.prototype, styles);

	const chalk = Chalk(); // eslint-disable-line new-cap
	chalk.supportsColor = stdoutColor;
	chalk.stderr = Chalk({level: stderrColor ? stderrColor.level : 0}); // eslint-disable-line new-cap
	chalk.stderr.supportsColor = stderrColor;

	// For TypeScript
	chalk.Level = {
		None: 0,
		Basic: 1,
		Ansi256: 2,
		TrueColor: 3,
		0: 'None',
		1: 'Basic',
		2: 'Ansi256',
		3: 'TrueColor'
	};

	source = chalk;
	return source;
}

var _interopRequireDefault$d = interopRequireDefaultExports;

Object.defineProperty(toHaveStyle$1, "__esModule", {
  value: true
});
toHaveStyle$1.toHaveStyle = toHaveStyle;

var _chalk = _interopRequireDefault$d(requireSource());

var _utils$c = utils;

function getStyleDeclaration(document, css) {
  const styles = {}; // The next block is necessary to normalize colors

  const copy = document.createElement('div');
  Object.keys(css).forEach(property => {
    copy.style[property] = css[property];
    styles[property] = copy.style[property];
  });
  return styles;
}

function isSubset(styles, computedStyle) {
  return !!Object.keys(styles).length && Object.entries(styles).every(([prop, value]) => computedStyle[prop] === value || computedStyle.getPropertyValue(prop.toLowerCase()) === value);
}

function printoutStyles(styles) {
  return Object.keys(styles).sort().map(prop => `${prop}: ${styles[prop]};`).join('\n');
} // Highlights only style rules that were expected but were not found in the
// received computed styles


function expectedDiff(diffFn, expected, computedStyles) {
  const received = Array.from(computedStyles).filter(prop => expected[prop] !== undefined).reduce((obj, prop) => Object.assign(obj, {
    [prop]: computedStyles.getPropertyValue(prop)
  }), {});
  const diffOutput = diffFn(printoutStyles(expected), printoutStyles(received)); // Remove the "+ Received" annotation because this is a one-way diff

  return diffOutput.replace(`${_chalk.default.red('+ Received')}\n`, '');
}

function toHaveStyle(htmlElement, css) {
  (0, _utils$c.checkHtmlElement)(htmlElement, toHaveStyle, this);
  const parsedCSS = typeof css === 'object' ? css : (0, _utils$c.parseCSS)(css, toHaveStyle, this);
  const {
    getComputedStyle
  } = htmlElement.ownerDocument.defaultView;
  const expected = getStyleDeclaration(htmlElement.ownerDocument, parsedCSS);
  const received = getComputedStyle(htmlElement);
  return {
    pass: isSubset(expected, received),
    message: () => {
      const matcher = `${this.isNot ? '.not' : ''}.toHaveStyle`;
      return [this.utils.matcherHint(matcher, 'element', ''), expectedDiff(this.utils.diff, expected, received)].join('\n\n');
    }
  };
}

var toHaveFocus$1 = {};

Object.defineProperty(toHaveFocus$1, "__esModule", {
  value: true
});
toHaveFocus$1.toHaveFocus = toHaveFocus;

var _utils$b = utils;

function toHaveFocus(element) {
  (0, _utils$b.checkHtmlElement)(element, toHaveFocus, this);
  return {
    pass: element.ownerDocument.activeElement === element,
    message: () => {
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toHaveFocus`, 'element', ''), '', ...(this.isNot ? ['Received element is focused:', `  ${this.utils.printReceived(element)}`] : ['Expected element with focus:', `  ${this.utils.printExpected(element)}`, 'Received element with focus:', `  ${this.utils.printReceived(element.ownerDocument.activeElement)}`])].join('\n');
    }
  };
}

var toHaveFormValues$1 = {};

var _extendsExports = {};
var _extends = {
  get exports(){ return _extendsExports; },
  set exports(v){ _extendsExports = v; },
};

var hasRequired_extends;

function require_extends () {
	if (hasRequired_extends) return _extendsExports;
	hasRequired_extends = 1;
	(function (module) {
		function _extends() {
		  module.exports = _extends = Object.assign ? Object.assign.bind() : function (target) {
		    for (var i = 1; i < arguments.length; i++) {
		      var source = arguments[i];
		      for (var key in source) {
		        if (Object.prototype.hasOwnProperty.call(source, key)) {
		          target[key] = source[key];
		        }
		      }
		    }
		    return target;
		  }, module.exports.__esModule = true, module.exports["default"] = module.exports;
		  return _extends.apply(this, arguments);
		}
		module.exports = _extends, module.exports.__esModule = true, module.exports["default"] = module.exports;
} (_extends));
	return _extendsExports;
}

var isEqualWith_1;
var hasRequiredIsEqualWith;

function requireIsEqualWith () {
	if (hasRequiredIsEqualWith) return isEqualWith_1;
	hasRequiredIsEqualWith = 1;
	var baseIsEqual = require_baseIsEqual();

	/**
	 * This method is like `_.isEqual` except that it accepts `customizer` which
	 * is invoked to compare values. If `customizer` returns `undefined`, comparisons
	 * are handled by the method instead. The `customizer` is invoked with up to
	 * six arguments: (objValue, othValue [, index|key, object, other, stack]).
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @param {Function} [customizer] The function to customize comparisons.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * function isGreeting(value) {
	 *   return /^h(?:i|ello)$/.test(value);
	 * }
	 *
	 * function customizer(objValue, othValue) {
	 *   if (isGreeting(objValue) && isGreeting(othValue)) {
	 *     return true;
	 *   }
	 * }
	 *
	 * var array = ['hello', 'goodbye'];
	 * var other = ['hi', 'goodbye'];
	 *
	 * _.isEqualWith(array, other, customizer);
	 * // => true
	 */
	function isEqualWith(value, other, customizer) {
	  customizer = typeof customizer == 'function' ? customizer : undefined;
	  var result = customizer ? customizer(value, other) : undefined;
	  return result === undefined ? baseIsEqual(value, other, undefined, customizer) : !!result;
	}

	isEqualWith_1 = isEqualWith;
	return isEqualWith_1;
}

/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */

var _baseFindIndex;
var hasRequired_baseFindIndex;

function require_baseFindIndex () {
	if (hasRequired_baseFindIndex) return _baseFindIndex;
	hasRequired_baseFindIndex = 1;
	function baseFindIndex(array, predicate, fromIndex, fromRight) {
	  var length = array.length,
	      index = fromIndex + (fromRight ? 1 : -1);

	  while ((fromRight ? index-- : ++index < length)) {
	    if (predicate(array[index], index, array)) {
	      return index;
	    }
	  }
	  return -1;
	}

	_baseFindIndex = baseFindIndex;
	return _baseFindIndex;
}

/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */

var _baseIsNaN;
var hasRequired_baseIsNaN;

function require_baseIsNaN () {
	if (hasRequired_baseIsNaN) return _baseIsNaN;
	hasRequired_baseIsNaN = 1;
	function baseIsNaN(value) {
	  return value !== value;
	}

	_baseIsNaN = baseIsNaN;
	return _baseIsNaN;
}

/**
 * A specialized version of `_.indexOf` which performs strict equality
 * comparisons of values, i.e. `===`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */

var _strictIndexOf;
var hasRequired_strictIndexOf;

function require_strictIndexOf () {
	if (hasRequired_strictIndexOf) return _strictIndexOf;
	hasRequired_strictIndexOf = 1;
	function strictIndexOf(array, value, fromIndex) {
	  var index = fromIndex - 1,
	      length = array.length;

	  while (++index < length) {
	    if (array[index] === value) {
	      return index;
	    }
	  }
	  return -1;
	}

	_strictIndexOf = strictIndexOf;
	return _strictIndexOf;
}

var _baseIndexOf;
var hasRequired_baseIndexOf;

function require_baseIndexOf () {
	if (hasRequired_baseIndexOf) return _baseIndexOf;
	hasRequired_baseIndexOf = 1;
	var baseFindIndex = require_baseFindIndex(),
	    baseIsNaN = require_baseIsNaN(),
	    strictIndexOf = require_strictIndexOf();

	/**
	 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} value The value to search for.
	 * @param {number} fromIndex The index to search from.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function baseIndexOf(array, value, fromIndex) {
	  return value === value
	    ? strictIndexOf(array, value, fromIndex)
	    : baseFindIndex(array, baseIsNaN, fromIndex);
	}

	_baseIndexOf = baseIndexOf;
	return _baseIndexOf;
}

var _arrayIncludes;
var hasRequired_arrayIncludes;

function require_arrayIncludes () {
	if (hasRequired_arrayIncludes) return _arrayIncludes;
	hasRequired_arrayIncludes = 1;
	var baseIndexOf = require_baseIndexOf();

	/**
	 * A specialized version of `_.includes` for arrays without support for
	 * specifying an index to search from.
	 *
	 * @private
	 * @param {Array} [array] The array to inspect.
	 * @param {*} target The value to search for.
	 * @returns {boolean} Returns `true` if `target` is found, else `false`.
	 */
	function arrayIncludes(array, value) {
	  var length = array == null ? 0 : array.length;
	  return !!length && baseIndexOf(array, value, 0) > -1;
	}

	_arrayIncludes = arrayIncludes;
	return _arrayIncludes;
}

/**
 * This function is like `arrayIncludes` except that it accepts a comparator.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @param {Function} comparator The comparator invoked per element.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */

var _arrayIncludesWith;
var hasRequired_arrayIncludesWith;

function require_arrayIncludesWith () {
	if (hasRequired_arrayIncludesWith) return _arrayIncludesWith;
	hasRequired_arrayIncludesWith = 1;
	function arrayIncludesWith(array, value, comparator) {
	  var index = -1,
	      length = array == null ? 0 : array.length;

	  while (++index < length) {
	    if (comparator(value, array[index])) {
	      return true;
	    }
	  }
	  return false;
	}

	_arrayIncludesWith = arrayIncludesWith;
	return _arrayIncludesWith;
}

/**
 * This method returns `undefined`.
 *
 * @static
 * @memberOf _
 * @since 2.3.0
 * @category Util
 * @example
 *
 * _.times(2, _.noop);
 * // => [undefined, undefined]
 */

var noop_1;
var hasRequiredNoop;

function requireNoop () {
	if (hasRequiredNoop) return noop_1;
	hasRequiredNoop = 1;
	function noop() {
	  // No operation performed.
	}

	noop_1 = noop;
	return noop_1;
}

var _createSet;
var hasRequired_createSet;

function require_createSet () {
	if (hasRequired_createSet) return _createSet;
	hasRequired_createSet = 1;
	var Set = require_Set(),
	    noop = requireNoop(),
	    setToArray = require_setToArray();

	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0;

	/**
	 * Creates a set object of `values`.
	 *
	 * @private
	 * @param {Array} values The values to add to the set.
	 * @returns {Object} Returns the new set.
	 */
	var createSet = !(Set && (1 / setToArray(new Set([,-0]))[1]) == INFINITY) ? noop : function(values) {
	  return new Set(values);
	};

	_createSet = createSet;
	return _createSet;
}

var _baseUniq;
var hasRequired_baseUniq;

function require_baseUniq () {
	if (hasRequired_baseUniq) return _baseUniq;
	hasRequired_baseUniq = 1;
	var SetCache = require_SetCache(),
	    arrayIncludes = require_arrayIncludes(),
	    arrayIncludesWith = require_arrayIncludesWith(),
	    cacheHas = require_cacheHas(),
	    createSet = require_createSet(),
	    setToArray = require_setToArray();

	/** Used as the size to enable large array optimizations. */
	var LARGE_ARRAY_SIZE = 200;

	/**
	 * The base implementation of `_.uniqBy` without support for iteratee shorthands.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {Function} [iteratee] The iteratee invoked per element.
	 * @param {Function} [comparator] The comparator invoked per element.
	 * @returns {Array} Returns the new duplicate free array.
	 */
	function baseUniq(array, iteratee, comparator) {
	  var index = -1,
	      includes = arrayIncludes,
	      length = array.length,
	      isCommon = true,
	      result = [],
	      seen = result;

	  if (comparator) {
	    isCommon = false;
	    includes = arrayIncludesWith;
	  }
	  else if (length >= LARGE_ARRAY_SIZE) {
	    var set = iteratee ? null : createSet(array);
	    if (set) {
	      return setToArray(set);
	    }
	    isCommon = false;
	    includes = cacheHas;
	    seen = new SetCache;
	  }
	  else {
	    seen = iteratee ? [] : result;
	  }
	  outer:
	  while (++index < length) {
	    var value = array[index],
	        computed = iteratee ? iteratee(value) : value;

	    value = (comparator || value !== 0) ? value : 0;
	    if (isCommon && computed === computed) {
	      var seenIndex = seen.length;
	      while (seenIndex--) {
	        if (seen[seenIndex] === computed) {
	          continue outer;
	        }
	      }
	      if (iteratee) {
	        seen.push(computed);
	      }
	      result.push(value);
	    }
	    else if (!includes(seen, computed, comparator)) {
	      if (seen !== result) {
	        seen.push(computed);
	      }
	      result.push(value);
	    }
	  }
	  return result;
	}

	_baseUniq = baseUniq;
	return _baseUniq;
}

var uniq_1;
var hasRequiredUniq;

function requireUniq () {
	if (hasRequiredUniq) return uniq_1;
	hasRequiredUniq = 1;
	var baseUniq = require_baseUniq();

	/**
	 * Creates a duplicate-free version of an array, using
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * for equality comparisons, in which only the first occurrence of each element
	 * is kept. The order of result values is determined by the order they occur
	 * in the array.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Array
	 * @param {Array} array The array to inspect.
	 * @returns {Array} Returns the new duplicate free array.
	 * @example
	 *
	 * _.uniq([2, 1, 2]);
	 * // => [2, 1]
	 */
	function uniq(array) {
	  return (array && array.length) ? baseUniq(array) : [];
	}

	uniq_1 = uniq;
	return uniq_1;
}

var css_escapeExports = {};
var css_escape = {
  get exports(){ return css_escapeExports; },
  set exports(v){ css_escapeExports = v; },
};

/*! https://mths.be/cssescape v1.5.1 by @mathias | MIT license */

var hasRequiredCss_escape;

function requireCss_escape () {
	if (hasRequiredCss_escape) return css_escapeExports;
	hasRequiredCss_escape = 1;
	(function (module, exports) {
(function(root, factory) {
			// https://github.com/umdjs/umd/blob/master/returnExports.js
			{
				// For Node.js.
				module.exports = factory(root);
			}
		}(typeof commonjsGlobal != 'undefined' ? commonjsGlobal : commonjsGlobal, function(root) {

			if (root.CSS && root.CSS.escape) {
				return root.CSS.escape;
			}

			// https://drafts.csswg.org/cssom/#serialize-an-identifier
			var cssEscape = function(value) {
				if (arguments.length == 0) {
					throw new TypeError('`CSS.escape` requires an argument.');
				}
				var string = String(value);
				var length = string.length;
				var index = -1;
				var codeUnit;
				var result = '';
				var firstCodeUnit = string.charCodeAt(0);
				while (++index < length) {
					codeUnit = string.charCodeAt(index);
					// Note: there’s no need to special-case astral symbols, surrogate
					// pairs, or lone surrogates.

					// If the character is NULL (U+0000), then the REPLACEMENT CHARACTER
					// (U+FFFD).
					if (codeUnit == 0x0000) {
						result += '\uFFFD';
						continue;
					}

					if (
						// If the character is in the range [\1-\1F] (U+0001 to U+001F) or is
						// U+007F, […]
						(codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit == 0x007F ||
						// If the character is the first character and is in the range [0-9]
						// (U+0030 to U+0039), […]
						(index == 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
						// If the character is the second character and is in the range [0-9]
						// (U+0030 to U+0039) and the first character is a `-` (U+002D), […]
						(
							index == 1 &&
							codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
							firstCodeUnit == 0x002D
						)
					) {
						// https://drafts.csswg.org/cssom/#escape-a-character-as-code-point
						result += '\\' + codeUnit.toString(16) + ' ';
						continue;
					}

					if (
						// If the character is the first character and is a `-` (U+002D), and
						// there is no second character, […]
						index == 0 &&
						length == 1 &&
						codeUnit == 0x002D
					) {
						result += '\\' + string.charAt(index);
						continue;
					}

					// If the character is not handled by one of the above rules and is
					// greater than or equal to U+0080, is `-` (U+002D) or `_` (U+005F), or
					// is in one of the ranges [0-9] (U+0030 to U+0039), [A-Z] (U+0041 to
					// U+005A), or [a-z] (U+0061 to U+007A), […]
					if (
						codeUnit >= 0x0080 ||
						codeUnit == 0x002D ||
						codeUnit == 0x005F ||
						codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
						codeUnit >= 0x0041 && codeUnit <= 0x005A ||
						codeUnit >= 0x0061 && codeUnit <= 0x007A
					) {
						// the character itself
						result += string.charAt(index);
						continue;
					}

					// Otherwise, the escaped character.
					// https://drafts.csswg.org/cssom/#escape-a-character
					result += '\\' + string.charAt(index);

				}
				return result;
			};

			if (!root.CSS) {
				root.CSS = {};
			}

			root.CSS.escape = cssEscape;
			return cssEscape;

		}));
} (css_escape));
	return css_escapeExports;
}

var _interopRequireDefault$c = interopRequireDefaultExports;

Object.defineProperty(toHaveFormValues$1, "__esModule", {
  value: true
});
toHaveFormValues$1.toHaveFormValues = toHaveFormValues;

var _extends2 = _interopRequireDefault$c(require_extends());

var _isEqualWith$1 = _interopRequireDefault$c(requireIsEqualWith());

var _uniq = _interopRequireDefault$c(requireUniq());

var _css = _interopRequireDefault$c(requireCss_escape());

var _utils$a = utils;

// Returns the combined value of several elements that have the same name
// e.g. radio buttons or groups of checkboxes
function getMultiElementValue(elements) {
  const types = (0, _uniq.default)(elements.map(element => element.type));

  if (types.length !== 1) {
    throw new Error('Multiple form elements with the same name must be of the same type');
  }

  switch (types[0]) {
    case 'radio':
      {
        const theChosenOne = elements.find(radio => radio.checked);
        return theChosenOne ? theChosenOne.value : undefined;
      }

    case 'checkbox':
      return elements.filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);

    default:
      // NOTE: Not even sure this is a valid use case, but just in case...
      return elements.map(element => element.value);
  }
}

function getFormValue(container, name) {
  const elements = [...container.querySelectorAll(`[name="${(0, _css.default)(name)}"]`)];
  /* istanbul ignore if */

  if (elements.length === 0) {
    return undefined; // shouldn't happen, but just in case
  }

  switch (elements.length) {
    case 1:
      return (0, _utils$a.getSingleElementValue)(elements[0]);

    default:
      return getMultiElementValue(elements);
  }
} // Strips the `[]` suffix off a form value name


function getPureName(name) {
  return /\[\]$/.test(name) ? name.slice(0, -2) : name;
}

function getAllFormValues(container) {
  const names = Array.from(container.elements).map(element => element.name);
  return names.reduce((obj, name) => (0, _extends2.default)({}, obj, {
    [getPureName(name)]: getFormValue(container, name)
  }), {});
}

function toHaveFormValues(formElement, expectedValues) {
  (0, _utils$a.checkHtmlElement)(formElement, toHaveFormValues, this);

  if (!formElement.elements) {
    // TODO: Change condition to use instanceof against the appropriate element classes instead
    throw new Error('toHaveFormValues must be called on a form or a fieldset');
  }

  const formValues = getAllFormValues(formElement);
  return {
    pass: Object.entries(expectedValues).every(([name, expectedValue]) => (0, _isEqualWith$1.default)(formValues[name], expectedValue, _utils$a.compareArraysAsSet)),
    message: () => {
      const to = this.isNot ? 'not to' : 'to';
      const matcher = `${this.isNot ? '.not' : ''}.toHaveFormValues`;
      const commonKeyValues = Object.keys(formValues).filter(key => expectedValues.hasOwnProperty(key)).reduce((obj, key) => (0, _extends2.default)({}, obj, {
        [key]: formValues[key]
      }), {});
      return [this.utils.matcherHint(matcher, 'element', ''), `Expected the element ${to} have form values`, this.utils.diff(expectedValues, commonKeyValues)].join('\n\n');
    }
  };
}

var toBeVisible$1 = {};

Object.defineProperty(toBeVisible$1, "__esModule", {
  value: true
});
toBeVisible$1.toBeVisible = toBeVisible;

var _utils$9 = utils;

function isStyleVisible(element) {
  const {
    getComputedStyle
  } = element.ownerDocument.defaultView;
  const {
    display,
    visibility,
    opacity
  } = getComputedStyle(element);
  return display !== 'none' && visibility !== 'hidden' && visibility !== 'collapse' && opacity !== '0' && opacity !== 0;
}

function isAttributeVisible(element, previousElement) {
  let detailsVisibility;

  if (previousElement) {
    detailsVisibility = element.nodeName === 'DETAILS' && previousElement.nodeName !== 'SUMMARY' ? element.hasAttribute('open') : true;
  } else {
    detailsVisibility = element.nodeName === 'DETAILS' ? element.hasAttribute('open') : true;
  }

  return !element.hasAttribute('hidden') && detailsVisibility;
}

function isElementVisible(element, previousElement) {
  return isStyleVisible(element) && isAttributeVisible(element, previousElement) && (!element.parentElement || isElementVisible(element.parentElement, element));
}

function toBeVisible(element) {
  (0, _utils$9.checkHtmlElement)(element, toBeVisible, this);
  const isInDocument = element.ownerDocument === element.getRootNode({
    composed: true
  });
  const isVisible = isInDocument && isElementVisible(element);
  return {
    pass: isVisible,
    message: () => {
      const is = isVisible ? 'is' : 'is not';
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toBeVisible`, 'element', ''), '', `Received element ${is} visible${isInDocument ? '' : ' (element is not in the document)'}:`, `  ${this.utils.printReceived(element.cloneNode(false))}`].join('\n');
    }
  };
}

var toBeDisabled$1 = {};

Object.defineProperty(toBeDisabled$1, "__esModule", {
  value: true
});
toBeDisabled$1.toBeDisabled = toBeDisabled;
toBeDisabled$1.toBeEnabled = toBeEnabled;

var _utils$8 = utils;

// form elements that support 'disabled'
const FORM_TAGS$2 = ['fieldset', 'input', 'select', 'optgroup', 'option', 'button', 'textarea'];
/*
 * According to specification:
 * If <fieldset> is disabled, the form controls that are its descendants,
 * except descendants of its first optional <legend> element, are disabled
 *
 * https://html.spec.whatwg.org/multipage/form-elements.html#concept-fieldset-disabled
 *
 * This method tests whether element is first legend child of fieldset parent
 */

function isFirstLegendChildOfFieldset(element, parent) {
  return (0, _utils$8.getTag)(element) === 'legend' && (0, _utils$8.getTag)(parent) === 'fieldset' && element.isSameNode(Array.from(parent.children).find(child => (0, _utils$8.getTag)(child) === 'legend'));
}

function isElementDisabledByParent(element, parent) {
  return isElementDisabled(parent) && !isFirstLegendChildOfFieldset(element, parent);
}

function isCustomElement(tag) {
  return tag.includes('-');
}
/*
 * Only certain form elements and custom elements can actually be disabled:
 * https://html.spec.whatwg.org/multipage/semantics-other.html#disabled-elements
 */


function canElementBeDisabled(element) {
  const tag = (0, _utils$8.getTag)(element);
  return FORM_TAGS$2.includes(tag) || isCustomElement(tag);
}

function isElementDisabled(element) {
  return canElementBeDisabled(element) && element.hasAttribute('disabled');
}

function isAncestorDisabled(element) {
  const parent = element.parentElement;
  return Boolean(parent) && (isElementDisabledByParent(element, parent) || isAncestorDisabled(parent));
}

function isElementOrAncestorDisabled(element) {
  return canElementBeDisabled(element) && (isElementDisabled(element) || isAncestorDisabled(element));
}

function toBeDisabled(element) {
  (0, _utils$8.checkHtmlElement)(element, toBeDisabled, this);
  const isDisabled = isElementOrAncestorDisabled(element);
  return {
    pass: isDisabled,
    message: () => {
      const is = isDisabled ? 'is' : 'is not';
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toBeDisabled`, 'element', ''), '', `Received element ${is} disabled:`, `  ${this.utils.printReceived(element.cloneNode(false))}`].join('\n');
    }
  };
}

function toBeEnabled(element) {
  (0, _utils$8.checkHtmlElement)(element, toBeEnabled, this);
  const isEnabled = !isElementOrAncestorDisabled(element);
  return {
    pass: isEnabled,
    message: () => {
      const is = isEnabled ? 'is' : 'is not';
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toBeEnabled`, 'element', ''), '', `Received element ${is} enabled:`, `  ${this.utils.printReceived(element.cloneNode(false))}`].join('\n');
    }
  };
}

var toBeRequired$1 = {};

Object.defineProperty(toBeRequired$1, "__esModule", {
  value: true
});
toBeRequired$1.toBeRequired = toBeRequired;

var _utils$7 = utils;

// form elements that support 'required'
const FORM_TAGS$1 = ['select', 'textarea'];
const ARIA_FORM_TAGS = ['input', 'select', 'textarea'];
const UNSUPPORTED_INPUT_TYPES = ['color', 'hidden', 'range', 'submit', 'image', 'reset'];
const SUPPORTED_ARIA_ROLES = ['combobox', 'gridcell', 'radiogroup', 'spinbutton', 'tree'];

function isRequiredOnFormTagsExceptInput(element) {
  return FORM_TAGS$1.includes((0, _utils$7.getTag)(element)) && element.hasAttribute('required');
}

function isRequiredOnSupportedInput(element) {
  return (0, _utils$7.getTag)(element) === 'input' && element.hasAttribute('required') && (element.hasAttribute('type') && !UNSUPPORTED_INPUT_TYPES.includes(element.getAttribute('type')) || !element.hasAttribute('type'));
}

function isElementRequiredByARIA(element) {
  return element.hasAttribute('aria-required') && element.getAttribute('aria-required') === 'true' && (ARIA_FORM_TAGS.includes((0, _utils$7.getTag)(element)) || element.hasAttribute('role') && SUPPORTED_ARIA_ROLES.includes(element.getAttribute('role')));
}

function toBeRequired(element) {
  (0, _utils$7.checkHtmlElement)(element, toBeRequired, this);
  const isRequired = isRequiredOnFormTagsExceptInput(element) || isRequiredOnSupportedInput(element) || isElementRequiredByARIA(element);
  return {
    pass: isRequired,
    message: () => {
      const is = isRequired ? 'is' : 'is not';
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toBeRequired`, 'element', ''), '', `Received element ${is} required:`, `  ${this.utils.printReceived(element.cloneNode(false))}`].join('\n');
    }
  };
}

var toBeInvalid$1 = {};

Object.defineProperty(toBeInvalid$1, "__esModule", {
  value: true
});
toBeInvalid$1.toBeInvalid = toBeInvalid;
toBeInvalid$1.toBeValid = toBeValid;

var _utils$6 = utils;

const FORM_TAGS = ['form', 'input', 'select', 'textarea'];

function isElementHavingAriaInvalid(element) {
  return element.hasAttribute('aria-invalid') && element.getAttribute('aria-invalid') !== 'false';
}

function isSupportsValidityMethod(element) {
  return FORM_TAGS.includes((0, _utils$6.getTag)(element));
}

function isElementInvalid(element) {
  const isHaveAriaInvalid = isElementHavingAriaInvalid(element);

  if (isSupportsValidityMethod(element)) {
    return isHaveAriaInvalid || !element.checkValidity();
  } else {
    return isHaveAriaInvalid;
  }
}

function toBeInvalid(element) {
  (0, _utils$6.checkHtmlElement)(element, toBeInvalid, this);
  const isInvalid = isElementInvalid(element);
  return {
    pass: isInvalid,
    message: () => {
      const is = isInvalid ? 'is' : 'is not';
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toBeInvalid`, 'element', ''), '', `Received element ${is} currently invalid:`, `  ${this.utils.printReceived(element.cloneNode(false))}`].join('\n');
    }
  };
}

function toBeValid(element) {
  (0, _utils$6.checkHtmlElement)(element, toBeValid, this);
  const isValid = !isElementInvalid(element);
  return {
    pass: isValid,
    message: () => {
      const is = isValid ? 'is' : 'is not';
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toBeValid`, 'element', ''), '', `Received element ${is} currently valid:`, `  ${this.utils.printReceived(element.cloneNode(false))}`].join('\n');
    }
  };
}

var toHaveValue$1 = {};

var _interopRequireDefault$b = interopRequireDefaultExports;

Object.defineProperty(toHaveValue$1, "__esModule", {
  value: true
});
toHaveValue$1.toHaveValue = toHaveValue;

var _isEqualWith = _interopRequireDefault$b(requireIsEqualWith());

var _utils$5 = utils;

function toHaveValue(htmlElement, expectedValue) {
  (0, _utils$5.checkHtmlElement)(htmlElement, toHaveValue, this);

  if (htmlElement.tagName.toLowerCase() === 'input' && ['checkbox', 'radio'].includes(htmlElement.type)) {
    throw new Error('input with type=checkbox or type=radio cannot be used with .toHaveValue(). Use .toBeChecked() for type=checkbox or .toHaveFormValues() instead');
  }

  const receivedValue = (0, _utils$5.getSingleElementValue)(htmlElement);
  const expectsValue = expectedValue !== undefined;
  let expectedTypedValue = expectedValue;
  let receivedTypedValue = receivedValue;

  if (expectedValue == receivedValue && expectedValue !== receivedValue) {
    expectedTypedValue = `${expectedValue} (${typeof expectedValue})`;
    receivedTypedValue = `${receivedValue} (${typeof receivedValue})`;
  }

  return {
    pass: expectsValue ? (0, _isEqualWith.default)(receivedValue, expectedValue, _utils$5.compareArraysAsSet) : Boolean(receivedValue),
    message: () => {
      const to = this.isNot ? 'not to' : 'to';
      const matcher = this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toHaveValue`, 'element', expectedValue);
      return (0, _utils$5.getMessage)(this, matcher, `Expected the element ${to} have value`, expectsValue ? expectedTypedValue : '(any)', 'Received', receivedTypedValue);
    }
  };
}

var toHaveDisplayValue$1 = {};

Object.defineProperty(toHaveDisplayValue$1, "__esModule", {
  value: true
});
toHaveDisplayValue$1.toHaveDisplayValue = toHaveDisplayValue;

var _utils$4 = utils;

function toHaveDisplayValue(htmlElement, expectedValue) {
  (0, _utils$4.checkHtmlElement)(htmlElement, toHaveDisplayValue, this);
  const tagName = htmlElement.tagName.toLowerCase();

  if (!['select', 'input', 'textarea'].includes(tagName)) {
    throw new Error('.toHaveDisplayValue() currently supports only input, textarea or select elements, try with another matcher instead.');
  }

  if (tagName === 'input' && ['radio', 'checkbox'].includes(htmlElement.type)) {
    throw new Error(`.toHaveDisplayValue() currently does not support input[type="${htmlElement.type}"], try with another matcher instead.`);
  }

  const values = getValues(tagName, htmlElement);
  const expectedValues = getExpectedValues(expectedValue);
  const numberOfMatchesWithValues = expectedValues.filter(expected => values.some(value => expected instanceof RegExp ? expected.test(value) : this.equals(value, String(expected)))).length;
  const matchedWithAllValues = numberOfMatchesWithValues === values.length;
  const matchedWithAllExpectedValues = numberOfMatchesWithValues === expectedValues.length;
  return {
    pass: matchedWithAllValues && matchedWithAllExpectedValues,
    message: () => (0, _utils$4.getMessage)(this, this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toHaveDisplayValue`, 'element', ''), `Expected element ${this.isNot ? 'not ' : ''}to have display value`, expectedValue, 'Received', values)
  };
}

function getValues(tagName, htmlElement) {
  return tagName === 'select' ? Array.from(htmlElement).filter(option => option.selected).map(option => option.textContent) : [htmlElement.value];
}

function getExpectedValues(expectedValue) {
  return expectedValue instanceof Array ? expectedValue : [expectedValue];
}

var toBeChecked$1 = {};

var lib = {};

var ariaPropsMap$1 = {};

var iterationDecorator$1 = {};

var iteratorProxy$1 = {};

Object.defineProperty(iteratorProxy$1, "__esModule", {
  value: true
});
iteratorProxy$1.default = void 0;

// eslint-disable-next-line no-unused-vars
function iteratorProxy() {
  var values = this;
  var index = 0;
  var iter = {
    '@@iterator': function iterator() {
      return iter;
    },
    next: function next() {
      if (index < values.length) {
        var value = values[index];
        index = index + 1;
        return {
          done: false,
          value: value
        };
      } else {
        return {
          done: true
        };
      }
    }
  };
  return iter;
}
var _default$2h = iteratorProxy;
iteratorProxy$1.default = _default$2h;

Object.defineProperty(iterationDecorator$1, "__esModule", {
  value: true
});
iterationDecorator$1.default = iterationDecorator;
var _iteratorProxy = _interopRequireDefault$a(iteratorProxy$1);
function _interopRequireDefault$a(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function iterationDecorator(collection, entries) {
  if (typeof Symbol === 'function' && _typeof(Symbol.iterator) === 'symbol') {
    Object.defineProperty(collection, Symbol.iterator, {
      value: _iteratorProxy.default.bind(entries)
    });
  }
  return collection;
}

Object.defineProperty(ariaPropsMap$1, "__esModule", {
  value: true
});
ariaPropsMap$1.default = void 0;
var _iterationDecorator$4 = _interopRequireDefault$9(iterationDecorator$1);
function _interopRequireDefault$9(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _slicedToArray$4(arr, i) { return _arrayWithHoles$4(arr) || _iterableToArrayLimit$4(arr, i) || _unsupportedIterableToArray$4(arr, i) || _nonIterableRest$4(); }
function _nonIterableRest$4() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit$4(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles$4(arr) { if (Array.isArray(arr)) return arr; }
function _createForOfIteratorHelper$4(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$4(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray$4(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$4(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$4(o, minLen); }
function _arrayLikeToArray$4(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
var properties = [['aria-activedescendant', {
  'type': 'id'
}], ['aria-atomic', {
  'type': 'boolean'
}], ['aria-autocomplete', {
  'type': 'token',
  'values': ['inline', 'list', 'both', 'none']
}], ['aria-busy', {
  'type': 'boolean'
}], ['aria-checked', {
  'type': 'tristate'
}], ['aria-colcount', {
  type: 'integer'
}], ['aria-colindex', {
  type: 'integer'
}], ['aria-colspan', {
  type: 'integer'
}], ['aria-controls', {
  'type': 'idlist'
}], ['aria-current', {
  type: 'token',
  values: ['page', 'step', 'location', 'date', 'time', true, false]
}], ['aria-describedby', {
  'type': 'idlist'
}], ['aria-details', {
  'type': 'id'
}], ['aria-disabled', {
  'type': 'boolean'
}], ['aria-dropeffect', {
  'type': 'tokenlist',
  'values': ['copy', 'execute', 'link', 'move', 'none', 'popup']
}], ['aria-errormessage', {
  'type': 'id'
}], ['aria-expanded', {
  'type': 'boolean',
  'allowundefined': true
}], ['aria-flowto', {
  'type': 'idlist'
}], ['aria-grabbed', {
  'type': 'boolean',
  'allowundefined': true
}], ['aria-haspopup', {
  'type': 'token',
  'values': [false, true, 'menu', 'listbox', 'tree', 'grid', 'dialog']
}], ['aria-hidden', {
  'type': 'boolean',
  'allowundefined': true
}], ['aria-invalid', {
  'type': 'token',
  'values': ['grammar', false, 'spelling', true]
}], ['aria-keyshortcuts', {
  type: 'string'
}], ['aria-label', {
  'type': 'string'
}], ['aria-labelledby', {
  'type': 'idlist'
}], ['aria-level', {
  'type': 'integer'
}], ['aria-live', {
  'type': 'token',
  'values': ['assertive', 'off', 'polite']
}], ['aria-modal', {
  type: 'boolean'
}], ['aria-multiline', {
  'type': 'boolean'
}], ['aria-multiselectable', {
  'type': 'boolean'
}], ['aria-orientation', {
  'type': 'token',
  'values': ['vertical', 'undefined', 'horizontal']
}], ['aria-owns', {
  'type': 'idlist'
}], ['aria-placeholder', {
  type: 'string'
}], ['aria-posinset', {
  'type': 'integer'
}], ['aria-pressed', {
  'type': 'tristate'
}], ['aria-readonly', {
  'type': 'boolean'
}], ['aria-relevant', {
  'type': 'tokenlist',
  'values': ['additions', 'all', 'removals', 'text']
}], ['aria-required', {
  'type': 'boolean'
}], ['aria-roledescription', {
  type: 'string'
}], ['aria-rowcount', {
  type: 'integer'
}], ['aria-rowindex', {
  type: 'integer'
}], ['aria-rowspan', {
  type: 'integer'
}], ['aria-selected', {
  'type': 'boolean',
  'allowundefined': true
}], ['aria-setsize', {
  'type': 'integer'
}], ['aria-sort', {
  'type': 'token',
  'values': ['ascending', 'descending', 'none', 'other']
}], ['aria-valuemax', {
  'type': 'number'
}], ['aria-valuemin', {
  'type': 'number'
}], ['aria-valuenow', {
  'type': 'number'
}], ['aria-valuetext', {
  'type': 'string'
}]];
var ariaPropsMap = {
  entries: function entries() {
    return properties;
  },
  forEach: function forEach(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var _iterator = _createForOfIteratorHelper$4(properties),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _step$value = _slicedToArray$4(_step.value, 2),
          key = _step$value[0],
          values = _step$value[1];
        fn.call(thisArg, values, key, properties);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  },
  get: function get(key) {
    var item = properties.find(function (tuple) {
      return tuple[0] === key ? true : false;
    });
    return item && item[1];
  },
  has: function has(key) {
    return !!ariaPropsMap.get(key);
  },
  keys: function keys() {
    return properties.map(function (_ref) {
      var _ref2 = _slicedToArray$4(_ref, 1),
        key = _ref2[0];
      return key;
    });
  },
  values: function values() {
    return properties.map(function (_ref3) {
      var _ref4 = _slicedToArray$4(_ref3, 2),
        values = _ref4[1];
      return values;
    });
  }
};
var _default$2g = (0, _iterationDecorator$4.default)(ariaPropsMap, ariaPropsMap.entries());
ariaPropsMap$1.default = _default$2g;

var domMap$1 = {};

Object.defineProperty(domMap$1, "__esModule", {
  value: true
});
domMap$1.default = void 0;
var _iterationDecorator$3 = _interopRequireDefault$8(iterationDecorator$1);
function _interopRequireDefault$8(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _slicedToArray$3(arr, i) { return _arrayWithHoles$3(arr) || _iterableToArrayLimit$3(arr, i) || _unsupportedIterableToArray$3(arr, i) || _nonIterableRest$3(); }
function _nonIterableRest$3() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit$3(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles$3(arr) { if (Array.isArray(arr)) return arr; }
function _createForOfIteratorHelper$3(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$3(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray$3(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$3(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$3(o, minLen); }
function _arrayLikeToArray$3(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
var dom$1 = [['a', {
  reserved: false
}], ['abbr', {
  reserved: false
}], ['acronym', {
  reserved: false
}], ['address', {
  reserved: false
}], ['applet', {
  reserved: false
}], ['area', {
  reserved: false
}], ['article', {
  reserved: false
}], ['aside', {
  reserved: false
}], ['audio', {
  reserved: false
}], ['b', {
  reserved: false
}], ['base', {
  reserved: true
}], ['bdi', {
  reserved: false
}], ['bdo', {
  reserved: false
}], ['big', {
  reserved: false
}], ['blink', {
  reserved: false
}], ['blockquote', {
  reserved: false
}], ['body', {
  reserved: false
}], ['br', {
  reserved: false
}], ['button', {
  reserved: false
}], ['canvas', {
  reserved: false
}], ['caption', {
  reserved: false
}], ['center', {
  reserved: false
}], ['cite', {
  reserved: false
}], ['code', {
  reserved: false
}], ['col', {
  reserved: true
}], ['colgroup', {
  reserved: true
}], ['content', {
  reserved: false
}], ['data', {
  reserved: false
}], ['datalist', {
  reserved: false
}], ['dd', {
  reserved: false
}], ['del', {
  reserved: false
}], ['details', {
  reserved: false
}], ['dfn', {
  reserved: false
}], ['dialog', {
  reserved: false
}], ['dir', {
  reserved: false
}], ['div', {
  reserved: false
}], ['dl', {
  reserved: false
}], ['dt', {
  reserved: false
}], ['em', {
  reserved: false
}], ['embed', {
  reserved: false
}], ['fieldset', {
  reserved: false
}], ['figcaption', {
  reserved: false
}], ['figure', {
  reserved: false
}], ['font', {
  reserved: false
}], ['footer', {
  reserved: false
}], ['form', {
  reserved: false
}], ['frame', {
  reserved: false
}], ['frameset', {
  reserved: false
}], ['h1', {
  reserved: false
}], ['h2', {
  reserved: false
}], ['h3', {
  reserved: false
}], ['h4', {
  reserved: false
}], ['h5', {
  reserved: false
}], ['h6', {
  reserved: false
}], ['head', {
  reserved: true
}], ['header', {
  reserved: false
}], ['hgroup', {
  reserved: false
}], ['hr', {
  reserved: false
}], ['html', {
  reserved: true
}], ['i', {
  reserved: false
}], ['iframe', {
  reserved: false
}], ['img', {
  reserved: false
}], ['input', {
  reserved: false
}], ['ins', {
  reserved: false
}], ['kbd', {
  reserved: false
}], ['keygen', {
  reserved: false
}], ['label', {
  reserved: false
}], ['legend', {
  reserved: false
}], ['li', {
  reserved: false
}], ['link', {
  reserved: true
}], ['main', {
  reserved: false
}], ['map', {
  reserved: false
}], ['mark', {
  reserved: false
}], ['marquee', {
  reserved: false
}], ['menu', {
  reserved: false
}], ['menuitem', {
  reserved: false
}], ['meta', {
  reserved: true
}], ['meter', {
  reserved: false
}], ['nav', {
  reserved: false
}], ['noembed', {
  reserved: true
}], ['noscript', {
  reserved: true
}], ['object', {
  reserved: false
}], ['ol', {
  reserved: false
}], ['optgroup', {
  reserved: false
}], ['option', {
  reserved: false
}], ['output', {
  reserved: false
}], ['p', {
  reserved: false
}], ['param', {
  reserved: true
}], ['picture', {
  reserved: true
}], ['pre', {
  reserved: false
}], ['progress', {
  reserved: false
}], ['q', {
  reserved: false
}], ['rp', {
  reserved: false
}], ['rt', {
  reserved: false
}], ['rtc', {
  reserved: false
}], ['ruby', {
  reserved: false
}], ['s', {
  reserved: false
}], ['samp', {
  reserved: false
}], ['script', {
  reserved: true
}], ['section', {
  reserved: false
}], ['select', {
  reserved: false
}], ['small', {
  reserved: false
}], ['source', {
  reserved: true
}], ['spacer', {
  reserved: false
}], ['span', {
  reserved: false
}], ['strike', {
  reserved: false
}], ['strong', {
  reserved: false
}], ['style', {
  reserved: true
}], ['sub', {
  reserved: false
}], ['summary', {
  reserved: false
}], ['sup', {
  reserved: false
}], ['table', {
  reserved: false
}], ['tbody', {
  reserved: false
}], ['td', {
  reserved: false
}], ['textarea', {
  reserved: false
}], ['tfoot', {
  reserved: false
}], ['th', {
  reserved: false
}], ['thead', {
  reserved: false
}], ['time', {
  reserved: false
}], ['title', {
  reserved: true
}], ['tr', {
  reserved: false
}], ['track', {
  reserved: true
}], ['tt', {
  reserved: false
}], ['u', {
  reserved: false
}], ['ul', {
  reserved: false
}], ['var', {
  reserved: false
}], ['video', {
  reserved: false
}], ['wbr', {
  reserved: false
}], ['xmp', {
  reserved: false
}]];
var domMap = {
  entries: function entries() {
    return dom$1;
  },
  forEach: function forEach(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var _iterator = _createForOfIteratorHelper$3(dom$1),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _step$value = _slicedToArray$3(_step.value, 2),
          key = _step$value[0],
          values = _step$value[1];
        fn.call(thisArg, values, key, dom$1);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  },
  get: function get(key) {
    var item = dom$1.find(function (tuple) {
      return tuple[0] === key ? true : false;
    });
    return item && item[1];
  },
  has: function has(key) {
    return !!domMap.get(key);
  },
  keys: function keys() {
    return dom$1.map(function (_ref) {
      var _ref2 = _slicedToArray$3(_ref, 1),
        key = _ref2[0];
      return key;
    });
  },
  values: function values() {
    return dom$1.map(function (_ref3) {
      var _ref4 = _slicedToArray$3(_ref3, 2),
        values = _ref4[1];
      return values;
    });
  }
};
var _default$2f = (0, _iterationDecorator$3.default)(domMap, domMap.entries());
domMap$1.default = _default$2f;

var rolesMap$1 = {};

var ariaAbstractRoles$1 = {};

var commandRole$1 = {};

Object.defineProperty(commandRole$1, "__esModule", {
  value: true
});
commandRole$1.default = void 0;
var commandRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'menuitem'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget']]
};
var _default$2e = commandRole;
commandRole$1.default = _default$2e;

var compositeRole$1 = {};

Object.defineProperty(compositeRole$1, "__esModule", {
  value: true
});
compositeRole$1.default = void 0;
var compositeRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-activedescendant': null,
    'aria-disabled': null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget']]
};
var _default$2d = compositeRole;
compositeRole$1.default = _default$2d;

var inputRole$1 = {};

Object.defineProperty(inputRole$1, "__esModule", {
  value: true
});
inputRole$1.default = void 0;
var inputRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null
  },
  relatedConcepts: [{
    concept: {
      name: 'input'
    },
    module: 'XForms'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget']]
};
var _default$2c = inputRole;
inputRole$1.default = _default$2c;

var landmarkRole$1 = {};

Object.defineProperty(landmarkRole$1, "__esModule", {
  value: true
});
landmarkRole$1.default = void 0;
var landmarkRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$2b = landmarkRole;
landmarkRole$1.default = _default$2b;

var rangeRole$1 = {};

Object.defineProperty(rangeRole$1, "__esModule", {
  value: true
});
rangeRole$1.default = void 0;
var rangeRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-valuemax': null,
    'aria-valuemin': null,
    'aria-valuenow': null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure']]
};
var _default$2a = rangeRole;
rangeRole$1.default = _default$2a;

var roletypeRole$1 = {};

Object.defineProperty(roletypeRole$1, "__esModule", {
  value: true
});
roletypeRole$1.default = void 0;
var roletypeRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: [],
  prohibitedProps: [],
  props: {
    'aria-atomic': null,
    'aria-busy': null,
    'aria-controls': null,
    'aria-current': null,
    'aria-describedby': null,
    'aria-details': null,
    'aria-dropeffect': null,
    'aria-flowto': null,
    'aria-grabbed': null,
    'aria-hidden': null,
    'aria-keyshortcuts': null,
    'aria-label': null,
    'aria-labelledby': null,
    'aria-live': null,
    'aria-owns': null,
    'aria-relevant': null,
    'aria-roledescription': null
  },
  relatedConcepts: [{
    concept: {
      name: 'rel'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'role'
    },
    module: 'XHTML'
  }, {
    concept: {
      name: 'type'
    },
    module: 'Dublin Core'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: []
};
var _default$29 = roletypeRole;
roletypeRole$1.default = _default$29;

var sectionRole$1 = {};

Object.defineProperty(sectionRole$1, "__esModule", {
  value: true
});
sectionRole$1.default = void 0;
var sectionRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: [],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'frontmatter'
    },
    module: 'DTB'
  }, {
    concept: {
      name: 'level'
    },
    module: 'DTB'
  }, {
    concept: {
      name: 'level'
    },
    module: 'SMIL'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure']]
};
var _default$28 = sectionRole;
sectionRole$1.default = _default$28;

var sectionheadRole$1 = {};

Object.defineProperty(sectionheadRole$1, "__esModule", {
  value: true
});
sectionheadRole$1.default = void 0;
var sectionheadRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure']]
};
var _default$27 = sectionheadRole;
sectionheadRole$1.default = _default$27;

var selectRole$1 = {};

Object.defineProperty(selectRole$1, "__esModule", {
  value: true
});
selectRole$1.default = void 0;
var selectRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-orientation': null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'composite'], ['roletype', 'structure', 'section', 'group']]
};
var _default$26 = selectRole;
selectRole$1.default = _default$26;

var structureRole$1 = {};

Object.defineProperty(structureRole$1, "__esModule", {
  value: true
});
structureRole$1.default = void 0;
var structureRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: [],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype']]
};
var _default$25 = structureRole;
structureRole$1.default = _default$25;

var widgetRole$1 = {};

Object.defineProperty(widgetRole$1, "__esModule", {
  value: true
});
widgetRole$1.default = void 0;
var widgetRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: [],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype']]
};
var _default$24 = widgetRole;
widgetRole$1.default = _default$24;

var windowRole$1 = {};

Object.defineProperty(windowRole$1, "__esModule", {
  value: true
});
windowRole$1.default = void 0;
var windowRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-modal': null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype']]
};
var _default$23 = windowRole;
windowRole$1.default = _default$23;

Object.defineProperty(ariaAbstractRoles$1, "__esModule", {
  value: true
});
ariaAbstractRoles$1.default = void 0;
var _commandRole = _interopRequireDefault$7(commandRole$1);
var _compositeRole = _interopRequireDefault$7(compositeRole$1);
var _inputRole = _interopRequireDefault$7(inputRole$1);
var _landmarkRole = _interopRequireDefault$7(landmarkRole$1);
var _rangeRole = _interopRequireDefault$7(rangeRole$1);
var _roletypeRole = _interopRequireDefault$7(roletypeRole$1);
var _sectionRole = _interopRequireDefault$7(sectionRole$1);
var _sectionheadRole = _interopRequireDefault$7(sectionheadRole$1);
var _selectRole = _interopRequireDefault$7(selectRole$1);
var _structureRole = _interopRequireDefault$7(structureRole$1);
var _widgetRole = _interopRequireDefault$7(widgetRole$1);
var _windowRole = _interopRequireDefault$7(windowRole$1);
function _interopRequireDefault$7(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ariaAbstractRoles = [['command', _commandRole.default], ['composite', _compositeRole.default], ['input', _inputRole.default], ['landmark', _landmarkRole.default], ['range', _rangeRole.default], ['roletype', _roletypeRole.default], ['section', _sectionRole.default], ['sectionhead', _sectionheadRole.default], ['select', _selectRole.default], ['structure', _structureRole.default], ['widget', _widgetRole.default], ['window', _windowRole.default]];
var _default$22 = ariaAbstractRoles;
ariaAbstractRoles$1.default = _default$22;

var ariaLiteralRoles$1 = {};

var alertRole$1 = {};

Object.defineProperty(alertRole$1, "__esModule", {
  value: true
});
alertRole$1.default = void 0;
var alertRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-atomic': 'true',
    'aria-live': 'assertive'
  },
  relatedConcepts: [{
    concept: {
      name: 'alert'
    },
    module: 'XForms'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$21 = alertRole;
alertRole$1.default = _default$21;

var alertdialogRole$1 = {};

Object.defineProperty(alertdialogRole$1, "__esModule", {
  value: true
});
alertdialogRole$1.default = void 0;
var alertdialogRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'alert'
    },
    module: 'XForms'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'alert'], ['roletype', 'window', 'dialog']]
};
var _default$20 = alertdialogRole;
alertdialogRole$1.default = _default$20;

var applicationRole$1 = {};

Object.defineProperty(applicationRole$1, "__esModule", {
  value: true
});
applicationRole$1.default = void 0;
var applicationRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-activedescendant': null,
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'Device Independence Delivery Unit'
    }
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure']]
};
var _default$1$ = applicationRole;
applicationRole$1.default = _default$1$;

var articleRole$1 = {};

Object.defineProperty(articleRole$1, "__esModule", {
  value: true
});
articleRole$1.default = void 0;
var articleRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-posinset': null,
    'aria-setsize': null
  },
  relatedConcepts: [{
    concept: {
      name: 'article'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'document']]
};
var _default$1_ = articleRole;
articleRole$1.default = _default$1_;

var bannerRole$1 = {};

Object.defineProperty(bannerRole$1, "__esModule", {
  value: true
});
bannerRole$1.default = void 0;
var bannerRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      constraints: ['direct descendant of document'],
      name: 'header'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$1Z = bannerRole;
bannerRole$1.default = _default$1Z;

var blockquoteRole$1 = {};

Object.defineProperty(blockquoteRole$1, "__esModule", {
  value: true
});
blockquoteRole$1.default = void 0;
var blockquoteRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1Y = blockquoteRole;
blockquoteRole$1.default = _default$1Y;

var buttonRole$1 = {};

Object.defineProperty(buttonRole$1, "__esModule", {
  value: true
});
buttonRole$1.default = void 0;
var buttonRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-pressed': null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ['set'],
        name: 'aria-pressed'
      }, {
        name: 'type',
        value: 'checkbox'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        name: 'aria-expanded',
        value: 'false'
      }],
      name: 'summary'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        name: 'aria-expanded',
        value: 'true'
      }],
      constraints: ['direct descendant of details element with the open attribute defined'],
      name: 'summary'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        name: 'type',
        value: 'button'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        name: 'type',
        value: 'image'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        name: 'type',
        value: 'reset'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        name: 'type',
        value: 'submit'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'button'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'trigger'
    },
    module: 'XForms'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'command']]
};
var _default$1X = buttonRole;
buttonRole$1.default = _default$1X;

var captionRole$1 = {};

Object.defineProperty(captionRole$1, "__esModule", {
  value: true
});
captionRole$1.default = void 0;
var captionRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['prohibited'],
  prohibitedProps: ['aria-label', 'aria-labelledby'],
  props: {},
  relatedConcepts: [],
  requireContextRole: ['figure', 'grid', 'table'],
  requiredContextRole: ['figure', 'grid', 'table'],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1W = captionRole;
captionRole$1.default = _default$1W;

var cellRole$1 = {};

Object.defineProperty(cellRole$1, "__esModule", {
  value: true
});
cellRole$1.default = void 0;
var cellRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-colindex': null,
    'aria-colspan': null,
    'aria-rowindex': null,
    'aria-rowspan': null
  },
  relatedConcepts: [{
    concept: {
      constraints: ['descendant of table'],
      name: 'td'
    },
    module: 'HTML'
  }],
  requireContextRole: ['row'],
  requiredContextRole: ['row'],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1V = cellRole;
cellRole$1.default = _default$1V;

var checkboxRole$1 = {};

Object.defineProperty(checkboxRole$1, "__esModule", {
  value: true
});
checkboxRole$1.default = void 0;
var checkboxRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-checked': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-invalid': null,
    'aria-readonly': null,
    'aria-required': null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: 'type',
        value: 'checkbox'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'option'
    },
    module: 'ARIA'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    'aria-checked': null
  },
  superClass: [['roletype', 'widget', 'input']]
};
var _default$1U = checkboxRole;
checkboxRole$1.default = _default$1U;

var codeRole$1 = {};

Object.defineProperty(codeRole$1, "__esModule", {
  value: true
});
codeRole$1.default = void 0;
var codeRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['prohibited'],
  prohibitedProps: ['aria-label', 'aria-labelledby'],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1T = codeRole;
codeRole$1.default = _default$1T;

var columnheaderRole$1 = {};

Object.defineProperty(columnheaderRole$1, "__esModule", {
  value: true
});
columnheaderRole$1.default = void 0;
var columnheaderRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-sort': null
  },
  relatedConcepts: [{
    attributes: [{
      name: 'scope',
      value: 'col'
    }],
    concept: {
      name: 'th'
    },
    module: 'HTML'
  }],
  requireContextRole: ['row'],
  requiredContextRole: ['row'],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'cell'], ['roletype', 'structure', 'section', 'cell', 'gridcell'], ['roletype', 'widget', 'gridcell'], ['roletype', 'structure', 'sectionhead']]
};
var _default$1S = columnheaderRole;
columnheaderRole$1.default = _default$1S;

var comboboxRole$1 = {};

Object.defineProperty(comboboxRole$1, "__esModule", {
  value: true
});
comboboxRole$1.default = void 0;
var comboboxRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-activedescendant': null,
    'aria-autocomplete': null,
    'aria-errormessage': null,
    'aria-invalid': null,
    'aria-readonly': null,
    'aria-required': null,
    'aria-expanded': 'false',
    'aria-haspopup': 'listbox'
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ['set'],
        name: 'list'
      }, {
        name: 'type',
        value: 'email'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['set'],
        name: 'list'
      }, {
        name: 'type',
        value: 'search'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['set'],
        name: 'list'
      }, {
        name: 'type',
        value: 'tel'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['set'],
        name: 'list'
      }, {
        name: 'type',
        value: 'text'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['set'],
        name: 'list'
      }, {
        name: 'type',
        value: 'url'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['set'],
        name: 'list'
      }, {
        name: 'type',
        value: 'url'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['undefined'],
        name: 'multiple'
      }, {
        constraints: ['undefined'],
        name: 'size'
      }],
      name: 'select'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['undefined'],
        name: 'multiple'
      }, {
        name: 'size',
        value: 1
      }],
      name: 'select'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'select'
    },
    module: 'XForms'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    'aria-controls': null,
    'aria-expanded': 'false'
  },
  superClass: [['roletype', 'widget', 'input']]
};
var _default$1R = comboboxRole;
comboboxRole$1.default = _default$1R;

var complementaryRole$1 = {};

Object.defineProperty(complementaryRole$1, "__esModule", {
  value: true
});
complementaryRole$1.default = void 0;
var complementaryRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'aside'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$1Q = complementaryRole;
complementaryRole$1.default = _default$1Q;

var contentinfoRole$1 = {};

Object.defineProperty(contentinfoRole$1, "__esModule", {
  value: true
});
contentinfoRole$1.default = void 0;
var contentinfoRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      constraints: ['direct descendant of document'],
      name: 'footer'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$1P = contentinfoRole;
contentinfoRole$1.default = _default$1P;

var definitionRole$1 = {};

Object.defineProperty(definitionRole$1, "__esModule", {
  value: true
});
definitionRole$1.default = void 0;
var definitionRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'dd'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1O = definitionRole;
definitionRole$1.default = _default$1O;

var deletionRole$1 = {};

Object.defineProperty(deletionRole$1, "__esModule", {
  value: true
});
deletionRole$1.default = void 0;
var deletionRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['prohibited'],
  prohibitedProps: ['aria-label', 'aria-labelledby'],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1N = deletionRole;
deletionRole$1.default = _default$1N;

var dialogRole$1 = {};

Object.defineProperty(dialogRole$1, "__esModule", {
  value: true
});
dialogRole$1.default = void 0;
var dialogRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'dialog'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'window']]
};
var _default$1M = dialogRole;
dialogRole$1.default = _default$1M;

var directoryRole$1 = {};

Object.defineProperty(directoryRole$1, "__esModule", {
  value: true
});
directoryRole$1.default = void 0;
var directoryRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    module: 'DAISY Guide'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'list']]
};
var _default$1L = directoryRole;
directoryRole$1.default = _default$1L;

var documentRole$1 = {};

Object.defineProperty(documentRole$1, "__esModule", {
  value: true
});
documentRole$1.default = void 0;
var documentRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'Device Independence Delivery Unit'
    }
  }, {
    concept: {
      name: 'body'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure']]
};
var _default$1K = documentRole;
documentRole$1.default = _default$1K;

var emphasisRole$1 = {};

Object.defineProperty(emphasisRole$1, "__esModule", {
  value: true
});
emphasisRole$1.default = void 0;
var emphasisRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['prohibited'],
  prohibitedProps: ['aria-label', 'aria-labelledby'],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1J = emphasisRole;
emphasisRole$1.default = _default$1J;

var feedRole$1 = {};

Object.defineProperty(feedRole$1, "__esModule", {
  value: true
});
feedRole$1.default = void 0;
var feedRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['article']],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'list']]
};
var _default$1I = feedRole;
feedRole$1.default = _default$1I;

var figureRole$1 = {};

Object.defineProperty(figureRole$1, "__esModule", {
  value: true
});
figureRole$1.default = void 0;
var figureRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'figure'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1H = figureRole;
figureRole$1.default = _default$1H;

var formRole$1 = {};

Object.defineProperty(formRole$1, "__esModule", {
  value: true
});
formRole$1.default = void 0;
var formRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ['set'],
        name: 'aria-label'
      }],
      name: 'form'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['set'],
        name: 'aria-labelledby'
      }],
      name: 'form'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['set'],
        name: 'name'
      }],
      name: 'form'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$1G = formRole;
formRole$1.default = _default$1G;

var genericRole$1 = {};

Object.defineProperty(genericRole$1, "__esModule", {
  value: true
});
genericRole$1.default = void 0;
var genericRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['prohibited'],
  prohibitedProps: ['aria-label', 'aria-labelledby'],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'span'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'div'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure']]
};
var _default$1F = genericRole;
genericRole$1.default = _default$1F;

var gridRole$1 = {};

Object.defineProperty(gridRole$1, "__esModule", {
  value: true
});
gridRole$1.default = void 0;
var gridRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-multiselectable': null,
    'aria-readonly': null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: 'role',
        value: 'grid'
      }],
      name: 'table'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['row'], ['row', 'rowgroup']],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'composite'], ['roletype', 'structure', 'section', 'table']]
};
var _default$1E = gridRole;
gridRole$1.default = _default$1E;

var gridcellRole$1 = {};

Object.defineProperty(gridcellRole$1, "__esModule", {
  value: true
});
gridcellRole$1.default = void 0;
var gridcellRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null,
    'aria-readonly': null,
    'aria-required': null,
    'aria-selected': null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: 'role',
        value: 'gridcell'
      }],
      name: 'td'
    },
    module: 'HTML'
  }],
  requireContextRole: ['row'],
  requiredContextRole: ['row'],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'cell'], ['roletype', 'widget']]
};
var _default$1D = gridcellRole;
gridcellRole$1.default = _default$1D;

var groupRole$1 = {};

Object.defineProperty(groupRole$1, "__esModule", {
  value: true
});
groupRole$1.default = void 0;
var groupRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-activedescendant': null,
    'aria-disabled': null
  },
  relatedConcepts: [{
    concept: {
      name: 'details'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'fieldset'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'optgroup'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1C = groupRole;
groupRole$1.default = _default$1C;

var headingRole$1 = {};

Object.defineProperty(headingRole$1, "__esModule", {
  value: true
});
headingRole$1.default = void 0;
var headingRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-level': '2'
  },
  relatedConcepts: [{
    concept: {
      name: 'h1'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'h2'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'h3'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'h4'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'h5'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'h6'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    'aria-level': '2'
  },
  superClass: [['roletype', 'structure', 'sectionhead']]
};
var _default$1B = headingRole;
headingRole$1.default = _default$1B;

var imgRole$1 = {};

Object.defineProperty(imgRole$1, "__esModule", {
  value: true
});
imgRole$1.default = void 0;
var imgRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ['set'],
        name: 'alt'
      }],
      name: 'img'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['undefined'],
        name: 'alt'
      }],
      name: 'img'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'imggroup'
    },
    module: 'DTB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1A = imgRole;
imgRole$1.default = _default$1A;

var insertionRole$1 = {};

Object.defineProperty(insertionRole$1, "__esModule", {
  value: true
});
insertionRole$1.default = void 0;
var insertionRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['prohibited'],
  prohibitedProps: ['aria-label', 'aria-labelledby'],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1z = insertionRole;
insertionRole$1.default = _default$1z;

var linkRole$1 = {};

Object.defineProperty(linkRole$1, "__esModule", {
  value: true
});
linkRole$1.default = void 0;
var linkRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-expanded': null,
    'aria-haspopup': null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: 'href'
      }],
      name: 'a'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        name: 'href'
      }],
      name: 'area'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        name: 'href'
      }],
      name: 'link'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'command']]
};
var _default$1y = linkRole;
linkRole$1.default = _default$1y;

var listRole$1 = {};

Object.defineProperty(listRole$1, "__esModule", {
  value: true
});
listRole$1.default = void 0;
var listRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'menu'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'ol'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'ul'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['listitem']],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1x = listRole;
listRole$1.default = _default$1x;

var listboxRole$1 = {};

Object.defineProperty(listboxRole$1, "__esModule", {
  value: true
});
listboxRole$1.default = void 0;
var listboxRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-invalid': null,
    'aria-multiselectable': null,
    'aria-readonly': null,
    'aria-required': null,
    'aria-orientation': 'vertical'
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ['>1'],
        name: 'size'
      }, {
        name: 'multiple'
      }],
      name: 'select'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['>1'],
        name: 'size'
      }],
      name: 'select'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        name: 'multiple'
      }],
      name: 'select'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'datalist'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'list'
    },
    module: 'ARIA'
  }, {
    concept: {
      name: 'select'
    },
    module: 'XForms'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['option', 'group'], ['option']],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'composite', 'select'], ['roletype', 'structure', 'section', 'group', 'select']]
};
var _default$1w = listboxRole;
listboxRole$1.default = _default$1w;

var listitemRole$1 = {};

Object.defineProperty(listitemRole$1, "__esModule", {
  value: true
});
listitemRole$1.default = void 0;
var listitemRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-level': null,
    'aria-posinset': null,
    'aria-setsize': null
  },
  relatedConcepts: [{
    concept: {
      constraints: ['direct descendant of ol, ul or menu'],
      name: 'li'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'item'
    },
    module: 'XForms'
  }],
  requireContextRole: ['directory', 'list'],
  requiredContextRole: ['directory', 'list'],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1v = listitemRole;
listitemRole$1.default = _default$1v;

var logRole$1 = {};

Object.defineProperty(logRole$1, "__esModule", {
  value: true
});
logRole$1.default = void 0;
var logRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-live': 'polite'
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1u = logRole;
logRole$1.default = _default$1u;

var mainRole$1 = {};

Object.defineProperty(mainRole$1, "__esModule", {
  value: true
});
mainRole$1.default = void 0;
var mainRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'main'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$1t = mainRole;
mainRole$1.default = _default$1t;

var marqueeRole$1 = {};

Object.defineProperty(marqueeRole$1, "__esModule", {
  value: true
});
marqueeRole$1.default = void 0;
var marqueeRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1s = marqueeRole;
marqueeRole$1.default = _default$1s;

var mathRole$1 = {};

Object.defineProperty(mathRole$1, "__esModule", {
  value: true
});
mathRole$1.default = void 0;
var mathRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'math'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1r = mathRole;
mathRole$1.default = _default$1r;

var menuRole$1 = {};

Object.defineProperty(menuRole$1, "__esModule", {
  value: true
});
menuRole$1.default = void 0;
var menuRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-orientation': 'vertical'
  },
  relatedConcepts: [{
    concept: {
      name: 'MENU'
    },
    module: 'JAPI'
  }, {
    concept: {
      name: 'list'
    },
    module: 'ARIA'
  }, {
    concept: {
      name: 'select'
    },
    module: 'XForms'
  }, {
    concept: {
      name: 'sidebar'
    },
    module: 'DTB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['menuitem', 'group'], ['menuitemradio', 'group'], ['menuitemcheckbox', 'group'], ['menuitem'], ['menuitemcheckbox'], ['menuitemradio']],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'composite', 'select'], ['roletype', 'structure', 'section', 'group', 'select']]
};
var _default$1q = menuRole;
menuRole$1.default = _default$1q;

var menubarRole$1 = {};

Object.defineProperty(menubarRole$1, "__esModule", {
  value: true
});
menubarRole$1.default = void 0;
var menubarRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-orientation': 'horizontal'
  },
  relatedConcepts: [{
    concept: {
      name: 'toolbar'
    },
    module: 'ARIA'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['menuitem', 'group'], ['menuitemradio', 'group'], ['menuitemcheckbox', 'group'], ['menuitem'], ['menuitemcheckbox'], ['menuitemradio']],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'composite', 'select', 'menu'], ['roletype', 'structure', 'section', 'group', 'select', 'menu']]
};
var _default$1p = menubarRole;
menubarRole$1.default = _default$1p;

var menuitemRole$1 = {};

Object.defineProperty(menuitemRole$1, "__esModule", {
  value: true
});
menuitemRole$1.default = void 0;
var menuitemRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-posinset': null,
    'aria-setsize': null
  },
  relatedConcepts: [{
    concept: {
      name: 'MENU_ITEM'
    },
    module: 'JAPI'
  }, {
    concept: {
      name: 'listitem'
    },
    module: 'ARIA'
  }, {
    concept: {
      name: 'menuitem'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'option'
    },
    module: 'ARIA'
  }],
  requireContextRole: ['group', 'menu', 'menubar'],
  requiredContextRole: ['group', 'menu', 'menubar'],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'command']]
};
var _default$1o = menuitemRole;
menuitemRole$1.default = _default$1o;

var menuitemcheckboxRole$1 = {};

Object.defineProperty(menuitemcheckboxRole$1, "__esModule", {
  value: true
});
menuitemcheckboxRole$1.default = void 0;
var menuitemcheckboxRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'menuitem'
    },
    module: 'ARIA'
  }],
  requireContextRole: ['group', 'menu', 'menubar'],
  requiredContextRole: ['group', 'menu', 'menubar'],
  requiredOwnedElements: [],
  requiredProps: {
    'aria-checked': null
  },
  superClass: [['roletype', 'widget', 'input', 'checkbox'], ['roletype', 'widget', 'command', 'menuitem']]
};
var _default$1n = menuitemcheckboxRole;
menuitemcheckboxRole$1.default = _default$1n;

var menuitemradioRole$1 = {};

Object.defineProperty(menuitemradioRole$1, "__esModule", {
  value: true
});
menuitemradioRole$1.default = void 0;
var menuitemradioRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'menuitem'
    },
    module: 'ARIA'
  }],
  requireContextRole: ['group', 'menu', 'menubar'],
  requiredContextRole: ['group', 'menu', 'menubar'],
  requiredOwnedElements: [],
  requiredProps: {
    'aria-checked': null
  },
  superClass: [['roletype', 'widget', 'input', 'checkbox', 'menuitemcheckbox'], ['roletype', 'widget', 'command', 'menuitem', 'menuitemcheckbox'], ['roletype', 'widget', 'input', 'radio']]
};
var _default$1m = menuitemradioRole;
menuitemradioRole$1.default = _default$1m;

var meterRole$1 = {};

Object.defineProperty(meterRole$1, "__esModule", {
  value: true
});
meterRole$1.default = void 0;
var meterRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-valuetext': null,
    'aria-valuemax': '100',
    'aria-valuemin': '0'
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    'aria-valuenow': null
  },
  superClass: [['roletype', 'structure', 'range']]
};
var _default$1l = meterRole;
meterRole$1.default = _default$1l;

var navigationRole$1 = {};

Object.defineProperty(navigationRole$1, "__esModule", {
  value: true
});
navigationRole$1.default = void 0;
var navigationRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'nav'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$1k = navigationRole;
navigationRole$1.default = _default$1k;

var noneRole$1 = {};

Object.defineProperty(noneRole$1, "__esModule", {
  value: true
});
noneRole$1.default = void 0;
var noneRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: [],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: []
};
var _default$1j = noneRole;
noneRole$1.default = _default$1j;

var noteRole$1 = {};

Object.defineProperty(noteRole$1, "__esModule", {
  value: true
});
noteRole$1.default = void 0;
var noteRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1i = noteRole;
noteRole$1.default = _default$1i;

var optionRole$1 = {};

Object.defineProperty(optionRole$1, "__esModule", {
  value: true
});
optionRole$1.default = void 0;
var optionRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-checked': null,
    'aria-posinset': null,
    'aria-setsize': null,
    'aria-selected': 'false'
  },
  relatedConcepts: [{
    concept: {
      name: 'item'
    },
    module: 'XForms'
  }, {
    concept: {
      name: 'listitem'
    },
    module: 'ARIA'
  }, {
    concept: {
      name: 'option'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    'aria-selected': 'false'
  },
  superClass: [['roletype', 'widget', 'input']]
};
var _default$1h = optionRole;
optionRole$1.default = _default$1h;

var paragraphRole$1 = {};

Object.defineProperty(paragraphRole$1, "__esModule", {
  value: true
});
paragraphRole$1.default = void 0;
var paragraphRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['prohibited'],
  prohibitedProps: ['aria-label', 'aria-labelledby'],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$1g = paragraphRole;
paragraphRole$1.default = _default$1g;

var presentationRole$1 = {};

Object.defineProperty(presentationRole$1, "__esModule", {
  value: true
});
presentationRole$1.default = void 0;
var presentationRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['prohibited'],
  prohibitedProps: ['aria-label', 'aria-labelledby'],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure']]
};
var _default$1f = presentationRole;
presentationRole$1.default = _default$1f;

var progressbarRole$1 = {};

Object.defineProperty(progressbarRole$1, "__esModule", {
  value: true
});
progressbarRole$1.default = void 0;
var progressbarRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-valuetext': null
  },
  relatedConcepts: [{
    concept: {
      name: 'progress'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'status'
    },
    module: 'ARIA'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'range'], ['roletype', 'widget']]
};
var _default$1e = progressbarRole;
progressbarRole$1.default = _default$1e;

var radioRole$1 = {};

Object.defineProperty(radioRole$1, "__esModule", {
  value: true
});
radioRole$1.default = void 0;
var radioRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-checked': null,
    'aria-posinset': null,
    'aria-setsize': null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: 'type',
        value: 'radio'
      }],
      name: 'input'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    'aria-checked': null
  },
  superClass: [['roletype', 'widget', 'input']]
};
var _default$1d = radioRole;
radioRole$1.default = _default$1d;

var radiogroupRole$1 = {};

Object.defineProperty(radiogroupRole$1, "__esModule", {
  value: true
});
radiogroupRole$1.default = void 0;
var radiogroupRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-errormessage': null,
    'aria-invalid': null,
    'aria-readonly': null,
    'aria-required': null
  },
  relatedConcepts: [{
    concept: {
      name: 'list'
    },
    module: 'ARIA'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['radio']],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'composite', 'select'], ['roletype', 'structure', 'section', 'group', 'select']]
};
var _default$1c = radiogroupRole;
radiogroupRole$1.default = _default$1c;

var regionRole$1 = {};

Object.defineProperty(regionRole$1, "__esModule", {
  value: true
});
regionRole$1.default = void 0;
var regionRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ['set'],
        name: 'aria-label'
      }],
      name: 'section'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['set'],
        name: 'aria-labelledby'
      }],
      name: 'section'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'Device Independence Glossart perceivable unit'
    }
  }, {
    concept: {
      name: 'frame'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$1b = regionRole;
regionRole$1.default = _default$1b;

var rowRole$1 = {};

Object.defineProperty(rowRole$1, "__esModule", {
  value: true
});
rowRole$1.default = void 0;
var rowRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-colindex': null,
    'aria-expanded': null,
    'aria-level': null,
    'aria-posinset': null,
    'aria-rowindex': null,
    'aria-selected': null,
    'aria-setsize': null
  },
  relatedConcepts: [{
    concept: {
      name: 'tr'
    },
    module: 'HTML'
  }],
  requireContextRole: ['grid', 'rowgroup', 'table', 'treegrid'],
  requiredContextRole: ['grid', 'rowgroup', 'table', 'treegrid'],
  requiredOwnedElements: [['cell'], ['columnheader'], ['gridcell'], ['rowheader']],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'group'], ['roletype', 'widget']]
};
var _default$1a = rowRole;
rowRole$1.default = _default$1a;

var rowgroupRole$1 = {};

Object.defineProperty(rowgroupRole$1, "__esModule", {
  value: true
});
rowgroupRole$1.default = void 0;
var rowgroupRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'tbody'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'tfoot'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'thead'
    },
    module: 'HTML'
  }],
  requireContextRole: ['grid', 'table', 'treegrid'],
  requiredContextRole: ['grid', 'table', 'treegrid'],
  requiredOwnedElements: [['row']],
  requiredProps: {},
  superClass: [['roletype', 'structure']]
};
var _default$19 = rowgroupRole;
rowgroupRole$1.default = _default$19;

var rowheaderRole$1 = {};

Object.defineProperty(rowheaderRole$1, "__esModule", {
  value: true
});
rowheaderRole$1.default = void 0;
var rowheaderRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-sort': null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: 'scope',
        value: 'row'
      }],
      name: 'th'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        name: 'scope',
        value: 'rowgroup'
      }],
      name: 'th'
    },
    module: 'HTML'
  }],
  requireContextRole: ['row', 'rowgroup'],
  requiredContextRole: ['row', 'rowgroup'],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'cell'], ['roletype', 'structure', 'section', 'cell', 'gridcell'], ['roletype', 'widget', 'gridcell'], ['roletype', 'structure', 'sectionhead']]
};
var _default$18 = rowheaderRole;
rowheaderRole$1.default = _default$18;

var scrollbarRole$1 = {};

Object.defineProperty(scrollbarRole$1, "__esModule", {
  value: true
});
scrollbarRole$1.default = void 0;
var scrollbarRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-valuetext': null,
    'aria-orientation': 'vertical',
    'aria-valuemax': '100',
    'aria-valuemin': '0'
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    'aria-controls': null,
    'aria-valuenow': null
  },
  superClass: [['roletype', 'structure', 'range'], ['roletype', 'widget']]
};
var _default$17 = scrollbarRole;
scrollbarRole$1.default = _default$17;

var searchRole$1 = {};

Object.defineProperty(searchRole$1, "__esModule", {
  value: true
});
searchRole$1.default = void 0;
var searchRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$16 = searchRole;
searchRole$1.default = _default$16;

var searchboxRole$1 = {};

Object.defineProperty(searchboxRole$1, "__esModule", {
  value: true
});
searchboxRole$1.default = void 0;
var searchboxRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ['undefined'],
        name: 'list'
      }, {
        name: 'type',
        value: 'search'
      }],
      name: 'input'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'input', 'textbox']]
};
var _default$15 = searchboxRole;
searchboxRole$1.default = _default$15;

var separatorRole$1 = {};

Object.defineProperty(separatorRole$1, "__esModule", {
  value: true
});
separatorRole$1.default = void 0;
var separatorRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-orientation': 'horizontal',
    'aria-valuemax': '100',
    'aria-valuemin': '0',
    'aria-valuenow': null,
    'aria-valuetext': null
  },
  relatedConcepts: [{
    concept: {
      name: 'hr'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure']]
};
var _default$14 = separatorRole;
separatorRole$1.default = _default$14;

var sliderRole$1 = {};

Object.defineProperty(sliderRole$1, "__esModule", {
  value: true
});
sliderRole$1.default = void 0;
var sliderRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-errormessage': null,
    'aria-haspopup': null,
    'aria-invalid': null,
    'aria-readonly': null,
    'aria-valuetext': null,
    'aria-orientation': 'horizontal',
    'aria-valuemax': '100',
    'aria-valuemin': '0'
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: 'type',
        value: 'range'
      }],
      name: 'input'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    'aria-valuenow': null
  },
  superClass: [['roletype', 'widget', 'input'], ['roletype', 'structure', 'range']]
};
var _default$13 = sliderRole;
sliderRole$1.default = _default$13;

var spinbuttonRole$1 = {};

Object.defineProperty(spinbuttonRole$1, "__esModule", {
  value: true
});
spinbuttonRole$1.default = void 0;
var spinbuttonRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-errormessage': null,
    'aria-invalid': null,
    'aria-readonly': null,
    'aria-required': null,
    'aria-valuetext': null,
    'aria-valuenow': '0'
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: 'type',
        value: 'number'
      }],
      name: 'input'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'composite'], ['roletype', 'widget', 'input'], ['roletype', 'structure', 'range']]
};
var _default$12 = spinbuttonRole;
spinbuttonRole$1.default = _default$12;

var statusRole$1 = {};

Object.defineProperty(statusRole$1, "__esModule", {
  value: true
});
statusRole$1.default = void 0;
var statusRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-atomic': 'true',
    'aria-live': 'polite'
  },
  relatedConcepts: [{
    concept: {
      name: 'output'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$11 = statusRole;
statusRole$1.default = _default$11;

var strongRole$1 = {};

Object.defineProperty(strongRole$1, "__esModule", {
  value: true
});
strongRole$1.default = void 0;
var strongRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['prohibited'],
  prohibitedProps: ['aria-label', 'aria-labelledby'],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$10 = strongRole;
strongRole$1.default = _default$10;

var subscriptRole$1 = {};

Object.defineProperty(subscriptRole$1, "__esModule", {
  value: true
});
subscriptRole$1.default = void 0;
var subscriptRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['prohibited'],
  prohibitedProps: ['aria-label', 'aria-labelledby'],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$$ = subscriptRole;
subscriptRole$1.default = _default$$;

var superscriptRole$1 = {};

Object.defineProperty(superscriptRole$1, "__esModule", {
  value: true
});
superscriptRole$1.default = void 0;
var superscriptRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['prohibited'],
  prohibitedProps: ['aria-label', 'aria-labelledby'],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$_ = superscriptRole;
superscriptRole$1.default = _default$_;

var switchRole$1 = {};

Object.defineProperty(switchRole$1, "__esModule", {
  value: true
});
switchRole$1.default = void 0;
var switchRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'button'
    },
    module: 'ARIA'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    'aria-checked': null
  },
  superClass: [['roletype', 'widget', 'input', 'checkbox']]
};
var _default$Z = switchRole;
switchRole$1.default = _default$Z;

var tabRole$1 = {};

Object.defineProperty(tabRole$1, "__esModule", {
  value: true
});
tabRole$1.default = void 0;
var tabRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-posinset': null,
    'aria-setsize': null,
    'aria-selected': 'false'
  },
  relatedConcepts: [],
  requireContextRole: ['tablist'],
  requiredContextRole: ['tablist'],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'sectionhead'], ['roletype', 'widget']]
};
var _default$Y = tabRole;
tabRole$1.default = _default$Y;

var tableRole$1 = {};

Object.defineProperty(tableRole$1, "__esModule", {
  value: true
});
tableRole$1.default = void 0;
var tableRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-colcount': null,
    'aria-rowcount': null
  },
  relatedConcepts: [{
    concept: {
      name: 'table'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['row'], ['row', 'rowgroup']],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$X = tableRole;
tableRole$1.default = _default$X;

var tablistRole$1 = {};

Object.defineProperty(tablistRole$1, "__esModule", {
  value: true
});
tablistRole$1.default = void 0;
var tablistRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-level': null,
    'aria-multiselectable': null,
    'aria-orientation': 'horizontal'
  },
  relatedConcepts: [{
    module: 'DAISY',
    concept: {
      name: 'guide'
    }
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['tab']],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'composite']]
};
var _default$W = tablistRole;
tablistRole$1.default = _default$W;

var tabpanelRole$1 = {};

Object.defineProperty(tabpanelRole$1, "__esModule", {
  value: true
});
tabpanelRole$1.default = void 0;
var tabpanelRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$V = tabpanelRole;
tabpanelRole$1.default = _default$V;

var termRole$1 = {};

Object.defineProperty(termRole$1, "__esModule", {
  value: true
});
termRole$1.default = void 0;
var termRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'dfn'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'dt'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$U = termRole;
termRole$1.default = _default$U;

var textboxRole$1 = {};

Object.defineProperty(textboxRole$1, "__esModule", {
  value: true
});
textboxRole$1.default = void 0;
var textboxRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-activedescendant': null,
    'aria-autocomplete': null,
    'aria-errormessage': null,
    'aria-haspopup': null,
    'aria-invalid': null,
    'aria-multiline': null,
    'aria-placeholder': null,
    'aria-readonly': null,
    'aria-required': null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ['undefined'],
        name: 'type'
      }, {
        constraints: ['undefined'],
        name: 'list'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['undefined'],
        name: 'list'
      }, {
        name: 'type',
        value: 'email'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['undefined'],
        name: 'list'
      }, {
        name: 'type',
        value: 'tel'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['undefined'],
        name: 'list'
      }, {
        name: 'type',
        value: 'text'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      attributes: [{
        constraints: ['undefined'],
        name: 'list'
      }, {
        name: 'type',
        value: 'url'
      }],
      name: 'input'
    },
    module: 'HTML'
  }, {
    concept: {
      name: 'input'
    },
    module: 'XForms'
  }, {
    concept: {
      name: 'textarea'
    },
    module: 'HTML'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'input']]
};
var _default$T = textboxRole;
textboxRole$1.default = _default$T;

var timeRole$1 = {};

Object.defineProperty(timeRole$1, "__esModule", {
  value: true
});
timeRole$1.default = void 0;
var timeRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$S = timeRole;
timeRole$1.default = _default$S;

var timerRole$1 = {};

Object.defineProperty(timerRole$1, "__esModule", {
  value: true
});
timerRole$1.default = void 0;
var timerRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'status']]
};
var _default$R = timerRole;
timerRole$1.default = _default$R;

var toolbarRole$1 = {};

Object.defineProperty(toolbarRole$1, "__esModule", {
  value: true
});
toolbarRole$1.default = void 0;
var toolbarRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-orientation': 'horizontal'
  },
  relatedConcepts: [{
    concept: {
      name: 'menubar'
    },
    module: 'ARIA'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'group']]
};
var _default$Q = toolbarRole;
toolbarRole$1.default = _default$Q;

var tooltipRole$1 = {};

Object.defineProperty(tooltipRole$1, "__esModule", {
  value: true
});
tooltipRole$1.default = void 0;
var tooltipRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$P = tooltipRole;
tooltipRole$1.default = _default$P;

var treeRole$1 = {};

Object.defineProperty(treeRole$1, "__esModule", {
  value: true
});
treeRole$1.default = void 0;
var treeRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-errormessage': null,
    'aria-invalid': null,
    'aria-multiselectable': null,
    'aria-required': null,
    'aria-orientation': 'vertical'
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['treeitem', 'group'], ['treeitem']],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'composite', 'select'], ['roletype', 'structure', 'section', 'group', 'select']]
};
var _default$O = treeRole;
treeRole$1.default = _default$O;

var treegridRole$1 = {};

Object.defineProperty(treegridRole$1, "__esModule", {
  value: true
});
treegridRole$1.default = void 0;
var treegridRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['row'], ['row', 'rowgroup']],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'composite', 'grid'], ['roletype', 'structure', 'section', 'table', 'grid'], ['roletype', 'widget', 'composite', 'select', 'tree'], ['roletype', 'structure', 'section', 'group', 'select', 'tree']]
};
var _default$N = treegridRole;
treegridRole$1.default = _default$N;

var treeitemRole$1 = {};

Object.defineProperty(treeitemRole$1, "__esModule", {
  value: true
});
treeitemRole$1.default = void 0;
var treeitemRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-expanded': null,
    'aria-haspopup': null
  },
  relatedConcepts: [],
  requireContextRole: ['group', 'tree'],
  requiredContextRole: ['group', 'tree'],
  requiredOwnedElements: [],
  requiredProps: {
    'aria-selected': null
  },
  superClass: [['roletype', 'structure', 'section', 'listitem'], ['roletype', 'widget', 'input', 'option']]
};
var _default$M = treeitemRole;
treeitemRole$1.default = _default$M;

Object.defineProperty(ariaLiteralRoles$1, "__esModule", {
  value: true
});
ariaLiteralRoles$1.default = void 0;
var _alertRole = _interopRequireDefault$6(alertRole$1);
var _alertdialogRole = _interopRequireDefault$6(alertdialogRole$1);
var _applicationRole = _interopRequireDefault$6(applicationRole$1);
var _articleRole = _interopRequireDefault$6(articleRole$1);
var _bannerRole = _interopRequireDefault$6(bannerRole$1);
var _blockquoteRole = _interopRequireDefault$6(blockquoteRole$1);
var _buttonRole = _interopRequireDefault$6(buttonRole$1);
var _captionRole = _interopRequireDefault$6(captionRole$1);
var _cellRole = _interopRequireDefault$6(cellRole$1);
var _checkboxRole = _interopRequireDefault$6(checkboxRole$1);
var _codeRole = _interopRequireDefault$6(codeRole$1);
var _columnheaderRole = _interopRequireDefault$6(columnheaderRole$1);
var _comboboxRole = _interopRequireDefault$6(comboboxRole$1);
var _complementaryRole = _interopRequireDefault$6(complementaryRole$1);
var _contentinfoRole = _interopRequireDefault$6(contentinfoRole$1);
var _definitionRole = _interopRequireDefault$6(definitionRole$1);
var _deletionRole = _interopRequireDefault$6(deletionRole$1);
var _dialogRole = _interopRequireDefault$6(dialogRole$1);
var _directoryRole = _interopRequireDefault$6(directoryRole$1);
var _documentRole = _interopRequireDefault$6(documentRole$1);
var _emphasisRole = _interopRequireDefault$6(emphasisRole$1);
var _feedRole = _interopRequireDefault$6(feedRole$1);
var _figureRole = _interopRequireDefault$6(figureRole$1);
var _formRole = _interopRequireDefault$6(formRole$1);
var _genericRole = _interopRequireDefault$6(genericRole$1);
var _gridRole = _interopRequireDefault$6(gridRole$1);
var _gridcellRole = _interopRequireDefault$6(gridcellRole$1);
var _groupRole = _interopRequireDefault$6(groupRole$1);
var _headingRole = _interopRequireDefault$6(headingRole$1);
var _imgRole = _interopRequireDefault$6(imgRole$1);
var _insertionRole = _interopRequireDefault$6(insertionRole$1);
var _linkRole = _interopRequireDefault$6(linkRole$1);
var _listRole = _interopRequireDefault$6(listRole$1);
var _listboxRole = _interopRequireDefault$6(listboxRole$1);
var _listitemRole = _interopRequireDefault$6(listitemRole$1);
var _logRole = _interopRequireDefault$6(logRole$1);
var _mainRole = _interopRequireDefault$6(mainRole$1);
var _marqueeRole = _interopRequireDefault$6(marqueeRole$1);
var _mathRole = _interopRequireDefault$6(mathRole$1);
var _menuRole = _interopRequireDefault$6(menuRole$1);
var _menubarRole = _interopRequireDefault$6(menubarRole$1);
var _menuitemRole = _interopRequireDefault$6(menuitemRole$1);
var _menuitemcheckboxRole = _interopRequireDefault$6(menuitemcheckboxRole$1);
var _menuitemradioRole = _interopRequireDefault$6(menuitemradioRole$1);
var _meterRole = _interopRequireDefault$6(meterRole$1);
var _navigationRole = _interopRequireDefault$6(navigationRole$1);
var _noneRole = _interopRequireDefault$6(noneRole$1);
var _noteRole = _interopRequireDefault$6(noteRole$1);
var _optionRole = _interopRequireDefault$6(optionRole$1);
var _paragraphRole = _interopRequireDefault$6(paragraphRole$1);
var _presentationRole = _interopRequireDefault$6(presentationRole$1);
var _progressbarRole = _interopRequireDefault$6(progressbarRole$1);
var _radioRole = _interopRequireDefault$6(radioRole$1);
var _radiogroupRole = _interopRequireDefault$6(radiogroupRole$1);
var _regionRole = _interopRequireDefault$6(regionRole$1);
var _rowRole = _interopRequireDefault$6(rowRole$1);
var _rowgroupRole = _interopRequireDefault$6(rowgroupRole$1);
var _rowheaderRole = _interopRequireDefault$6(rowheaderRole$1);
var _scrollbarRole = _interopRequireDefault$6(scrollbarRole$1);
var _searchRole = _interopRequireDefault$6(searchRole$1);
var _searchboxRole = _interopRequireDefault$6(searchboxRole$1);
var _separatorRole = _interopRequireDefault$6(separatorRole$1);
var _sliderRole = _interopRequireDefault$6(sliderRole$1);
var _spinbuttonRole = _interopRequireDefault$6(spinbuttonRole$1);
var _statusRole = _interopRequireDefault$6(statusRole$1);
var _strongRole = _interopRequireDefault$6(strongRole$1);
var _subscriptRole = _interopRequireDefault$6(subscriptRole$1);
var _superscriptRole = _interopRequireDefault$6(superscriptRole$1);
var _switchRole = _interopRequireDefault$6(switchRole$1);
var _tabRole = _interopRequireDefault$6(tabRole$1);
var _tableRole = _interopRequireDefault$6(tableRole$1);
var _tablistRole = _interopRequireDefault$6(tablistRole$1);
var _tabpanelRole = _interopRequireDefault$6(tabpanelRole$1);
var _termRole = _interopRequireDefault$6(termRole$1);
var _textboxRole = _interopRequireDefault$6(textboxRole$1);
var _timeRole = _interopRequireDefault$6(timeRole$1);
var _timerRole = _interopRequireDefault$6(timerRole$1);
var _toolbarRole = _interopRequireDefault$6(toolbarRole$1);
var _tooltipRole = _interopRequireDefault$6(tooltipRole$1);
var _treeRole = _interopRequireDefault$6(treeRole$1);
var _treegridRole = _interopRequireDefault$6(treegridRole$1);
var _treeitemRole = _interopRequireDefault$6(treeitemRole$1);
function _interopRequireDefault$6(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ariaLiteralRoles = [['alert', _alertRole.default], ['alertdialog', _alertdialogRole.default], ['application', _applicationRole.default], ['article', _articleRole.default], ['banner', _bannerRole.default], ['blockquote', _blockquoteRole.default], ['button', _buttonRole.default], ['caption', _captionRole.default], ['cell', _cellRole.default], ['checkbox', _checkboxRole.default], ['code', _codeRole.default], ['columnheader', _columnheaderRole.default], ['combobox', _comboboxRole.default], ['complementary', _complementaryRole.default], ['contentinfo', _contentinfoRole.default], ['definition', _definitionRole.default], ['deletion', _deletionRole.default], ['dialog', _dialogRole.default], ['directory', _directoryRole.default], ['document', _documentRole.default], ['emphasis', _emphasisRole.default], ['feed', _feedRole.default], ['figure', _figureRole.default], ['form', _formRole.default], ['generic', _genericRole.default], ['grid', _gridRole.default], ['gridcell', _gridcellRole.default], ['group', _groupRole.default], ['heading', _headingRole.default], ['img', _imgRole.default], ['insertion', _insertionRole.default], ['link', _linkRole.default], ['list', _listRole.default], ['listbox', _listboxRole.default], ['listitem', _listitemRole.default], ['log', _logRole.default], ['main', _mainRole.default], ['marquee', _marqueeRole.default], ['math', _mathRole.default], ['menu', _menuRole.default], ['menubar', _menubarRole.default], ['menuitem', _menuitemRole.default], ['menuitemcheckbox', _menuitemcheckboxRole.default], ['menuitemradio', _menuitemradioRole.default], ['meter', _meterRole.default], ['navigation', _navigationRole.default], ['none', _noneRole.default], ['note', _noteRole.default], ['option', _optionRole.default], ['paragraph', _paragraphRole.default], ['presentation', _presentationRole.default], ['progressbar', _progressbarRole.default], ['radio', _radioRole.default], ['radiogroup', _radiogroupRole.default], ['region', _regionRole.default], ['row', _rowRole.default], ['rowgroup', _rowgroupRole.default], ['rowheader', _rowheaderRole.default], ['scrollbar', _scrollbarRole.default], ['search', _searchRole.default], ['searchbox', _searchboxRole.default], ['separator', _separatorRole.default], ['slider', _sliderRole.default], ['spinbutton', _spinbuttonRole.default], ['status', _statusRole.default], ['strong', _strongRole.default], ['subscript', _subscriptRole.default], ['superscript', _superscriptRole.default], ['switch', _switchRole.default], ['tab', _tabRole.default], ['table', _tableRole.default], ['tablist', _tablistRole.default], ['tabpanel', _tabpanelRole.default], ['term', _termRole.default], ['textbox', _textboxRole.default], ['time', _timeRole.default], ['timer', _timerRole.default], ['toolbar', _toolbarRole.default], ['tooltip', _tooltipRole.default], ['tree', _treeRole.default], ['treegrid', _treegridRole.default], ['treeitem', _treeitemRole.default]];
var _default$L = ariaLiteralRoles;
ariaLiteralRoles$1.default = _default$L;

var ariaDpubRoles$1 = {};

var docAbstractRole$1 = {};

Object.defineProperty(docAbstractRole$1, "__esModule", {
  value: true
});
docAbstractRole$1.default = void 0;
var docAbstractRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'abstract [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$K = docAbstractRole;
docAbstractRole$1.default = _default$K;

var docAcknowledgmentsRole$1 = {};

Object.defineProperty(docAcknowledgmentsRole$1, "__esModule", {
  value: true
});
docAcknowledgmentsRole$1.default = void 0;
var docAcknowledgmentsRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'acknowledgments [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$J = docAcknowledgmentsRole;
docAcknowledgmentsRole$1.default = _default$J;

var docAfterwordRole$1 = {};

Object.defineProperty(docAfterwordRole$1, "__esModule", {
  value: true
});
docAfterwordRole$1.default = void 0;
var docAfterwordRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'afterword [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$I = docAfterwordRole;
docAfterwordRole$1.default = _default$I;

var docAppendixRole$1 = {};

Object.defineProperty(docAppendixRole$1, "__esModule", {
  value: true
});
docAppendixRole$1.default = void 0;
var docAppendixRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'appendix [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$H = docAppendixRole;
docAppendixRole$1.default = _default$H;

var docBacklinkRole$1 = {};

Object.defineProperty(docBacklinkRole$1, "__esModule", {
  value: true
});
docBacklinkRole$1.default = void 0;
var docBacklinkRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'content'],
  prohibitedProps: [],
  props: {
    'aria-errormessage': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'referrer [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'command', 'link']]
};
var _default$G = docBacklinkRole;
docBacklinkRole$1.default = _default$G;

var docBiblioentryRole$1 = {};

Object.defineProperty(docBiblioentryRole$1, "__esModule", {
  value: true
});
docBiblioentryRole$1.default = void 0;
var docBiblioentryRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'EPUB biblioentry [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: ['doc-bibliography'],
  requiredContextRole: ['doc-bibliography'],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'listitem']]
};
var _default$F = docBiblioentryRole;
docBiblioentryRole$1.default = _default$F;

var docBibliographyRole$1 = {};

Object.defineProperty(docBibliographyRole$1, "__esModule", {
  value: true
});
docBibliographyRole$1.default = void 0;
var docBibliographyRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'bibliography [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['doc-biblioentry']],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$E = docBibliographyRole;
docBibliographyRole$1.default = _default$E;

var docBibliorefRole$1 = {};

Object.defineProperty(docBibliorefRole$1, "__esModule", {
  value: true
});
docBibliorefRole$1.default = void 0;
var docBibliorefRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-errormessage': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'biblioref [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'command', 'link']]
};
var _default$D = docBibliorefRole;
docBibliorefRole$1.default = _default$D;

var docChapterRole$1 = {};

Object.defineProperty(docChapterRole$1, "__esModule", {
  value: true
});
docChapterRole$1.default = void 0;
var docChapterRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'chapter [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$C = docChapterRole;
docChapterRole$1.default = _default$C;

var docColophonRole$1 = {};

Object.defineProperty(docColophonRole$1, "__esModule", {
  value: true
});
docColophonRole$1.default = void 0;
var docColophonRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'colophon [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$B = docColophonRole;
docColophonRole$1.default = _default$B;

var docConclusionRole$1 = {};

Object.defineProperty(docConclusionRole$1, "__esModule", {
  value: true
});
docConclusionRole$1.default = void 0;
var docConclusionRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'conclusion [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$A = docConclusionRole;
docConclusionRole$1.default = _default$A;

var docCoverRole$1 = {};

Object.defineProperty(docCoverRole$1, "__esModule", {
  value: true
});
docCoverRole$1.default = void 0;
var docCoverRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'cover [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'img']]
};
var _default$z = docCoverRole;
docCoverRole$1.default = _default$z;

var docCreditRole$1 = {};

Object.defineProperty(docCreditRole$1, "__esModule", {
  value: true
});
docCreditRole$1.default = void 0;
var docCreditRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'credit [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$y = docCreditRole;
docCreditRole$1.default = _default$y;

var docCreditsRole$1 = {};

Object.defineProperty(docCreditsRole$1, "__esModule", {
  value: true
});
docCreditsRole$1.default = void 0;
var docCreditsRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'credits [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$x = docCreditsRole;
docCreditsRole$1.default = _default$x;

var docDedicationRole$1 = {};

Object.defineProperty(docDedicationRole$1, "__esModule", {
  value: true
});
docDedicationRole$1.default = void 0;
var docDedicationRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'dedication [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$w = docDedicationRole;
docDedicationRole$1.default = _default$w;

var docEndnoteRole$1 = {};

Object.defineProperty(docEndnoteRole$1, "__esModule", {
  value: true
});
docEndnoteRole$1.default = void 0;
var docEndnoteRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'rearnote [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: ['doc-endnotes'],
  requiredContextRole: ['doc-endnotes'],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'listitem']]
};
var _default$v = docEndnoteRole;
docEndnoteRole$1.default = _default$v;

var docEndnotesRole$1 = {};

Object.defineProperty(docEndnotesRole$1, "__esModule", {
  value: true
});
docEndnotesRole$1.default = void 0;
var docEndnotesRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'rearnotes [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['doc-endnote']],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$u = docEndnotesRole;
docEndnotesRole$1.default = _default$u;

var docEpigraphRole$1 = {};

Object.defineProperty(docEpigraphRole$1, "__esModule", {
  value: true
});
docEpigraphRole$1.default = void 0;
var docEpigraphRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'epigraph [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$t = docEpigraphRole;
docEpigraphRole$1.default = _default$t;

var docEpilogueRole$1 = {};

Object.defineProperty(docEpilogueRole$1, "__esModule", {
  value: true
});
docEpilogueRole$1.default = void 0;
var docEpilogueRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'epilogue [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$s = docEpilogueRole;
docEpilogueRole$1.default = _default$s;

var docErrataRole$1 = {};

Object.defineProperty(docErrataRole$1, "__esModule", {
  value: true
});
docErrataRole$1.default = void 0;
var docErrataRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'errata [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$r = docErrataRole;
docErrataRole$1.default = _default$r;

var docExampleRole$1 = {};

Object.defineProperty(docExampleRole$1, "__esModule", {
  value: true
});
docExampleRole$1.default = void 0;
var docExampleRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$q = docExampleRole;
docExampleRole$1.default = _default$q;

var docFootnoteRole$1 = {};

Object.defineProperty(docFootnoteRole$1, "__esModule", {
  value: true
});
docFootnoteRole$1.default = void 0;
var docFootnoteRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'footnote [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$p = docFootnoteRole;
docFootnoteRole$1.default = _default$p;

var docForewordRole$1 = {};

Object.defineProperty(docForewordRole$1, "__esModule", {
  value: true
});
docForewordRole$1.default = void 0;
var docForewordRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'foreword [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$o = docForewordRole;
docForewordRole$1.default = _default$o;

var docGlossaryRole$1 = {};

Object.defineProperty(docGlossaryRole$1, "__esModule", {
  value: true
});
docGlossaryRole$1.default = void 0;
var docGlossaryRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'glossary [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [['definition'], ['term']],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$n = docGlossaryRole;
docGlossaryRole$1.default = _default$n;

var docGlossrefRole$1 = {};

Object.defineProperty(docGlossrefRole$1, "__esModule", {
  value: true
});
docGlossrefRole$1.default = void 0;
var docGlossrefRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-errormessage': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'glossref [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'command', 'link']]
};
var _default$m = docGlossrefRole;
docGlossrefRole$1.default = _default$m;

var docIndexRole$1 = {};

Object.defineProperty(docIndexRole$1, "__esModule", {
  value: true
});
docIndexRole$1.default = void 0;
var docIndexRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'index [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark', 'navigation']]
};
var _default$l = docIndexRole;
docIndexRole$1.default = _default$l;

var docIntroductionRole$1 = {};

Object.defineProperty(docIntroductionRole$1, "__esModule", {
  value: true
});
docIntroductionRole$1.default = void 0;
var docIntroductionRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'introduction [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$k = docIntroductionRole;
docIntroductionRole$1.default = _default$k;

var docNoterefRole$1 = {};

Object.defineProperty(docNoterefRole$1, "__esModule", {
  value: true
});
docNoterefRole$1.default = void 0;
var docNoterefRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-errormessage': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'noteref [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'widget', 'command', 'link']]
};
var _default$j = docNoterefRole;
docNoterefRole$1.default = _default$j;

var docNoticeRole$1 = {};

Object.defineProperty(docNoticeRole$1, "__esModule", {
  value: true
});
docNoticeRole$1.default = void 0;
var docNoticeRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'notice [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'note']]
};
var _default$i = docNoticeRole;
docNoticeRole$1.default = _default$i;

var docPagebreakRole$1 = {};

Object.defineProperty(docPagebreakRole$1, "__esModule", {
  value: true
});
docPagebreakRole$1.default = void 0;
var docPagebreakRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'pagebreak [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'separator']]
};
var _default$h = docPagebreakRole;
docPagebreakRole$1.default = _default$h;

var docPagelistRole$1 = {};

Object.defineProperty(docPagelistRole$1, "__esModule", {
  value: true
});
docPagelistRole$1.default = void 0;
var docPagelistRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'page-list [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark', 'navigation']]
};
var _default$g = docPagelistRole;
docPagelistRole$1.default = _default$g;

var docPartRole$1 = {};

Object.defineProperty(docPartRole$1, "__esModule", {
  value: true
});
docPartRole$1.default = void 0;
var docPartRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'part [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$f = docPartRole;
docPartRole$1.default = _default$f;

var docPrefaceRole$1 = {};

Object.defineProperty(docPrefaceRole$1, "__esModule", {
  value: true
});
docPrefaceRole$1.default = void 0;
var docPrefaceRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'preface [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$e = docPrefaceRole;
docPrefaceRole$1.default = _default$e;

var docPrologueRole$1 = {};

Object.defineProperty(docPrologueRole$1, "__esModule", {
  value: true
});
docPrologueRole$1.default = void 0;
var docPrologueRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'prologue [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark']]
};
var _default$d = docPrologueRole;
docPrologueRole$1.default = _default$d;

var docPullquoteRole$1 = {};

Object.defineProperty(docPullquoteRole$1, "__esModule", {
  value: true
});
docPullquoteRole$1.default = void 0;
var docPullquoteRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: 'pullquote [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['none']]
};
var _default$c = docPullquoteRole;
docPullquoteRole$1.default = _default$c;

var docQnaRole$1 = {};

Object.defineProperty(docQnaRole$1, "__esModule", {
  value: true
});
docQnaRole$1.default = void 0;
var docQnaRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'qna [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section']]
};
var _default$b = docQnaRole;
docQnaRole$1.default = _default$b;

var docSubtitleRole$1 = {};

Object.defineProperty(docSubtitleRole$1, "__esModule", {
  value: true
});
docSubtitleRole$1.default = void 0;
var docSubtitleRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'subtitle [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'sectionhead']]
};
var _default$a = docSubtitleRole;
docSubtitleRole$1.default = _default$a;

var docTipRole$1 = {};

Object.defineProperty(docTipRole$1, "__esModule", {
  value: true
});
docTipRole$1.default = void 0;
var docTipRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'help [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'note']]
};
var _default$9 = docTipRole;
docTipRole$1.default = _default$9;

var docTocRole$1 = {};

Object.defineProperty(docTocRole$1, "__esModule", {
  value: true
});
docTocRole$1.default = void 0;
var docTocRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    concept: {
      name: 'toc [EPUB-SSV]'
    },
    module: 'EPUB'
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'landmark', 'navigation']]
};
var _default$8 = docTocRole;
docTocRole$1.default = _default$8;

Object.defineProperty(ariaDpubRoles$1, "__esModule", {
  value: true
});
ariaDpubRoles$1.default = void 0;
var _docAbstractRole = _interopRequireDefault$5(docAbstractRole$1);
var _docAcknowledgmentsRole = _interopRequireDefault$5(docAcknowledgmentsRole$1);
var _docAfterwordRole = _interopRequireDefault$5(docAfterwordRole$1);
var _docAppendixRole = _interopRequireDefault$5(docAppendixRole$1);
var _docBacklinkRole = _interopRequireDefault$5(docBacklinkRole$1);
var _docBiblioentryRole = _interopRequireDefault$5(docBiblioentryRole$1);
var _docBibliographyRole = _interopRequireDefault$5(docBibliographyRole$1);
var _docBibliorefRole = _interopRequireDefault$5(docBibliorefRole$1);
var _docChapterRole = _interopRequireDefault$5(docChapterRole$1);
var _docColophonRole = _interopRequireDefault$5(docColophonRole$1);
var _docConclusionRole = _interopRequireDefault$5(docConclusionRole$1);
var _docCoverRole = _interopRequireDefault$5(docCoverRole$1);
var _docCreditRole = _interopRequireDefault$5(docCreditRole$1);
var _docCreditsRole = _interopRequireDefault$5(docCreditsRole$1);
var _docDedicationRole = _interopRequireDefault$5(docDedicationRole$1);
var _docEndnoteRole = _interopRequireDefault$5(docEndnoteRole$1);
var _docEndnotesRole = _interopRequireDefault$5(docEndnotesRole$1);
var _docEpigraphRole = _interopRequireDefault$5(docEpigraphRole$1);
var _docEpilogueRole = _interopRequireDefault$5(docEpilogueRole$1);
var _docErrataRole = _interopRequireDefault$5(docErrataRole$1);
var _docExampleRole = _interopRequireDefault$5(docExampleRole$1);
var _docFootnoteRole = _interopRequireDefault$5(docFootnoteRole$1);
var _docForewordRole = _interopRequireDefault$5(docForewordRole$1);
var _docGlossaryRole = _interopRequireDefault$5(docGlossaryRole$1);
var _docGlossrefRole = _interopRequireDefault$5(docGlossrefRole$1);
var _docIndexRole = _interopRequireDefault$5(docIndexRole$1);
var _docIntroductionRole = _interopRequireDefault$5(docIntroductionRole$1);
var _docNoterefRole = _interopRequireDefault$5(docNoterefRole$1);
var _docNoticeRole = _interopRequireDefault$5(docNoticeRole$1);
var _docPagebreakRole = _interopRequireDefault$5(docPagebreakRole$1);
var _docPagelistRole = _interopRequireDefault$5(docPagelistRole$1);
var _docPartRole = _interopRequireDefault$5(docPartRole$1);
var _docPrefaceRole = _interopRequireDefault$5(docPrefaceRole$1);
var _docPrologueRole = _interopRequireDefault$5(docPrologueRole$1);
var _docPullquoteRole = _interopRequireDefault$5(docPullquoteRole$1);
var _docQnaRole = _interopRequireDefault$5(docQnaRole$1);
var _docSubtitleRole = _interopRequireDefault$5(docSubtitleRole$1);
var _docTipRole = _interopRequireDefault$5(docTipRole$1);
var _docTocRole = _interopRequireDefault$5(docTocRole$1);
function _interopRequireDefault$5(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ariaDpubRoles = [['doc-abstract', _docAbstractRole.default], ['doc-acknowledgments', _docAcknowledgmentsRole.default], ['doc-afterword', _docAfterwordRole.default], ['doc-appendix', _docAppendixRole.default], ['doc-backlink', _docBacklinkRole.default], ['doc-biblioentry', _docBiblioentryRole.default], ['doc-bibliography', _docBibliographyRole.default], ['doc-biblioref', _docBibliorefRole.default], ['doc-chapter', _docChapterRole.default], ['doc-colophon', _docColophonRole.default], ['doc-conclusion', _docConclusionRole.default], ['doc-cover', _docCoverRole.default], ['doc-credit', _docCreditRole.default], ['doc-credits', _docCreditsRole.default], ['doc-dedication', _docDedicationRole.default], ['doc-endnote', _docEndnoteRole.default], ['doc-endnotes', _docEndnotesRole.default], ['doc-epigraph', _docEpigraphRole.default], ['doc-epilogue', _docEpilogueRole.default], ['doc-errata', _docErrataRole.default], ['doc-example', _docExampleRole.default], ['doc-footnote', _docFootnoteRole.default], ['doc-foreword', _docForewordRole.default], ['doc-glossary', _docGlossaryRole.default], ['doc-glossref', _docGlossrefRole.default], ['doc-index', _docIndexRole.default], ['doc-introduction', _docIntroductionRole.default], ['doc-noteref', _docNoterefRole.default], ['doc-notice', _docNoticeRole.default], ['doc-pagebreak', _docPagebreakRole.default], ['doc-pagelist', _docPagelistRole.default], ['doc-part', _docPartRole.default], ['doc-preface', _docPrefaceRole.default], ['doc-prologue', _docPrologueRole.default], ['doc-pullquote', _docPullquoteRole.default], ['doc-qna', _docQnaRole.default], ['doc-subtitle', _docSubtitleRole.default], ['doc-tip', _docTipRole.default], ['doc-toc', _docTocRole.default]];
var _default$7 = ariaDpubRoles;
ariaDpubRoles$1.default = _default$7;

var ariaGraphicsRoles$1 = {};

var graphicsDocumentRole$1 = {};

Object.defineProperty(graphicsDocumentRole$1, "__esModule", {
  value: true
});
graphicsDocumentRole$1.default = void 0;
var graphicsDocumentRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    module: 'GRAPHICS',
    concept: {
      name: 'graphics-object'
    }
  }, {
    module: 'ARIA',
    concept: {
      name: 'img'
    }
  }, {
    module: 'ARIA',
    concept: {
      name: 'article'
    }
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'document']]
};
var _default$6 = graphicsDocumentRole;
graphicsDocumentRole$1.default = _default$6;

var graphicsObjectRole$1 = {};

Object.defineProperty(graphicsObjectRole$1, "__esModule", {
  value: true
});
graphicsObjectRole$1.default = void 0;
var graphicsObjectRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ['author', 'contents'],
  prohibitedProps: [],
  props: {
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [{
    module: 'GRAPHICS',
    concept: {
      name: 'graphics-document'
    }
  }, {
    module: 'ARIA',
    concept: {
      name: 'group'
    }
  }, {
    module: 'ARIA',
    concept: {
      name: 'img'
    }
  }, {
    module: 'GRAPHICS',
    concept: {
      name: 'graphics-symbol'
    }
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'group']]
};
var _default$5 = graphicsObjectRole;
graphicsObjectRole$1.default = _default$5;

var graphicsSymbolRole$1 = {};

Object.defineProperty(graphicsSymbolRole$1, "__esModule", {
  value: true
});
graphicsSymbolRole$1.default = void 0;
var graphicsSymbolRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ['author'],
  prohibitedProps: [],
  props: {
    'aria-disabled': null,
    'aria-errormessage': null,
    'aria-expanded': null,
    'aria-haspopup': null,
    'aria-invalid': null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [['roletype', 'structure', 'section', 'img']]
};
var _default$4 = graphicsSymbolRole;
graphicsSymbolRole$1.default = _default$4;

Object.defineProperty(ariaGraphicsRoles$1, "__esModule", {
  value: true
});
ariaGraphicsRoles$1.default = void 0;
var _graphicsDocumentRole = _interopRequireDefault$4(graphicsDocumentRole$1);
var _graphicsObjectRole = _interopRequireDefault$4(graphicsObjectRole$1);
var _graphicsSymbolRole = _interopRequireDefault$4(graphicsSymbolRole$1);
function _interopRequireDefault$4(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ariaGraphicsRoles = [['graphics-document', _graphicsDocumentRole.default], ['graphics-object', _graphicsObjectRole.default], ['graphics-symbol', _graphicsSymbolRole.default]];
var _default$3 = ariaGraphicsRoles;
ariaGraphicsRoles$1.default = _default$3;

Object.defineProperty(rolesMap$1, "__esModule", {
  value: true
});
rolesMap$1.default = void 0;
var _ariaAbstractRoles = _interopRequireDefault$3(ariaAbstractRoles$1);
var _ariaLiteralRoles = _interopRequireDefault$3(ariaLiteralRoles$1);
var _ariaDpubRoles = _interopRequireDefault$3(ariaDpubRoles$1);
var _ariaGraphicsRoles = _interopRequireDefault$3(ariaGraphicsRoles$1);
var _iterationDecorator$2 = _interopRequireDefault$3(iterationDecorator$1);
function _interopRequireDefault$3(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _createForOfIteratorHelper$2(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$2(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }
function _slicedToArray$2(arr, i) { return _arrayWithHoles$2(arr) || _iterableToArrayLimit$2(arr, i) || _unsupportedIterableToArray$2(arr, i) || _nonIterableRest$2(); }
function _nonIterableRest$2() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray$2(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$2(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$2(o, minLen); }
function _arrayLikeToArray$2(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
function _iterableToArrayLimit$2(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles$2(arr) { if (Array.isArray(arr)) return arr; }
var roles$1 = [].concat(_ariaAbstractRoles.default, _ariaLiteralRoles.default, _ariaDpubRoles.default, _ariaGraphicsRoles.default);
roles$1.forEach(function (_ref) {
  var _ref2 = _slicedToArray$2(_ref, 2),
    roleDefinition = _ref2[1];
  // Conglomerate the properties
  var _iterator = _createForOfIteratorHelper$2(roleDefinition.superClass),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var superClassIter = _step.value;
      var _iterator2 = _createForOfIteratorHelper$2(superClassIter),
        _step2;
      try {
        var _loop = function _loop() {
          var superClassName = _step2.value;
          var superClassRoleTuple = roles$1.find(function (_ref3) {
            var _ref4 = _slicedToArray$2(_ref3, 1),
              name = _ref4[0];
            return name === superClassName;
          });
          if (superClassRoleTuple) {
            var superClassDefinition = superClassRoleTuple[1];
            for (var _i2 = 0, _Object$keys = Object.keys(superClassDefinition.props); _i2 < _Object$keys.length; _i2++) {
              var prop = _Object$keys[_i2];
              if (
              // $FlowIssue Accessing the hasOwnProperty on the Object prototype is fine.
              !Object.prototype.hasOwnProperty.call(roleDefinition.props, prop)) {
                Object.assign(roleDefinition.props, _defineProperty({}, prop, superClassDefinition.props[prop]));
              }
            }
          }
        };
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          _loop();
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
});
var rolesMap = {
  entries: function entries() {
    return roles$1;
  },
  forEach: function forEach(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var _iterator3 = _createForOfIteratorHelper$2(roles$1),
      _step3;
    try {
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
        var _step3$value = _slicedToArray$2(_step3.value, 2),
          key = _step3$value[0],
          values = _step3$value[1];
        fn.call(thisArg, values, key, roles$1);
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }
  },
  get: function get(key) {
    var item = roles$1.find(function (tuple) {
      return tuple[0] === key ? true : false;
    });
    return item && item[1];
  },
  has: function has(key) {
    return !!rolesMap.get(key);
  },
  keys: function keys() {
    return roles$1.map(function (_ref5) {
      var _ref6 = _slicedToArray$2(_ref5, 1),
        key = _ref6[0];
      return key;
    });
  },
  values: function values() {
    return roles$1.map(function (_ref7) {
      var _ref8 = _slicedToArray$2(_ref7, 2),
        values = _ref8[1];
      return values;
    });
  }
};
var _default$2 = (0, _iterationDecorator$2.default)(rolesMap, rolesMap.entries());
rolesMap$1.default = _default$2;

var elementRoleMap$1 = {};

var toStr$9 = Object.prototype.toString;

var isArguments$2 = function isArguments(value) {
	var str = toStr$9.call(value);
	var isArgs = str === '[object Arguments]';
	if (!isArgs) {
		isArgs = str !== '[object Array]' &&
			value !== null &&
			typeof value === 'object' &&
			typeof value.length === 'number' &&
			value.length >= 0 &&
			toStr$9.call(value.callee) === '[object Function]';
	}
	return isArgs;
};

var implementation$b;
var hasRequiredImplementation;

function requireImplementation () {
	if (hasRequiredImplementation) return implementation$b;
	hasRequiredImplementation = 1;

	var keysShim;
	if (!Object.keys) {
		// modified from https://github.com/es-shims/es5-shim
		var has = Object.prototype.hasOwnProperty;
		var toStr = Object.prototype.toString;
		var isArgs = isArguments$2; // eslint-disable-line global-require
		var isEnumerable = Object.prototype.propertyIsEnumerable;
		var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
		var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
		var dontEnums = [
			'toString',
			'toLocaleString',
			'valueOf',
			'hasOwnProperty',
			'isPrototypeOf',
			'propertyIsEnumerable',
			'constructor'
		];
		var equalsConstructorPrototype = function (o) {
			var ctor = o.constructor;
			return ctor && ctor.prototype === o;
		};
		var excludedKeys = {
			$applicationCache: true,
			$console: true,
			$external: true,
			$frame: true,
			$frameElement: true,
			$frames: true,
			$innerHeight: true,
			$innerWidth: true,
			$onmozfullscreenchange: true,
			$onmozfullscreenerror: true,
			$outerHeight: true,
			$outerWidth: true,
			$pageXOffset: true,
			$pageYOffset: true,
			$parent: true,
			$scrollLeft: true,
			$scrollTop: true,
			$scrollX: true,
			$scrollY: true,
			$self: true,
			$webkitIndexedDB: true,
			$webkitStorageInfo: true,
			$window: true
		};
		var hasAutomationEqualityBug = (function () {
			/* global window */
			if (typeof window === 'undefined') { return false; }
			for (var k in window) {
				try {
					if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
						try {
							equalsConstructorPrototype(window[k]);
						} catch (e) {
							return true;
						}
					}
				} catch (e) {
					return true;
				}
			}
			return false;
		}());
		var equalsConstructorPrototypeIfNotBuggy = function (o) {
			/* global window */
			if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
				return equalsConstructorPrototype(o);
			}
			try {
				return equalsConstructorPrototype(o);
			} catch (e) {
				return false;
			}
		};

		keysShim = function keys(object) {
			var isObject = object !== null && typeof object === 'object';
			var isFunction = toStr.call(object) === '[object Function]';
			var isArguments = isArgs(object);
			var isString = isObject && toStr.call(object) === '[object String]';
			var theKeys = [];

			if (!isObject && !isFunction && !isArguments) {
				throw new TypeError('Object.keys called on a non-object');
			}

			var skipProto = hasProtoEnumBug && isFunction;
			if (isString && object.length > 0 && !has.call(object, 0)) {
				for (var i = 0; i < object.length; ++i) {
					theKeys.push(String(i));
				}
			}

			if (isArguments && object.length > 0) {
				for (var j = 0; j < object.length; ++j) {
					theKeys.push(String(j));
				}
			} else {
				for (var name in object) {
					if (!(skipProto && name === 'prototype') && has.call(object, name)) {
						theKeys.push(String(name));
					}
				}
			}

			if (hasDontEnumBug) {
				var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

				for (var k = 0; k < dontEnums.length; ++k) {
					if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
						theKeys.push(dontEnums[k]);
					}
				}
			}
			return theKeys;
		};
	}
	implementation$b = keysShim;
	return implementation$b;
}

var slice$1 = Array.prototype.slice;
var isArgs = isArguments$2;

var origKeys = Object.keys;
var keysShim = origKeys ? function keys(o) { return origKeys(o); } : requireImplementation();

var originalKeys = Object.keys;

keysShim.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = (function () {
			// Safari 5.0 bug
			var args = Object.keys(arguments);
			return args && args.length === arguments.length;
		}(1, 2));
		if (!keysWorksWithArguments) {
			Object.keys = function keys(object) { // eslint-disable-line func-name-matching
				if (isArgs(object)) {
					return originalKeys(slice$1.call(object));
				}
				return originalKeys(object);
			};
		}
	} else {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

var objectKeys$2 = keysShim;

/* eslint complexity: [2, 18], max-statements: [2, 33] */
var shams$1 = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = shams$1;

var hasSymbols$5 = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr$8 = Object.prototype.toString;
var funcType = '[object Function]';

var implementation$a = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr$8.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

var implementation$9 = implementation$a;

var functionBind = Function.prototype.bind || implementation$9;

var bind$1 = functionBind;

var src = bind$1.call(Function.call, Object.prototype.hasOwnProperty);

var undefined$1;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError$1 = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD$2 = Object.getOwnPropertyDescriptor;
if ($gOPD$2) {
	try {
		$gOPD$2({}, '');
	} catch (e) {
		$gOPD$2 = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError$1();
};
var ThrowTypeError = $gOPD$2
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD$2(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols$4 = hasSymbols$5();

var getProto$1 = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined$1 : getProto$1(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined$1 : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols$4 ? getProto$1([][Symbol.iterator]()) : undefined$1,
	'%AsyncFromSyncIteratorPrototype%': undefined$1,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined$1 : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined$1 : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined$1 : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined$1 : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols$4 ? getProto$1(getProto$1([][Symbol.iterator]())) : undefined$1,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols$4 ? undefined$1 : getProto$1(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols$4 ? undefined$1 : getProto$1(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols$4 ? getProto$1(''[Symbol.iterator]()) : undefined$1,
	'%Symbol%': hasSymbols$4 ? Symbol : undefined$1,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError$1,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined$1 : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet
};

try {
	null.error; // eslint-disable-line no-unused-expressions
} catch (e) {
	// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
	var errorProto = getProto$1(getProto$1(e));
	INTRINSICS['%Error.prototype%'] = errorProto;
}

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto$1(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = functionBind;
var hasOwn$1 = src;
var $concat$1 = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace$1 = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);
var $exec$1 = bind.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace$1(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace$1(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn$1(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn$1(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError$1('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

var getIntrinsic = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError$1('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError$1('"allowMissing" argument must be a boolean');
	}

	if ($exec$1(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat$1([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn$1(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError$1('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined$1;
			}
			if ($gOPD$2 && (i + 1) >= parts.length) {
				var desc = $gOPD$2(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn$1(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

var GetIntrinsic$6 = getIntrinsic;

var $defineProperty = GetIntrinsic$6('%Object.defineProperty%', true);

var hasPropertyDescriptors$1 = function hasPropertyDescriptors() {
	if ($defineProperty) {
		try {
			$defineProperty({}, 'a', { value: 1 });
			return true;
		} catch (e) {
			// IE 8 has a broken defineProperty
			return false;
		}
	}
	return false;
};

hasPropertyDescriptors$1.hasArrayLengthDefineBug = function hasArrayLengthDefineBug() {
	// node v0.6 has a bug where array lengths can be Set but not Defined
	if (!hasPropertyDescriptors$1()) {
		return null;
	}
	try {
		return $defineProperty([], 'length', { value: 1 }).length !== 1;
	} catch (e) {
		// In Firefox 4-22, defining length on an array throws an exception.
		return true;
	}
};

var hasPropertyDescriptors_1 = hasPropertyDescriptors$1;

var keys$2 = objectKeys$2;
var hasSymbols$3 = typeof Symbol === 'function' && typeof Symbol('foo') === 'symbol';

var toStr$7 = Object.prototype.toString;
var concat = Array.prototype.concat;
var origDefineProperty = Object.defineProperty;

var isFunction = function (fn) {
	return typeof fn === 'function' && toStr$7.call(fn) === '[object Function]';
};

var hasPropertyDescriptors = hasPropertyDescriptors_1();

var supportsDescriptors$2 = origDefineProperty && hasPropertyDescriptors;

var defineProperty$1 = function (object, name, value, predicate) {
	if (name in object) {
		if (predicate === true) {
			if (object[name] === value) {
				return;
			}
		} else if (!isFunction(predicate) || !predicate()) {
			return;
		}
	}
	if (supportsDescriptors$2) {
		origDefineProperty(object, name, {
			configurable: true,
			enumerable: false,
			value: value,
			writable: true
		});
	} else {
		object[name] = value; // eslint-disable-line no-param-reassign
	}
};

var defineProperties$1 = function (object, map) {
	var predicates = arguments.length > 2 ? arguments[2] : {};
	var props = keys$2(map);
	if (hasSymbols$3) {
		props = concat.call(props, Object.getOwnPropertySymbols(map));
	}
	for (var i = 0; i < props.length; i += 1) {
		defineProperty$1(object, props[i], map[props[i]], predicates[props[i]]);
	}
};

defineProperties$1.supportsDescriptors = !!supportsDescriptors$2;

var defineProperties_1 = defineProperties$1;

var callBindExports = {};
var callBind$5 = {
  get exports(){ return callBindExports; },
  set exports(v){ callBindExports = v; },
};

(function (module) {

	var bind = functionBind;
	var GetIntrinsic = getIntrinsic;

	var $apply = GetIntrinsic('%Function.prototype.apply%');
	var $call = GetIntrinsic('%Function.prototype.call%');
	var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

	var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
	var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
	var $max = GetIntrinsic('%Math.max%');

	if ($defineProperty) {
		try {
			$defineProperty({}, 'a', { value: 1 });
		} catch (e) {
			// IE 8 has a broken defineProperty
			$defineProperty = null;
		}
	}

	module.exports = function callBind(originalFunction) {
		var func = $reflectApply(bind, $call, arguments);
		if ($gOPD && $defineProperty) {
			var desc = $gOPD(func, 'length');
			if (desc.configurable) {
				// original length, plus the receiver, minus any additional arguments (after the receiver)
				$defineProperty(
					func,
					'length',
					{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
				);
			}
		}
		return func;
	};

	var applyBind = function applyBind() {
		return $reflectApply(bind, $apply, arguments);
	};

	if ($defineProperty) {
		$defineProperty(module.exports, 'apply', { value: applyBind });
	} else {
		module.exports.apply = applyBind;
	}
} (callBind$5));

var GetIntrinsic$5 = getIntrinsic;

var callBind$4 = callBindExports;

var $indexOf$1 = callBind$4(GetIntrinsic$5('String.prototype.indexOf'));

var callBound$b = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic$5(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf$1(name, '.prototype.') > -1) {
		return callBind$4(intrinsic);
	}
	return intrinsic;
};

// modified from https://github.com/es-shims/es6-shim
var objectKeys$1 = objectKeys$2;
var hasSymbols$2 = shams$1();
var callBound$a = callBound$b;
var toObject = Object;
var $push = callBound$a('Array.prototype.push');
var $propIsEnumerable = callBound$a('Object.prototype.propertyIsEnumerable');
var originalGetSymbols = hasSymbols$2 ? Object.getOwnPropertySymbols : null;

// eslint-disable-next-line no-unused-vars
var implementation$8 = function assign(target, source1) {
	if (target == null) { throw new TypeError('target must be an object'); }
	var to = toObject(target); // step 1
	if (arguments.length === 1) {
		return to; // step 2
	}
	for (var s = 1; s < arguments.length; ++s) {
		var from = toObject(arguments[s]); // step 3.a.i

		// step 3.a.ii:
		var keys = objectKeys$1(from);
		var getSymbols = hasSymbols$2 && (Object.getOwnPropertySymbols || originalGetSymbols);
		if (getSymbols) {
			var syms = getSymbols(from);
			for (var j = 0; j < syms.length; ++j) {
				var key = syms[j];
				if ($propIsEnumerable(from, key)) {
					$push(keys, key);
				}
			}
		}

		// step 3.a.iii:
		for (var i = 0; i < keys.length; ++i) {
			var nextKey = keys[i];
			if ($propIsEnumerable(from, nextKey)) { // step 3.a.iii.2
				var propValue = from[nextKey]; // step 3.a.iii.2.a
				to[nextKey] = propValue; // step 3.a.iii.2.b
			}
		}
	}

	return to; // step 4
};

var implementation$7 = implementation$8;

var lacksProperEnumerationOrder = function () {
	if (!Object.assign) {
		return false;
	}
	/*
	 * v8, specifically in node 4.x, has a bug with incorrect property enumeration order
	 * note: this does not detect the bug unless there's 20 characters
	 */
	var str = 'abcdefghijklmnopqrst';
	var letters = str.split('');
	var map = {};
	for (var i = 0; i < letters.length; ++i) {
		map[letters[i]] = letters[i];
	}
	var obj = Object.assign({}, map);
	var actual = '';
	for (var k in obj) {
		actual += k;
	}
	return str !== actual;
};

var assignHasPendingExceptions = function () {
	if (!Object.assign || !Object.preventExtensions) {
		return false;
	}
	/*
	 * Firefox 37 still has "pending exception" logic in its Object.assign implementation,
	 * which is 72% slower than our shim, and Firefox 40's native implementation.
	 */
	var thrower = Object.preventExtensions({ 1: 2 });
	try {
		Object.assign(thrower, 'xy');
	} catch (e) {
		return thrower[1] === 'y';
	}
	return false;
};

var polyfill$4 = function getPolyfill() {
	if (!Object.assign) {
		return implementation$7;
	}
	if (lacksProperEnumerationOrder()) {
		return implementation$7;
	}
	if (assignHasPendingExceptions()) {
		return implementation$7;
	}
	return Object.assign;
};

var define$3 = defineProperties_1;
var getPolyfill$5 = polyfill$4;

var shim$5 = function shimAssign() {
	var polyfill = getPolyfill$5();
	define$3(
		Object,
		{ assign: polyfill },
		{ assign: function () { return Object.assign !== polyfill; } }
	);
	return polyfill;
};

var defineProperties = defineProperties_1;
var callBind$3 = callBindExports;

var implementation$6 = implementation$8;
var getPolyfill$4 = polyfill$4;
var shim$4 = shim$5;

var polyfill$3 = callBind$3.apply(getPolyfill$4());
// eslint-disable-next-line no-unused-vars
var bound = function assign(target, source1) {
	return polyfill$3(Object, arguments);
};

defineProperties(bound, {
	getPolyfill: getPolyfill$4,
	implementation: implementation$6,
	shim: shim$4
});

var object_assign = bound;

var implementationExports = {};
var implementation$5 = {
  get exports(){ return implementationExports; },
  set exports(v){ implementationExports = v; },
};

var functionsHaveNames = function functionsHaveNames() {
	return typeof function f() {}.name === 'string';
};

var gOPD$4 = Object.getOwnPropertyDescriptor;
if (gOPD$4) {
	try {
		gOPD$4([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		gOPD$4 = null;
	}
}

functionsHaveNames.functionsHaveConfigurableNames = function functionsHaveConfigurableNames() {
	if (!functionsHaveNames() || !gOPD$4) {
		return false;
	}
	var desc = gOPD$4(function () {}, 'name');
	return !!desc && !!desc.configurable;
};

var $bind = Function.prototype.bind;

functionsHaveNames.boundFunctionsHaveNames = function boundFunctionsHaveNames() {
	return functionsHaveNames() && typeof $bind === 'function' && function f() {}.bind().name !== '';
};

var functionsHaveNames_1 = functionsHaveNames;

(function (module) {

	var functionsHaveConfigurableNames = functionsHaveNames_1.functionsHaveConfigurableNames();

	var $Object = Object;
	var $TypeError = TypeError;

	module.exports = function flags() {
		if (this != null && this !== $Object(this)) {
			throw new $TypeError('RegExp.prototype.flags getter called on non-object');
		}
		var result = '';
		if (this.hasIndices) {
			result += 'd';
		}
		if (this.global) {
			result += 'g';
		}
		if (this.ignoreCase) {
			result += 'i';
		}
		if (this.multiline) {
			result += 'm';
		}
		if (this.dotAll) {
			result += 's';
		}
		if (this.unicode) {
			result += 'u';
		}
		if (this.sticky) {
			result += 'y';
		}
		return result;
	};

	if (functionsHaveConfigurableNames && Object.defineProperty) {
		Object.defineProperty(module.exports, 'name', { value: 'get flags' });
	}
} (implementation$5));

var implementation$4 = implementationExports;

var supportsDescriptors$1 = defineProperties_1.supportsDescriptors;
var $gOPD$1 = Object.getOwnPropertyDescriptor;

var polyfill$2 = function getPolyfill() {
	if (supportsDescriptors$1 && (/a/mig).flags === 'gim') {
		var descriptor = $gOPD$1(RegExp.prototype, 'flags');
		if (
			descriptor
			&& typeof descriptor.get === 'function'
			&& typeof RegExp.prototype.dotAll === 'boolean'
			&& typeof RegExp.prototype.hasIndices === 'boolean'
		) {
			/* eslint getter-return: 0 */
			var calls = '';
			var o = {};
			Object.defineProperty(o, 'hasIndices', {
				get: function () {
					calls += 'd';
				}
			});
			Object.defineProperty(o, 'sticky', {
				get: function () {
					calls += 'y';
				}
			});
			if (calls === 'dy') {
				return descriptor.get;
			}
		}
	}
	return implementation$4;
};

var supportsDescriptors = defineProperties_1.supportsDescriptors;
var getPolyfill$3 = polyfill$2;
var gOPD$3 = Object.getOwnPropertyDescriptor;
var defineProperty = Object.defineProperty;
var TypeErr = TypeError;
var getProto = Object.getPrototypeOf;
var regex = /a/;

var shim$3 = function shimFlags() {
	if (!supportsDescriptors || !getProto) {
		throw new TypeErr('RegExp.prototype.flags requires a true ES5 environment that supports property descriptors');
	}
	var polyfill = getPolyfill$3();
	var proto = getProto(regex);
	var descriptor = gOPD$3(proto, 'flags');
	if (!descriptor || descriptor.get !== polyfill) {
		defineProperty(proto, 'flags', {
			configurable: true,
			enumerable: false,
			get: polyfill
		});
	}
	return polyfill;
};

var define$2 = defineProperties_1;
var callBind$2 = callBindExports;

var implementation$3 = implementationExports;
var getPolyfill$2 = polyfill$2;
var shim$2 = shim$3;

var flagsBound = callBind$2(getPolyfill$2());

define$2(flagsBound, {
	getPolyfill: getPolyfill$2,
	implementation: implementation$3,
	shim: shim$2
});

var regexp_prototype_flags = flagsBound;

// this should only run in node >= 13.2, so it
// does not need any of the intense fallbacks that old node/browsers do

var $iterator = Symbol.iterator;
var node = function getIterator(iterable) {
	// alternatively, `iterable[$iterator]?.()`
	if (iterable != null && typeof iterable[$iterator] !== 'undefined') {
		return iterable[$iterator]();
	}
};

var util_inspect = require$$0$2.inspect;

var hasMap = typeof Map === 'function' && Map.prototype;
var mapSizeDescriptor = Object.getOwnPropertyDescriptor && hasMap ? Object.getOwnPropertyDescriptor(Map.prototype, 'size') : null;
var mapSize = hasMap && mapSizeDescriptor && typeof mapSizeDescriptor.get === 'function' ? mapSizeDescriptor.get : null;
var mapForEach = hasMap && Map.prototype.forEach;
var hasSet = typeof Set === 'function' && Set.prototype;
var setSizeDescriptor = Object.getOwnPropertyDescriptor && hasSet ? Object.getOwnPropertyDescriptor(Set.prototype, 'size') : null;
var setSize = hasSet && setSizeDescriptor && typeof setSizeDescriptor.get === 'function' ? setSizeDescriptor.get : null;
var setForEach = hasSet && Set.prototype.forEach;
var hasWeakMap = typeof WeakMap === 'function' && WeakMap.prototype;
var weakMapHas = hasWeakMap ? WeakMap.prototype.has : null;
var hasWeakSet = typeof WeakSet === 'function' && WeakSet.prototype;
var weakSetHas = hasWeakSet ? WeakSet.prototype.has : null;
var hasWeakRef = typeof WeakRef === 'function' && WeakRef.prototype;
var weakRefDeref = hasWeakRef ? WeakRef.prototype.deref : null;
var booleanValueOf = Boolean.prototype.valueOf;
var objectToString = Object.prototype.toString;
var functionToString = Function.prototype.toString;
var $match = String.prototype.match;
var $slice$2 = String.prototype.slice;
var $replace = String.prototype.replace;
var $toUpperCase = String.prototype.toUpperCase;
var $toLowerCase = String.prototype.toLowerCase;
var $test = RegExp.prototype.test;
var $concat = Array.prototype.concat;
var $join = Array.prototype.join;
var $arrSlice = Array.prototype.slice;
var $floor = Math.floor;
var bigIntValueOf$1 = typeof BigInt === 'function' ? BigInt.prototype.valueOf : null;
var gOPS = Object.getOwnPropertySymbols;
var symToString = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? Symbol.prototype.toString : null;
var hasShammedSymbols = typeof Symbol === 'function' && typeof Symbol.iterator === 'object';
// ie, `has-tostringtag/shams
var toStringTag = typeof Symbol === 'function' && Symbol.toStringTag && (typeof Symbol.toStringTag === hasShammedSymbols ? 'object' : 'symbol')
    ? Symbol.toStringTag
    : null;
var isEnumerable = Object.prototype.propertyIsEnumerable;

var gPO$1 = (typeof Reflect === 'function' ? Reflect.getPrototypeOf : Object.getPrototypeOf) || (
    [].__proto__ === Array.prototype // eslint-disable-line no-proto
        ? function (O) {
            return O.__proto__; // eslint-disable-line no-proto
        }
        : null
);

function addNumericSeparator(num, str) {
    if (
        num === Infinity
        || num === -Infinity
        || num !== num
        || (num && num > -1000 && num < 1000)
        || $test.call(/e/, str)
    ) {
        return str;
    }
    var sepRegex = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
    if (typeof num === 'number') {
        var int = num < 0 ? -$floor(-num) : $floor(num); // trunc(num)
        if (int !== num) {
            var intStr = String(int);
            var dec = $slice$2.call(str, intStr.length + 1);
            return $replace.call(intStr, sepRegex, '$&_') + '.' + $replace.call($replace.call(dec, /([0-9]{3})/g, '$&_'), /_$/, '');
        }
    }
    return $replace.call(str, sepRegex, '$&_');
}

var utilInspect = util_inspect;
var inspectCustom = utilInspect.custom;
var inspectSymbol = isSymbol$2(inspectCustom) ? inspectCustom : null;

var objectInspect = function inspect_(obj, options, depth, seen) {
    var opts = options || {};

    if (has$1(opts, 'quoteStyle') && (opts.quoteStyle !== 'single' && opts.quoteStyle !== 'double')) {
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
    }
    if (
        has$1(opts, 'maxStringLength') && (typeof opts.maxStringLength === 'number'
            ? opts.maxStringLength < 0 && opts.maxStringLength !== Infinity
            : opts.maxStringLength !== null
        )
    ) {
        throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    }
    var customInspect = has$1(opts, 'customInspect') ? opts.customInspect : true;
    if (typeof customInspect !== 'boolean' && customInspect !== 'symbol') {
        throw new TypeError('option "customInspect", if provided, must be `true`, `false`, or `\'symbol\'`');
    }

    if (
        has$1(opts, 'indent')
        && opts.indent !== null
        && opts.indent !== '\t'
        && !(parseInt(opts.indent, 10) === opts.indent && opts.indent > 0)
    ) {
        throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
    }
    if (has$1(opts, 'numericSeparator') && typeof opts.numericSeparator !== 'boolean') {
        throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
    }
    var numericSeparator = opts.numericSeparator;

    if (typeof obj === 'undefined') {
        return 'undefined';
    }
    if (obj === null) {
        return 'null';
    }
    if (typeof obj === 'boolean') {
        return obj ? 'true' : 'false';
    }

    if (typeof obj === 'string') {
        return inspectString(obj, opts);
    }
    if (typeof obj === 'number') {
        if (obj === 0) {
            return Infinity / obj > 0 ? '0' : '-0';
        }
        var str = String(obj);
        return numericSeparator ? addNumericSeparator(obj, str) : str;
    }
    if (typeof obj === 'bigint') {
        var bigIntStr = String(obj) + 'n';
        return numericSeparator ? addNumericSeparator(obj, bigIntStr) : bigIntStr;
    }

    var maxDepth = typeof opts.depth === 'undefined' ? 5 : opts.depth;
    if (typeof depth === 'undefined') { depth = 0; }
    if (depth >= maxDepth && maxDepth > 0 && typeof obj === 'object') {
        return isArray$1(obj) ? '[Array]' : '[Object]';
    }

    var indent = getIndent(opts, depth);

    if (typeof seen === 'undefined') {
        seen = [];
    } else if (indexOf(seen, obj) >= 0) {
        return '[Circular]';
    }

    function inspect(value, from, noIndent) {
        if (from) {
            seen = $arrSlice.call(seen);
            seen.push(from);
        }
        if (noIndent) {
            var newOpts = {
                depth: opts.depth
            };
            if (has$1(opts, 'quoteStyle')) {
                newOpts.quoteStyle = opts.quoteStyle;
            }
            return inspect_(value, newOpts, depth + 1, seen);
        }
        return inspect_(value, opts, depth + 1, seen);
    }

    if (typeof obj === 'function' && !isRegExp(obj)) { // in older engines, regexes are callable
        var name = nameOf(obj);
        var keys = arrObjKeys(obj, inspect);
        return '[Function' + (name ? ': ' + name : ' (anonymous)') + ']' + (keys.length > 0 ? ' { ' + $join.call(keys, ', ') + ' }' : '');
    }
    if (isSymbol$2(obj)) {
        var symString = hasShammedSymbols ? $replace.call(String(obj), /^(Symbol\(.*\))_[^)]*$/, '$1') : symToString.call(obj);
        return typeof obj === 'object' && !hasShammedSymbols ? markBoxed(symString) : symString;
    }
    if (isElement(obj)) {
        var s = '<' + $toLowerCase.call(String(obj.nodeName));
        var attrs = obj.attributes || [];
        for (var i = 0; i < attrs.length; i++) {
            s += ' ' + attrs[i].name + '=' + wrapQuotes(quote(attrs[i].value), 'double', opts);
        }
        s += '>';
        if (obj.childNodes && obj.childNodes.length) { s += '...'; }
        s += '</' + $toLowerCase.call(String(obj.nodeName)) + '>';
        return s;
    }
    if (isArray$1(obj)) {
        if (obj.length === 0) { return '[]'; }
        var xs = arrObjKeys(obj, inspect);
        if (indent && !singleLineValues(xs)) {
            return '[' + indentedJoin(xs, indent) + ']';
        }
        return '[ ' + $join.call(xs, ', ') + ' ]';
    }
    if (isError(obj)) {
        var parts = arrObjKeys(obj, inspect);
        if (!('cause' in Error.prototype) && 'cause' in obj && !isEnumerable.call(obj, 'cause')) {
            return '{ [' + String(obj) + '] ' + $join.call($concat.call('[cause]: ' + inspect(obj.cause), parts), ', ') + ' }';
        }
        if (parts.length === 0) { return '[' + String(obj) + ']'; }
        return '{ [' + String(obj) + '] ' + $join.call(parts, ', ') + ' }';
    }
    if (typeof obj === 'object' && customInspect) {
        if (inspectSymbol && typeof obj[inspectSymbol] === 'function' && utilInspect) {
            return utilInspect(obj, { depth: maxDepth - depth });
        } else if (customInspect !== 'symbol' && typeof obj.inspect === 'function') {
            return obj.inspect();
        }
    }
    if (isMap$2(obj)) {
        var mapParts = [];
        if (mapForEach) {
            mapForEach.call(obj, function (value, key) {
                mapParts.push(inspect(key, obj, true) + ' => ' + inspect(value, obj));
            });
        }
        return collectionOf('Map', mapSize.call(obj), mapParts, indent);
    }
    if (isSet$2(obj)) {
        var setParts = [];
        if (setForEach) {
            setForEach.call(obj, function (value) {
                setParts.push(inspect(value, obj));
            });
        }
        return collectionOf('Set', setSize.call(obj), setParts, indent);
    }
    if (isWeakMap$1(obj)) {
        return weakCollectionOf('WeakMap');
    }
    if (isWeakSet$1(obj)) {
        return weakCollectionOf('WeakSet');
    }
    if (isWeakRef(obj)) {
        return weakCollectionOf('WeakRef');
    }
    if (isNumber$1(obj)) {
        return markBoxed(inspect(Number(obj)));
    }
    if (isBigInt$1(obj)) {
        return markBoxed(inspect(bigIntValueOf$1.call(obj)));
    }
    if (isBoolean$1(obj)) {
        return markBoxed(booleanValueOf.call(obj));
    }
    if (isString$2(obj)) {
        return markBoxed(inspect(String(obj)));
    }
    if (!isDate$1(obj) && !isRegExp(obj)) {
        var ys = arrObjKeys(obj, inspect);
        var isPlainObject = gPO$1 ? gPO$1(obj) === Object.prototype : obj instanceof Object || obj.constructor === Object;
        var protoTag = obj instanceof Object ? '' : 'null prototype';
        var stringTag = !isPlainObject && toStringTag && Object(obj) === obj && toStringTag in obj ? $slice$2.call(toStr$6(obj), 8, -1) : protoTag ? 'Object' : '';
        var constructorTag = isPlainObject || typeof obj.constructor !== 'function' ? '' : obj.constructor.name ? obj.constructor.name + ' ' : '';
        var tag = constructorTag + (stringTag || protoTag ? '[' + $join.call($concat.call([], stringTag || [], protoTag || []), ': ') + '] ' : '');
        if (ys.length === 0) { return tag + '{}'; }
        if (indent) {
            return tag + '{' + indentedJoin(ys, indent) + '}';
        }
        return tag + '{ ' + $join.call(ys, ', ') + ' }';
    }
    return String(obj);
};

function wrapQuotes(s, defaultStyle, opts) {
    var quoteChar = (opts.quoteStyle || defaultStyle) === 'double' ? '"' : "'";
    return quoteChar + s + quoteChar;
}

function quote(s) {
    return $replace.call(String(s), /"/g, '&quot;');
}

function isArray$1(obj) { return toStr$6(obj) === '[object Array]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isDate$1(obj) { return toStr$6(obj) === '[object Date]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isRegExp(obj) { return toStr$6(obj) === '[object RegExp]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isError(obj) { return toStr$6(obj) === '[object Error]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isString$2(obj) { return toStr$6(obj) === '[object String]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isNumber$1(obj) { return toStr$6(obj) === '[object Number]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }
function isBoolean$1(obj) { return toStr$6(obj) === '[object Boolean]' && (!toStringTag || !(typeof obj === 'object' && toStringTag in obj)); }

// Symbol and BigInt do have Symbol.toStringTag by spec, so that can't be used to eliminate false positives
function isSymbol$2(obj) {
    if (hasShammedSymbols) {
        return obj && typeof obj === 'object' && obj instanceof Symbol;
    }
    if (typeof obj === 'symbol') {
        return true;
    }
    if (!obj || typeof obj !== 'object' || !symToString) {
        return false;
    }
    try {
        symToString.call(obj);
        return true;
    } catch (e) {}
    return false;
}

function isBigInt$1(obj) {
    if (!obj || typeof obj !== 'object' || !bigIntValueOf$1) {
        return false;
    }
    try {
        bigIntValueOf$1.call(obj);
        return true;
    } catch (e) {}
    return false;
}

var hasOwn = Object.prototype.hasOwnProperty || function (key) { return key in this; };
function has$1(obj, key) {
    return hasOwn.call(obj, key);
}

function toStr$6(obj) {
    return objectToString.call(obj);
}

function nameOf(f) {
    if (f.name) { return f.name; }
    var m = $match.call(functionToString.call(f), /^function\s*([\w$]+)/);
    if (m) { return m[1]; }
    return null;
}

function indexOf(xs, x) {
    if (xs.indexOf) { return xs.indexOf(x); }
    for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) { return i; }
    }
    return -1;
}

function isMap$2(x) {
    if (!mapSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        mapSize.call(x);
        try {
            setSize.call(x);
        } catch (s) {
            return true;
        }
        return x instanceof Map; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakMap$1(x) {
    if (!weakMapHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakMapHas.call(x, weakMapHas);
        try {
            weakSetHas.call(x, weakSetHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakMap; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakRef(x) {
    if (!weakRefDeref || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakRefDeref.call(x);
        return true;
    } catch (e) {}
    return false;
}

function isSet$2(x) {
    if (!setSize || !x || typeof x !== 'object') {
        return false;
    }
    try {
        setSize.call(x);
        try {
            mapSize.call(x);
        } catch (m) {
            return true;
        }
        return x instanceof Set; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isWeakSet$1(x) {
    if (!weakSetHas || !x || typeof x !== 'object') {
        return false;
    }
    try {
        weakSetHas.call(x, weakSetHas);
        try {
            weakMapHas.call(x, weakMapHas);
        } catch (s) {
            return true;
        }
        return x instanceof WeakSet; // core-js workaround, pre-v2.5.0
    } catch (e) {}
    return false;
}

function isElement(x) {
    if (!x || typeof x !== 'object') { return false; }
    if (typeof HTMLElement !== 'undefined' && x instanceof HTMLElement) {
        return true;
    }
    return typeof x.nodeName === 'string' && typeof x.getAttribute === 'function';
}

function inspectString(str, opts) {
    if (str.length > opts.maxStringLength) {
        var remaining = str.length - opts.maxStringLength;
        var trailer = '... ' + remaining + ' more character' + (remaining > 1 ? 's' : '');
        return inspectString($slice$2.call(str, 0, opts.maxStringLength), opts) + trailer;
    }
    // eslint-disable-next-line no-control-regex
    var s = $replace.call($replace.call(str, /(['\\])/g, '\\$1'), /[\x00-\x1f]/g, lowbyte);
    return wrapQuotes(s, 'single', opts);
}

function lowbyte(c) {
    var n = c.charCodeAt(0);
    var x = {
        8: 'b',
        9: 't',
        10: 'n',
        12: 'f',
        13: 'r'
    }[n];
    if (x) { return '\\' + x; }
    return '\\x' + (n < 0x10 ? '0' : '') + $toUpperCase.call(n.toString(16));
}

function markBoxed(str) {
    return 'Object(' + str + ')';
}

function weakCollectionOf(type) {
    return type + ' { ? }';
}

function collectionOf(type, size, entries, indent) {
    var joinedEntries = indent ? indentedJoin(entries, indent) : $join.call(entries, ', ');
    return type + ' (' + size + ') {' + joinedEntries + '}';
}

function singleLineValues(xs) {
    for (var i = 0; i < xs.length; i++) {
        if (indexOf(xs[i], '\n') >= 0) {
            return false;
        }
    }
    return true;
}

function getIndent(opts, depth) {
    var baseIndent;
    if (opts.indent === '\t') {
        baseIndent = '\t';
    } else if (typeof opts.indent === 'number' && opts.indent > 0) {
        baseIndent = $join.call(Array(opts.indent + 1), ' ');
    } else {
        return null;
    }
    return {
        base: baseIndent,
        prev: $join.call(Array(depth + 1), baseIndent)
    };
}

function indentedJoin(xs, indent) {
    if (xs.length === 0) { return ''; }
    var lineJoiner = '\n' + indent.prev + indent.base;
    return lineJoiner + $join.call(xs, ',' + lineJoiner) + '\n' + indent.prev;
}

function arrObjKeys(obj, inspect) {
    var isArr = isArray$1(obj);
    var xs = [];
    if (isArr) {
        xs.length = obj.length;
        for (var i = 0; i < obj.length; i++) {
            xs[i] = has$1(obj, i) ? inspect(obj[i], obj) : '';
        }
    }
    var syms = typeof gOPS === 'function' ? gOPS(obj) : [];
    var symMap;
    if (hasShammedSymbols) {
        symMap = {};
        for (var k = 0; k < syms.length; k++) {
            symMap['$' + syms[k]] = syms[k];
        }
    }

    for (var key in obj) { // eslint-disable-line no-restricted-syntax
        if (!has$1(obj, key)) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (isArr && String(Number(key)) === key && key < obj.length) { continue; } // eslint-disable-line no-restricted-syntax, no-continue
        if (hasShammedSymbols && symMap['$' + key] instanceof Symbol) {
            // this is to prevent shammed Symbols, which are stored as strings, from being included in the string key section
            continue; // eslint-disable-line no-restricted-syntax, no-continue
        } else if ($test.call(/[^\w$]/, key)) {
            xs.push(inspect(key, obj) + ': ' + inspect(obj[key], obj));
        } else {
            xs.push(key + ': ' + inspect(obj[key], obj));
        }
    }
    if (typeof gOPS === 'function') {
        for (var j = 0; j < syms.length; j++) {
            if (isEnumerable.call(obj, syms[j])) {
                xs.push('[' + inspect(syms[j]) + ']: ' + inspect(obj[syms[j]], obj));
            }
        }
    }
    return xs;
}

var GetIntrinsic$4 = getIntrinsic;
var callBound$9 = callBound$b;
var inspect = objectInspect;

var $TypeError = GetIntrinsic$4('%TypeError%');
var $WeakMap$1 = GetIntrinsic$4('%WeakMap%', true);
var $Map$2 = GetIntrinsic$4('%Map%', true);

var $weakMapGet = callBound$9('WeakMap.prototype.get', true);
var $weakMapSet = callBound$9('WeakMap.prototype.set', true);
var $weakMapHas = callBound$9('WeakMap.prototype.has', true);
var $mapGet$1 = callBound$9('Map.prototype.get', true);
var $mapSet = callBound$9('Map.prototype.set', true);
var $mapHas$5 = callBound$9('Map.prototype.has', true);

/*
 * This function traverses the list returning the node corresponding to the
 * given key.
 *
 * That node is also moved to the head of the list, so that if it's accessed
 * again we don't need to traverse the whole list. By doing so, all the recently
 * used nodes can be accessed relatively quickly.
 */
var listGetNode = function (list, key) { // eslint-disable-line consistent-return
	for (var prev = list, curr; (curr = prev.next) !== null; prev = curr) {
		if (curr.key === key) {
			prev.next = curr.next;
			curr.next = list.next;
			list.next = curr; // eslint-disable-line no-param-reassign
			return curr;
		}
	}
};

var listGet = function (objects, key) {
	var node = listGetNode(objects, key);
	return node && node.value;
};
var listSet = function (objects, key, value) {
	var node = listGetNode(objects, key);
	if (node) {
		node.value = value;
	} else {
		// Prepend the new node to the beginning of the list
		objects.next = { // eslint-disable-line no-param-reassign
			key: key,
			next: objects.next,
			value: value
		};
	}
};
var listHas = function (objects, key) {
	return !!listGetNode(objects, key);
};

var sideChannel = function getSideChannel() {
	var $wm;
	var $m;
	var $o;
	var channel = {
		assert: function (key) {
			if (!channel.has(key)) {
				throw new $TypeError('Side channel does not contain ' + inspect(key));
			}
		},
		get: function (key) { // eslint-disable-line consistent-return
			if ($WeakMap$1 && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapGet($wm, key);
				}
			} else if ($Map$2) {
				if ($m) {
					return $mapGet$1($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listGet($o, key);
				}
			}
		},
		has: function (key) {
			if ($WeakMap$1 && key && (typeof key === 'object' || typeof key === 'function')) {
				if ($wm) {
					return $weakMapHas($wm, key);
				}
			} else if ($Map$2) {
				if ($m) {
					return $mapHas$5($m, key);
				}
			} else {
				if ($o) { // eslint-disable-line no-lonely-if
					return listHas($o, key);
				}
			}
			return false;
		},
		set: function (key, value) {
			if ($WeakMap$1 && key && (typeof key === 'object' || typeof key === 'function')) {
				if (!$wm) {
					$wm = new $WeakMap$1();
				}
				$weakMapSet($wm, key, value);
			} else if ($Map$2) {
				if (!$m) {
					$m = new $Map$2();
				}
				$mapSet($m, key, value);
			} else {
				if (!$o) {
					/*
					 * Initialize the linked list as an empty node, so that we don't have
					 * to special-case handling of the first node: we can always refer to
					 * it as (previous node).next, instead of something like (list).head
					 */
					$o = { key: {}, next: null };
				}
				listSet($o, key, value);
			}
		}
	};
	return channel;
};

var numberIsNaN = function (value) {
	return value !== value;
};

var implementation$2 = function is(a, b) {
	if (a === 0 && b === 0) {
		return 1 / a === 1 / b;
	}
	if (a === b) {
		return true;
	}
	if (numberIsNaN(a) && numberIsNaN(b)) {
		return true;
	}
	return false;
};

var implementation$1 = implementation$2;

var polyfill$1 = function getPolyfill() {
	return typeof Object.is === 'function' ? Object.is : implementation$1;
};

var getPolyfill$1 = polyfill$1;
var define$1 = defineProperties_1;

var shim$1 = function shimObjectIs() {
	var polyfill = getPolyfill$1();
	define$1(Object, { is: polyfill }, {
		is: function testObjectIs() {
			return Object.is !== polyfill;
		}
	});
	return polyfill;
};

var define = defineProperties_1;
var callBind$1 = callBindExports;

var implementation = implementation$2;
var getPolyfill = polyfill$1;
var shim = shim$1;

var polyfill = callBind$1(getPolyfill(), Object);

define(polyfill, {
	getPolyfill: getPolyfill,
	implementation: implementation,
	shim: shim
});

var objectIs = polyfill;

var hasSymbols$1 = shams$1;

var shams = function hasToStringTagShams() {
	return hasSymbols$1() && !!Symbol.toStringTag;
};

var hasToStringTag$8 = shams();
var callBound$8 = callBound$b;

var $toString$4 = callBound$8('Object.prototype.toString');

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag$8 && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return $toString$4(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		$toString$4(value) !== '[object Array]' &&
		$toString$4(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

var isArguments$1 = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

var toString = {}.toString;

var isarray = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

var fnToStr = Function.prototype.toString;
var reflectApply = typeof Reflect === 'object' && Reflect !== null && Reflect.apply;
var badArrayLike;
var isCallableMarker;
if (typeof reflectApply === 'function' && typeof Object.defineProperty === 'function') {
	try {
		badArrayLike = Object.defineProperty({}, 'length', {
			get: function () {
				throw isCallableMarker;
			}
		});
		isCallableMarker = {};
		// eslint-disable-next-line no-throw-literal
		reflectApply(function () { throw 42; }, null, badArrayLike);
	} catch (_) {
		if (_ !== isCallableMarker) {
			reflectApply = null;
		}
	}
} else {
	reflectApply = null;
}

var constructorRegex = /^\s*class\b/;
var isES6ClassFn = function isES6ClassFunction(value) {
	try {
		var fnStr = fnToStr.call(value);
		return constructorRegex.test(fnStr);
	} catch (e) {
		return false; // not a function
	}
};

var tryFunctionObject = function tryFunctionToStr(value) {
	try {
		if (isES6ClassFn(value)) { return false; }
		fnToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr$5 = Object.prototype.toString;
var objectClass = '[object Object]';
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var ddaClass = '[object HTMLAllCollection]'; // IE 11
var ddaClass2 = '[object HTML document.all class]';
var ddaClass3 = '[object HTMLCollection]'; // IE 9-10
var hasToStringTag$7 = typeof Symbol === 'function' && !!Symbol.toStringTag; // better: use `has-tostringtag`

var isIE68 = !(0 in [,]); // eslint-disable-line no-sparse-arrays, comma-spacing

var isDDA = function isDocumentDotAll() { return false; };
if (typeof document === 'object') {
	// Firefox 3 canonicalizes DDA to undefined when it's not accessed directly
	var all = document.all;
	if (toStr$5.call(all) === toStr$5.call(document.all)) {
		isDDA = function isDocumentDotAll(value) {
			/* globals document: false */
			// in IE 6-8, typeof document.all is "object" and it's truthy
			if ((isIE68 || !value) && (typeof value === 'undefined' || typeof value === 'object')) {
				try {
					var str = toStr$5.call(value);
					return (
						str === ddaClass
						|| str === ddaClass2
						|| str === ddaClass3 // opera 12.16
						|| str === objectClass // IE 6-8
					) && value('') == null; // eslint-disable-line eqeqeq
				} catch (e) { /**/ }
			}
			return false;
		};
	}
}

var isCallable$1 = reflectApply
	? function isCallable(value) {
		if (isDDA(value)) { return true; }
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		try {
			reflectApply(value, null, badArrayLike);
		} catch (e) {
			if (e !== isCallableMarker) { return false; }
		}
		return !isES6ClassFn(value) && tryFunctionObject(value);
	}
	: function isCallable(value) {
		if (isDDA(value)) { return true; }
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		if (hasToStringTag$7) { return tryFunctionObject(value); }
		if (isES6ClassFn(value)) { return false; }
		var strClass = toStr$5.call(value);
		if (strClass !== fnClass && strClass !== genClass && !(/^\[object HTML/).test(strClass)) { return false; }
		return tryFunctionObject(value);
	};

var isCallable = isCallable$1;

var toStr$4 = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;

var forEachArray = function forEachArray(array, iterator, receiver) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            if (receiver == null) {
                iterator(array[i], i, array);
            } else {
                iterator.call(receiver, array[i], i, array);
            }
        }
    }
};

var forEachString = function forEachString(string, iterator, receiver) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        if (receiver == null) {
            iterator(string.charAt(i), i, string);
        } else {
            iterator.call(receiver, string.charAt(i), i, string);
        }
    }
};

var forEachObject = function forEachObject(object, iterator, receiver) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            if (receiver == null) {
                iterator(object[k], k, object);
            } else {
                iterator.call(receiver, object[k], k, object);
            }
        }
    }
};

var forEach$2 = function forEach(list, iterator, thisArg) {
    if (!isCallable(iterator)) {
        throw new TypeError('iterator must be a function');
    }

    var receiver;
    if (arguments.length >= 3) {
        receiver = thisArg;
    }

    if (toStr$4.call(list) === '[object Array]') {
        forEachArray(list, iterator, receiver);
    } else if (typeof list === 'string') {
        forEachString(list, iterator, receiver);
    } else {
        forEachObject(list, iterator, receiver);
    }
};

var forEach_1 = forEach$2;

var possibleNames = [
	'BigInt64Array',
	'BigUint64Array',
	'Float32Array',
	'Float64Array',
	'Int16Array',
	'Int32Array',
	'Int8Array',
	'Uint16Array',
	'Uint32Array',
	'Uint8Array',
	'Uint8ClampedArray'
];

var g$2 = typeof globalThis === 'undefined' ? commonjsGlobal : globalThis;

var availableTypedArrays$2 = function availableTypedArrays() {
	var out = [];
	for (var i = 0; i < possibleNames.length; i++) {
		if (typeof g$2[possibleNames[i]] === 'function') {
			out[out.length] = possibleNames[i];
		}
	}
	return out;
};

var GetIntrinsic$3 = getIntrinsic;

var $gOPD = GetIntrinsic$3('%Object.getOwnPropertyDescriptor%', true);

if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

var gopd = $gOPD;

var forEach$1 = forEach_1;
var availableTypedArrays$1 = availableTypedArrays$2;
var callBound$7 = callBound$b;

var $toString$3 = callBound$7('Object.prototype.toString');
var hasToStringTag$6 = shams();
var gOPD$2 = gopd;

var g$1 = typeof globalThis === 'undefined' ? commonjsGlobal : globalThis;
var typedArrays$1 = availableTypedArrays$1();

var $indexOf = callBound$7('Array.prototype.indexOf', true) || function indexOf(array, value) {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i] === value) {
			return i;
		}
	}
	return -1;
};
var $slice$1 = callBound$7('String.prototype.slice');
var toStrTags$1 = {};
var getPrototypeOf$1 = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag$6 && gOPD$2 && getPrototypeOf$1) {
	forEach$1(typedArrays$1, function (typedArray) {
		var arr = new g$1[typedArray]();
		if (Symbol.toStringTag in arr) {
			var proto = getPrototypeOf$1(arr);
			var descriptor = gOPD$2(proto, Symbol.toStringTag);
			if (!descriptor) {
				var superProto = getPrototypeOf$1(proto);
				descriptor = gOPD$2(superProto, Symbol.toStringTag);
			}
			toStrTags$1[typedArray] = descriptor.get;
		}
	});
}

var tryTypedArrays$1 = function tryAllTypedArrays(value) {
	var anyTrue = false;
	forEach$1(toStrTags$1, function (getter, typedArray) {
		if (!anyTrue) {
			try {
				anyTrue = getter.call(value) === typedArray;
			} catch (e) { /**/ }
		}
	});
	return anyTrue;
};

var isTypedArray$2 = function isTypedArray(value) {
	if (!value || typeof value !== 'object') { return false; }
	if (!hasToStringTag$6 || !(Symbol.toStringTag in value)) {
		var tag = $slice$1($toString$3(value), 8, -1);
		return $indexOf(typedArrays$1, tag) > -1;
	}
	if (!gOPD$2) { return false; }
	return tryTypedArrays$1(value);
};

var callBind = callBindExports;
var callBound$6 = callBound$b;
var GetIntrinsic$2 = getIntrinsic;
var isTypedArray$1 = isTypedArray$2;

var $ArrayBuffer = GetIntrinsic$2('ArrayBuffer', true);
var $Float32Array = GetIntrinsic$2('Float32Array', true);
var $byteLength$1 = callBound$6('ArrayBuffer.prototype.byteLength', true);

// in node 0.10, ArrayBuffers have no prototype methods, but have an own slot-checking `slice` method
var abSlice = $ArrayBuffer && !$byteLength$1 && new $ArrayBuffer().slice;
var $abSlice = abSlice && callBind(abSlice);

var isArrayBuffer$1 = $byteLength$1 || $abSlice
	? function isArrayBuffer(obj) {
		if (!obj || typeof obj !== 'object') {
			return false;
		}
		try {
			if ($byteLength$1) {
				$byteLength$1(obj);
			} else {
				$abSlice(obj, 0);
			}
			return true;
		} catch (e) {
			return false;
		}
	}
	: $Float32Array
		// in node 0.8, ArrayBuffers have no prototype or own methods
		? function IsArrayBuffer(obj) {
			try {
				return (new $Float32Array(obj)).buffer === obj && !isTypedArray$1(obj);
			} catch (e) {
				return typeof obj === 'object' && e.name === 'RangeError';
			}
		}
		: function isArrayBuffer(obj) { // eslint-disable-line no-unused-vars
			return false;
		};

var getDay = Date.prototype.getDay;
var tryDateObject = function tryDateGetDayCall(value) {
	try {
		getDay.call(value);
		return true;
	} catch (e) {
		return false;
	}
};

var toStr$3 = Object.prototype.toString;
var dateClass = '[object Date]';
var hasToStringTag$5 = shams();

var isDateObject = function isDateObject(value) {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	return hasToStringTag$5 ? tryDateObject(value) : toStr$3.call(value) === dateClass;
};

var callBound$5 = callBound$b;
var hasToStringTag$4 = shams();
var has;
var $exec;
var isRegexMarker;
var badStringifier;

if (hasToStringTag$4) {
	has = callBound$5('Object.prototype.hasOwnProperty');
	$exec = callBound$5('RegExp.prototype.exec');
	isRegexMarker = {};

	var throwRegexMarker = function () {
		throw isRegexMarker;
	};
	badStringifier = {
		toString: throwRegexMarker,
		valueOf: throwRegexMarker
	};

	if (typeof Symbol.toPrimitive === 'symbol') {
		badStringifier[Symbol.toPrimitive] = throwRegexMarker;
	}
}

var $toString$2 = callBound$5('Object.prototype.toString');
var gOPD$1 = Object.getOwnPropertyDescriptor;
var regexClass = '[object RegExp]';

var isRegex$1 = hasToStringTag$4
	// eslint-disable-next-line consistent-return
	? function isRegex(value) {
		if (!value || typeof value !== 'object') {
			return false;
		}

		var descriptor = gOPD$1(value, 'lastIndex');
		var hasLastIndexDataProperty = descriptor && has(descriptor, 'value');
		if (!hasLastIndexDataProperty) {
			return false;
		}

		try {
			$exec(value, badStringifier);
		} catch (e) {
			return e === isRegexMarker;
		}
	}
	: function isRegex(value) {
		// In older browsers, typeof regex incorrectly returns 'function'
		if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
			return false;
		}

		return $toString$2(value) === regexClass;
	};

var callBound$4 = callBound$b;

var $byteLength = callBound$4('SharedArrayBuffer.prototype.byteLength', true);

var isSharedArrayBuffer$1 = $byteLength
	? function isSharedArrayBuffer(obj) {
		if (!obj || typeof obj !== 'object') {
			return false;
		}
		try {
			$byteLength(obj);
			return true;
		} catch (e) {
			return false;
		}
	}
	: function isSharedArrayBuffer(obj) { // eslint-disable-line no-unused-vars
		return false;
	};

var strValue = String.prototype.valueOf;
var tryStringObject = function tryStringObject(value) {
	try {
		strValue.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr$2 = Object.prototype.toString;
var strClass = '[object String]';
var hasToStringTag$3 = shams();

var isString$1 = function isString(value) {
	if (typeof value === 'string') {
		return true;
	}
	if (typeof value !== 'object') {
		return false;
	}
	return hasToStringTag$3 ? tryStringObject(value) : toStr$2.call(value) === strClass;
};

var numToStr = Number.prototype.toString;
var tryNumberObject = function tryNumberObject(value) {
	try {
		numToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr$1 = Object.prototype.toString;
var numClass = '[object Number]';
var hasToStringTag$2 = shams();

var isNumberObject = function isNumberObject(value) {
	if (typeof value === 'number') {
		return true;
	}
	if (typeof value !== 'object') {
		return false;
	}
	return hasToStringTag$2 ? tryNumberObject(value) : toStr$1.call(value) === numClass;
};

var callBound$3 = callBound$b;
var $boolToStr = callBound$3('Boolean.prototype.toString');
var $toString$1 = callBound$3('Object.prototype.toString');

var tryBooleanObject = function booleanBrandCheck(value) {
	try {
		$boolToStr(value);
		return true;
	} catch (e) {
		return false;
	}
};
var boolClass = '[object Boolean]';
var hasToStringTag$1 = shams();

var isBooleanObject = function isBoolean(value) {
	if (typeof value === 'boolean') {
		return true;
	}
	if (value === null || typeof value !== 'object') {
		return false;
	}
	return hasToStringTag$1 && Symbol.toStringTag in value ? tryBooleanObject(value) : $toString$1(value) === boolClass;
};

var isSymbolExports = {};
var isSymbol$1 = {
  get exports(){ return isSymbolExports; },
  set exports(v){ isSymbolExports = v; },
};

var toStr = Object.prototype.toString;
var hasSymbols = hasSymbols$5();

if (hasSymbols) {
	var symToStr = Symbol.prototype.toString;
	var symStringRegex = /^Symbol\(.*\)$/;
	var isSymbolObject = function isRealSymbolObject(value) {
		if (typeof value.valueOf() !== 'symbol') {
			return false;
		}
		return symStringRegex.test(symToStr.call(value));
	};

	isSymbol$1.exports = function isSymbol(value) {
		if (typeof value === 'symbol') {
			return true;
		}
		if (toStr.call(value) !== '[object Symbol]') {
			return false;
		}
		try {
			return isSymbolObject(value);
		} catch (e) {
			return false;
		}
	};
} else {

	isSymbol$1.exports = function isSymbol(value) {
		// this environment does not support Symbols.
		return false ;
	};
}

var isBigintExports = {};
var isBigint = {
  get exports(){ return isBigintExports; },
  set exports(v){ isBigintExports = v; },
};

var $BigInt = typeof BigInt !== 'undefined' && BigInt;

var hasBigints = function hasNativeBigInts() {
	return typeof $BigInt === 'function'
		&& typeof BigInt === 'function'
		&& typeof $BigInt(42) === 'bigint' // eslint-disable-line no-magic-numbers
		&& typeof BigInt(42) === 'bigint'; // eslint-disable-line no-magic-numbers
};

var hasBigInts = hasBigints();

if (hasBigInts) {
	var bigIntValueOf = BigInt.prototype.valueOf;
	var tryBigInt = function tryBigIntObject(value) {
		try {
			bigIntValueOf.call(value);
			return true;
		} catch (e) {
		}
		return false;
	};

	isBigint.exports = function isBigInt(value) {
		if (
			value === null
			|| typeof value === 'undefined'
			|| typeof value === 'boolean'
			|| typeof value === 'string'
			|| typeof value === 'number'
			|| typeof value === 'symbol'
			|| typeof value === 'function'
		) {
			return false;
		}
		if (typeof value === 'bigint') {
			return true;
		}

		return tryBigInt(value);
	};
} else {
	isBigint.exports = function isBigInt(value) {
		return false ;
	};
}

var isString = isString$1;
var isNumber = isNumberObject;
var isBoolean = isBooleanObject;
var isSymbol = isSymbolExports;
var isBigInt = isBigintExports;

// eslint-disable-next-line consistent-return
var whichBoxedPrimitive$1 = function whichBoxedPrimitive(value) {
	// eslint-disable-next-line eqeqeq
	if (value == null || (typeof value !== 'object' && typeof value !== 'function')) {
		return null;
	}
	if (isString(value)) {
		return 'String';
	}
	if (isNumber(value)) {
		return 'Number';
	}
	if (isBoolean(value)) {
		return 'Boolean';
	}
	if (isSymbol(value)) {
		return 'Symbol';
	}
	if (isBigInt(value)) {
		return 'BigInt';
	}
};

var $Map$1 = typeof Map === 'function' && Map.prototype ? Map : null;
var $Set$2 = typeof Set === 'function' && Set.prototype ? Set : null;

var exported$2;

if (!$Map$1) {
	// eslint-disable-next-line no-unused-vars
	exported$2 = function isMap(x) {
		// `Map` is not present in this environment.
		return false;
	};
}

var $mapHas$4 = $Map$1 ? Map.prototype.has : null;
var $setHas$4 = $Set$2 ? Set.prototype.has : null;
if (!exported$2 && !$mapHas$4) {
	// eslint-disable-next-line no-unused-vars
	exported$2 = function isMap(x) {
		// `Map` does not have a `has` method
		return false;
	};
}

var isMap$1 = exported$2 || function isMap(x) {
	if (!x || typeof x !== 'object') {
		return false;
	}
	try {
		$mapHas$4.call(x);
		if ($setHas$4) {
			try {
				$setHas$4.call(x);
			} catch (e) {
				return true;
			}
		}
		return x instanceof $Map$1; // core-js workaround, pre-v2.5.0
	} catch (e) {}
	return false;
};

var $Map = typeof Map === 'function' && Map.prototype ? Map : null;
var $Set$1 = typeof Set === 'function' && Set.prototype ? Set : null;

var exported$1;

if (!$Set$1) {
	// eslint-disable-next-line no-unused-vars
	exported$1 = function isSet(x) {
		// `Set` is not present in this environment.
		return false;
	};
}

var $mapHas$3 = $Map ? Map.prototype.has : null;
var $setHas$3 = $Set$1 ? Set.prototype.has : null;
if (!exported$1 && !$setHas$3) {
	// eslint-disable-next-line no-unused-vars
	exported$1 = function isSet(x) {
		// `Set` does not have a `has` method
		return false;
	};
}

var isSet$1 = exported$1 || function isSet(x) {
	if (!x || typeof x !== 'object') {
		return false;
	}
	try {
		$setHas$3.call(x);
		if ($mapHas$3) {
			try {
				$mapHas$3.call(x);
			} catch (e) {
				return true;
			}
		}
		return x instanceof $Set$1; // core-js workaround, pre-v2.5.0
	} catch (e) {}
	return false;
};

var $WeakMap = typeof WeakMap === 'function' && WeakMap.prototype ? WeakMap : null;
var $WeakSet$1 = typeof WeakSet === 'function' && WeakSet.prototype ? WeakSet : null;

var exported;

if (!$WeakMap) {
	// eslint-disable-next-line no-unused-vars
	exported = function isWeakMap(x) {
		// `WeakMap` is not present in this environment.
		return false;
	};
}

var $mapHas$2 = $WeakMap ? $WeakMap.prototype.has : null;
var $setHas$2 = $WeakSet$1 ? $WeakSet$1.prototype.has : null;
if (!exported && !$mapHas$2) {
	// eslint-disable-next-line no-unused-vars
	exported = function isWeakMap(x) {
		// `WeakMap` does not have a `has` method
		return false;
	};
}

var isWeakmap = exported || function isWeakMap(x) {
	if (!x || typeof x !== 'object') {
		return false;
	}
	try {
		$mapHas$2.call(x, $mapHas$2);
		if ($setHas$2) {
			try {
				$setHas$2.call(x, $setHas$2);
			} catch (e) {
				return true;
			}
		}
		return x instanceof $WeakMap; // core-js workaround, pre-v3
	} catch (e) {}
	return false;
};

var isWeaksetExports = {};
var isWeakset = {
  get exports(){ return isWeaksetExports; },
  set exports(v){ isWeaksetExports = v; },
};

var GetIntrinsic$1 = getIntrinsic;
var callBound$2 = callBound$b;

var $WeakSet = GetIntrinsic$1('%WeakSet%', true);

var $setHas$1 = callBound$2('WeakSet.prototype.has', true);

if ($setHas$1) {
	var $mapHas$1 = callBound$2('WeakMap.prototype.has', true);

	isWeakset.exports = function isWeakSet(x) {
		if (!x || typeof x !== 'object') {
			return false;
		}
		try {
			$setHas$1(x, $setHas$1);
			if ($mapHas$1) {
				try {
					$mapHas$1(x, $mapHas$1);
				} catch (e) {
					return true;
				}
			}
			return x instanceof $WeakSet; // core-js workaround, pre-v3
		} catch (e) {}
		return false;
	};
} else {
	// eslint-disable-next-line no-unused-vars
	isWeakset.exports = function isWeakSet(x) {
		// `WeakSet` does not exist, or does not have a `has` method
		return false;
	};
}

var isMap = isMap$1;
var isSet = isSet$1;
var isWeakMap = isWeakmap;
var isWeakSet = isWeaksetExports;

var whichCollection$1 = function whichCollection(value) {
	if (value && typeof value === 'object') {
		if (isMap(value)) {
			return 'Map';
		}
		if (isSet(value)) {
			return 'Set';
		}
		if (isWeakMap(value)) {
			return 'WeakMap';
		}
		if (isWeakSet(value)) {
			return 'WeakSet';
		}
	}
	return false;
};

var forEach = forEach_1;
var availableTypedArrays = availableTypedArrays$2;
var callBound$1 = callBound$b;
var gOPD = gopd;

var $toString = callBound$1('Object.prototype.toString');
var hasToStringTag = shams();

var g = typeof globalThis === 'undefined' ? commonjsGlobal : globalThis;
var typedArrays = availableTypedArrays();

var $slice = callBound$1('String.prototype.slice');
var toStrTags = {};
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		if (typeof g[typedArray] === 'function') {
			var arr = new g[typedArray]();
			if (Symbol.toStringTag in arr) {
				var proto = getPrototypeOf(arr);
				var descriptor = gOPD(proto, Symbol.toStringTag);
				if (!descriptor) {
					var superProto = getPrototypeOf(proto);
					descriptor = gOPD(superProto, Symbol.toStringTag);
				}
				toStrTags[typedArray] = descriptor.get;
			}
		}
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var foundName = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!foundName) {
			try {
				var name = getter.call(value);
				if (name === typedArray) {
					foundName = name;
				}
			} catch (e) {}
		}
	});
	return foundName;
};

var isTypedArray = isTypedArray$2;

var whichTypedArray$1 = function whichTypedArray(value) {
	if (!isTypedArray(value)) { return false; }
	if (!hasToStringTag || !(Symbol.toStringTag in value)) { return $slice($toString(value), 8, -1); }
	return tryTypedArrays(value);
};

var assign = object_assign;
var callBound = callBound$b;
var flags = regexp_prototype_flags;
var GetIntrinsic = getIntrinsic;
var getIterator = node;
var getSideChannel = sideChannel;
var is = objectIs;
var isArguments = isArguments$1;
var isArray = isarray;
var isArrayBuffer = isArrayBuffer$1;
var isDate = isDateObject;
var isRegex = isRegex$1;
var isSharedArrayBuffer = isSharedArrayBuffer$1;
var objectKeys = objectKeys$2;
var whichBoxedPrimitive = whichBoxedPrimitive$1;
var whichCollection = whichCollection$1;
var whichTypedArray = whichTypedArray$1;

var byteLength = callBound('ArrayBuffer.prototype.byteLength', true)
	|| function byteLength(ab) { return ab.byteLength; }; // in node < 0.11, byteLength is an own nonconfigurable property
var sabByteLength = callBound('SharedArrayBuffer.prototype.byteLength', true);

var $getTime = callBound('Date.prototype.getTime');
var gPO = Object.getPrototypeOf;
var $objToString = callBound('Object.prototype.toString');

var $Set = GetIntrinsic('%Set%', true);
var $mapHas = callBound('Map.prototype.has', true);
var $mapGet = callBound('Map.prototype.get', true);
var $mapSize = callBound('Map.prototype.size', true);
var $setAdd = callBound('Set.prototype.add', true);
var $setDelete = callBound('Set.prototype.delete', true);
var $setHas = callBound('Set.prototype.has', true);
var $setSize = callBound('Set.prototype.size', true);

// taken from https://github.com/browserify/commonjs-assert/blob/bba838e9ba9e28edf3127ce6974624208502f6bc/internal/util/comparisons.js#L401-L414
function setHasEqualElement(set, val1, opts, channel) {
  var i = getIterator(set);
  var result;
  while ((result = i.next()) && !result.done) {
    if (internalDeepEqual(val1, result.value, opts, channel)) { // eslint-disable-line no-use-before-define
      // Remove the matching element to make sure we do not check that again.
      $setDelete(set, result.value);
      return true;
    }
  }

  return false;
}

// taken from https://github.com/browserify/commonjs-assert/blob/bba838e9ba9e28edf3127ce6974624208502f6bc/internal/util/comparisons.js#L416-L439
function findLooseMatchingPrimitives(prim) {
  if (typeof prim === 'undefined') {
    return null;
  }
  if (typeof prim === 'object') { // Only pass in null as object!
    return void 0;
  }
  if (typeof prim === 'symbol') {
    return false;
  }
  if (typeof prim === 'string' || typeof prim === 'number') {
    // Loose equal entries exist only if the string is possible to convert to a regular number and not NaN.
    return +prim === +prim; // eslint-disable-line no-implicit-coercion
  }
  return true;
}

// taken from https://github.com/browserify/commonjs-assert/blob/bba838e9ba9e28edf3127ce6974624208502f6bc/internal/util/comparisons.js#L449-L460
function mapMightHaveLoosePrim(a, b, prim, item, opts, channel) {
  var altValue = findLooseMatchingPrimitives(prim);
  if (altValue != null) {
    return altValue;
  }
  var curB = $mapGet(b, altValue);
  var looseOpts = assign({}, opts, { strict: false });
  if (
    (typeof curB === 'undefined' && !$mapHas(b, altValue))
    // eslint-disable-next-line no-use-before-define
    || !internalDeepEqual(item, curB, looseOpts, channel)
  ) {
    return false;
  }
  // eslint-disable-next-line no-use-before-define
  return !$mapHas(a, altValue) && internalDeepEqual(item, curB, looseOpts, channel);
}

// taken from https://github.com/browserify/commonjs-assert/blob/bba838e9ba9e28edf3127ce6974624208502f6bc/internal/util/comparisons.js#L441-L447
function setMightHaveLoosePrim(a, b, prim) {
  var altValue = findLooseMatchingPrimitives(prim);
  if (altValue != null) {
    return altValue;
  }

  return $setHas(b, altValue) && !$setHas(a, altValue);
}

// taken from https://github.com/browserify/commonjs-assert/blob/bba838e9ba9e28edf3127ce6974624208502f6bc/internal/util/comparisons.js#L518-L533
function mapHasEqualEntry(set, map, key1, item1, opts, channel) {
  var i = getIterator(set);
  var result;
  var key2;
  while ((result = i.next()) && !result.done) {
    key2 = result.value;
    if (
      // eslint-disable-next-line no-use-before-define
      internalDeepEqual(key1, key2, opts, channel)
      // eslint-disable-next-line no-use-before-define
      && internalDeepEqual(item1, $mapGet(map, key2), opts, channel)
    ) {
      $setDelete(set, key2);
      return true;
    }
  }

  return false;
}

function internalDeepEqual(actual, expected, options, channel) {
  var opts = options || {};

  // 7.1. All identical values are equivalent, as determined by ===.
  if (opts.strict ? is(actual, expected) : actual === expected) {
    return true;
  }

  var actualBoxed = whichBoxedPrimitive(actual);
  var expectedBoxed = whichBoxedPrimitive(expected);
  if (actualBoxed !== expectedBoxed) {
    return false;
  }

  // 7.3. Other pairs that do not both pass typeof value == 'object', equivalence is determined by ==.
  if (!actual || !expected || (typeof actual !== 'object' && typeof expected !== 'object')) {
    return opts.strict ? is(actual, expected) : actual == expected; // eslint-disable-line eqeqeq
  }

  /*
   * 7.4. For all other Object pairs, including Array objects, equivalence is
   * determined by having the same number of owned properties (as verified
   * with Object.prototype.hasOwnProperty.call), the same set of keys
   * (although not necessarily the same order), equivalent values for every
   * corresponding key, and an identical 'prototype' property. Note: this
   * accounts for both named and indexed properties on Arrays.
   */
  // see https://github.com/nodejs/node/commit/d3aafd02efd3a403d646a3044adcf14e63a88d32 for memos/channel inspiration

  var hasActual = channel.has(actual);
  var hasExpected = channel.has(expected);
  var sentinel;
  if (hasActual && hasExpected) {
    if (channel.get(actual) === channel.get(expected)) {
      return true;
    }
  } else {
    sentinel = {};
  }
  if (!hasActual) { channel.set(actual, sentinel); }
  if (!hasExpected) { channel.set(expected, sentinel); }

  // eslint-disable-next-line no-use-before-define
  return objEquiv(actual, expected, opts, channel);
}

function isBuffer(x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') {
    return false;
  }
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') {
    return false;
  }

  return !!(x.constructor && x.constructor.isBuffer && x.constructor.isBuffer(x));
}

function setEquiv(a, b, opts, channel) {
  if ($setSize(a) !== $setSize(b)) {
    return false;
  }
  var iA = getIterator(a);
  var iB = getIterator(b);
  var resultA;
  var resultB;
  var set;
  while ((resultA = iA.next()) && !resultA.done) {
    if (resultA.value && typeof resultA.value === 'object') {
      if (!set) { set = new $Set(); }
      $setAdd(set, resultA.value);
    } else if (!$setHas(b, resultA.value)) {
      if (opts.strict) { return false; }
      if (!setMightHaveLoosePrim(a, b, resultA.value)) {
        return false;
      }
      if (!set) { set = new $Set(); }
      $setAdd(set, resultA.value);
    }
  }
  if (set) {
    while ((resultB = iB.next()) && !resultB.done) {
      // We have to check if a primitive value is already matching and only if it's not, go hunting for it.
      if (resultB.value && typeof resultB.value === 'object') {
        if (!setHasEqualElement(set, resultB.value, opts.strict, channel)) {
          return false;
        }
      } else if (
        !opts.strict
        && !$setHas(a, resultB.value)
        && !setHasEqualElement(set, resultB.value, opts.strict, channel)
      ) {
        return false;
      }
    }
    return $setSize(set) === 0;
  }
  return true;
}

function mapEquiv(a, b, opts, channel) {
  if ($mapSize(a) !== $mapSize(b)) {
    return false;
  }
  var iA = getIterator(a);
  var iB = getIterator(b);
  var resultA;
  var resultB;
  var set;
  var key;
  var item1;
  var item2;
  while ((resultA = iA.next()) && !resultA.done) {
    key = resultA.value[0];
    item1 = resultA.value[1];
    if (key && typeof key === 'object') {
      if (!set) { set = new $Set(); }
      $setAdd(set, key);
    } else {
      item2 = $mapGet(b, key);
      if ((typeof item2 === 'undefined' && !$mapHas(b, key)) || !internalDeepEqual(item1, item2, opts, channel)) {
        if (opts.strict) {
          return false;
        }
        if (!mapMightHaveLoosePrim(a, b, key, item1, opts, channel)) {
          return false;
        }
        if (!set) { set = new $Set(); }
        $setAdd(set, key);
      }
    }
  }

  if (set) {
    while ((resultB = iB.next()) && !resultB.done) {
      key = resultB.value[0];
      item2 = resultB.value[1];
      if (key && typeof key === 'object') {
        if (!mapHasEqualEntry(set, a, key, item2, opts, channel)) {
          return false;
        }
      } else if (
        !opts.strict
        && (!a.has(key) || !internalDeepEqual($mapGet(a, key), item2, opts, channel))
        && !mapHasEqualEntry(set, a, key, item2, assign({}, opts, { strict: false }), channel)
      ) {
        return false;
      }
    }
    return $setSize(set) === 0;
  }
  return true;
}

function objEquiv(a, b, opts, channel) {
  /* eslint max-statements: [2, 100], max-lines-per-function: [2, 120], max-depth: [2, 5], max-lines: [2, 400] */
  var i, key;

  if (typeof a !== typeof b) { return false; }
  if (a == null || b == null) { return false; }

  if ($objToString(a) !== $objToString(b)) { return false; }

  if (isArguments(a) !== isArguments(b)) { return false; }

  var aIsArray = isArray(a);
  var bIsArray = isArray(b);
  if (aIsArray !== bIsArray) { return false; }

  // TODO: replace when a cross-realm brand check is available
  var aIsError = a instanceof Error;
  var bIsError = b instanceof Error;
  if (aIsError !== bIsError) { return false; }
  if (aIsError || bIsError) {
    if (a.name !== b.name || a.message !== b.message) { return false; }
  }

  var aIsRegex = isRegex(a);
  var bIsRegex = isRegex(b);
  if (aIsRegex !== bIsRegex) { return false; }
  if ((aIsRegex || bIsRegex) && (a.source !== b.source || flags(a) !== flags(b))) {
    return false;
  }

  var aIsDate = isDate(a);
  var bIsDate = isDate(b);
  if (aIsDate !== bIsDate) { return false; }
  if (aIsDate || bIsDate) { // && would work too, because both are true or both false here
    if ($getTime(a) !== $getTime(b)) { return false; }
  }
  if (opts.strict && gPO && gPO(a) !== gPO(b)) { return false; }

  var aWhich = whichTypedArray(a);
  var bWhich = whichTypedArray(b);
  if ((aWhich || bWhich) && aWhich !== bWhich) {
    return false;
  }

  var aIsBuffer = isBuffer(a);
  var bIsBuffer = isBuffer(b);
  if (aIsBuffer !== bIsBuffer) { return false; }
  if (aIsBuffer || bIsBuffer) { // && would work too, because both are true or both false here
    if (a.length !== b.length) { return false; }
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) { return false; }
    }
    return true;
  }

  var aIsArrayBuffer = isArrayBuffer(a);
  var bIsArrayBuffer = isArrayBuffer(b);
  if (aIsArrayBuffer !== bIsArrayBuffer) { return false; }
  if (aIsArrayBuffer || bIsArrayBuffer) { // && would work too, because both are true or both false here
    if (byteLength(a) !== byteLength(b)) { return false; }
    return typeof Uint8Array === 'function' && internalDeepEqual(new Uint8Array(a), new Uint8Array(b), opts, channel);
  }

  var aIsSAB = isSharedArrayBuffer(a);
  var bIsSAB = isSharedArrayBuffer(b);
  if (aIsSAB !== bIsSAB) { return false; }
  if (aIsSAB || bIsSAB) { // && would work too, because both are true or both false here
    if (sabByteLength(a) !== sabByteLength(b)) { return false; }
    return typeof Uint8Array === 'function' && internalDeepEqual(new Uint8Array(a), new Uint8Array(b), opts, channel);
  }

  if (typeof a !== typeof b) { return false; }

  var ka = objectKeys(a);
  var kb = objectKeys(b);
  // having the same number of owned properties (keys incorporates hasOwnProperty)
  if (ka.length !== kb.length) { return false; }

  // the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  // ~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i]) { return false; } // eslint-disable-line eqeqeq
  }

  // equivalent values for every corresponding key, and ~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!internalDeepEqual(a[key], b[key], opts, channel)) { return false; }
  }

  var aCollection = whichCollection(a);
  var bCollection = whichCollection(b);
  if (aCollection !== bCollection) {
    return false;
  }
  if (aCollection === 'Set' || bCollection === 'Set') { // aCollection === bCollection
    return setEquiv(a, b, opts, channel);
  }
  if (aCollection === 'Map') { // aCollection === bCollection
    return mapEquiv(a, b, opts, channel);
  }

  return true;
}

var deepEqual = function deepEqual(a, b, opts) {
  return internalDeepEqual(a, b, opts, getSideChannel());
};

Object.defineProperty(elementRoleMap$1, "__esModule", {
  value: true
});
elementRoleMap$1.default = void 0;
var _deepEqual = _interopRequireDefault$2(deepEqual);
var _iterationDecorator$1 = _interopRequireDefault$2(iterationDecorator$1);
var _rolesMap$2 = _interopRequireDefault$2(rolesMap$1);
function _interopRequireDefault$2(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _slicedToArray$1(arr, i) { return _arrayWithHoles$1(arr) || _iterableToArrayLimit$1(arr, i) || _unsupportedIterableToArray$1(arr, i) || _nonIterableRest$1(); }
function _nonIterableRest$1() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit$1(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles$1(arr) { if (Array.isArray(arr)) return arr; }
function _createForOfIteratorHelper$1(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$1(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray$1(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$1(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen); }
function _arrayLikeToArray$1(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
var elementRoles$1 = [];
var keys$1 = _rolesMap$2.default.keys();
for (var i$1 = 0; i$1 < keys$1.length; i$1++) {
  var key = keys$1[i$1];
  var role = _rolesMap$2.default.get(key);
  if (role) {
    var concepts = [].concat(role.baseConcepts, role.relatedConcepts);
    for (var k = 0; k < concepts.length; k++) {
      var relation = concepts[k];
      if (relation.module === 'HTML') {
        var concept = relation.concept;
        if (concept) {
          (function () {
            var conceptStr = JSON.stringify(concept);
            var elementRoleRelation = elementRoles$1.find(function (relation) {
              return JSON.stringify(relation[0]) === conceptStr;
            });
            var roles = void 0;
            if (elementRoleRelation) {
              roles = elementRoleRelation[1];
            } else {
              roles = [];
            }
            var isUnique = true;
            for (var _i = 0; _i < roles.length; _i++) {
              if (roles[_i] === key) {
                isUnique = false;
                break;
              }
            }
            if (isUnique) {
              roles.push(key);
            }
            elementRoles$1.push([concept, roles]);
          })();
        }
      }
    }
  }
}
var elementRoleMap = {
  entries: function entries() {
    return elementRoles$1;
  },
  forEach: function forEach(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var _iterator = _createForOfIteratorHelper$1(elementRoles$1),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _step$value = _slicedToArray$1(_step.value, 2),
          _key = _step$value[0],
          values = _step$value[1];
        fn.call(thisArg, values, _key, elementRoles$1);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  },
  get: function get(key) {
    var item = elementRoles$1.find(function (tuple) {
      return (0, _deepEqual.default)(key, tuple[0]);
    });
    return item && item[1];
  },
  has: function has(key) {
    return !!elementRoleMap.get(key);
  },
  keys: function keys() {
    return elementRoles$1.map(function (_ref) {
      var _ref2 = _slicedToArray$1(_ref, 1),
        key = _ref2[0];
      return key;
    });
  },
  values: function values() {
    return elementRoles$1.map(function (_ref3) {
      var _ref4 = _slicedToArray$1(_ref3, 2),
        values = _ref4[1];
      return values;
    });
  }
};
var _default$1 = (0, _iterationDecorator$1.default)(elementRoleMap, elementRoleMap.entries());
elementRoleMap$1.default = _default$1;

var roleElementMap$1 = {};

Object.defineProperty(roleElementMap$1, "__esModule", {
  value: true
});
roleElementMap$1.default = void 0;
var _iterationDecorator = _interopRequireDefault$1(iterationDecorator$1);
var _rolesMap$1 = _interopRequireDefault$1(rolesMap$1);
function _interopRequireDefault$1(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
var roleElement = [];
var keys = _rolesMap$1.default.keys();
var _loop = function _loop(i) {
  var key = keys[i];
  var role = _rolesMap$1.default.get(key);
  if (role) {
    var concepts = [].concat(role.baseConcepts, role.relatedConcepts);
    for (var k = 0; k < concepts.length; k++) {
      var relation = concepts[k];
      if (relation.module === 'HTML') {
        var concept = relation.concept;
        if (concept) {
          var roleElementRelation = roleElement.find(function (item) {
            return item[0] === key;
          });
          var relationConcepts = void 0;
          if (roleElementRelation) {
            relationConcepts = roleElementRelation[1];
          } else {
            relationConcepts = [];
          }
          relationConcepts.push(concept);
          roleElement.push([key, relationConcepts]);
        }
      }
    }
  }
};
for (var i = 0; i < keys.length; i++) {
  _loop(i);
}
var roleElementMap = {
  entries: function entries() {
    return roleElement;
  },
  forEach: function forEach(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var _iterator = _createForOfIteratorHelper(roleElement),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _step$value = _slicedToArray(_step.value, 2),
          key = _step$value[0],
          values = _step$value[1];
        fn.call(thisArg, values, key, roleElement);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  },
  get: function get(key) {
    var item = roleElement.find(function (tuple) {
      return tuple[0] === key ? true : false;
    });
    return item && item[1];
  },
  has: function has(key) {
    return !!roleElementMap.get(key);
  },
  keys: function keys() {
    return roleElement.map(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 1),
        key = _ref2[0];
      return key;
    });
  },
  values: function values() {
    return roleElement.map(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2),
        values = _ref4[1];
      return values;
    });
  }
};
var _default = (0, _iterationDecorator.default)(roleElementMap, roleElementMap.entries());
roleElementMap$1.default = _default;

Object.defineProperty(lib, "__esModule", {
  value: true
});
lib.roles = lib.roleElements = lib.elementRoles = lib.dom = lib.aria = void 0;
var _ariaPropsMap = _interopRequireDefault(ariaPropsMap$1);
var _domMap = _interopRequireDefault(domMap$1);
var _rolesMap = _interopRequireDefault(rolesMap$1);
var _elementRoleMap = _interopRequireDefault(elementRoleMap$1);
var _roleElementMap = _interopRequireDefault(roleElementMap$1);
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var aria = _ariaPropsMap.default;
lib.aria = aria;
var dom = _domMap.default;
lib.dom = dom;
var roles = _rolesMap.default;
lib.roles = roles;
var elementRoles = _elementRoleMap.default;
lib.elementRoles = elementRoles;
var roleElements = _roleElementMap.default;
lib.roleElements = roleElements;

Object.defineProperty(toBeChecked$1, "__esModule", {
  value: true
});
toBeChecked$1.toBeChecked = toBeChecked;

var _ariaQuery = lib;

var _utils$3 = utils;

function toBeChecked(element) {
  (0, _utils$3.checkHtmlElement)(element, toBeChecked, this);

  const isValidInput = () => {
    return element.tagName.toLowerCase() === 'input' && ['checkbox', 'radio'].includes(element.type);
  };

  const isValidAriaElement = () => {
    return roleSupportsChecked(element.getAttribute('role')) && ['true', 'false'].includes(element.getAttribute('aria-checked'));
  };

  if (!isValidInput() && !isValidAriaElement()) {
    return {
      pass: false,
      message: () => `only inputs with type="checkbox" or type="radio" or elements with ${supportedRolesSentence()} and a valid aria-checked attribute can be used with .toBeChecked(). Use .toHaveValue() instead`
    };
  }

  const isChecked = () => {
    if (isValidInput()) return element.checked;
    return element.getAttribute('aria-checked') === 'true';
  };

  return {
    pass: isChecked(),
    message: () => {
      const is = isChecked() ? 'is' : 'is not';
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toBeChecked`, 'element', ''), '', `Received element ${is} checked:`, `  ${this.utils.printReceived(element.cloneNode(false))}`].join('\n');
    }
  };
}

function supportedRolesSentence() {
  return (0, _utils$3.toSentence)(supportedRoles().map(role => `role="${role}"`), {
    lastWordConnector: ' or '
  });
}

function supportedRoles() {
  return _ariaQuery.roles.keys().filter(roleSupportsChecked);
}

function roleSupportsChecked(role) {
  var _roles$get;

  return ((_roles$get = _ariaQuery.roles.get(role)) == null ? void 0 : _roles$get.props['aria-checked']) !== undefined;
}

var toBePartiallyChecked$1 = {};

Object.defineProperty(toBePartiallyChecked$1, "__esModule", {
  value: true
});
toBePartiallyChecked$1.toBePartiallyChecked = toBePartiallyChecked;

var _utils$2 = utils;

function toBePartiallyChecked(element) {
  (0, _utils$2.checkHtmlElement)(element, toBePartiallyChecked, this);

  const isValidInput = () => {
    return element.tagName.toLowerCase() === 'input' && element.type === 'checkbox';
  };

  const isValidAriaElement = () => {
    return element.getAttribute('role') === 'checkbox';
  };

  if (!isValidInput() && !isValidAriaElement()) {
    return {
      pass: false,
      message: () => 'only inputs with type="checkbox" or elements with role="checkbox" and a valid aria-checked attribute can be used with .toBePartiallyChecked(). Use .toHaveValue() instead'
    };
  }

  const isPartiallyChecked = () => {
    const isAriaMixed = element.getAttribute('aria-checked') === 'mixed';

    if (isValidInput()) {
      return element.indeterminate || isAriaMixed;
    }

    return isAriaMixed;
  };

  return {
    pass: isPartiallyChecked(),
    message: () => {
      const is = isPartiallyChecked() ? 'is' : 'is not';
      return [this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toBePartiallyChecked`, 'element', ''), '', `Received element ${is} partially checked:`, `  ${this.utils.printReceived(element.cloneNode(false))}`].join('\n');
    }
  };
}

var toHaveDescription$1 = {};

Object.defineProperty(toHaveDescription$1, "__esModule", {
  value: true
});
toHaveDescription$1.toHaveDescription = toHaveDescription;

var _utils$1 = utils;

// See algoritm: https://www.w3.org/TR/accname-1.1/#mapping_additional_nd_description
function toHaveDescription(htmlElement, checkWith) {
  (0, _utils$1.deprecate)('toHaveDescription', 'Please use toHaveAccessibleDescription.');
  (0, _utils$1.checkHtmlElement)(htmlElement, toHaveDescription, this);
  const expectsDescription = checkWith !== undefined;
  const descriptionIDRaw = htmlElement.getAttribute('aria-describedby') || '';
  const descriptionIDs = descriptionIDRaw.split(/\s+/).filter(Boolean);
  let description = '';

  if (descriptionIDs.length > 0) {
    const document = htmlElement.ownerDocument;
    const descriptionEls = descriptionIDs.map(descriptionID => document.getElementById(descriptionID)).filter(Boolean);
    description = (0, _utils$1.normalize)(descriptionEls.map(el => el.textContent).join(' '));
  }

  return {
    pass: expectsDescription ? checkWith instanceof RegExp ? checkWith.test(description) : this.equals(description, checkWith) : Boolean(description),
    message: () => {
      const to = this.isNot ? 'not to' : 'to';
      return (0, _utils$1.getMessage)(this, this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toHaveDescription`, 'element', ''), `Expected the element ${to} have description`, this.utils.printExpected(checkWith), 'Received', this.utils.printReceived(description));
    }
  };
}

var toHaveErrormessage = {};

Object.defineProperty(toHaveErrormessage, "__esModule", {
  value: true
});
toHaveErrormessage.toHaveErrorMessage = toHaveErrorMessage;

var _utils = utils;

// See aria-errormessage spec https://www.w3.org/TR/wai-aria-1.2/#aria-errormessage
function toHaveErrorMessage(htmlElement, checkWith) {
  (0, _utils.checkHtmlElement)(htmlElement, toHaveErrorMessage, this);

  if (!htmlElement.hasAttribute('aria-invalid') || htmlElement.getAttribute('aria-invalid') === 'false') {
    const not = this.isNot ? '.not' : '';
    return {
      pass: false,
      message: () => {
        return (0, _utils.getMessage)(this, this.utils.matcherHint(`${not}.toHaveErrorMessage`, 'element', ''), `Expected the element to have invalid state indicated by`, 'aria-invalid="true"', 'Received', htmlElement.hasAttribute('aria-invalid') ? `aria-invalid="${htmlElement.getAttribute('aria-invalid')}"` : this.utils.printReceived(''));
      }
    };
  }

  const expectsErrorMessage = checkWith !== undefined;
  const errormessageIDRaw = htmlElement.getAttribute('aria-errormessage') || '';
  const errormessageIDs = errormessageIDRaw.split(/\s+/).filter(Boolean);
  let errormessage = '';

  if (errormessageIDs.length > 0) {
    const document = htmlElement.ownerDocument;
    const errormessageEls = errormessageIDs.map(errormessageID => document.getElementById(errormessageID)).filter(Boolean);
    errormessage = (0, _utils.normalize)(errormessageEls.map(el => el.textContent).join(' '));
  }

  return {
    pass: expectsErrorMessage ? checkWith instanceof RegExp ? checkWith.test(errormessage) : this.equals(errormessage, checkWith) : Boolean(errormessage),
    message: () => {
      const to = this.isNot ? 'not to' : 'to';
      return (0, _utils.getMessage)(this, this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toHaveErrorMessage`, 'element', ''), `Expected the element ${to} have error message`, this.utils.printExpected(checkWith), 'Received', this.utils.printReceived(errormessage));
    }
  };
}

(function (exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	Object.defineProperty(exports, "toBeChecked", {
	  enumerable: true,
	  get: function () {
	    return _toBeChecked.toBeChecked;
	  }
	});
	Object.defineProperty(exports, "toBeDisabled", {
	  enumerable: true,
	  get: function () {
	    return _toBeDisabled.toBeDisabled;
	  }
	});
	Object.defineProperty(exports, "toBeEmpty", {
	  enumerable: true,
	  get: function () {
	    return _toBeEmpty.toBeEmpty;
	  }
	});
	Object.defineProperty(exports, "toBeEmptyDOMElement", {
	  enumerable: true,
	  get: function () {
	    return _toBeEmptyDomElement.toBeEmptyDOMElement;
	  }
	});
	Object.defineProperty(exports, "toBeEnabled", {
	  enumerable: true,
	  get: function () {
	    return _toBeDisabled.toBeEnabled;
	  }
	});
	Object.defineProperty(exports, "toBeInTheDOM", {
	  enumerable: true,
	  get: function () {
	    return _toBeInTheDom.toBeInTheDOM;
	  }
	});
	Object.defineProperty(exports, "toBeInTheDocument", {
	  enumerable: true,
	  get: function () {
	    return _toBeInTheDocument.toBeInTheDocument;
	  }
	});
	Object.defineProperty(exports, "toBeInvalid", {
	  enumerable: true,
	  get: function () {
	    return _toBeInvalid.toBeInvalid;
	  }
	});
	Object.defineProperty(exports, "toBePartiallyChecked", {
	  enumerable: true,
	  get: function () {
	    return _toBePartiallyChecked.toBePartiallyChecked;
	  }
	});
	Object.defineProperty(exports, "toBeRequired", {
	  enumerable: true,
	  get: function () {
	    return _toBeRequired.toBeRequired;
	  }
	});
	Object.defineProperty(exports, "toBeValid", {
	  enumerable: true,
	  get: function () {
	    return _toBeInvalid.toBeValid;
	  }
	});
	Object.defineProperty(exports, "toBeVisible", {
	  enumerable: true,
	  get: function () {
	    return _toBeVisible.toBeVisible;
	  }
	});
	Object.defineProperty(exports, "toContainElement", {
	  enumerable: true,
	  get: function () {
	    return _toContainElement.toContainElement;
	  }
	});
	Object.defineProperty(exports, "toContainHTML", {
	  enumerable: true,
	  get: function () {
	    return _toContainHtml.toContainHTML;
	  }
	});
	Object.defineProperty(exports, "toHaveAccessibleDescription", {
	  enumerable: true,
	  get: function () {
	    return _toHaveAccessibleDescription.toHaveAccessibleDescription;
	  }
	});
	Object.defineProperty(exports, "toHaveAccessibleName", {
	  enumerable: true,
	  get: function () {
	    return _toHaveAccessibleName.toHaveAccessibleName;
	  }
	});
	Object.defineProperty(exports, "toHaveAttribute", {
	  enumerable: true,
	  get: function () {
	    return _toHaveAttribute.toHaveAttribute;
	  }
	});
	Object.defineProperty(exports, "toHaveClass", {
	  enumerable: true,
	  get: function () {
	    return _toHaveClass.toHaveClass;
	  }
	});
	Object.defineProperty(exports, "toHaveDescription", {
	  enumerable: true,
	  get: function () {
	    return _toHaveDescription.toHaveDescription;
	  }
	});
	Object.defineProperty(exports, "toHaveDisplayValue", {
	  enumerable: true,
	  get: function () {
	    return _toHaveDisplayValue.toHaveDisplayValue;
	  }
	});
	Object.defineProperty(exports, "toHaveErrorMessage", {
	  enumerable: true,
	  get: function () {
	    return _toHaveErrormessage.toHaveErrorMessage;
	  }
	});
	Object.defineProperty(exports, "toHaveFocus", {
	  enumerable: true,
	  get: function () {
	    return _toHaveFocus.toHaveFocus;
	  }
	});
	Object.defineProperty(exports, "toHaveFormValues", {
	  enumerable: true,
	  get: function () {
	    return _toHaveFormValues.toHaveFormValues;
	  }
	});
	Object.defineProperty(exports, "toHaveStyle", {
	  enumerable: true,
	  get: function () {
	    return _toHaveStyle.toHaveStyle;
	  }
	});
	Object.defineProperty(exports, "toHaveTextContent", {
	  enumerable: true,
	  get: function () {
	    return _toHaveTextContent.toHaveTextContent;
	  }
	});
	Object.defineProperty(exports, "toHaveValue", {
	  enumerable: true,
	  get: function () {
	    return _toHaveValue.toHaveValue;
	  }
	});

	var _toBeInTheDom = toBeInTheDom;

	var _toBeInTheDocument = toBeInTheDocument$1;

	var _toBeEmpty = toBeEmpty$1;

	var _toBeEmptyDomElement = toBeEmptyDomElement;

	var _toContainElement = toContainElement$1;

	var _toContainHtml = toContainHtml;

	var _toHaveTextContent = toHaveTextContent$1;

	var _toHaveAccessibleDescription = toHaveAccessibleDescription$1;

	var _toHaveAccessibleName = toHaveAccessibleName$1;

	var _toHaveAttribute = toHaveAttribute$1;

	var _toHaveClass = toHaveClass$1;

	var _toHaveStyle = toHaveStyle$1;

	var _toHaveFocus = toHaveFocus$1;

	var _toHaveFormValues = toHaveFormValues$1;

	var _toBeVisible = toBeVisible$1;

	var _toBeDisabled = toBeDisabled$1;

	var _toBeRequired = toBeRequired$1;

	var _toBeInvalid = toBeInvalid$1;

	var _toHaveValue = toHaveValue$1;

	var _toHaveDisplayValue = toHaveDisplayValue$1;

	var _toBeChecked = toBeChecked$1;

	var _toBePartiallyChecked = toBePartiallyChecked$1;

	var _toHaveDescription = toHaveDescription$1;

	var _toHaveErrormessage = toHaveErrormessage;
} (matchers));

var extensions = _interopRequireWildcard(matchers);

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

expect.extend(extensions);

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
