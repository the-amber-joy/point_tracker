import { Component, OnInit, Input, Output, EventEmitter, Inject, NgModule } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogConfig, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { Offender } from '../shared/offender.model';
import { Note } from "../shared/note.model";
import { Admin } from "../shared/admin.model";
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
        this.getAll();
    }

    @Output()
    selectionChange: EventEmitter<MatSelectChange>
    offenders: Offender[];
    offender: Offender;
    newNote: string = '';
    addedName: string = '';

    getAll() {
        return this.offenderService.getAll().subscribe(response => {
            this.offenders = response;
            this.offenders.forEach(offender => {
                offender.originalPoints = offender.points;
                offender.originalStatus = offender.isBanned;
            })
            return this.offenders;
        });
    }

    openDialog(addedName) {
        let dialogRef = this.dialog.open(DialogComponent, {
            data: {
                name: addedName,
                nickName: '',
                note: '',
                points: 0
            }
        });
        this.addedName = '';

        dialogRef.beforeClose().subscribe(dialogData => {
                return this.offenderService.postNew(dialogData).subscribe(response => {
                    response.originalPoints = response.points
                    response.originalStatus = response.isBanned
                    this.offenders.push(response)
            })

        });
    }

    addNewNote(offender) {
        let noteToAdd = { note: this.newNote, isNew: true, created: new Date(), addedBy: { firstName: "Fake", lastName: "Tester", nickName: "Admin" } }
        offender.notes.push(noteToAdd);
        offender.notesAdded = true;
        offender.changesMade = true;

        this.newNote = '';
    }

    pointsChanged($event: EventEmitter<MatSelectChange>, offender) {
        if (offender.originalPoints == offender.points) {
            offender.pointsChanged = false;
        }
        if (offender.originalPoints != offender.points) {
            offender.changesMade = true;
            offender.pointsChanged = true;
        } else if (offender.originalPoints == offender.points
            && offender.originalStatus == offender.isBanned
            && !offender.notesAdded
        ) {
            offender.changesMade = false;
        }
    }

    banStatusChanged($event: EventEmitter<any>, offender) {
        if (offender.originalStatus == offender.isBanned) {
            offender.banStatusChanged = false;
        }
        if (offender.originalStatus != offender.isBanned) {
            offender.banStatusChanged = true;
            offender.changesMade = true;
        } else if (
            offender.originalStatus == offender.isBanned
            && offender.originalPoints == offender.points
            && !offender.notesAdded
        ) {
            offender.changesMade = false;
        }
    }

    saveChanges(offender: Offender) {
        let newNotes: Note[] = [];
        if (offender.notesAdded) {
            newNotes = [];
            offender.notes.forEach(note => {
                if (note.isNew) {
                    note.isNew = false;
                    newNotes.push(note)
                }
            })
        }

        offender.originalPoints = offender.points;
        offender.originalStatus = offender.isBanned;
        offender.changesMade = false;
        offender.updated = new Date();

        this.offenderService.updateStatus({
            _id: offender._id,
            notes: newNotes,
            points: offender.points,
            isBanned: offender.isBanned,
            updated: offender.updated
        }).subscribe();
    }

    discardChanges(offender) {
        if (offender.notesAdded) {
            offender.notes.forEach(note => {
                if (note.isNew) {
                    let idx = offender.notes.indexOf(note);
                    offender.notes.splice(idx);
                }
                offender.notesAdded = false;
            })
        }
        if (offender.banStatusChanged) {
            offender.isBanned = offender.originalStatus;
        }
        if (offender.pointsChanged) {
            offender.points = offender.originalPoints;
        }
        offender.changesMade = false;
    }
}
