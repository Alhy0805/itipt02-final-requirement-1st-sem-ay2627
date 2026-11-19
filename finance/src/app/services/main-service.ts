import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class MainService {
    private localStorageData: any = null;

    getLocalStorageData(): any {
        this.localStorageData = localStorage.getItem('finance-resources') || [];
        return this.localStorageData;
    }
}