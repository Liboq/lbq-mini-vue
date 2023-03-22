/*
 * @Author: Liboq 99778162+Liboq@users.noreply.github.com
 * @Date: 2023-03-20 09:57:02
 * @LastEditors: Liboq 99778162+Liboq@users.noreply.github.com
 * @LastEditTime: 2023-03-21 17:32:53
 */
import { isString, isNumber, isArray } from "../utils/index";
export const ShapeFlags = {
  ELEMENT: 1,
  TEXT: 1 << 1,
  FRAGMENT: 1 << 2,
  COMPONENT: 1 << 3,
  TEXT_CHILDREN: 1 << 4,
  ARRAY_CHILDREN: 1 << 5,
  CHILDREN: (1 << 4) | (1 << 5),
};
export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");

/**
 * @description:
 * @param {String | Object | Text | Fragement } type
 * @param {Object | null} props
 * @param {String | Array | Object | null} children
 * @return vnode
 */
export const h = (type, props, children) => {
  let shapeFlag = 0;
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT;
  } else if (type === Text) {
    shapeFlag = ShapeFlags.TEXT;
  } else if (type === Fragment) {
    shapeFlag = ShapeFlags.FRAGMENT;
  } else {
    shapeFlag = ShapeFlags.COMPONENT;
  }
  if (isString(children) || isNumber(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    children = children.toString();
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }
  return {
    type,
    props,
    children,
    shapeFlag,
    el:null,
    anchor:null
  };
};
