import {
  AfterViewInit,
  Directive,
  Input,
  OnDestroy,
  OnInit,
  Optional
} from '@angular/core';

import {
  AbstractControl,
  FormArray,
  FormGroup,
  NgForm
} from '@angular/forms';

import {Subscription} from 'rxjs/Subscription';
import {ReplaySubject} from "rxjs/ReplaySubject";

import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/skipUntil';

import {FormStore} from '../form-store';
import {State} from '../state';

@Directive({selector: 'form[connect]'})
export class Connect implements OnInit, OnDestroy, AfterViewInit {

  @Input('connect') private readonly connect: () => (string | number) | Array<string | number>;
  @Input('connectDebounce') private readonly connectDebounce = 250;
  @Input('formGroup') private readonly formGroup: FormGroup;

  private subscription: Subscription = new Subscription();

  private form: FormGroup;

  private initialized = new ReplaySubject<boolean>();

  constructor(private store: FormStore,
              @Optional() private ngForm: NgForm) {
  }

  ngOnInit(): void {
    if (this.formGroup) {
      this.form = this.formGroup;
    } else if (this.ngForm) {
      this.form = this.ngForm.form;
    } else {
      console.error('Invalid connect configuration, no FormGroup found!');
    }
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

  get valuePath(): Array<string> {
    return [...this.path, 'value']
  }

  get validityPath(): Array<string> {
    return [...this.path, 'validity']
  }

  get statusPath(): Array<string> {
    return [...this.path, 'status']
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.subscription.add(
        this.form.valueChanges
          .skipUntil(this.initialized.asObservable())
          .debounceTime(this.connectDebounce)
          .map(() => this.form.getRawValue())
          .distinctUntilChanged((x: any, y: any) => Connect.deepEquals(x, y))
          .subscribe((v: any) => this.publishValueChange(v))
      );
      this.subscription.add(
        this.form.statusChanges
          .skipUntil(this.initialized.asObservable())
          .debounceTime(this.connectDebounce)
          .map(() => Connect.buildFormStatus(this.form))
          .distinctUntilChanged((x, y) => Connect.deepEquals(x, y))
          .subscribe((v) => this.publishStatusChange(v))
      );
      this.subscription.add(
        this.form.statusChanges
          .skipUntil(this.initialized.asObservable())
          .debounceTime(this.connectDebounce)
          .map(() => Connect.buildFormValidity(this.form))
          .distinctUntilChanged((x, y) => Connect.deepEquals(x, y))
          .subscribe((c) => this.publishValidityChange(c))
      );
      this.subscription.add(
        this.store.select(this.valuePath)
          .subscribe((value) => {
            if (!value) {
              // init the form if nothing is in store yet
              value = this.form.getRawValue();
              this.init(value);
            }
            this.form.setValue(value);
            if (!this.initialized.isStopped) {
              setTimeout(() => {
                this.initialized.next(true);
                this.initialized.complete();
              });
            }
          }));
    });
  }

  private init(value: any) {
    this.store.init(this.path, {
      value: value,
      status: Connect.buildFormStatus(this.form),
      validity: Connect.buildFormValidity(this.form)
    });
  }

  private publishValueChange(value: any) {
    this.store.valueChanged(this.valuePath, value);
  }

  private publishStatusChange(v: any) {
    this.store.statusChanged(this.statusPath, v);
  }

  private publishValidityChange(v: any) {
    this.store.validityChanged(this.validityPath, v);
  }

  private static buildFormValidity(control: AbstractControl) {
    let controls: any;
    if (control instanceof FormGroup) {
      const keys = Object.keys(control.controls);
      if (keys.length > 0) {
        controls = {};
        keys.forEach((key) => controls[key] = Connect.buildFormValidity(control.controls[key]));
      }
    }
    if (control instanceof FormArray) {
      controls = [];
      control.controls.forEach((c) => controls.push(Connect.buildFormValidity(c)));
    }
    return {
      valid: control.valid,
      invalid: control.invalid,
      errors: control.errors,
      controls
    };
  }

  private static buildFormStatus(control: AbstractControl) {
    let controls: any;
    if (control instanceof FormGroup) {
      const keys = Object.keys(control.controls);
      if (keys.length > 0) {
        controls = {};
        keys.forEach((key) => controls[key] = Connect.buildFormStatus(control.controls[key]));
      }
    }
    if (control instanceof FormArray) {
      controls = [];
      control.controls.forEach((c) => controls.push(Connect.buildFormStatus(c)));
    }
    return {
      touched: control.touched,
      untouched: control.untouched,
      pristine: control.pristine,
      dirty: control.dirty,
      pending: control.pending,
      enabled: control.enabled,
      disabled: control.disabled,
      controls
    };
  }

  private static deepEquals(x: any, y: any): boolean {
    if (x === y) {
      return true; // if both x and y are null or undefined and exactly the same
    } else if (!(x instanceof Object) || !(y instanceof Object)) {
      return false; // if they are not strictly equal, they both need to be Objects
    } else if (x.constructor !== y.constructor) {
      // they must have the exact same prototype chain, the closest we can do is
      // test their constructor.
      return false;
    } else {
      for (const p in x) {
        if (!x.hasOwnProperty(p)) {
          continue; // other properties were tested using x.constructor === y.constructor
        }
        if (!y.hasOwnProperty(p)) {
          return false; // allows to compare x[ p ] and y[ p ] when set to undefined
        }
        if (x[p] === y[p]) {
          continue; // if they have the same strict value or identity then they are equal
        }
        if (typeof (x[p]) !== 'object') {
          return false; // Numbers, Strings, Functions, Booleans must be strictly equal
        }
        if (!this.deepEquals(x[p], y[p])) {
          return false;
        }
      }
      for (const p in y) {
        if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
          return false;
        }
      }
      return true;
    }
  }
}
