import { isObject } from "../../utils";
import { reactive } from '../reactive';
import { effect } from '../effect';
import { ref } from '../ref';
import { computed } from '../computed';



it("isObject",()=>{
    expect(isObject({})).toBe(true);
    // expect(true).toBe(true)
})
it("reactive",()=>{
    const obj1 = reactive({
        age:10
    })
    expect(obj1.age).toBe(10)
})
it("effect",()=>{
   
    const obj1 = reactive({
        age:10
    })

    let age

    effect(()=>{
        age = obj1.age + 1
    })
    // update
    obj1.age++
    // expect(obj1.age).toBe(11)
    expect(age).toBe(12)
})
it('ref',()=>{
    const val = ref(10)
    val.value++
    expect(val.value).toBe(11)
})
it('computed',()=>{
    const obj1 = reactive({
        age:10
    })
    const val = computed(()=>{
        console.log(obj1);
        
        return obj1.age +1
    })
    obj1.age++
    
    expect(val.value).toBe(12)
})