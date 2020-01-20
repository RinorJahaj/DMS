import {Section, PureContainer, FlexRow, Button, TextField, ValidationGroup, Select} from "cx/widgets";
import { KeySelection, ContentPlaceholder, computable } from 'cx/ui';
import Controller from "./Controller";
import {Auth} from "../../api/Auth";

export default (
    <cx>
        <PureContainer
            visible-expr="!{user}"
            controller={Controller}
        >
            <div style="height: 100%; display: flex; align-items: center; justify-content: center">
                <Section mod="card">
                    <h3>Sign In</h3>
                    <p style="font-size: smaller; color: gray">Please sign to get access to the product.</p>
                    <ValidationGroup valid-bind="login.valid">
                        <form style="margin-top: -15px" onSubmit="login">
                            <TextField value-bind="login.username" label="Username" required autoFocus/>
                            <br/>
                            <TextField value-bind="login.password" label="Password" inputType="password" required/>
                            <br/>
                            <Button mod="primary" enabled-bind="login.valid" style="margin-top: 30px" submit>
                                Sign In
                            </Button>
                        </form>
                    </ValidationGroup>
                </Section>
            </div>
        </PureContainer>
        <PureContainer
            visible-expr="!!{user}"
        >
            <div class="loginSection">
            <h2 putInto="header">Admin</h2>
                <FlexRow mod="card" style="height: 40%; width: 50%" bodyStyle="display: inline-flex; align-items: right"> 
                    <p>You're logged in as <strong text-bind="user.username"/>.</p>
                    
                </FlexRow>
                <FlexRow>
                    <TextField  style=" width: 25%" placeholder="Add a list of users you'd like to manage."></TextField>
                </FlexRow>
                <FlexRow style="padding: 20px">
                    <Button
                        mod="primary"
                        text="Log In"
                        onClick={() => {
                            window.open('https://onedrive.live.com/about/en-us/signin/');
                        }}
                    />
                    <Button
                        mod="hollow"
                        text="Log Out"
                        onClick={() => {
                            Auth.signOut();
                        }}
                    />
                        
                </FlexRow>
            </div>
            
        </PureContainer>
    </cx>
);
