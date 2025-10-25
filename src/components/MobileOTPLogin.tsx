import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Phone, MessageSquare, User, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MobileOTPLoginProps {
    onSuccess?: () => void;
}

const MobileOTPLogin: React.FC<MobileOTPLoginProps> = ({ onSuccess }) => {
    const { sendOTP, verifyOTP, resendOTP } = useAuth();
    const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const formatPhoneNumber = (value: string) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        
        // Always add India country code (+91) automatically
        return '+91' + digits;
    };

    const handleSendOTP = async () => {
        if (!phone || phone.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = formatPhoneNumber(phone);
            await sendOTP(formattedPhone, 'login');
            setOtpSent(true);
            setStep('otp');
            setCountdown(60);

            // Start countdown
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            toast.success('OTP sent successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = formatPhoneNumber(phone);
            await verifyOTP(formattedPhone, otp);
            toast.success('Login successful!');
            onSuccess?.();
        } catch (error: any) {
            if (error.message?.includes('User not found') || error.message?.includes('registration')) {
                setStep('register');
                toast.info('Please complete your registration');
            } else {
                toast.error(error.message || 'Invalid OTP');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name.trim()) {
            toast.error('Please enter your name');
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = formatPhoneNumber(phone);
            await verifyOTP(formattedPhone, otp, {
                name: name.trim(),
                dateOfBirth: dateOfBirth || undefined,
                gender: gender || undefined,
            });
            toast.success('Registration successful!');
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (countdown > 0) {
            toast.error(`Please wait ${countdown} seconds before resending`);
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = formatPhoneNumber(phone);
            await resendOTP(formattedPhone);
            setCountdown(60);

            // Start countdown
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            toast.success('OTP resent successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to resend OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'otp') {
            setStep('phone');
            setOtpSent(false);
            setOtp('');
        } else if (step === 'register') {
            setStep('otp');
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                    <Phone className="w-6 h-6" />
                    Mobile Login
                </CardTitle>
                <CardDescription>
                    {step === 'phone' && 'Enter your mobile number to get started'}
                    {step === 'otp' && 'Enter the OTP sent to your mobile'}
                    {step === 'register' && 'Complete your registration'}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {step === 'phone' && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Mobile Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+91 9876543210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSendOTP}
                            disabled={isLoading || !phone}
                            className="w-full"
                        >
                            {isLoading ? 'Sending...' : 'Send OTP'}
                        </Button>
                    </>
                )}

                {step === 'otp' && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="otp">Enter OTP</Label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="otp"
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="pl-10 text-center text-lg tracking-widest"
                                    maxLength={6}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                OTP sent to {phone}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleVerifyOTP}
                                disabled={isLoading || otp.length !== 6}
                                className="flex-1"
                            >
                                {isLoading ? 'Verifying...' : 'Verify OTP'}
                            </Button>
                        </div>

                        <div className="text-center">
                            {countdown > 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Resend OTP in {countdown}s
                                </p>
                            ) : (
                                <Button
                                    variant="link"
                                    onClick={handleResendOTP}
                                    disabled={isLoading}
                                    className="text-sm"
                                >
                                    Resend OTP
                                </Button>
                            )}
                        </div>
                    </>
                )}

                {step === 'register' && (
                    <>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="dateOfBirth"
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender (Optional)</Label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <select
                                        id="gender"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full h-10 pl-10 pr-3 border border-input bg-background rounded-md text-sm"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                        <option value="prefer-not-to-say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleRegister}
                                disabled={isLoading || !name.trim()}
                                className="flex-1"
                            >
                                {isLoading ? 'Registering...' : 'Complete Registration'}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default MobileOTPLogin;
