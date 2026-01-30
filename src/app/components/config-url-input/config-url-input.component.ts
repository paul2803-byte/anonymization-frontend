import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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

    private http = inject(HttpClient);

    constructor() { }

    onValueChange(newValue: string) {
        this.value = newValue;
        this.valueChange.emit(newValue);
    }

    createNewConfig() {
        window.open('https://soya.ownyourdata.eu/#/', '_blank');
    }

    async viewConfig() {
        if (this.value) {
            const yamlUrl = this.value.endsWith('/')
                ? this.value + 'yaml'
                : this.value + '/yaml';

            let urlToOpen = this.value;

            try {
                // Check if the /yaml endpoint returns a successful response
                await this.http.head(yamlUrl, { observe: 'response' }).toPromise();
                // If successful (2xx), use the yaml URL
                urlToOpen = yamlUrl;
            } catch (error) {
                // If the request fails (non-2xx or network error), use the original URL
                urlToOpen = this.value;
            }

            if (confirm(`Are you sure you want to open this configuration URL?\n\n${urlToOpen}`)) {
                window.open(urlToOpen, '_blank');
            }
        }
    }
}
