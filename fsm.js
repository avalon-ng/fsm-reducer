(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function makeFSM(stateMap, actionMap, opts) {
        var _a = (opts || {}).validateMap, validateMap = _a === void 0 ? {} : _a;
        var initState = stateMap.start;
        var currentStatus = stateMap.start.status;
        var validateError = null;
        function getHandler(handles, handlerName) {
            var actionParts = handlerName.split('.');
            if (actionParts.length == 1) {
                return handles[handlerName];
            }
            return getHandler(handles[actionParts[0]], actionParts.slice(1).join('.'));
        }
        function transit(state, action) {
            var nextStatus = currentStatus;
            if (typeof action == 'function') {
                nextStatus = action(state);
            }
            else {
                nextStatus = action;
            }
            if (!stateMap.states[nextStatus]) {
                var msg = "cannot transit to status " + nextStatus + " from " + currentStatus;
                console.warn(msg);
                nextStatus = currentStatus;
            }
            return nextStatus;
        }
        var reducer = function (state, actionObj) {
            if (state === void 0) { state = initState; }
            var actionName = actionObj.type;
            if (!actionName) {
                return state;
            }
            var status = state.status, value = state.value;
            var availableActions = stateMap.states[status];
            if (!availableActions[actionName]) {
                var msg = "action " + actionName + " is not available for status " + status;
                console.warn(msg);
                return state;
            }
            var action = getHandler(actionMap, actionName);
            var validate = getHandler(validateMap, actionName);
            if (validate) {
                validateError = validate(value, actionObj);
                if (validateError) {
                    return state;
                }
            }
            // alow action to be no operation
            var nextValue = action(value, actionObj) || value;
            var nextStatus = transit(nextValue, availableActions[actionName]);
            currentStatus = nextStatus;
            return {
                status: nextStatus,
                value: nextValue,
            };
        };
        var getActions = function () {
            return Object.keys(stateMap.states[currentStatus]);
        };
        var getValidateError = function () {
            return validateError;
        };
        return {
            reducer: reducer,
            getActions: getActions,
            getValidateError: getValidateError
        };
    }
    exports.makeFSM = makeFSM;
    exports.default = makeFSM;
});
