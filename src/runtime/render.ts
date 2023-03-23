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
    patch(prevVNode, vnode, container, null);
  }
  container._vnode = vnode;
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
export const patch = (n1, n2, container, anchor) => {
  if (n1 && !isSameNode(n1, n2)) {
    anchor = (n1.anchor || n1.el).nextSibling;
    unmount(n1);
    n1 = null;
  }
  const { shapeFlag } = n2;
  if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponent(n1, n2, container, anchor);
  } else if (shapeFlag & ShapeFlags.TEXT) {
    processText(n1, n2, container, anchor);
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    processFragment(n1, n2, container, anchor);
  } else {
    processElement(n1, n2, container, anchor);
  }
};

export const processComponent = (n1, n2, container, anchor) => {};

export const unmountComponent = (vnode) => {};

export const processFragment = (n1, n2, container, anchor) => {
  const fragmentStartAnchor = n1 ? n1.el : document.createTextNode("");
  const fragmentEndAnchor = n2.anchor ? n2.anchor : document.createTextNode("");
  if (n1) {
    patchChildren(n1, n2, container, anchor);
  } else {
    container.insertBefore(fragmentStartAnchor, anchor);
    container.insertBefore(fragmentEndAnchor, anchor);
    mountChildren(n2.children, container, fragmentEndAnchor);
  }
};
export const unmountFragment = (vnode) => {
  let { el: cur, anchor: end } = vnode;
  const { prarentNode } = cur;
  while (cur !== end) {
    const next = cur.nextSibling;
    prarentNode.removeChild(cur);
    cur = next;
  }
};
export const processText = (n1, n2, container, anchor) => {
  if (n1) {
    n2.el = n1.el;
    n1.el.textContent = n2.children;
  } else {
    mountTextNode(n2, container, anchor);
  }
};
export const processElement = (n1, n2, container, anchor) => {
  if (n1) {
    patchElement(n1, n2, anchor);
  } else {
    mountElement(n2, container, anchor);
  }
};
export const patchElement = (n1, n2, anchor) => {
  n2.el = n1.el;
  patchProps(n1.props, n2.props, n2.el);
  patchChildren(n1, n2, n2.el, anchor);
};
export const unmountChildren = (children) => {
  children.forEach((child) => {
    unmount(child);
  });
};
// react 的differ算法
export const pathchkeyedArrayChildren2 = (c1, c2, container, anchor) => {
  const map = new Map();
  c1.forEach((prev, j) => {
    map.set(prev.key, { prev, j });
  });
  // maxNewIndexSoFar 如果从旧数组中找到的位置小于naxNewIndexSoFar,则判断它是上升趋势，不需要移动此元素位置 用来判断是否需要移动新的元素
  let maxNewIndexSoFar = 0;
  for (let i = 0; i < c2.lenght; i++) {
    const next = c2[i];
    const curAnchor = i === 0 ? c1[0].el : c2[i].el.nextSibling;
    if (map.has(next.key)) {
      const { prev, j } = map.get(next.key);
      patch(prev, next, container, curAnchor);
      if (j < maxNewIndexSoFar) {
        // insertBefore 若第二个参数为null，则相当于appendChild
        container.insertBefore(next.el, curAnchor);
      } else {
        maxNewIndexSoFar = j;
      }
      map.delete(next.key);
    } else {
      patch(null, next, container, curAnchor);
    }
  }
  map.forEach(({ prev }) => {
    unmount(prev);
  });
};
// vue3 的diff算法
export const pathchkeyedArrayChildren = (c1, c2, container, anchor) => {
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
  } else if (i > e2) {
    // 若是 c1，c2中旧节点对比完成，则只剩下c1中旧节点，则剩下的全部unMount
    for (let j = i; j < e1; j++) {
      unmount(e1[j]);
    }
  } else {
    //  若都不满足前面的，则采取传统的differ算法，只是不真的对其进行移动和添加，而是将其删除和标记起来
    const map = new Map();
    for(let j =i;j<e1;j++){
      const prev = c1[j]
      map.set(prev.key,{prev,j})
    }
    // maxNewIndexSoFar 如果从旧数组中找到的位置小于naxNewIndexSoFar,则判断它是上升趋势，不需要移动此元素位置 用来判断是否需要移动新的元素
    let maxNewIndexSoFar = 0;
    let move = false;
    let source = new Array(e2 - i + 1).fill(-1);
    let toMounted: any = [];
    for (let k = 0; k < source.length; k++) {
      const next = c2[k+i];
      if (map.has(next.key)) {
        const { prev, j } = map.get(next.key);
        patch(prev, next, container, anchor);
        if (j < maxNewIndexSoFar) {
          move = true;
        } else {
          maxNewIndexSoFar = j;
        }
        source[k] = j;
        map.delete(next.key);
      } else {
        toMounted.push(k + i);
      }
    }
    map.forEach(({ prev }) => {
      unmount(prev);
    });
    if (move) {
      // 获取最长递增子序列，-1表示新增
      const seq = getSequence(source);
      let j = seq.length - 1;
      for (let k = source.length - 1; k > 0; k--) {
        if (seq[j] === k) {
          // 不用移动
          j--;
        } else {
          const pos = k + i;
          const nextPos = pos + 1;
          const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor;
          if (source[k] === -1) {
            // mount
            patch(null, c2[pos], container, curAnchor);
          } else {
            // 移动
            container.insertBefore(c2[pos].el, curAnchor);
          }
        }
      }
    } else if (toMounted.length) {
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
export const getSequence = (source) => {
  return [];
};

// const nums = [5,6,1,3,8,9,4]
// 复杂度过高 O(n^2)
const lengthOfLTS = (nums) => {
  const deps = new Array(nums.length).fill(1);
  let max = 1;
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[i] > nums[j]) {
        deps[i] = Math.max(deps[i], deps[j] + 1);
      }
    }
    max = Math.max(max, deps[i]);
  }
  return max;
};

