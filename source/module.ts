import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {NgRedux} from '@angular-redux/store';

import {ConnectReactiveDirective} from './connect-reactive';
import {ConnectTemplateDirective} from './connect-template';
import {ConnectArray} from './connect-array';
import {FormStore} from './form-store';

export function formStoreFactory(ngRedux: NgRedux<any>) {
  return new FormStore(ngRedux);
}

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [
    ConnectTemplateDirective,
    ConnectReactiveDirective,
    ConnectArray,
  ],
  exports: [
    ConnectTemplateDirective,
    ConnectReactiveDirective,
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
export class NgReduxFormModule {}
