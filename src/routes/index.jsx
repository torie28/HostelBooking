import { createBrowserRouter } from "react-router-dom";
import { Signup } from "../features/auth/pages/sign up/Signup";
import { Signin } from "../features/auth/pages/signin/Signin";
import NotFound from "../pages/components/PageNotfound";
import { StudentDashboard } from "../features/dashboards/studentdashboard/StudentDashboard";
import { AdminDashboard } from "../features/dashboards/Admindashboard/AdminDashboard";
import ProtectedRoute from "../components/ProtectedRoute";

const router = createBrowserRouter([
    {
        path: "/signup",
        element: <Signup />,
    },
    {
        path: "/",
        element: <Signin />,
    },
    {
        path: "/studentdashboard",
        element: (
            <ProtectedRoute>
                <StudentDashboard />
            </ProtectedRoute>
        ),
    },
    {
        path: "/admindashboard",
        element: (
            <ProtectedRoute>
                <AdminDashboard />
            </ProtectedRoute>
        )
    },
    {
        path: "*",
        element: <NotFound />,
    },
]);

export default router;
