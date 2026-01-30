import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AnonymizationService, FlatJsonRequest } from '../../services/anonymization.service';
import { ConfigUrlInputComponent } from '../config-url-input/config-url-input.component';

@Component({
  selector: 'app-flat-json-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfigUrlInputComponent],
  templateUrl: './flat-json-form.component.html',
  styleUrls: ['./flat-json-form.component.css']
})
export class FlatJsonFormComponent {
  @Output() resultChange = new EventEmitter<string>();

  configurationUrl = '';
  prefix = '';
  jsonData = '';
  calculateKpi = true;
  includeOriginalData = false;
  useAdjustedAttributes = true;
  isLoading = false;
  error = '';
  result = '';

  selectedExample: any = null;

  examples = [
    {
      label: 'Simple flat JSON example',
      file: 'examples/example_flat_1.json'
    },
    {
      label: 'Flat JSON based on multiple objects',
      file: 'examples/example_flat_2.json'
    },
    {
      label: 'Flat JSON for address anonymization',
      file: 'examples/example_flat_3.json'
    }
  ];

  constructor(
    private anonymizationService: AnonymizationService,
    private http: HttpClient
  ) { }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.jsonData = reader.result as string;
        this.selectedExample = null; // Clear selection when file uploaded
      };
      reader.readAsText(file);
    }
  }

  onExampleChange(): void {
    if (this.selectedExample) {
      this.selectExample(this.selectedExample);
    }
  }

  revert(): void {
    this.configurationUrl = '';
    this.prefix = '';
    this.jsonData = '';
    this.calculateKpi = true;
    this.includeOriginalData = false;
    this.useAdjustedAttributes = true;
    this.selectedExample = null;
    this.result = '';
    this.error = '';
  }

  selectExample(example: any): void {
    this.http.get(example.file).subscribe({
      next: (data: any) => {
        this.processExampleData(data);
      },
      error: (err) => {
        console.error('Error loading example', err);
        this.error = 'Failed to load example data';
      }
    });
  }

  private processExampleData(fullExample: any): void {
    if (fullExample.configurationUrl) {
      this.configurationUrl = fullExample.configurationUrl;
    }

    if (fullExample.prefix) {
      this.prefix = fullExample.prefix;
    }

    if (fullExample.data) {
      this.jsonData = JSON.stringify(fullExample.data, null, 2);
    } else {
      // Fallback if structure is different
      this.jsonData = JSON.stringify(fullExample, null, 2);
    }

    if (fullExample.includeOriginalData !== undefined) {
      this.includeOriginalData = fullExample.includeOriginalData;
    }
    if (fullExample.useAdjustedAttributes !== undefined) {
      this.useAdjustedAttributes = fullExample.useAdjustedAttributes;
    } else {
      this.useAdjustedAttributes = true;
    }
    this.calculateKpi = true;
  }

  async anonymize(): Promise<void> {
    if (!this.configurationUrl || !this.prefix || !this.jsonData) {
      this.error = 'Please provide Configuration URL, Prefix, and JSON data';
      return;
    }

    if (!this.useAdjustedAttributes && this.includeOriginalData) {
      this.error = 'Invalid combination: "Use Suffix" must be enabled when "Include Original Data" is enabled';
      return;
    }

    let parsedData: any[];
    try {
      parsedData = JSON.parse(this.jsonData);
      if (!Array.isArray(parsedData)) {
        this.error = 'Flat JSON data must be an array';
        return;
      }
    } catch (e) {
      this.error = 'Invalid JSON format';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.result = '';

    const request: FlatJsonRequest = {
      configurationUrl: this.configurationUrl,
      prefix: this.prefix,
      data: parsedData,
      calculateKpi: this.calculateKpi,
      includeOriginalData: this.includeOriginalData,
      useAdjustedAttributes: this.useAdjustedAttributes
    };

    this.anonymizationService.anonymizeFlatJson(request).subscribe({
      next: (response) => {
        this.result = JSON.stringify(response, null, 2);
        this.resultChange.emit(this.result);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.message || err.message || 'An error occurred';
        this.isLoading = false;
      }
    });
  }

  downloadResult(): void {
    const blob = new Blob([this.result], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'anonymization-result.json';
    link.click();
    URL.revokeObjectURL(url);
  }
}
