import { generate } from './codegen';
import { parse } from './parse';
export const compile = (template)=>{
    const ast = parse(template)
    return generate(ast)
}