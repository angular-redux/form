import {Inject, NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

const {NgRedux} = require('ng2-redux');

import {Connect} from './connect';
import {ConnectArray} from './connect-array';
import {FormStore} from './form-store';

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
      useFactory: Inject(NgRedux)(ngRedux => new FormStore(ngRedux)),
      deps: [NgRedux],
    },
  ]
})
export class NgReduxForms {}

