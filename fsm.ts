interface FSMOption {
  validateMap?: object;
}

interface State<S> {
  status: S;
  value: object;
}

interface StateMap<A extends string> {
  start: {
    status: string;
    value: object;
  };
  states: {
    [status: string]: {
      [action in A]: any;
    }
  }
}

interface ActionMap<S> {
  [key: string]: (state: State<S>, ...args: any[]) => State<S>;
}

type MaybeError = Error | null
type Reducer<S> = (state: State<S>, action: ActionObject) => State<S>;
type GetActions<A> = () => A[];

interface ActionObject {
  type: string;
  [key: string]: any;
}

function makeFSM<
    S extends Extract<keyof StateMap<A>['states'], string>,
    AM extends ActionMap<S>,
    A extends Extract<keyof AM, string>>
    (stateMap: StateMap<A>, actionMap: AM, opts?: FSMOption): {
        reducer: Reducer<S>;
        getActions: GetActions<A>;
        getValidateError: () => MaybeError;
    } {

  const { validateMap = {} } = (opts || {});
  const initState: State<S> = stateMap.start as State<S>;
  let currentStatus: S = stateMap.start.status as S;
  let validateError: MaybeError = null;

  function getHandler(handles: object, handlerName: string): Function {
    const actionParts = handlerName.split('.');
    if(actionParts.length == 1) {
      return handles[handlerName];
    }
    return getHandler(handles[actionParts[0]], actionParts.slice(1).join('.'));
  }

  function transit(state: State<S>, action: Function): S;
  function transit(state: State<S>, action: S): S;
  function transit(state: State<S>, action: any): S {
    let nextStatus: S = currentStatus;
    if(typeof action == 'function') {
      nextStatus = action(state);
    } else {
      nextStatus = action;
    }
    if(!stateMap.states[nextStatus]) {
      const msg = `cannot transit to status ${nextStatus} from ${currentStatus}`;
      console.warn(msg);
      nextStatus = currentStatus;
    }
    return nextStatus;
  }

  let reducer: Reducer<S> = (state = initState, actionObj) => {

    const { type: actionName } = actionObj;

    if( !actionName ) {
      return state;
    }

    const { status, value } = state;

    const availableActions = stateMap.states[status];

    if(!availableActions[actionName]) {
      const msg = `action ${actionName} is not available for status ${status}`;
      console.warn(msg);
      return state;
    }


    const action = getHandler(actionMap, actionName);
    const validate: Function = getHandler(validateMap, actionName);

    if ( validate ) {
      validateError = validate(value, actionObj);
      if ( validateError ){
        return state;
      }
    }

    // alow action to be no operation
    const nextValue = action(value, actionObj) || value;
    const nextStatus = transit(nextValue, availableActions[actionName]);
    currentStatus = nextStatus;

    return {
      status: nextStatus,
      value: nextValue,
    };
  }

  const getActions: GetActions<A> = () => {
    return Object.keys(stateMap.states[currentStatus]) as A[];
  }

  const getValidateError = () => {
    return validateError;
  }

  return {
    reducer,
    getActions,
    getValidateError
  };
}

export { makeFSM };
export default makeFSM;

