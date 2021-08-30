import { Component } from '@angular/core';
import { PokerService, Session } from '../poker.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';

export interface Vote {
    username : string;
    estimate : number;
}

@Component({
    templateUrl: './session.component.html',
    styleUrls: ['./session.component.scss']
})
export class SessionComponent {
    constructor(
        private poker : PokerService,
        private router : Router,
        private route : ActivatedRoute,
        private snackbar : MatSnackBar
    ) {

    }


    session : Session | null = null;
    subscription : Subscription | null = null;
    votes : Vote[] = [];
    options = [ 1, 2, 3, 5, 8, 13 ];
    sessionID : string | null = null;
    username : string | null = null;
    proposedUsername : string | null = null;

    get url() {
        return `${location.origin}/${this.sessionID}`;
    }

    async copyUrl() {
        await navigator.clipboard.writeText(this.url);
        this.snackbar.open("URL copied to clipboard", undefined, { duration: 2000 });
    }

    get voted() {
        return this.myVote?.estimate! > 0;
    }

    get myVote() {
        return this.votes.find(x => x.username === this.username);
    }

    async reveal() {
        if (!this.sessionID) {
            throw new Error('No active session');
        }

        await this.poker.reveal(this.sessionID, true);
    }

    async remove(username : string) {
        if (!this.sessionID) {
            throw new Error('No active session');
        }

        await this.poker.removeVote(this.sessionID, username);
    }

    async reset() {
        if (!this.sessionID) {
            throw new Error('No active session');
        }
        
        await this.poker.reset(this.sessionID);
    }

    async vote(estimate : number) {
        if (!this.sessionID)
            throw new Error(`No active session`);
        if (!this.username) {
            alert(`Choose a username first`);
            return;
        }

        await this.poker.vote(this.sessionID, this.username, estimate);
    }

    isPresenter = false;

    async setUsername(username : string) {
        await this.poker.signIn(this.sessionID!, username);
        this.router.navigateByUrl(`/${this.sessionID}/${username}`);
    }

    async ngOnInit() {
        combineLatest([this.route.paramMap, this.route.data]).subscribe(async ([params, data]) => {

            if (params.has('username')) {
                this.username = params.get('username');
            }

            this.isPresenter = params.get('username') === 'presenter';

            this.subscription?.unsubscribe();

            let id = params.get('id');
            if (id) {
                this.sessionID = id;
                console.log(`Joining poker session...`);
                try {
                    let obs = await this.poker.joinSession(id);
                    this.subscription = obs.subscribe(change => {
                        this.votes = change.votes;
                        this.session = change.session;
                    });
                    console.log(`Joined session`);
                } catch (e) {
                    console.error(`Failed to connect to poker session`);
                    console.error(e);
                }
            }
        });
    }
}