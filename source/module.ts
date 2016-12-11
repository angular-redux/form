import {Inject, NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {Connect} from './connect';
import {ConnectArray} from './connect-array';
import {FormStore} from './form-store';
import { NgRedux } from 'ng2-redux';

export function formStoreFactory(ngRedux: NgRedux<any>) {
  return new FormStore(ngRedux)
}

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [
    Connect,
    ConnectArray,
  ],
  exports: [
    Connect,
    ConnectArray,
  ],
  providers: [
    {
      provide: FormStore,
      useFactory: formStoreFactory,
      deps: [NgRedux],
    },
  ]
})
export class NgReduxForms {}

