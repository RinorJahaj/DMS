import {Route, RedirectRoute, Section, Sandbox, PureContainer} from "cx/widgets";
import {FirstVisibleChildLayout} from "cx/ui";

import AppLayout from "../layout";

import Search from "./Search";
import Login from "./login";

export default () => <cx>
    <PureContainer>
        <Login visible-expr="!{user}" />
        <Sandbox
            visible-expr="!!{user}"
            key-bind="url"
            storage-bind="pages"
            outerLayout={AppLayout}
            layout={FirstVisibleChildLayout}
        >
            <RedirectRoute route="~/" url-bind="url" redirect="~/search"/>
            <Route route="~/search" url-bind="url">
                <Search/>
            </Route>
            <Route route="~/login" url-bind="url">
                <Login/>
            </Route>
            <Section title="Page Not Found" mod="card">
                This page doesn't exists. Please check your URL.
            </Section>
        </Sandbox>
    </PureContainer>
</cx>;
