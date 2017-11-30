import { Input } from '@angular/core';

import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormArray,
  NgControl,
} from '@angular/forms';

import { Subscription } from 'rxjs';

import { Unsubscribe } from 'redux';

import 'rxjs/add/operator/debounceTime';

import { FormStore } from '../form-store';
import { State } from '../state';

export interface ControlPair {
  path: Array<string>;
  control: AbstractControl;
}

export class ConnectBase {

  @Input('connect') connect: () => (string | number) | Array<string | number>;
  @Input('debounce') debounce: number;
  private stateSubscription: Unsubscribe;

  private formSubscription: Subscription;
  protected store: FormStore;
  protected form: any;
  protected get changeDebounce(): number {
    return 'number' === typeof this.debounce || ('string' === typeof this.debounce && String(this.debounce).match(/^[0-9]+(\.[0-9]+)?$/)) ? Number(this.debounce) : 0;
  }

  public get path(): Array<string> {
    const path = typeof this.connect === 'function'
      ? this.connect()
      : this.connect;

    switch (typeof path) {
      case 'object':
        if (State.empty(path)) {
          return [];
        }
        if (Array.isArray(path)) {
          return <Array<string>>path;
        }
      case 'string':
        return (<string>path).split(/\./g);
      default: // fallthrough above (no break)
        throw new Error(`Cannot determine path to object: ${JSON.stringify(path)}`);
    }
  }

  ngOnDestroy() {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }

    if (typeof this.stateSubscription === 'function') {
      this.stateSubscription(); // unsubscribe
    }
  }

  ngAfterContentInit() {
    Promise.resolve().then(() => {
      // This is the first "change" of the form (setting initial values from the store) and thus should not emit a "changed" event
      this.resetState(false);

      // Any further changes on the state are due to application flow (e.g. user interaction triggering state changes) and thus have to trigger "changed" events
      this.stateSubscription = this.store.subscribe(() => this.resetState(true));

      Promise.resolve().then(() => {
        this.formSubscription = (<any>this.form.valueChanges)
          .debounceTime(this.changeDebounce)
          .subscribe((values: any) => this.publish(values));
      });
    });
  }

  private descendants(path: Array<string>, formElement: any): Array<ControlPair> {
    const pairs = new Array<ControlPair>();

    if (formElement instanceof FormArray) {
      formElement.controls.forEach((c, index) => {
        for (const d of this.descendants((<any>path).concat([index]), c)) {
          pairs.push(d);
        }
      })
    }
    else if (formElement instanceof FormGroup) {
      for (const k of Object.keys(formElement.controls)) {
        // If the control is a FormGroup or FormArray get the descendants of the the control instead of the control itself to always patch fields, not groups/arrays
        if(formElement.controls[k] instanceof FormArray || formElement.controls[k] instanceof FormGroup) {
          pairs.push(...this.descendants(path.concat([k]), formElement.controls[k]));
        }
        else {
          pairs.push({ path: path.concat([k]), control: formElement.controls[k] });
        }
      }
    }
    else if (formElement instanceof NgControl || formElement instanceof FormControl) {
      return [{ path: path, control: <any>formElement }];
    }
    else {
      throw new Error(`Unknown type of form element: ${formElement.constructor.name}`);
    }

    return pairs;
  }

  private resetState(emitEvent: boolean = true) {
    emitEvent = !!emitEvent ? true : false;
    
    var formElement;
    
    if (this.form.control === undefined) {
      formElement = this.form;
    }
    else {
      formElement = this.form.control;
    }

    const children = this.descendants([], formElement);

    children.forEach(c => {
      const { path, control } = c;

      const value                    = State.get(this.getState(), this.path.concat(path));
      const newValueIsEmpty: boolean = 'undefined' === typeof value || null === value || ('string' === typeof value && '' === value);
      const oldValueIsEmpty: boolean = 'undefined' === typeof control.value || null === control.value || ('string' === typeof control.value && '' === control.value);

      // patchValue() should only be called upon "real changes", meaning "null" and "undefined" should be treated equal to "" (empty string)
      // newValueIsEmpty: true,  oldValueIsEmpty: true  => no change
      // newValueIsEmpty: true,  oldValueIsEmpty: false => change
      // newValueIsEmpty: false, oldValueIsEmpty: true  => change
      // newValueIsEmpty: false, oldValueIsEmpty: false =>
      //                        control.value === value => no change
      //                        control.value !== value => change
      if (oldValueIsEmpty !== newValueIsEmpty || (!oldValueIsEmpty && !newValueIsEmpty && control.value !== value)) {
        control.patchValue(newValueIsEmpty ? '' : value, {emitEvent});
      }
    });
  }

  private publish(value: any) {
    this.store.valueChanged(this.path, this.form, value);
  }

  private getState() {
    return this.store.getState();
  }
}
