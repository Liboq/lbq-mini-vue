import { isNativeTag, isVoidTag } from '.';
import { NodeTypes, createRoot, ElementTypes } from './ast';
import { camelize } from '../utils/index';
export const parse = (content)=>{
const context  = createParseContext(content)
const children = parseChildren(context)
return createRoot(children)
}
export const createParseContext = (content)=>{
    return {
        options:{
            delimiters: ["{{","}}"],
            isVoidTag,
            isNativeTag
        },
        source:content
    }
}
const parseChildren = (context)=>{
    const nodes:any =[]
    // 判断是否是</开头
    while(!isEnd(context)){
        const s = context.source
        let node ;
        if(s.startsWith(context.options.delimiters[0])){
            node = parseInterpolation(context)
        }else if(s[0] === '<'){
            node = parseElement(context)
        }else{
            node = parseText(context)
        }
        nodes.push(node)
    }
    let removedWhitespaces = false
    for(let i =0;i<nodes.length;i++){
        const node = nodes[i]
        if(node.type === NodeTypes.TEXT){
            // 区分文本节点是否全为空白
            if(/[^\t\r\f\n ]/.test(node.content)){
                // 文本节点的一些字符
                node.content = node.content.replace(/[\t\r\f\n ]+/g, " ")
            }else{
                const prev = nodes[i-1]
                const next = nodes[i+1]
                if(!prev||!next||(prev.type === NodeTypes.ELEMENT && next.type === NodeTypes.ELEMENT&&/[\r\n]/.test(node.content))){
                    // 删除空白节点
                    removedWhitespaces = true
                    nodes[i] = null

                }else{
                    node.content = " "
                }
            }
        }
    }
    return removedWhitespaces ? nodes.filter(Boolean):nodes
}
export const parseText = (context)=>{
    const endTokens = ["<",context.options.delimiters[0]]
    let endIndex = context.source.length;
    for(let i = 0;i<endTokens.length;i++){
        let index =context.source.indexOf(endTokens[i])
        if(index !== -1&& index<endIndex){
            endIndex = index
        }
    }
    const content = parseTextData(context,endIndex)
    return {
        type:NodeTypes.TEXT,
        content
    }
}
export const parseTextData = (context,length)=>{
    const text = context.source.slice(0,length)
    advanceBy(context,length)
    return text
}
const parseInterpolation = (context)=>{
    const [open,close] = context.options.delimiters
    advanceBy(context,open.length)

    const closeIndex = context.source.indexOf(close)
    const content = parseTextData(context,closeIndex).trim()
    advanceBy(context,close.length)
    return {
        type:NodeTypes.INTERPOLATION,
        content:{
            type:NodeTypes.SIMPLE_EXPRESSION,
            content,
            isStatic:false
        }
    }

}
const parseElement= (context)=>{
    // start
    const element = parseTag(context)
    if(element.isSelfClosing || context.options.isVoidTag(element.tag)){
        return element
    }
    // parseChildren
    element.children = parseChildren(context)
    // end tag
    parseTag(context)
    return element

}
const parseTag = (context)=>{
    const match:any =  /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)
    const tag = match[1]

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
    tag, // 标签名,
    tagType, // 是组件还是原生元素,
    props, // 属性节点数组,
    directives, // 指令数组
    isSelfClosing, // 是否是自闭合标签,
    children: [],
  };
}

function isComponent(tag, context) {
  return !context.options.isNativeTag(tag);
}

function parseAttributes(context) {
  const props:any = [];
  const directives :any = [];
  while (
    context.source.length &&
    !context.source.startsWith('>') &&
    !context.source.startsWith('/>')
  ) {
    let attr = parseAttribute(context);
    if (attr.type === NodeTypes.DIRECTIVE) {
      directives.push(attr);
    } else {
      props.push(attr);
    }
  }
  return { props, directives };
}

function parseAttribute(context) {
  const match :any= /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
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
    } else if (name[0] === '@') {
      dirName = 'on';
      argContent = name.slice(1);
    } else if (name.startsWith('v-')) {
      [dirName, argContent] = name.slice(2).split(':');
    }

    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
      }, // 表达式节点
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

const parseAttributeValue= (context)=> {
  const quote = context.source[0];
  advanceBy(context, 1);

  const endIndex = context.source.indexOf(quote);

  const content = parseTextData(context, endIndex);

  advanceBy(context, 1);

  return { content };
}

const advanceSpaces = (context) => {
    const match = /^[\t\r\n\f ]+/.exec(context.source);
    if (match) {
      advanceBy(context, match[0].length);
    }
  }
const isEnd = (context)=>{
    const s = context.source
    return s.startsWith('</') || !s
}
const advanceBy = (context,numberOfCharacters)=>{
    context.source = context.source.slice(numberOfCharacters);
}