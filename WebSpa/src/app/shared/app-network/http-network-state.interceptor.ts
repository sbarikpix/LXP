import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { HttpNetworkStateService } from './http-network-state.service';
import { AppConstants } from '../App-Constants';
import { Router } from '@angular/router';
import { DataStorageService } from '../services/data-storage.service';

@Injectable()
export class HttpNetworkStateInterceptor implements HttpInterceptor {

  constructor(
    private httpNetworkStateService: HttpNetworkStateService, private route: Router,
    private dataStorageService: DataStorageService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const id = this.httpNetworkStateService.addRequest()
    return next.handle(req).pipe(

      // default error is not possible here

      catchError(error => {

        //For Network disconnected
        if (!(navigator.onLine)) {
          let errorMessage = AppConstants.DefaultError.ConnectionError;
          window.alert(errorMessage);
        }

        // redirect to login
        if (!this.dataStorageService.get(AppConstants.LocalStorage.IsLoggedIn)) {
          this.route.navigate([`/`]);
        }

        throw error;
      }),
      finalize(() => {
        this.httpNetworkStateService.completeRequest(id);
      }));
  }
}