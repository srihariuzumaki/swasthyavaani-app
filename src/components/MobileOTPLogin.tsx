import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AppLogo } from './ui/AppLogo';
import { Phone, MessageSquare, User, Calendar, Users, Loader2, CheckCircle2, Sparkles, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface MobileOTPLoginProps {
    onSuccess?: () => void;
}

interface CountryCode {
    code: string;
    dialCode: string;
    name: string;
}

const COUNTRY_CODES: CountryCode[] = [
    { code: 'IN', dialCode: '+91', name: 'India' },
    { code: 'US', dialCode: '+1', name: 'United States' },
    { code: 'GB', dialCode: '+44', name: 'United Kingdom' },
    { code: 'CA', dialCode: '+1', name: 'Canada' },
    { code: 'AU', dialCode: '+61', name: 'Australia' },
    { code: 'BD', dialCode: '+880', name: 'Bangladesh' },
    { code: 'PK', dialCode: '+92', name: 'Pakistan' },
    { code: 'NP', dialCode: '+977', name: 'Nepal' },
    { code: 'LK', dialCode: '+94', name: 'Sri Lanka' },
    { code: 'SG', dialCode: '+65', name: 'Singapore' },
    { code: 'MY', dialCode: '+60', name: 'Malaysia' },
    { code: 'AE', dialCode: '+971', name: 'United Arab Emirates' },
    { code: 'SA', dialCode: '+966', name: 'Saudi Arabia' },
    { code: 'KW', dialCode: '+965', name: 'Kuwait' },
    { code: 'QA', dialCode: '+974', name: 'Qatar' },
    { code: 'OM', dialCode: '+968', name: 'Oman' },
    { code: 'BH', dialCode: '+973', name: 'Bahrain' },
    { code: 'ZA', dialCode: '+27', name: 'South Africa' },
    { code: 'NZ', dialCode: '+64', name: 'New Zealand' },
    { code: 'DE', dialCode: '+49', name: 'Germany' },
    { code: 'FR', dialCode: '+33', name: 'France' },
    { code: 'IT', dialCode: '+39', name: 'Italy' },
    { code: 'ES', dialCode: '+34', name: 'Spain' },
    { code: 'NL', dialCode: '+31', name: 'Netherlands' },
    { code: 'BE', dialCode: '+32', name: 'Belgium' },
    { code: 'CH', dialCode: '+41', name: 'Switzerland' },
    { code: 'AT', dialCode: '+43', name: 'Austria' },
    { code: 'SE', dialCode: '+46', name: 'Sweden' },
    { code: 'NO', dialCode: '+47', name: 'Norway' },
    { code: 'DK', dialCode: '+45', name: 'Denmark' },
    { code: 'FI', dialCode: '+358', name: 'Finland' },
    { code: 'PL', dialCode: '+48', name: 'Poland' },
    { code: 'PT', dialCode: '+351', name: 'Portugal' },
    { code: 'GR', dialCode: '+30', name: 'Greece' },
    { code: 'IE', dialCode: '+353', name: 'Ireland' },
    { code: 'JP', dialCode: '+81', name: 'Japan' },
    { code: 'KR', dialCode: '+82', name: 'South Korea' },
    { code: 'CN', dialCode: '+86', name: 'China' },
    { code: 'HK', dialCode: '+852', name: 'Hong Kong' },
    { code: 'TW', dialCode: '+886', name: 'Taiwan' },
    { code: 'TH', dialCode: '+66', name: 'Thailand' },
    { code: 'ID', dialCode: '+62', name: 'Indonesia' },
    { code: 'PH', dialCode: '+63', name: 'Philippines' },
    { code: 'VN', dialCode: '+84', name: 'Vietnam' },
    { code: 'BR', dialCode: '+55', name: 'Brazil' },
    { code: 'MX', dialCode: '+52', name: 'Mexico' },
    { code: 'AR', dialCode: '+54', name: 'Argentina' },
    { code: 'CL', dialCode: '+56', name: 'Chile' },
    { code: 'CO', dialCode: '+57', name: 'Colombia' },
    { code: 'PE', dialCode: '+51', name: 'Peru' },
    { code: 'RU', dialCode: '+7', name: 'Russia' },
    { code: 'TR', dialCode: '+90', name: 'Turkey' },
    { code: 'EG', dialCode: '+20', name: 'Egypt' },
    { code: 'NG', dialCode: '+234', name: 'Nigeria' },
    { code: 'KE', dialCode: '+254', name: 'Kenya' },
];

const MobileOTPLogin: React.FC<MobileOTPLoginProps> = ({ onSuccess }) => {
    const { t } = useTranslation();
    const { sendOTP, verifyOTP, resendOTP } = useAuth();
    const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
    const [countryCode, setCountryCode] = useState<string>('+91');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [animateStep, setAnimateStep] = useState(false);

    const selectedCountry = COUNTRY_CODES.find(c => c.dialCode === countryCode) || COUNTRY_CODES[0];

    useEffect(() => {
        setAnimateStep(true);
        const timer = setTimeout(() => setAnimateStep(false), 500);
        return () => clearTimeout(timer);
    }, [step]);

    const formatPhoneNumber = (value: string) => {
        const digits = value.replace(/\D/g, '');
        return countryCode + digits;
    };

    const handleSendOTP = async () => {
        const phoneDigits = phone.replace(/\D/g, '');
        if (!phoneDigits || phoneDigits.length < 7) {
            toast.error(t('login.validPhoneRequired', { defaultValue: 'Please enter a valid phone number' }));
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = formatPhoneNumber(phone);
            await sendOTP(formattedPhone, 'login');
            setOtpSent(true);
            setStep('otp');
            setCountdown(60);

            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            toast.success(t('login.otpSentSuccess', { defaultValue: 'OTP sent successfully!' }));
        } catch (error: any) {
            toast.error(error.message || t('login.sendOTPFailed', { defaultValue: 'Failed to send OTP' }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            toast.error(t('login.validOTPRequired', { defaultValue: 'Please enter a valid 6-digit OTP' }));
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = formatPhoneNumber(phone);
            await verifyOTP(formattedPhone, otp);
            toast.success(t('login.loginSuccess', { defaultValue: 'Login successful!' }));
            onSuccess?.();
        } catch (error: any) {
            if (error.message?.includes('User not found') || error.message?.includes('registration')) {
                setStep('register');
                toast.info(t('login.completeRegistrationPrompt', { defaultValue: 'Please complete your registration' }));
            } else {
                toast.error(error.message || t('login.invalidOTP', { defaultValue: 'Invalid OTP' }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!name.trim()) {
            toast.error(t('login.nameRequired', { defaultValue: 'Please enter your name' }));
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
            toast.success(t('login.registrationSuccess', { defaultValue: 'Registration successful!' }));
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.message || t('login.registrationFailed', { defaultValue: 'Registration failed' }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (countdown > 0) {
            toast.error(t('login.waitBeforeResend', { count: countdown, defaultValue: `Please wait {{count}} seconds before resending` }));
            return;
        }

        setIsLoading(true);
        try {
            const formattedPhone = formatPhoneNumber(phone);
            await resendOTP(formattedPhone);
            setCountdown(60);

            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            toast.success(t('login.resendSuccess', { defaultValue: 'OTP resent successfully!' }));
        } catch (error: any) {
            toast.error(error.message || t('login.resendFailed', { defaultValue: 'Failed to resend OTP' }));
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

    const getStepIcon = () => {
        if (step === 'phone') return <Phone className="w-8 h-8 animate-pulse" />;
        if (step === 'otp') return <MessageSquare className="w-8 h-8 animate-bounce" />;
        return <User className="w-8 h-8 animate-pulse" />;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className={`w-full max-w-md transition-all duration-500 relative z-10 ${animateStep ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                {/* App Name Header */}
                <div className="text-center mb-6 animate-fade-in">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <AppLogo size="md" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-1">
                        {t('app.name', { defaultValue: 'Swasthya Vaani' })}
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        {t('app.tagline', { defaultValue: 'Your Health Companion' })}
                    </p>
                </div>

                <Card className="border-0 shadow-[var(--shadow-medical)] backdrop-blur-sm bg-card/95 animate-fade-in">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-br from-primary via-secondary to-accent p-6 pt-8 rounded-t-xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        }}></div>
                        
                        <div className="relative z-10 text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/30 shadow-lg animate-pulse">
                                {getStepIcon()}
                            </div>
                            
                            <div>
                                <CardTitle className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                                    {step === 'phone' ? (
                                        <>
                                            <Phone className="w-5 h-5" />
                                            {t('login.mobileLogin', { defaultValue: 'Mobile Login' })}
                                        </>
                                    ) : step === 'otp' ? (
                                        <>
                                            <MessageSquare className="w-5 h-5" />
                                            {t('login.enterOTPField', { defaultValue: 'Enter OTP' })}
                                        </>
                                    ) : (
                                        <>
                                            <User className="w-5 h-5" />
                                            {t('login.completeRegistration', { defaultValue: 'Complete Registration' })}
                                        </>
                                    )}
                                </CardTitle>
                                <CardDescription className="text-white/90 text-base">
                                    {step === 'phone' && t('login.enterPhone', { defaultValue: 'Enter your mobile number to get started' })}
                                    {step === 'otp' && t('login.enterOTP', { defaultValue: 'Enter the OTP sent to your mobile' })}
                                    {step === 'register' && t('login.completeRegistration', { defaultValue: 'Complete your registration' })}
                                </CardDescription>
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-6 space-y-6">
                        {step === 'phone' && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="space-y-3">
                                    <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-primary" />
                                        {t('login.mobileNumber', { defaultValue: 'Mobile Number' })}
                                    </Label>
                                    <div className="flex gap-3">
                                        <Select value={countryCode} onValueChange={setCountryCode}>
                                            <SelectTrigger className="w-[150px] shrink-0 h-12 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 hover:border-primary/40 transition-all shadow-sm">
                                                <SelectValue>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base font-semibold">{selectedCountry.dialCode}</span>
                                                        <span className="text-xs text-muted-foreground hidden sm:inline bg-primary/10 px-2 py-0.5 rounded">
                                                            {selectedCountry.code}
                                                        </span>
                                                    </div>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {COUNTRY_CODES.map((country) => (
                                                    <SelectItem key={country.code} value={country.dialCode}>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-semibold w-16">{country.dialCode}</span>
                                                            <span className="text-muted-foreground">{country.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <div className="relative flex-1 group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary group-focus-within:text-accent transition-colors z-10" />
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="9876543210"
                                                value={phone}
                                                onChange={(e) => {
                                                    const digits = e.target.value.replace(/\D/g, '');
                                                    setPhone(digits);
                                                }}
                                                className="pl-12 h-12 text-base border-2 border-input/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm bg-gradient-to-br from-background to-muted/30"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-primary/5 border border-primary/10">
                                        <Lock className="w-4 h-4 text-primary" />
                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-semibold text-primary">{selectedCountry.dialCode}</span>{' '}
                                            {phone || <span className="italic">{t('login.enterPhone', { defaultValue: 'Enter your phone number' })}</span>}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSendOTP}
                                    disabled={isLoading || !phone}
                                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all shadow-[var(--shadow-medical)] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                    size="lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            {t('login.sending', { defaultValue: 'Sending...' })}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5 mr-2" />
                                            {t('login.sendOTP', { defaultValue: 'Send OTP' })}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {step === 'otp' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4 animate-pulse">
                                        <MessageSquare className="w-8 h-8 text-primary" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {t('login.otpSentTo', { phone: formatPhoneNumber(phone), defaultValue: 'OTP sent to {{phone}}' })}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="otp" className="text-base font-semibold flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-primary" />
                                        {t('login.enterOTPField', { defaultValue: 'Enter OTP' })}
                                    </Label>
                                    <div className="relative group">
                                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary group-focus-within:text-accent transition-colors z-10" />
                                        <Input
                                            id="otp"
                                            type="text"
                                            placeholder="000000"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="pl-12 pr-4 h-14 text-center text-2xl font-bold tracking-[0.5em] border-2 border-input/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm bg-gradient-to-br from-background to-muted/30"
                                            maxLength={6}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-center">
                                        {[...Array(6)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-3 h-3 rounded-full transition-all ${
                                                    i < otp.length
                                                        ? 'bg-primary scale-125 animate-pulse'
                                                        : 'bg-muted-foreground/30'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleBack}
                                        disabled={isLoading}
                                        className="flex-1 h-12 border-2 hover:bg-muted transition-all"
                                    >
                                        {t('common.back', { defaultValue: 'Back' })}
                                    </Button>
                                    <Button
                                        onClick={handleVerifyOTP}
                                        disabled={isLoading || otp.length !== 6}
                                        className="flex-1 h-12 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all shadow-[var(--shadow-medical)] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                        size="lg"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                {t('login.verifying', { defaultValue: 'Verifying...' })}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                                {t('login.verifyOTP', { defaultValue: 'Verify OTP' })}
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <div className="text-center space-y-2">
                                    {countdown > 0 ? (
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {t('login.resendOTPIn', { count: countdown, defaultValue: 'Resend OTP in {{count}}s' })}
                                            </p>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="link"
                                            onClick={handleResendOTP}
                                            disabled={isLoading}
                                            className="text-sm text-primary hover:text-accent transition-colors font-semibold"
                                        >
                                            {t('login.resendOTP', { defaultValue: 'Resend OTP' })}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 'register' && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                                            <User className="w-4 h-4 text-primary" />
                                            {t('login.fullName', { defaultValue: 'Full Name *' })}
                                        </Label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary group-focus-within:text-accent transition-colors z-10" />
                                            <Input
                                                id="name"
                                                type="text"
                                                placeholder={t('login.fullNamePlaceholder', { defaultValue: 'Enter your full name' })}
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="pl-12 h-12 text-base border-2 border-input/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm bg-gradient-to-br from-background to-muted/30"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="dateOfBirth" className="text-base font-semibold flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            {t('login.dateOfBirth', { defaultValue: 'Date of Birth (Optional)' })}
                                        </Label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary group-focus-within:text-accent transition-colors z-10" />
                                            <Input
                                                id="dateOfBirth"
                                                type="date"
                                                value={dateOfBirth}
                                                onChange={(e) => setDateOfBirth(e.target.value)}
                                                className="pl-12 h-12 text-base border-2 border-input/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm bg-gradient-to-br from-background to-muted/30"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gender" className="text-base font-semibold flex items-center gap-2">
                                            <Users className="w-4 h-4 text-primary" />
                                            {t('login.gender', { defaultValue: 'Gender (Optional)' })}
                                        </Label>
                                        <div className="relative group">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary group-focus-within:text-accent transition-colors z-10" />
                                            <select
                                                id="gender"
                                                value={gender}
                                                onChange={(e) => setGender(e.target.value)}
                                                className="w-full h-12 pl-12 pr-4 border-2 border-input/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm bg-gradient-to-br from-background to-muted/30 rounded-md text-base"
                                            >
                                                <option value="">{t('login.selectGender', { defaultValue: 'Select Gender' })}</option>
                                                <option value="male">{t('login.male', { defaultValue: 'Male' })}</option>
                                                <option value="female">{t('login.female', { defaultValue: 'Female' })}</option>
                                                <option value="other">{t('login.other', { defaultValue: 'Other' })}</option>
                                                <option value="prefer-not-to-say">{t('login.preferNotToSay', { defaultValue: 'Prefer not to say' })}</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleBack}
                                        disabled={isLoading}
                                        className="flex-1 h-12 border-2 hover:bg-muted transition-all"
                                    >
                                        {t('common.back', { defaultValue: 'Back' })}
                                    </Button>
                                    <Button
                                        onClick={handleRegister}
                                        disabled={isLoading || !name.trim()}
                                        className="flex-1 h-12 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all shadow-[var(--shadow-medical)] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                                        size="lg"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                {t('login.registering', { defaultValue: 'Registering...' })}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-5 h-5 mr-2" />
                                                {t('login.completeRegistrationButton', { defaultValue: 'Complete Registration' })}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MobileOTPLogin;
