import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiData } from '../../utils/kpi-extractor.util';

@Component({
    selector: 'app-kpi-display',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './kpi-display.component.html',
    styleUrls: ['./kpi-display.component.css']
})
export class KpiDisplayComponent {
    @Input() kpiData: KpiData | null = null;

    formatAnonymizationType(type: string): string {
        if (!type) return 'Unknown';
        // Capitalize first letter and format
        return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    }
}
