const queue :any = []
let isFlushing = false
const resolvePromise = Promise.resolve()
let currentFlushPromise:any = null
export const queueJob = (job)=>{
    if(!queue.length&& !queue.includes(job)){
        queue.push(job)
        queueFlush()
    }
}
const queueFlush = ()=>{
    if(!isFlushing){
        isFlushing = true
        currentFlushPromise = resolvePromise.then(flushJobs)
    }
}
const flushJobs = ()=>{
    try {
        for(let i = 0;i<queue.length;i++){
            const job = queue[i]
            job()
        }
    } catch (error) {
        isFlushing = false
        queue.lengh = 0
        currentFlushPromise = null
    }
}
export const nextTick = (fn)=>{
    const p = currentFlushPromise || resolvePromise;
    return fn ? p.then(): p
}