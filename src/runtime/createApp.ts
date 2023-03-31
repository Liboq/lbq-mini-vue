import { isString, camelize, capitalize } from '../utils/index';
import { render } from './render';
import { h } from './vnode';
let components;
export const createApp = (rootComponent)=>{
    components = rootComponent.components || {}
    const app = {
        mount(rootContainer){
            if(isString(rootComponent)){
                rootComponent = document.querySelector(rootComponent)

            }
            if(!rootComponent.render && !rootComponent.template){
                rootComponent.template = rootComponent.innerHTML
            }
            rootComponent.innerHTML = ""

            render(h(rootComponent,null,''),rootContainer)
        }
    }
    return app;
}
export const resolveComponent = (name)=>{
    return (components && (components[name] || components[camelize(name)]) || components[capitalize(name)])
}