export const isObject = (target) => {
  return typeof target === "object" && target !== null;
};
export const hasChanged = (oldValue, value) => {
  return value !== oldValue && !(Number.isNaN(oldValue) && Number.isNaN(value));
};
export const isFunction = (value)=>{
    return typeof value ==="function"
}
export const isArray = (value)=>{
   return  Array.isArray(value)
}
