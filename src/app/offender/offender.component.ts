import { Component, OnInit, Input, Output, EventEmitter, Inject, NgModule } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogConfig, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { Offender } from '../models/offender.model';
import { Note } from "../models/note.model";
import { Admin } from "../models/admin.model";
import { OffenderService } from "./offender.service";
import { AppModule } from '../app.module';
import { MatSelectChange } from '@angular/material';
import { OffenderDialogComponent } from '../offender-dialog/offender-dialog.component';

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
    watchStatus: string;

    getAll() {
        return this.offenderService.getAll().subscribe(response => {
            this.offenders = response;
            this.offenders.forEach(offender => {
                offender.originalPoints = offender.points;
                offender.originalStatus = offender.isBanned;
                offender.watchStatus = this.getWatchStatus(offender);
            })
            return this.offenders;
        });
    }

    openDialog(addedName) {
        let dialogRef = this.dialog.open(OffenderDialogComponent, {
            data: {
                name: addedName,
                nickName: '',
                note: '',
                points: 0
            }
        });
        this.addedName = '';

        dialogRef.afterClosed().subscribe(dialogData => {
            console.log(dialogData);
            if (dialogData == null) {
                return
            }
            else {
                return this.offenderService.postNew(dialogData).subscribe(response => {
                    response.originalPoints = response.points
                    response.originalStatus = response.isBanned
                    this.offenders.push(response)
                })
            }
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
        offender.watchStatus = this.getWatchStatus(offender);

        if (offender.points == offender.originalPoints) {
            offender.pointsChanged = false;
        }
        if (offender.points != offender.originalPoints || offender.isBanned != offender.originalStatus) {
            if (offender.points != offender.originalPoints) {
                offender.pointsChanged = true;
            }
            if (offender.isBanned != offender.originalStatus) {
                offender.banStatusChanged = true;
            }
            offender.changesMade = true;
        } else if (offender.points == offender.originalPoints
            && offender.isBanned == offender.originalStatus
            && !offender.notesAdded
        ) {
            offender.changesMade = false;
        }
    }

    banStatusChanged(offender) {
        offender.isBanned = !offender.isBanned;
        
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
        let confirmBan = false;
        let newNotes: Note[] = [];

        function saveNotes() {
            if (offender.notesAdded) {
                newNotes = [];
                offender.notes.forEach(note => {
                    if (note.isNew) {
                        note.isNew = false;
                        newNotes.push(note)
                    }
                })
            }
        }

        if (this.newNote !== '') {
            this.addNewNote(offender);
        }

        if (offender.originalStatus !== offender.isBanned && offender.isBanned == true) {
            confirmBan = confirm("Are you sure you want to ban " + offender.name + "?");
            if (confirmBan == true) {
                saveNotes();
                this.resetOffender(offender);
                this.offenderService.updateStatus({
                    _id: offender._id,
                    notes: newNotes,
                    points: offender.points,
                    isBanned: offender.isBanned,
                    updated: offender.updated
                }).subscribe();
            }
        }

        if (confirmBan == false) {
            saveNotes();
            this.offenderService.updateStatus({
                _id: offender._id,
                notes: newNotes,
                points: offender.points,
                isBanned: offender.isBanned,
                updated: offender.updated
            }).subscribe();
            this.resetOffender(offender);
        }
    }

    resetOffender(offender) {
        offender.originalPoints = offender.points;
        offender.originalStatus = offender.isBanned;
        offender.watchStatus = this.getWatchStatus(offender);
        offender.changesMade = false;
        offender.updated = new Date();
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
            offender.watchStatus = this.getWatchStatus(offender);
        }
        offender.changesMade = false
    }

    getWatchStatus(offender) {
        if (offender.points == 0) {
            return "Probation"
        } else if (offender.points == 1) {
            return "Watching"
        } else if(offender.points == 2) {
            return "Warned"
        } else {
            return "Final Straw"
        }
    }
}
