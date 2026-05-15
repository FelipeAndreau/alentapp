import { createBrowserRouter } from "react-router";
import { MembersView } from "./views/Members";
import { HomeView } from "./views/Home";
import { PaymentsView } from "./views/Payments";
import { DisciplinesView } from "./views/Disciplines";
<<<<<<< HEAD
import { LockersView } from "./views/Lockers";
=======
>>>>>>> origin/feature/discipline-read
import Layout from "./Layout";

export let router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        path: "/",
        Component: HomeView,
      },
      {
        path: "/members",
        Component: MembersView,
      },
      {
        path: "/payments",
        Component: PaymentsView,
      },
      {
        path: "/disciplines",
        Component: DisciplinesView,
<<<<<<< HEAD
      },
      {
        path: "/lockers",
        Component: LockersView,
=======
>>>>>>> origin/feature/discipline-read
      },
    ],
  },
]);