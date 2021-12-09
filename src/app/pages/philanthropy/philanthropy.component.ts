import { Component, OnInit } from '@angular/core';
import { FirebaseService } from 'src/app/services/firebase.service';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
    selector: 'app-philanthropy',
    templateUrl: './philanthropy.component.html',
    styleUrls: ['./philanthropy.component.css'],
    providers: [NgbCarouselConfig] 
})


export class PhilanthropyComponent implements OnInit {

    udanceTeam: any[]= [];
    udanceTotal: number;
    udanceTeamID: number = 3717;
    udanceEventTag: string = "ud2022"; 
    udanceGoal: number = 55000.00;

    percentGoal: number;
    showTeam: boolean = true;

    allEvents: {'images': string[], 'name':string, 'desc':string}[] = [];

    loading: boolean = true;
    isAdmin: boolean = false;

    hero: string[] = ['IMG_7660.jpg', 'IMG_7975.jpg', 'DSC_0584.JPG', 'IMG_6128.JPEG', 'DSC_0590.JPG', 'IMG_9866.JPG', 'IMG_6175.JPEG', 'IMG_9867.JPG'];


    constructor(private firebaseService: FirebaseService, config: NgbCarouselConfig, private authService: AuthenticationService) { 
        config.interval = 4000;
        config.keyboard = true;
        config.pauseOnHover = true;
    }

    ngOnInit(): void {
        this.loadPhilanthropyData();

        //this check is to update the admin status whenever the user signs in or signs out
        this.authService.getCurrentAdminStatus().subscribe(data => {
            this.isAdmin = data;
        });
    }

    loadPhilanthropyData(){
        this.firebaseService.getPhilanthropy().then((snapshot: any)=>{
            let data = snapshot.val();

            this.udanceTotal = Math.round(data.udance.total);
            Object.keys(data.udance.team).map(id=>{
                this.udanceTeam.push(data.udance.team[id]);    
            });

            this.percentGoal = Math.round(this.udanceTotal/this.udanceGoal * 100);

            Object.keys(data.events).map(id=>{
                this.allEvents.push(data.events[id]);    
            });

            this.loading = false;

            //check user but has to be in this async because it doesn't work right away
            //this check is for navigating back to this page while being signed in
            if(this.authService.getUser()){
                this.authService.isAdmin().then(ss=>{ 
                    //if the user does not exist, make a new user
                    if(ss.val() != null){
                        this.isAdmin = ss.val().admin;
                        console.log(this.isAdmin);
                    }
                });
            }
        });
    }

    //Set everything including the events
    setPhilanthropyData(){
        this.firebaseService.setPhilanthropy({'udance': {'team': this.udanceTeam, 'total': this.udanceTotal}, 'events':this.allEvents});
    }

    //only update the udance team info
    setUdanceData(){
        this.firebaseService.setUdance({'team': this.udanceTeam, 'total': this.udanceTotal});
        this.percentGoal = Math.round(this.udanceTotal/this.udanceGoal * 100);
    }


    calcRightDeg(){
        if(this.percentGoal > 50){
            return 180;
        } else {
            return (this.percentGoal) / 100 * 360;
        }
    }

    calcLeftDeg(){
        if(this.percentGoal > 50){
            return (this.percentGoal - 50) / 100 * 360;
        } else {
            return 0;
        }
    }

    addCommas(input){
        return input.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }


    loadUdanceReport(event) {
        const reader = new FileReader();
        
        reader.onload = (e: any) => {
            this.loading = true;

            this.udanceTeam = [];
            let csvToRowArray = e.target.result.split("\n");
            for (let index = 1; index < csvToRowArray.length - 1; index++) {
                let row = csvToRowArray[index].split('","');
                
                if(row[21]){
                    row[21] = row[21].toString().replaceAll('"', "");
                    row[21] = row[21].replace("$", "");
                    row[21] = row[21].replace(",", "");
                }

                if(row[14]){
                    row[14] = row[14].replaceAll('"', "");
                    row[14] = row[14].replace("$", "");
                    row[14] = row[14].replace(",", "");
                }

                if(row[21]){
                    if(!row[2])
                        this.udanceTotal = parseFloat(row[21]);
                    else
                        this.udanceTeam.push({'name': row[1] + " " + row[2], 'raised': Math.round(parseFloat(row[21])), 'goal': parseFloat(row[14]),'pageid':row[22]});
                }
                
                this.udanceTeam.sort((a, b) => (a.raised > b.raised) ? -1 : 1);
            }
            this.setUdanceData();
            this.loading = false;
        };
        
        reader.readAsText(event.target.files[0]);
    }
    


}
