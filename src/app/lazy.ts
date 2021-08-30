import { Observable, BehaviorSubject, ConnectableObservable, Subject } from 'rxjs';
import { publish } from 'rxjs/operators';

export interface LazyConnectionOptions<T> {
    start : (subject : Subject<T>) => void;
    stop : () => void;
}

export function lazyConnection<T>(options : LazyConnectionOptions<T>): Observable<T> {
    let obs = new Observable(observer => {
        let subject = new Subject<T>();
        options.start(subject);

        let subscription = subject.subscribe(observer);

        return () => {
            subscription.unsubscribe();
            options.stop();
        };
    });
    
    return (<ConnectableObservable<T>>obs.pipe(publish())).refCount();
}