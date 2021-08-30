import { Injectable } from '@angular/core';
import * as Fs from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { lazyConnection } from './lazy';

export interface Vote {
    username : string;
    estimate : number;
}

export interface VoteChange {
    votes : Vote[];
    session : Session;
}

export interface Session {
    revealed : boolean;
}

@Injectable()
export class PokerService {
    constructor(
        private firestore : Fs.Firestore
    ) {
    }

    async newSession(): Promise<string> {
        this.firestore.app
        let docRef = await Fs.addDoc(this.$sessions, <Session>{
            revealed: false
        });

        return docRef.id;
    }

    private $sessions = <Fs.CollectionReference<Session>>Fs.collection(this.firestore, 'sessions');
    
    private $votes(sessionID : string) {    
        return Fs.collection(this.$sessions, `${sessionID}/votes`);
    }

    private $session(sessionID : string) {
        return Fs.doc<Session>(this.$sessions, sessionID);
    }

    async reveal(sessionID : string, revealed : boolean) {
        await Fs.updateDoc(this.$session(sessionID), { revealed });
    }

    async signIn(sessionID : string, username : string) {
        let vote = await (await Fs.getDoc(this.$vote(sessionID, username)));
        if (!vote.exists())
            await this.vote(sessionID, username, 0);
    }

    async joinSession(sessionId : string) {
        console.log(`Votes: ${this.$votes(sessionId).path}`);
        let subscription : Subscription;

        return lazyConnection<VoteChange>({
            start: (subject) => {
                
                let votes : Vote[] = [];
                let session : Session;

                console.log(`Subscribing to vote changes`);

                Fs.docSnapshots<Session>(this.$session(sessionId)).subscribe(snapshot => {
                    let data = snapshot.data();
                    if (data)
                        session = data;
                    subject.next({ votes, session });
                });

                subscription = Fs.collectionChanges(this.$votes(sessionId)).subscribe(changes => {
                    for (let change of changes) {
                        if (change.type === 'removed') {
                            votes = votes.filter(x => x.username !== change.doc.id);
                        } else {
                            let vote = votes.find(x => x.username === change.doc.id) || <Vote>{ username: change.doc.id };
                            vote.estimate = change.doc.data().estimate;
                            if (!votes.includes(vote))
                                votes.push(vote);
                        }
                    }

                    subject.next({ votes, session })
                });
            },
            stop: () => subscription.unsubscribe()
        })
    }

    private $vote(sessionID : string, username : string) {
        return Fs.doc(this.firestore, `sessions/${sessionID}/votes/${username}`)
    }

    async reset(sessionID : string) {
        let docs = await Fs.getDocs(this.$votes(sessionID));
        for (let doc of docs.docs) {
            await this.vote(sessionID, doc.id, 0);
        } 
        await this.reveal(sessionID, false);
    }

    async vote(sessionID : string, username : string, estimate : number) {
        Fs.setDoc(this.$vote(sessionID, username), {
            estimate
        })
    }

    async removeVote(sessionID : string, username : string) {
        await Fs.deleteDoc(this.$vote(sessionID, username));
    }
}