import { Routes } from '@angular/router';
import { Home } from './features/home/pages/home/home'
import { Liveboard } from './features/liveboard/pages/liveboard/liveboard';
import { Connections } from './features/connections/pages/connections/connections';
export const routes: Routes = [
    { path: '', component: Home },
    { path: 'liveboard', component: Liveboard },
    { path: 'connections', component: Connections}
];
