import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AnonymizationService, JsonLdRequest } from '../../services/anonymization.service';
import { ConfigUrlInputComponent } from '../config-url-input/config-url-input.component';
import { KpiDisplayComponent } from '../kpi-display/kpi-display.component';
import { MultiKpiData, extractAllKpis, filterDataEntries } from '../../utils/kpi-extractor.util';

@Component({
  selector: 'app-json-ld-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfigUrlInputComponent, KpiDisplayComponent],
  templateUrl: './json-ld-form.component.html',
  styleUrls: ['./json-ld-form.component.css']
})
export class JsonLdFormComponent {
  @Output() resultChange = new EventEmitter<string>();

  configurationUrl = '';
  jsonData = '';
  calculateKpi = true;
  includeOriginalData = false;
  useAdjustedAttributes = true;
  isLoading = false;
  error = '';
  result = '';

  // KPI data extracted from response
  kpiData: MultiKpiData[] | null = null;

  // Turtle format handling
  turtleResult = '';
  turtleError = '';
  showingTurtleFormat = false;
  isTurtleLoading = false;

  selectedExample: any = null;

  examples = [
    {
      label: 'Simple JSON-LD example',
      file: 'examples/example_json_ld_1.json'
    },
    {
      label: 'JSON-LD with two anonymization objects',
      file: 'examples/example_json_ld_2.json'
    },
    {
      label: 'JSON-LD of object anonymization (address)',
      file: 'examples/example_json_ld_3.json'
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
    this.jsonData = '';
    this.calculateKpi = true;
    this.includeOriginalData = false;
    this.kpiData = null;
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
    // Reset KPI to default
    this.calculateKpi = true;
  }

  async anonymize(): Promise<void> {
    if (!this.configurationUrl || !this.jsonData) {
      this.error = 'Please provide both Configuration URL and JSON-LD data';
      return;
    }

    if (!this.useAdjustedAttributes && this.includeOriginalData) {
      this.error = 'Invalid combination: "Use Suffix" must be enabled when "Include Original Data" is enabled';
      return;
    }

    let parsedData: object;
    try {
      parsedData = JSON.parse(this.jsonData);
    } catch (e) {
      this.error = 'Invalid JSON format';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.result = '';
    this.kpiData = null;
    this.turtleResult = '';
    this.turtleError = '';
    this.showingTurtleFormat = false;

    const request: JsonLdRequest = {
      configurationUrl: this.configurationUrl,
      data: parsedData,
      calculateKpi: this.calculateKpi,
      includeOriginalData: this.includeOriginalData,
      useAdjustedAttributes: this.useAdjustedAttributes
    };

    this.anonymizationService.anonymizeJsonLD(request).subscribe({
      next: (response) => {
        // Extract KPIs if calculateKpi was enabled
        if (this.calculateKpi) {
          this.kpiData = extractAllKpis(response);
        }

        // Store full response for display and download
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
    if (this.showingTurtleFormat && this.turtleResult) {
      const blob = new Blob([this.turtleResult], { type: 'text/turtle' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'anonymization-result.ttl';
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([this.result], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'anonymization-result.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  onFormatToggle(): void {
    // If switching to JSON-LD or turtle is already loaded, no need to fetch again
    if (!this.showingTurtleFormat || this.turtleResult) {
      return;
    }

    // Need to fetch turtle format
    if (!this.result) {
      this.turtleError = 'No JSON-LD result available to convert';
      this.showingTurtleFormat = false;
      return;
    }

    this.isTurtleLoading = true;
    this.turtleError = '';

    let jsonLdData: any;
    try {
      jsonLdData = JSON.parse(this.result);
      // Filter out KPI data to reduce payload size
      jsonLdData = filterDataEntries(jsonLdData);
    } catch (e) {
      this.turtleError = 'Invalid JSON-LD format';
      this.isTurtleLoading = false;
      this.showingTurtleFormat = false;
      return;
    }

    const canonicalUrl = '/soya-api/canonical';

    this.http.post(canonicalUrl, jsonLdData, {
      headers: { 'Accept': 'text/turtle', 'Content-Type': 'application/json' },
      responseType: 'text'
    }).subscribe({
      next: (response) => {
        this.turtleResult = response;
        this.isTurtleLoading = false;
      },
      error: (err) => {
        if (err.status === 413) {
          this.turtleError = 'The data is too large to convert to Turtle format. Please try with a smaller dataset.';
        } else {
          this.turtleError = err.error?.message || err.message || 'Failed to convert to Turtle format';
        }
        this.isTurtleLoading = false;
        this.showingTurtleFormat = false;
      }
    });
  }

  getDisplayedContent(): string {
    return this.showingTurtleFormat ? this.turtleResult : this.result;
  }

  getDownloadButtonText(): string {
    return this.showingTurtleFormat ? 'Download TTL' : 'Download JSON';
  }
}
