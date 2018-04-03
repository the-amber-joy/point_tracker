import { Component, OnInit, Input, Output, EventEmitter, Inject  } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Offender } from './offender.model';
import { Note } from "../shared/note.model";
import { Admin } from "../shared/admin.model";
import { Observable } from 'rxjs/Observable';

import { OffenderService } from "./offender.service";
import { AppModule } from '../app.module';
import { MatSelectChange } from '@angular/material';
import { DialogComponent } from '../dialog/dialog.component';

@Component({
    selector: 'offenders-component',
    templateUrl: './offender.component.html',
    styleUrls: ['./offender.component.css']
})
export class OffenderComponent implements OnInit, AppModule {
    constructor(
        public dialog: MatDialog,
        private offenderService: OffenderService
    ) { }

    ngOnInit() {
        this.getOffenders();
        this.offenders;
        this.newNote = '';

        // this.offenders = OffenderService.getList(url): Observable < Offender > {
        //     return this.httpClient.get('/api/people');
        // return an array of typed objects to iterate through
        // }
    }

    @Output()
    selectionChange: EventEmitter<MatSelectChange>
    offenders: Offender[];
    offender: Offender;
    newNote: string;
    newName: string = '';

    getOffenders() {
        this.offenders = this.offenderService.getOffenders();
    }

    doSomething($event: EventEmitter<MatSelectChange>, offender) {
        offender.banStatus = offender.score == 10;
    }

    addNewNote() {
        console.log(this.offender.notes);
        let noteToAdd = new Note(this.newNote, new Date(), new Admin("Patrick", "Umphrey", "CoachPotato"))
        this.offender.notes.push(noteToAdd);
        console.log(this.offender.notes);
        this.newNote = '';
    }

    buttonClicked() {
        alert("This form doesn't do anything yet");
    }

    openDialog(): void {
        let dialogRef = this.dialog.open(DialogComponent, {
            height: '400px',
            width: '600px',
            data: { name: this.newName }
        });

        dialogRef.afterClosed().subscribe(result => {
            console.log(`Dialog result: ${result}`);
            this.newName = '';
        });
    }
}
