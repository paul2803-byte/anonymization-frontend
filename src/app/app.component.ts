import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JsonLdFormComponent } from './components/json-ld-form/json-ld-form.component';
import { FlatJsonFormComponent } from './components/flat-json-form/flat-json-form.component';

import { FurtherInfoComponent } from './components/further-info/further-info.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, JsonLdFormComponent, FlatJsonFormComponent, FurtherInfoComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  activeTab: 'json-ld' | 'flat-json' = 'json-ld';

  setActiveTab(tab: 'json-ld' | 'flat-json'): void {
    this.activeTab = tab;
  }
}
