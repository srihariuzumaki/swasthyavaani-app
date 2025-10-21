import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MobileOTPLogin from "@/components/MobileOTPLogin";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        // If user is already authenticated, redirect to home
        if (isAuthenticated) {
            navigate("/home");
        }
    }, [isAuthenticated, navigate]);

    const handleLoginSuccess = () => {
        navigate("/home");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
            <MobileOTPLogin onSuccess={handleLoginSuccess} />
        </div>
    );
};

export default Login;
