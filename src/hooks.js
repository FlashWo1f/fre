import { scheduleWork, getCurrentFiber } from './reconciler'
let cursor = 0
let oldInputs = []
let isMounted

function update (key, reducer, value) {
  const current = this ? this : getCurrentFiber()
  value = reducer ? reducer(current.state[key], value) : value
  current.state[key] = value
  scheduleWork(current)
}
export function resetCursor () {
  cursor = 0
}
export function useState (initState) {
  return useReducer(null, initState)
}
export function useReducer (reducer, initState) {
  let current = getCurrentFiber()
  let key = '$' + cursor
  let setter = update.bind(current, key, reducer)
  if (!current) {
    return [initState, setter]
  } else {
    cursor++
    let state = current.state || {}
    if (typeof state === 'object' && key in state) {
      return [state[key], setter]
    } else {
      current.state[key] = initState
    }
    return [initState, setter]
  }
}
export function useEffect (cb, inputs) {
  let current = getCurrentFiber()
  if (current) current.effect = useMemo(cb, inputs)
}

export function useMemo (cb, inputs) {
  return function () {
    let current = getCurrentFiber()
    if (current) {
      let hasChaged = inputs
        ? oldInputs.some((v, i) => inputs[i] !== v)
        : true
      if (inputs && !inputs.length && !isMounted) {
        // 空数组只执行一次
        hasChaged = true
        isMounted = true
      }
      if (hasChaged) cb()
      oldInputs = inputs
    }
  }
}

export function createContext (initContext = {}) {
  let context = initContext
  let setters = []
  const update = newContext => setters.forEach(fn => fn(newContext))

  const subscribe = fn => setters.push(fn)

  const unSubscribe = fn => (setters = setters.filter(f => f !== fn))

  return { context, update, subscribe, unSubscribe }
}

export function useContext (ctx) {
  const [context, setContext] = useState(ctx.context)

  ctx.subscribe(setContext)
  useEffect(() => ctx.unSubscribe(setContext))

  return [context, ctx.update]
}
