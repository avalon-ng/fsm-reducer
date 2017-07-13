
function makeFSMReducer(stateMap, actionMap, prefix = '') {

  const initState = {
    status: stateMap.start.status,
    value: stateMap.start.value,
  };
	
	let currentStatus = stateMap.start.status;

  function getAction(actions, actionName) {
    const actionParts = actionName.split('.');
    if(actionParts.length == 1) {
      return actions[actionName];
    }
    return getAction(actions[actionParts[0]], actionParts.slice(1).join('.'));
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
		
    const { type : actionName } = actionObj;
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
    const action = getAction(actionMap, actionName);
		
    // alow action to be no operation
    const nextValue = action(value, actionObj) || value;
    const nextStatus = transit(nextValue, availableActions[actionName]);
		currentStatus = nextStatus;
		
    return {
      status: nextStatus,
      value: nextValue,
    };
  }
	reducer.getActions = () => {
		return Object.keys(stateMap.states[currentStatus]);
	}
	return reducer;
}

module.exports = makeFSMReducer;