import {Iterable} from 'immutable';

import {Action} from 'redux';

import {
  VALUE_CHANGED,
  VALIDITY_CHANGED,
  STATUS_CHANGED,
  INIT
} from './form-store';

import {State} from './state';

export const defaultFormReducer = <RootState>(initialState?: RootState | Iterable.Keyed<string, any>) => {
  const reducer = (state: RootState | Iterable.Keyed<string, any> | undefined = initialState, action: Action & {payload?: any}) => {
    switch (action.type) {
      case VALUE_CHANGED:
      case VALIDITY_CHANGED:
      case STATUS_CHANGED:
      case INIT:
        return State.assign(
          state,
          action.payload.path,
          action.payload.value);
      default:
        return state;
    }
  };
  return reducer;
};
