import { Reducer, Action } from 'redux';

export const composeReducers = <State>(
  ...reducers: Reducer<State>[]
): Reducer<State> => (s: State, action: Action) =>
  reducers.reduce((st, reducer) => {
    let r = reducer(st, action);
    console.log('r', r, 'st', st);
    return r;
  }, s);