// 二分查找法
// 这里用一个position 把 元素 放到某个位置 存起来 然后 和arr中数组进行比较 
const goodLengthOfLTS = (nums) => {
  if (nums.length === 0) {
    return 0;
  }
  const arr = [nums[0]];
  const position =[0]
  for (let i = 1; i < nums.length; i++) {
    if(nums[i] === -1){
      continue
    }
    if (nums[i] > arr[arr.length - 1]) {
      arr.push(nums[i]);
      position.push(arr.length-1)
    } else {
      let l = 0;
      let r = arr.length - 1;
      while (l <= r) {
        let mid = Math.floor((1 + r) / 2);
        if (nums[i] > arr[mid]) {
          l = mid + 1;
        } else if (nums[i] < arr[mid]) {
          r = mid - 1;
        } else {
          l = mid;
          break;
        }
      }
      arr[l] = nums[i];
      position.push(l)
    }
  }
  let cur = arr.length-1
  for(let i = position.length-1;i>=0&&cur>=0;i--){
    if(position[i] === cur){
      arr[cur--] = i
    }
  }
  return arr;
};

export const pathchUnkeyedArrayChildren = (c1, c2, container, anchor) => {
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
export const patchChildren = (n1, n2, container, anchor) => {
  const { shapeFlag: shapeFlagPrev, children: c1 } = n1;
  const { shapeFlag, children: c2 } = n2;
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    if (shapeFlagPrev & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(c1);
    }
    if (c1 !== c2) {
      container.textContent = c2;
    }
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    if (shapeFlagPrev & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = "";
      mountChildren(c2, container, anchor);
    } else if (shapeFlagPrev & ShapeFlags.ARRAY_CHILDREN) {
      if (c1[0 && c1[0].key != null && c2[0] && c2[0].key != null]) {
        pathchkeyedArrayChildren(c1, c2, container, anchor);
      } else {
        pathchUnkeyedArrayChildren(c1, c2, container, anchor);
      }
    } else {
      mountChildren(c2, container, anchor);
    }
  } else {
    if (shapeFlagPrev & ShapeFlags.TEXT_CHILDREN) {
      container.textContent = "";
    } else if (shapeFlagPrev & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(c1);
    }
  }
};
export const isSameNode = (n1, n2) => {
  return n1.type === n2.type;
};
export const mountTextNode = (vnode, container, anchor) => {
  const textNode = document.createTextNode(vnode.children);
  // container.appendChild(textNode);
  container.insertBefore(textNode, anchor);
  vnode.el = textNode;
};
export const mountFragment = (vnode, container, anchor) => {
  mountChildren(vnode, container, anchor);
};
export const mountChildren = (children, container, anchor) => {
  children.forEach((child) => {
    patch(null, child, container, anchor);
  });
};
export const mountElement = (vnode, container, anchor) => {
  const { shapeFlag, props, type, children } = vnode;
  const el = document.createElement(type);
  mountProps(props, el);
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    mountTextNode(vnode, el, anchor);
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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
