import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JsonLdRequest {
  configurationUrl: string;
  data: object;
  calculateKpi?: boolean;
  includeOriginalData?: boolean;
}

export interface FlatJsonRequest {
  configurationUrl: string;
  prefix: string;
  data: any[];
  calculateKpi?: boolean;
  includeOriginalData?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AnonymizationService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) { }

  anonymizeJsonLD(request: JsonLdRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put(`${this.baseUrl}/anonymization`, request, { headers });
  }

  anonymizeFlatJson(request: FlatJsonRequest): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put(`${this.baseUrl}/anonymization/flatjson`, request, { headers });
  }
}
