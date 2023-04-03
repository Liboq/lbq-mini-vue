import { capitalize } from "../utils";
import { NodeTypes } from "./ast";

export const generate = (ast) => {
  const returns = traverseNode(ast);
  const code = `with(ctx){
        const {h,Text,Fragment,readerList,withModel,resloveComponent} = miniVue;
        return  ${returns}
    }`;
  return code;
};
export const traverseNode = (node, parent?) => {
  switch (node.type) {
    case NodeTypes.ROOT:
      if (node.children.length === 1) {
        return traverseNode(node.children[0], node);
      }
      let result:any = traverseChildren(node);
      // result = result.slice(1,-1)
      return result;
    case NodeTypes.ELEMENT:
      return resolveElementASTNode(node, parent);
    case NodeTypes.INTERPOLATION:
      return createTextVNode(node.content);
    case NodeTypes.TEXT:
      return createTextVNode(node);
  }
};
export const traverseChildren = (node) => {
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
  const results: any = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    results.push(traverseNode(child, node));
  }
  return `[${results.join(", ")}]`;
};
// 专门处理特殊指令
export const resolveElementASTNode = (node, parent) => {
  const ifNode =
    pluck(node.directives, "if") || pluck(node.directives, "else-if");
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
        if (
          pluck(sibling.directives, "else") ||
          pluck(sibling.directives, "else-if", false)
        ) {
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
    return `h(Fragment, null, renderList(${source.trim()}, ${args.trim()} => ${resolveElementASTNode(
      node,
      parent
    )}))`;
  }
  return createElementVNode(node);
};
export const createElementVNode = (node) => {
  const { children, tagType } = node;
  const tag =
    tagType === NodeTypes.ELEMENT
      ? `"${node.tag}"`
      : `resolveComponent("${node.tag}")`;
  const propArr: any = createPropArr(node);
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
export const createPropArr = (node) => {
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
export const createTextVNode = (node?) => {
  const child = createText(node);
  return `h(Text, null, ${child})`;
};
export const createText = ({ isStatic = true, content = "" } = {}) => {
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
