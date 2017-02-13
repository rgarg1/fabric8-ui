import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule, Http } from '@angular/http';
import { DataTableModule } from 'angular2-datatable';

import { StackDetailsComponent } from './stack-details.component';
import { ModalModule } from 'ngx-modal';

import { StackRecoModule } from '../stack-recommendation/module';
import
  { ContainerTogglerModule }
from '../../../shared-component/container-toggler/container-toggler.module';

@NgModule({
  imports: [CommonModule,
            ContainerTogglerModule,
            DataTableModule,
            HttpModule,
            ModalModule,
            StackRecoModule],
  declarations: [ StackDetailsComponent ],
  exports: [ StackDetailsComponent ]
})
export class StackDetailsModule {
  constructor(http: Http) {}
}