import { Component } from '@angular/core';
import { PokerService } from './poker.service';
import { Router } from '@angular/router';

@Component({
    template: `
        <nav>
            Planning Poker
        </nav>

        <button (click)="newSession()" mat-raised-button color="accent">
            <mat-icon>play_arrow</mat-icon>
            Start
        </button>

        <br/>
        <br/>
        <br/>

        <a mat-button target="_blank" href="https://github.com/rezonant/poker">
            <img src="/assets/github.svg" style="height: 1.5em; margin-right: 0.25em;" />
            github.com/rezonant/poker
        </a>
    `,
    styles: [
        `       
        :host {
            color: white;
            text-align: center;
            display: block;
        }

        nav {
            font-size: 36px;
            font-weight: 100;
            margin: 1em;
        }
        `
    ]
})
export class HomeComponent {
    constructor(
        private poker : PokerService,
        private router : Router
    ) {

    }

    async newSession() {
        let id = await this.poker.newSession();
        this.router.navigateByUrl(`/${id}`);
    }
}