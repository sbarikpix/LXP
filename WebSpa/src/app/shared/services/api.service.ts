import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DataStorageService } from './data-storage.service';
import { Observable, of, switchMap } from 'rxjs';
import { AppConstants } from '../App-Constants';

@Injectable({
  providedIn: 'root'
})

export class ApiService {
  constructor(
    private httpClient: HttpClient,
    private dataStorageService: DataStorageService
  ) { }

  public get<TRes>(
    url: string,
    options?: {
      params?: HttpParams | { [param: string]: string | string[] };
      headers?: HttpHeaders;
    }
  ): Observable<TRes> {
    return this.getOptions().pipe(
      switchMap((defaultOptions) => {
        const mergedOptions = {
          ...defaultOptions,
          ...options,
          observe: 'body' as const
        };
        return this.httpClient.request<TRes>('GET', url, mergedOptions);
      })
    );
  }

  public post<TRes>(
    url: string,
    body?: any,
    options?: {
      params?: HttpParams | { [param: string]: string | string[] };
      headers?: HttpHeaders;
    }
  ): Observable<TRes> {
    return this.getOptions().pipe(
      switchMap((defaultOptions) => {
        const mergedOptions = {
          ...defaultOptions,
          ...options,
          observe: 'body' as const
        };
        return this.httpClient.request<TRes>('POST', url, {
          ...mergedOptions,
          body
        });
      })
    );
  }

  public put<TRes>(
    url: string,
    body: any,
    options?: {
      params?: HttpParams | { [param: string]: string | string[] };
      headers?: HttpHeaders;
    }
  ): Observable<TRes> {
    return this.getOptions().pipe(
      switchMap((defaultOptions) => {
        const mergedOptions = {
          ...defaultOptions,
          ...options,
          observe: 'body' as const
        };
        return this.httpClient.request<TRes>('PUT', url, {
          ...mergedOptions,
          body
        });
      })
    );
  }

  public delete<TRes>(
    url: string,
    options?: {
      params?: HttpParams | { [param: string]: string | string[] };
      headers?: HttpHeaders;
    }
  ): Observable<TRes> {
    return this.getOptions().pipe(
      switchMap((defaultOptions) => {
        const mergedOptions = {
          ...defaultOptions,
          ...options,
          observe: 'body' as const
        };
        return this.httpClient.request<TRes>('DELETE', url, mergedOptions);
      })
    );
  }

  private getOptions(): Observable<{ headers: HttpHeaders }> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.dataStorageService.get(AppConstants.LocalStorage.APIToken)}`,
      'UserId': `${this.dataStorageService.get(AppConstants.LocalStorage.UserId)}`
    });

    return of({ headers });
  }
}