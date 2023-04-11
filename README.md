
[up 主的仓库](https://github.com/leaon4/mini-vue)
[我的仓库](https://github.com/Liboq/lbq-mini-vue)

# 环境搭建

## day01(2023-03-15)

jest 单元测试
拉取依赖 环境搭建 ts jest
yarn init -y
yarn add --dev jest
yarn add typescript --dev
npx tsc init
typescript 文件配置
types：["jest"]
babel 依赖，允许 es6 出现
yarn add --dev babel-jest @babel/core @babel/preset-env
yarn add --dev @babel/preset-typescript
babel 配置
module.exports = {
presets: [
['@babel/preset-env', {targets: {node: 'current'}}],
'@babel/preset-typescript',
],
};
了解虚拟 dom 的种类
Element
![image.png](https://cdn.nlark.com/yuque/0/2023/png/32577971/1679390415978-3ac4f325-e285-4696-ac88-e4d3b1d95a6d.png#averageHue=%23d8fdfc&clientId=u7545749e-f074-4&from=paste&height=222&id=u90409902&name=image.png&originHeight=222&originWidth=1121&originalType=binary&ratio=1&rotation=0&showTitle=false&size=25841&status=done&style=none&taskId=u16f8e387-99f2-4b8e-9530-040f774e585&title=&width=1121)
Text
![image.png](https://cdn.nlark.com/yuque/0/2023/png/32577971/1679390446368-e8c65c0a-717a-4837-be22-b8893ac92fad.png#averageHue=%23cef1ce&clientId=u7545749e-f074-4&from=paste&height=244&id=u2259714b&name=image.png&originHeight=244&originWidth=1107&originalType=binary&ratio=1&rotation=0&showTitle=false&size=22053&status=done&style=none&taskId=ubbc1e196-8d0e-46d8-8ee7-378bb1052b7&title=&width=1107)
Fragment
![image.png](https://cdn.nlark.com/yuque/0/2023/png/32577971/1679390463525-7a9db1e2-39cd-46c5-be18-55239bd3f31d.png#averageHue=%23c3e9c8&clientId=u7545749e-f074-4&from=paste&height=235&id=ua7e9e59f&name=image.png&originHeight=235&originWidth=1099&originalType=binary&ratio=1&rotation=0&showTitle=false&size=25890&status=done&style=none&taskId=u7383b61a-c27a-4d75-83e3-c9ce6f939b5&title=&width=1099)
Component
![image.png](https://cdn.nlark.com/yuque/0/2023/png/32577971/1679390502762-25bba03c-0d39-4f39-ade7-767468d6addf.png#averageHue=%23f3f5f8&clientId=u7545749e-f074-4&from=paste&height=489&id=udf52e333&name=image.png&originHeight=489&originWidth=1032&originalType=binary&ratio=1&rotation=0&showTitle=false&size=48273&status=done&style=none&taskId=u8cf44675-84de-4f67-8366-c1cf1b1ae9a&title=&width=1032)

# reactive 的学习

## day02(2023-03-16)

ref,effect,computed,reactive
ref：通过 class 中 的 get set 属性监听类中 value 的变化
reactive:通过 proxy 监听数据的变化，当获取数据(get)的时候,Reflect.get 对数据进行获取
Reflect.set 对数据进行改变
computed: 也是通过 class 中的 get set 属性监听类中 value 中的变化，与 effect 不同点在于，computed 有缓存，只有当获取该数据（get）时才会执行 computed 中的方法
effect： track 方法对数据进行存储，当改变（set）数据时,trigger 方法触发对此数据存储的方法

# runtime 的学习

## day03(2023-03-20)

patch 包括：
patchText：文本比较
patchElement: 元素比较
patchChildren: 孩子比较
patchFragment：Fragement 节点比较
patchProps:属性比较
patchComponent:组件比较(暂无)

## day04(2023-03-22)

核心 differ 算法
react differ 算法

```typescript
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
```

![image.png](https://cdn.nlark.com/yuque/0/2023/png/32577971/1679539507833-413651be-1774-428e-8447-c7b815374d4e.png#averageHue=%23f9f9f8&clientId=uca08c979-3c10-4&from=paste&height=344&id=ue8af7127&name=image.png&originHeight=344&originWidth=936&originalType=binary&ratio=1&rotation=0&showTitle=false&size=50414&status=done&style=none&taskId=u83e7c41a-c231-4919-a4ec-6f8c2484df8&title=&width=936)

```typescript
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
    c1.forEach((prev, j) => {
      map.set(prev.key, { prev, j });
    });
    // maxNewIndexSoFar 如果从旧数组中找到的位置小于naxNewIndexSoFar,则判断它是上升趋势，不需要移动此元素位置 用来判断是否需要移动新的元素
    let maxNewIndexSoFar = 0;
    let move = false;
    let source = new Array(e2 - i + 1).fill(-1);
    let toMounted: any = [];
    for (let k = 0; k < c2.length; k++) {
      const next = c2[k];
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
      for (let k = toMounted.length; k < 0; k--) {
        const pos = toMounted[k];
        const nextPos = pos + 1;
        const curAnchor = (c2[nextPos] && c2[nextPos].el) || anchor;
        patch(null, c2[pos], container, curAnchor);
      }
    }
  }
};
```

最长子序列上升算法：就是一个数组中最长连续上升的部分

```typescript
// const nums = [5,6,1,3,8,9,4]
// 复杂度过高 O(n^2)，没有采用
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
  const arr = [nums[0]];
  const position = [0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === -1) {
      continue;
    }
    if (nums[i] > arr[arr.length - 1]) {
      arr.push(nums[i]);
      position.push(arr.length - 1);
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
```

# compile 的学习

![image.png](https://cdn.nlark.com/yuque/0/2023/png/32577971/1680514953512-788ba81d-d77a-4c8d-aa9b-b4c96ae8f51d.png#averageHue=%23fbfbf4&clientId=ufa5d5e51-f7cd-4&from=paste&height=293&id=ucc341e96&name=image.png&originHeight=293&originWidth=1111&originalType=binary&ratio=1&rotation=0&showTitle=false&size=56518&status=done&style=none&taskId=ua113410c-fff4-4929-95e1-7c1a311e8eb&title=&width=1111)

parse:
![image.png](https://cdn.nlark.com/yuque/0/2023/png/32577971/1680514842297-c6f367e6-8121-415d-853f-42bed9efd494.png#averageHue=%23282922&clientId=ufa5d5e51-f7cd-4&from=paste&height=757&id=u4e030f15&name=image.png&originHeight=757&originWidth=1011&originalType=binary&ratio=1&rotation=0&showTitle=false&size=61381&status=done&style=none&taskId=ucb2e91e6-5291-4282-a167-73af5bce9d7&title=&width=1011)
对图中的节点分别进行判断解析为 ast 抽象语法树
transform
codegen：
解析指令为代码

# test

用 up 主的测试用例对代码进行测试，测试过程发现很多问题，弄了好几天，没有完全解决问题，先留着了。
