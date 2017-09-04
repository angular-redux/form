import {Injectable} from '@angular/core';
import {
    NgRedux,
    Selector
} from '@angular-redux/store';
import {Action, Unsubscribe} from 'redux';
import {Observable} from 'rxjs/Observable';

export interface AbstractStore<RootState> {
  /// Dispatch an action
  dispatch(action: Action & {payload: any}): void;

  /// Retrieve the current application state
  getState(): RootState;

  /// Subscribe to changes in the store
  subscribe(fn: (state: RootState) => void): Unsubscribe;
}

export const INIT = '@@angular-redux/form/INIT';
export const VALUE_CHANGED = '@@angular-redux/form/VALUE_CHANGED';
export const VALIDITY_CHANGED = '@@angular-redux/form/VALIDITY_CHANGED';
export const STATUS_CHANGED = '@@angular-redux/form/STATUS_CHANGED';

@Injectable()
export class FormStore {
  /// NOTE(cbond): The declaration of store is misleading. This class is
  /// actually capable of taking a plain Redux store or an NgRedux instance.
  /// But in order to make the ng dependency injector work properly, we
  /// declare it as an NgRedux type, since the @angular-redux/store use case involves
  /// calling the constructor of this class manually (from configure.ts),
  /// where a plain store can be cast to an NgRedux. (For our purposes, they
  /// have almost identical shapes.)
  constructor(private store: NgRedux<any>) {}

  getState() {
    return this.store.getState();
  }

  subscribe(fn: (state: any) => void): Unsubscribe {
    return this.store.subscribe(() => fn(this.getState()));
  }

  select<T>(selector: Selector<any, T>): Observable<T> {
    return this.store.select(selector);
  }

  init(path: string[], value: any) {
    this.store.dispatch({
      type: INIT,
      payload: {
        path,
        value
      }
    });
  }

  valueChanged(path: string[], value: any) {
    this.store.dispatch({
      type: VALUE_CHANGED,
      payload: {
        path,
        value
      }
    });
  }

  validityChanged(path: string[], value: any) {
    this.store.dispatch({
      type: VALIDITY_CHANGED,
      payload: {
        path,
        value
      }
    });
  }

  statusChanged(path: string[], value: any) {
    this.store.dispatch({
      type: STATUS_CHANGED,
      payload: {
        path,
        value
      }
    });
  }
}
