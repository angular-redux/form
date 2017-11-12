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
      this.resetState(false);

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
        pairs.push({ path: path.concat([k]), control: formElement.controls[k] });
      }
    }
    else if (formElement instanceof NgControl || formElement instanceof FormControl) {
      return [{ path: path, control: <any>formElement }];
    }
    else {
      throw new Error(`Unknown type of form element: ${formElement.constructor.name}`);
    }

    return pairs.filter(p => (<any>p.control)._parent === this.form.control || (<any>p.control)._parent === this.form);
  }

  private resetState(emitEvent: boolean) {
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

      if (oldValueIsEmpty !== newValueIsEmpty && control.value !== value) {
        control.setValue(newValueIsEmpty ? '' : value, {emitEvent});
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
