function makeFSM(stateMap, actionMap, opts = { }) {
  const { prefix = '', validateMap = {} } = opts; 
  const initState = {
    status: stateMap.start.status,
    value: stateMap.start.value,
  };
	
	let currentStatus = stateMap.start.status;
  let validateError = null;

  function getHandler(handles, handlerName) {
    const actionParts = handlerName.split('.');
    if(actionParts.length == 1) {
      return handles[handlerName];
    }
    return getHandler(handles[actionParts[0]], actionParts.slice(1).join('.'));
  }

  function transit(state, action) {
    let nextStatus = '';
    if(typeof action == 'function') {
      nextStatus = action(state);
    } else if(typeof action == 'string') {
      nextStatus = action;
    }
    if(!stateMap.states[nextStatus]) {
      const msg = `cannot transit to status ${nextStatus} from ${status}`;
      console.warn(msg);
      nextStatus = status;
    }
    return nextStatus;
  }

	let reducer = (state = initState, actionObj) => {
		
    const { type } = actionObj;
    const actionName = (type || '').replace(new RegExp('^' + prefix), '');
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
    const validate = getHandler(validateMap, actionName);

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

	const getActions = () => {
		return Object.keys(stateMap.states[currentStatus]);
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

module.exports = makeFSM;