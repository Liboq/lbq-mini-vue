/*
 * @Date: 2023-03-20 13:33:18
 * @LastEditors: Liboq 
 * @LastEditTime: 2023-03-20 13:42:51
 */
import { h } from "../vnode"

it('runtime',()=>{
    const vnode = h('div',{
        class:'a b',
        style:{
            border:'1px solid',
            fontSize: '14px'
        },
        onClick:()=>console.log('click'),
        id:'foo',
        checked:'',
        custom:false
    },[
        h('ul',null,[
            h('li',{style:{color:'red'}},1),
            h('li',null,2),
            h('li',{style:{color:'blue'}},3),
            h('Fragment',null,[
            h('li',null,null),
            ]),
            h('li',{style:{color:'red'}},1),
        ])
    ])
    console.log(vnode);
    
})