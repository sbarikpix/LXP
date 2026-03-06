import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DataStorageService {
  private storage: Storage | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.storage = localStorage;
    }
  }

  public get(key: string): string | null {
    if (!this.storage) return null;
    return this.storage.getItem(key);
  }

  public set(key: string, value: string): void {
    if (this.storage) {
      this.storage.setItem(key, value);
    }
  }

  public remove(key: string): void {
    if (this.storage) {
      this.storage.removeItem(key);
    }
  }

  public clear(): void {
    if (this.storage) {
      this.storage.clear();
    }
  }
}