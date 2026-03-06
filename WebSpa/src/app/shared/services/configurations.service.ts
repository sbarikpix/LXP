import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export interface Configuration {
  aiInstrumentaionKey: string,
  chasmaNOVOAPI: string,
  oidcSettings: {
    authority: string,
    client_id: string,
    redirect_uri: string,
    silent_redirect_uri: string,
    post_logout_redirect_uri: string,
    response_type: string,
    scope: string,
  },
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  public configuration!: Configuration;

  private $load: Promise<boolean>;

  constructor(private httpClient: HttpClient) {
    this.$load = new Promise<boolean>((resolve) => {
      this.configuration = environment.configuration
      resolve(true);
    });
  }


  public loaded() {
    return this.$load;
  }

}
