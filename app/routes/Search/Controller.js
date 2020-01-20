import { Controller } from "cx/ui";
import { saveAs } from 'file-saver';
let moment = require('moment');
let jsZip = require('jszip');
const axios = require('axios');
let JSZipUtils = require('jszip-utils');

export default class extends Controller {
    onInit() {
        this.rootGridFill();
        this.store.init('$page', {
            filter: {
                page: 1,
                pageSize: 20,
                pageCount: Math.ceil(this.store.get('$page.length') / 20)
            }
        });

        this.store.set("$options.users", 
            Array.from({ length: 5 }).map((v, i) => ({
            id: i,
            text: `User ${++i}`
        })));
        
        this.addTrigger("changePAge", ["$page.filter.page", "$page.filter.pageSize"], (page, pageSize) => {
            if(page) {
                const data = this.store.get("$page.allData");
                console.log(data);
                this.store.set("$page.data", data.slice((page - 1) * pageSize, page * pageSize));
            }
        })
    }

    // used to get all content of the root folder in OneDrive from
    // 'rootGridFill' method in the backend of the application
    rootGridFill() {
        axios.get('http://localhost:3000/rootGridFill')
        .then(response => {
            let data = response.data.message.value; 
            this.store.set("$page.length", response.data.message.value.length)
            const grid = data.map((item, i) => {
                return ({  
                    docsId: item.id,
                    webUrl: item.webUrl,
                    isFolder: item.folder,
                    isFile: item.file,
                    icon: item.hasOwnProperty('folder') || item.name,
                    description: item.description,
                    document: item.name,
                    folder: "Root Folder",
                    user: item.createdBy.user.displayName,
                    lastModified: this.formatDate(item.lastModifiedDateTime)
                })
            })
            this.store.set("$page.allData", grid);
            this.store.set("$page.filter.pageCount", Math.ceil(response.data.message.value.length / 20))
            const finalGrid = grid.slice(0, 20);
            this.store.set("$page.data", finalGrid);
        }).catch(err => console.log(new Error(err))); 
    }

    // this method is used by the 'fillTrigger' in onInit() to get all data of that clicked folder
    
    // used to do all the searching functionality in our main grid
    onSearch(){

        // Getting the user input from the client
        let searchedUser = this.store.get("$page.filter.user");

        // Getting the date input from the client
        let searchedDate = this.store.get('$page.filter.date');

        // Getting the description input from the client
        let searchedDocumentName = this.store.get('$page.filter.description');
        
        // Getting the full list of store data
        let data = [];
        let entries = Object.entries(this.store.get("$page.data"));
        entries.forEach( item => data.push(item[1]));

        // the array used to gather all filtered data
        let finalResult = [];

        // full search for users, lastModified and description
        if(searchedUser != null && searchedDate != null && searchedDocumentName != null){
            console.log("1") // used for debugging purposes
            let desiredDateFormat = this.formatDate(searchedDate);  
            data.forEach(item => {
                if(item.user == searchedUser &&
                     this.compareDates(desiredDateFormat, item.lastModified) && 
                        ((item.document).toLowerCase().includes(searchedDocumentName)) || item.description.includes(searchedDocumentName)) finalResult.push(item);
            });
        }

        // couples - filtering by input of two given search fields
        if(searchedDocumentName, searchedDate != null && searchedUser == null){
            console.log("2A") // used for debugging purposes
            let desiredDateFormat = this.formatDate(searchedDate);
            data.forEach(item => {
                if (this.compareDates(desiredDateFormat, item.lastModified) && (item.document).toLowerCase().includes(searchedDocumentName)) finalResult.push(item);
            })
        }
        if(searchedDocumentName, searchedUser != null && searchedDate == null){
            console.log("2B") // used for debugging purposes
            data.forEach(item => {
                if(item.user == searchedUser && (item.document).toLowerCase().includes(searchedDocumentName)) finalResult.push(item);
            });
        }
        if(searchedUser, searchedDate != null && searchedDocumentName == null){
            console.log("2C") // used for debugging purposes
            let desiredDateFormat = this.formatDate(searchedDate);
            data.forEach(item => {
                if(this.compareDates(desiredDateFormat, item.lastModified) && item.user == searchedUser) finalResult.push(item);
            });
        }


        // singles - filtering by input given only by one search field

        // single-description
        if(searchedUser, searchedDate == null && searchedDocumentName != null){
            console.log("3A") // used for debugging purposes
            data.forEach(item => {
                if((item.document).toLowerCase().includes(searchedDocumentName)) finalResult.push(item); 
            });
        }

        // single-lastModified
        if(searchedUser, searchedDocumentName == null && searchedDate != null){
            console.log("3B") // used for debugging purposes
            let desiredDateFormat = this.formatDate(searchedDate);
            data.forEach(item => {
                if(this.compareDates(desiredDateFormat, item.lastModified)) finalResult.push(item); 
            });
        }
        // user part not activated because i haven't been able to do the multi-user functionality
        // if(searchedUser, searchedDate != null && searchedDocumentName == null){
        //     data.filter(item => {
        //         this.compareDates(desiredDateFormat, item.lastModified) && item.user == searchedUser;
        //     });
        // }
        

        
        // final mapping of filtered data
        
            this.store.set('$page.data', 
                finalResult.map((item, i) => ({
                    docsId: item.docsId,
                    icon: item.hasOwnProperty('folder') || item.document,
                    document: item.document, 
                    folder: item.folder,
                    user: item.user,
                    lastModified: item.lastModified
                })
            ));
    }

    

        onZip(){
            let selected = this.store.get('$page.selection');
            let zip = new jsZip();

            let files = [];
            let entries = Object.entries(this.store.get("$page.data"));
            entries.forEach( item => files.push(item[1]));

            files.forEach( item => {
                
                if(item.document === selected){

                    JSZipUtils.getBinaryContent(item['@microsoft.graph.downloadUrl'], (err, data) => {
                        if(err) {
                            alert('Error');
                            console.log(new Error(err));
                        }
                        else {
                            zip.file(item.document, data, {binary : true});
                            zip.generateAsync({ type:"Blob" })
                            .then(content => {
                                saveAs(content, `${selected}.zip`);
                            })
                            .catch(err => console.log(new Error(err)));
                        }  
                    });
                }
            })
        }



    // used for returning/redirecting to the root folder in OneDrive, while also deleting inputs in the filter/search fields
    goBack(){
        this.onDelete();
        this.rootGridFill();
    }

    // used to delete input from the filter/search fields
    onDelete() {
        this.store.delete('$page.filter.users');
        this.store.delete('$page.filter.date');
        this.store.delete('$page.filter.description');
    }

    // used to format the given data from the datefield for a more convenient comparison
    formatDate(dateModified) {
        let desiredDateFormat = dateModified.slice(0, 10);
        return moment(desiredDateFormat).format('DD/MM/YYYY');  
    }


    // used to compare given date input in the filter/search field with a given file's date
    compareDates(givenSearchDate, fileDate){
        let searchDateAsArray = givenSearchDate.split('/');
        let fileDateAsArray = fileDate.split('/');
        // split is used in this case to convert a date from
        // this format: 11/11/2019 to an array like this: [11, 11, 2019],
        // then we compare both given search date and the file date first by
        // comparing the year, the month and finally the day
        if(searchDateAsArray[2] <= fileDateAsArray[2]) {
            if(searchDateAsArray[1] <= fileDateAsArray[1]){
                if(searchDateAsArray[0] <= fileDateAsArray[0]){
                    return true;
                }
            }
        }
        return false;
    }
}

