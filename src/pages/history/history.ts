import {Component, ChangeDetectorRef} from '@angular/core';
import {NavController, LoadingController} from 'ionic-angular';
import {Payment} from '../../providers/payment/payment';
import {History} from '../../providers/history/history';
import {Currency} from '../../providers/currency/currency';
import {Config} from '../../providers/config';
import {Transaction} from '../../api/transaction';

@Component({
    templateUrl : 'history.html'
})
export class HistoryPage {
    
    transactions: Array<{txid: string, fiatAmount:string, currency:string, timestamp:number, confirmations:number}> = [];
    currencyThousandsPoint: string = "";
    currencySeparator: string = "";
    moreContentAvailable: boolean = true;
    
    constructor(private history: History, private config: Config, private currency: Currency, private payment: Payment, private loading: LoadingController, private nav: NavController, private changeDetector: ChangeDetectorRef) {    

        let loader = this.loading.create({
            content: 'Checking Transactions'
        });
        loader.present();

        try {
            Promise.all<string>([
                config.get('currency-format-t') ,
                config.get('currency-format-s')
            ]).then(promised => {
                this.currencyThousandsPoint = promised[0];
                this.currencySeparator = promised[1];

                payment.updateConfirmations()
                    .then(() => { return history.queryTransactions(10,0) })
                    .then(transactions => {
                        this.addTransactions(transactions);
                        loader.dismiss();                        
                    })
                    .catch(() => {
                        loader.dismiss();
                    });
            });
        } catch (e) {
            console.debug("History Error: ", e);
            loader.dismiss();
        }       

    }

    addTransactions(transactions: Array<Transaction>) {
        if (transactions && transactions.length <= 0) {
            this.moreContentAvailable = false;
            return;
        } else {
            this.moreContentAvailable = true;
        }
        
        for(let t of transactions) {
            this.transactions.push({
                txid : t.txid ,
                fiatAmount : this.currency.formatNumber(t.fiatAmount, this.currencySeparator) ,
                timestamp : t.timestamp ,
                currency : t.currency ,
                confirmations : t.confirmations
            });
        }
        this.changeDetector.detectChanges();
    }

    deleteTransaction(index: number) {
        this.history.deleteTransaction(this.transactions[index].txid);
        this.transactions.splice(index,1);        
    }

    openTransaction(txid: string) {
        window.open('https://blockchain.info/tx/' + txid, '_system');
    }

    loadTransactions(infiniteScroll) {
        this.history.queryTransactions(10,this.transactions.length-1).then(transactions => {
            this.addTransactions(transactions);
            infiniteScroll.complete();
        }).catch(() => {
            infiniteScroll.complete();
        });
    }    
}