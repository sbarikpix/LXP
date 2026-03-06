import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HttpNetworkStateService {

  private requestIdSeq = 1;

  requestsInProgress: string[] = [];

  isBusy() {
    return this.requestsInProgress.length > 0;
  }

  addRequest() {
    const id = this.requestIdSeq++;
    this.requestsInProgress.push(id.toString());
    return id.toString();
  }

  completeRequest(id: string) {
    this.requestsInProgress = this.requestsInProgress.filter(x => x != id);
    return id;
  }
}
