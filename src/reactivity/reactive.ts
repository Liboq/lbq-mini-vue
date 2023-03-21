/*
 * @Author: Liboq 99778162+Liboq@users.noreply.github.com
 * @Date: 2023-03-16 09:43:51
 * @LastEditors: Liboq 99778162+Liboq@users.noreply.github.com
 * @LastEditTime: 2023-03-20 16:28:40
 * @FilePath: \pikachu-mini-vue\src\reactivity\reactive.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { hasChanged, isArray, isObject } from "../utils/index";
import { track, trigger } from "./effect";

const proxyMap = new WeakMap();
/* 
通过 proxy 监听 对象的存取
*/ 
export const reactive = (target) => {
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
        if(isArray(target)&&hasChanged(oldLength,target.length)){
            trigger(target,length)
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
