import { Section, Tab, PureContainer, FlexCol, FlexRow, Button, TextArea, Checkbox } from "cx/widgets";
import { Grid, DateField, Pagination, LookupField, MsgBox, Select} from "cx/widgets";
import { KeySelection, computable } from 'cx/ui';
import {enableMsgBoxAlerts} from 'cx/widgets';
enableMsgBoxAlerts();
const axios = require('axios');
const moment = require('moment');
let JSZip = require('jszip');
let zip = new JSZip();

import Controller from "./Controller";

export default (
    <cx>
        <PureContainer controller={Controller}>
            <h2 putInto="header">Search</h2>
            <Section mod="card" style="height: 100%" pad={false}>
                <div style="line-height: 0">
                    <Tab mod="line" value-bind="$page.search" tab="search" default>Search</Tab>
                </div>
                <div style="padding: 1rem; border-top: 1px solid lightgray; margin-top: -1px">
                    <div visible-expr="{$page.search} == 'search'">
                        <FlexCol controller={Controller} style="height: 100%" spacing="large">
                            <h2 putInto="header">Search</h2>
                            <Section mod="card">
                                <FlexRow spacing>
                                    <Button onClick="goBack" mod="primary">Home</Button>
                                    <LookupField
                                        label="Select users"
                                        value-bind="$page.s.id"
                                        text-bind="$page.s.text"
                                        options-bind="$options.users"
                                        multiple
                                    />

                                    <DateField
                                        placeholder="Date Modified"
                                        value-bind="$page.filter.date"
                                    />

                                    <TextArea label="Description" value-bind="$page.filter.description" rows={1}/>

                                    <Button mod="primary" style="margin-left: 50px" onClick="onSearch" >Search</Button>
                                    
                                    <Button mod="hollow" icon="refresh" onClick="onDelete" />

                                    <Button style="margin-left: auto" onClick={(e, {controller, store}) => {
                                                                                    MsgBox.yesNo({
                                                                                        message: "Would you like to export '" + store.get(`$page.selection`) + "' as ZIP?"
                                                                                    }).then(btn => {
                                                                                        if (btn == "yes") controller.onZip();
                                                                                    });
                                                                                }}>Export as ZIP</Button>
                                    {/* Modify button not included because it isn't neccesary due to that functionality being handled in 'onRowClick' property of the main grid */}
                                </FlexRow>  
                            </Section>
                            <Section mod="card" style="flex: 1 1 0" pad={false} bodyStyle="display: flex">
                                <Grid
                                    
                                    style="flex: 1 1 0; border: none"
                                    onRowClick={(e, { store }) => {
                                
                                        // gets the id of the clicked folder for use in the 'fillInData' 
                                        // method of the controller as the itemId of that folder
                                        store.set("$page.itemId", store.get(`$page.data[${store.itemIndex}].docsId`)); 
                                        let folder = store.get(`$page.data[${store.itemIndex}].isFolder`);
                                        let file = store.get(`$page.data[${store.itemIndex}].isFile`);
                                        let webUrl = store.get(`$page.data[${store.itemIndex}].webUrl`);

                                        if(!file && !folder){
                                                MsgBox.yesNo({
                                                    message: `Would you like to open the '${store.get(`$page.data[${store.itemIndex}].document`)}' file?`
                                                }).then(btn => {
                                                    if(btn == 'yes') window.open(webUrl);
                                                });
                                        }

                                        if(file) {
                                            MsgBox.yesNo({
                                                message: `Would you like to open the '${store.get(`$page.data[${store.itemIndex}].document`)}' file?`
                                            }).then(btn => {
                                                if(btn == 'yes') window.open(webUrl);
                                            });
                                        }               

                                        if(folder){
                                            if(folder.childCount == 0){
                                                MsgBox.yesNo({
                                                    message: "This Folder is empty, would you like to open it OneDrive?"
                                                }).then(btn => {
                                                    if(btn == 'yes') window.open(webUrl);
                                                });
                                            } else {
                                                // destructuring assigment used to get the id of
                                                // the clicked folder
                                                const { docsId } = store.get('$record');
                                                const params = { docsId };

                                                axios.post(`http://localhost:3000/fillInGrid`, params)
                                                .then(response => {
                                                    let data = response.data.message.value; 
                                                    store.set("$page.data", data.map((item, i) => {
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
                                                            lastModified: formatDate(item.lastModifiedDateTime)
                                                        })
                                                    }));

                                                    // used to format the given data from the datefield for a more convenient comparison
                                                    function formatDate(dateModified) {
                                                        let desiredDateFormat = dateModified.slice(0, 10);
                                                        return moment(desiredDateFormat).format('DD/MM/YYYY');  
                                                    }
                                                }).catch(err => console.log(new Error(err)));
                                            }
                                        } 
                                    }}
                                    scrollable
                                    vlines
                                    records-bind="$page.data"
                                    columns={[
                                        {
                                        header: 'Icon',
                                        field: 'icon',
                                        align: 'left',
                                        sortable: true,
                                        items: <cx>
                                            <i class={computable("$record.icon",
                                            (type) => {
                                                if(type){
                                                if(type == true)return "far fa-folder fa-lg";
                                                else if(type.endsWith(".jpg") || type.endsWith(".jpeg") || type.endsWith(".png") || type.endsWith(".mp3") || type.endsWith(".mp4")) return "far fa-file-image fa-lg"; 
                                                else if(type.toLowerCase().endsWith(".docx")) return "far fa-file-word fa-lg";
                                                else if(type.toLowerCase().endsWith(".pptx")) return "far fa-file-powerpoint fa-lg";
                                                else if(type.toLowerCase().endsWith(".txt") ||
                                                            type.toLowerCase().endsWith("md")) return "far fa-file-alt fa-lg";
                                                else if(type.toLowerCase().endsWith(".zip")) return "far fa-file-archive fa-lg";
                                                else if(type.toLowerCase().endsWith(".pdf")) return "far fa-file-pdf fa-lg";
                                                else if(type.toLowerCase().endsWith(".csv")) return "fas fa-file-csv fa-lg";
                                                else if(type.toLowerCase().endsWith(".xlsx")) return "far fa-file-excel fa-lg";
                                                else if(type.toLowerCase().endsWith(".js")) return "fab fa-js fa-lg";
                                                else if(type.toLowerCase().endsWith(".css")) return "far fa-css3-alt fa-lg";
                                                else if(type.toLowerCase().endsWith(".html")) return "far fa-html5 fa-lg";
                                                else if(type.toLowerCase().endsWith(".json")) return "far fa-file-code fa-lg";
                                                else if(type.toLowerCase().endsWith(".py")) return "far fa-python fa-lg";
                                                else return "far fa-question-circle fa-lg";     
                                            }}
                                            )}/>
                                        </cx>
                                    }, {
                                        header: 'Document',
                                        field: 'document',
                                        align: 'left',
                                        sortable: true,
                                        format: 'string'
                                    }, {
                                        header: 'Folder',
                                        field: 'folder',
                                        align: 'left',
                                        sortable: true,
                                        format: 'string'
                                    }, {
                                        header: 'User',
                                        field: 'user',
                                        align: 'left',
                                        sortable: true,
                                        format: 'string'
                                    },{
                                        header: 'Last Modified',
                                        field: 'lastModified',
                                        align: 'left',
                                        sortable: true,
                                        format: 'string'
                                    }
                                    ]}
                                    emptyText="No data was found!"
                                    selection={{ type: KeySelection, keyField: 'document', bind: "$page.selection" }}
                                    />
                            </Section>


                            <Section mod="card"
                                bodyStyle="display: flex; align-items: center"
                            >
                                <Pagination page-bind="$page.filter.page" pageCount-bind="$page.filter.pageCount" />
                                <Select value-bind="$page.filter.pageSize" style="margin-left: auto; width: 50px">
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </Select>
                                <span>
                                    records per page
                                </span>
                            </Section>
                        </FlexCol>
                    </div>
                </div>
            </Section>
        </PureContainer>
    </cx>
);
