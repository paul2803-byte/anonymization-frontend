import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-config-url-input',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './config-url-input.component.html',
    styleUrls: ['./config-url-input.component.css']
})
export class ConfigUrlInputComponent {
    @Input() value: string = '';
    @Output() valueChange = new EventEmitter<string>();

    constructor() { }

    onValueChange(newValue: string) {
        this.value = newValue;
        this.valueChange.emit(newValue);
    }

    createNewConfig() {
        window.open('https://soya.ownyourdata.eu/#/', '_blank');
    }

    viewConfig() {
        if (this.value) {
            if (confirm('Are you sure you want to open this configuration URL?')) {
                window.open(this.value, '_blank');
            }
        }
    }
}
