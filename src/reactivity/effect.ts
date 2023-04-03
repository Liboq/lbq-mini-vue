const effectStack: any = [];
let activeEffect;
/* 
相当于watch 监听 函数中元素是否为reactive 如果为reactive  元素变动则引起函数执行
*/
export const effect = (fn, options: any = {}) => {
  const effectFn = () => {
    try {
      activeEffect = effectFn;
      effectStack.push(activeEffect);
      return fn();
    } finally {
      effectStack.pop()
      if(effectStack.length-1>0){
      activeEffect = effectStack[effectStack.length-1]

      }else{
        activeEffect = null
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
export const track = (target, key) => {
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
export const trigger = (target, key) => {
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
    } else {
      effectFn();
    }
  });
};
