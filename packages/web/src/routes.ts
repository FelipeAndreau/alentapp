import { createBrowserRouter } from 'react-router';
import { MembersView } from './views/Members';
import { HomeView } from './views/Home';
import { PaymentsView } from './views/Payments';
import { DisciplinesView } from './views/Disciplines';
import { LockersView } from './views/Lockers';
import { SportsView } from './views/Sports';
import { EnrollmentsView } from './views/Enrollments';
import Layout from './Layout';

export let router = createBrowserRouter([
    {
        Component: Layout,
        children: [
            {
                path: '/',
                Component: HomeView,
            },
            {
                path: '/members',
                Component: MembersView,
            },
            {
                path: '/payments',
                Component: PaymentsView,
            },
            {
                path: '/disciplines',
                Component: DisciplinesView,
            },
            {
                path: '/lockers',
                Component: LockersView,
            },
            {
                path: '/sports',
                Component: SportsView,
            },
            {
                path: '/enrollments',
                Component: EnrollmentsView,
            },
        ],
    },
]);
