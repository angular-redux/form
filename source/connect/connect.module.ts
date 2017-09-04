import { NgModule } from '@angular/core';

import { Connect } from './connect-base';
import {ConnectArrayFactory} from "./connect-array-factory";

const declarations = [Connect, ConnectArrayFactory];

@NgModule({
  declarations: [...declarations],
  exports: [...declarations],
})
export class NgReduxFormConnectModule {}
