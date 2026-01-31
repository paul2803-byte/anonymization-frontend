import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiKpiData } from '../../utils/kpi-extractor.util';

@Component({
    selector: 'app-kpi-display',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './kpi-display.component.html',
    styleUrls: ['./kpi-display.component.css']
})
export class KpiDisplayComponent {
    /** Multiple KPI data for different object types */
    @Input() kpiData: MultiKpiData[] | null = null;

    formatAnonymizationType(type: string): string {
        if (!type) return 'Unknown';
        // Capitalize first letter and format
        return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    }

    /** Check if we have any KPI data to display */
    hasData(): boolean {
        return !!(this.kpiData && this.kpiData.length > 0);
    }

    /** Check if we have multiple KPI objects */
    hasMultipleObjects(): boolean {
        return this.kpiData !== null && (this.kpiData.length > 1 || (this.kpiData.length === 1 && this.kpiData[0].objectType !== ''));
    }

    /** Get severity class based on k-anonymity value */
    getKpiSeverity(kAnonymity: number): string {
        if (kAnonymity <= 1) {
            return 'severity-critical';
        } else if (kAnonymity <= 4) {
            return 'severity-warning';
        }
        return 'severity-good';
    }
}
