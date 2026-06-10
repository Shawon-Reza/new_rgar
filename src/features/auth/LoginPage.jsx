import React, { useState } from 'react';
import img from "../../assets/medim.png";
import icon from "../../assets/loginLogo.png";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiActivity, FiLock, FiMail, FiServer, FiShield } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import axios from 'axios';
import { base_URL } from '../../config/Config';
import { Link, useNavigate } from 'react-router-dom';
import { getDeviceInfo } from '../../service/device';

const ClinicLogo = ({ light = false }) => (
    <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-2xl ${light ? 'bg-white/15 text-white ring-1 ring-white/20' : 'bg-[#2B76F4] text-white'}`}>
            <FiActivity size={20} />
        </div>
        <div>
            <img src={icon} alt="Kyro AI" className={`h-6 w-[132px] object-contain ${light ? '' : 'rounded bg-[#0f172a] px-2 py-1'}`} />
            <p className={`mt-1 text-[9px] font-black uppercase tracking-[0.2em] ${light ? 'text-blue-100' : 'text-slate-400'}`}>
                Clinical Portal
            </p>
        </div>
    </div>
);

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');

        try {
            const payload = {
                email,
                password,
                ...getDeviceInfo(),
            };
            const response = await axios.post(`${base_URL}/api/v1/login/`, payload);
            toast.success('Login successful');

            if (response?.data) {
                const { access, refresh } = response.data;
                if (access || refresh) {
                    localStorage.setItem('auth', JSON.stringify({ access, refresh }));
                }
            }

            navigate('/admin/assistance', {
                replace: true,
                state: { openAiAssistant: true },
            });
        } catch (error) {
            const message = error?.response?.data?.message || 'Login failed. Please check your credentials and try again.';
            setErrorMessage(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-gradient-to-tr from-[#2B76F4] via-[#3b82f6] to-[#7cb2ff] p-4 text-[#1e293b]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[7%] top-[8%] h-32 w-32 animate-pulse rounded-full bg-white/20 blur-[2px]" />
                <div className="absolute bottom-[6%] right-[8%] h-44 w-44 rounded-full bg-white/15 blur-[4px]" />
                <div className="absolute right-[3%] top-[45%] h-20 w-20 rounded-full bg-white/10 blur-[1px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,0.025)_1.5px,transparent_1.5px)] bg-[size:50px_50px]" />
            </div>

            <div className="relative z-10 my-6 w-full max-w-5xl">
                <section className="grid min-h-[660px] w-full overflow-hidden rounded-[2.5rem] bg-white shadow-[0_35px_100px_-15px_rgba(43,118,244,0.42)] lg:grid-cols-[1fr_1fr]">
                    <aside className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
                        <div className="absolute inset-0">
                            <img
                                src={img}
                                alt="Pristine medical workspace"
                                className="h-full w-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#2B76F4]/92 via-[#2B76F4]/62 to-[#7cb2ff]/38 mix-blend-multiply" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#2B76F4]/22" />
                        </div>

                        <div className="relative z-10">
                            <ClinicLogo light />
                        </div>

                        <div className="relative z-10 my-auto max-w-md py-10">
                            <span className="mb-3 block text-left text-5xl font-light leading-tight tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                                Kyro Care Portal
                            </span>
                            <p className="text-left text-sm font-medium leading-relaxed tracking-wide text-blue-50/90 drop-shadow-sm">
                                Medicine is a journey of precision, enabling recovery and nurturing clinical wellness step by step.
                            </p>
                            <div className="mt-8 flex items-center gap-3 border-t border-white/15 pt-6">
                                <div className="h-2 w-2 animate-ping rounded-full bg-emerald-300" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
                                    Precision Clinical Operations Network
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4">
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-100">
                                <FiShield size={14} className="text-emerald-300" />
                                <span>Protected clinical terminal</span>
                            </div>
                            <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[9px] tracking-wider text-blue-100">
                                SECURE ENDPOINT
                            </span>
                        </div>
                    </aside>

                    <section className="relative flex shrink-0 flex-col justify-between overflow-hidden bg-white px-8 py-10 sm:px-12 lg:px-14">
                        <div className="relative z-10 mb-8 flex items-center justify-between lg:hidden">
                            <ClinicLogo />
                            <span className="h-2 w-2 animate-pulse rounded-full bg-[#2B76F4]" />
                        </div>

                        <div className="hidden h-6 lg:block" />

                        <div className="relative z-10 mx-auto w-full max-w-[360px] py-2">
                            <div className="mb-8 text-center lg:text-left">
                                <div className="relative hidden h-1 justify-end pr-4 text-[#2B76F4] lg:flex">
                                    <div className="absolute right-0 -top-8 flex flex-col items-center text-[#2B76F4] opacity-80">
                                        <div className="relative w-24 border-t border-dashed border-[#2B76F4]/40">
                                            <span className="absolute right-0 -top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-white">
                                                <FiActivity size={10} className="text-[#2B76F4]" />
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <h2 className="text-4xl font-extrabold leading-none tracking-tight text-[#2B76F4]">
                                    Welcome
                                </h2>
                                <p className="mt-1.5 text-xs font-semibold tracking-wider text-slate-400">
                                    Log in with email
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="block">
                                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#2B76F4]">
                                        Email
                                    </span>
                                    <span className="relative block">
                                        <FiMail className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'email' ? 'text-[#2B76F4]' : 'text-slate-400'}`} />
                                        <input
                                            type="email"
                                            value={email}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@clinic.com"
                                            className={`h-11 w-full rounded-xl border pl-11 pr-4 text-xs font-semibold text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-300 ${focusedField === 'email' ? 'border-[#2B76F4] bg-white shadow-[0_0_12px_rgba(43,118,244,0.16)]' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'}`}
                                            required
                                            disabled={isLoading}
                                        />
                                    </span>
                                </div>

                                <div className="block">
                                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#2B76F4]">
                                        Password
                                    </span>
                                    <span className="relative block">
                                        <FiLock className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'password' ? 'text-[#2B76F4]' : 'text-slate-400'}`} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter password"
                                            className={`h-11 w-full rounded-xl border pl-11 pr-11 text-xs font-semibold text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-300 ${focusedField === 'password' ? 'border-[#2B76F4] bg-white shadow-[0_0_12px_rgba(43,118,244,0.16)]' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'}`}
                                            required
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                        </button>
                                    </span>
                                    <Link to="/forgot-password" className="mt-2 block text-right text-[10px] font-semibold text-slate-400 hover:text-[#2B76F4]">
                                        Forgot password?
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#2B76F4] to-[#65a0ff] px-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#2B76F4]/20 transition-all hover:shadow-xl hover:shadow-[#2B76F4]/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            <span>Entering Secure Terminal...</span>
                                        </div>
                                    ) : (
                                        <span>Login</span>
                                    )}
                                </button>
                            </form>

                            {errorMessage && (
                                <div className="mt-5 overflow-hidden rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 text-left text-slate-700">
                                    <div className="flex items-start gap-2.5">
                                        <FiServer className="mt-0.5 h-4 w-4 shrink-0 animate-pulse text-[#2B76F4]" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wide text-[#2B76F4]">
                                                Login Failed
                                            </p>
                                            <p className="mt-0.5 text-[10px] font-medium leading-normal text-slate-500">
                                                {errorMessage}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-0 h-16 select-none text-[#2B76F4] opacity-[0.09]">
                            <svg className="h-full w-full" viewBox="0 0 400 60" preserveAspectRatio="none" fill="currentColor">
                                <path d="M0,60 L20,60 L20,35 L35,35 L35,60 L50,60 L50,20 L65,20 L65,30 L75,30 L75,10 L90,10 L90,60 L110,60 L110,40 L125,40 L125,45 L140,45 L140,60 L160,60 L170,50 L180,50 L195,30 L205,45 L215,15 L225,55 L235,50 L245,60 L270,60 L270,30 L280,30 L280,25 h10 v5 h10 L300,60 L320,60 L320,40 L340,40 L340,60 L360,60 L365,15 L375,15 L375,30 L385,30 L385,60 L400,60 Z" />
                                <rect x="55" y="25" width="5" height="1.5" />
                                <rect x="56.5" y="23" width="1.5" height="5.5" />
                                <rect x="80" y="20" width="5" height="1.5" />
                                <rect x="81.5" y="18" width="1.5" height="5.5" />
                                <rect x="367" y="20" width="6" height="1.5" />
                                <rect x="369.2" y="17" width="1.5" height="7.5" />
                            </svg>
                        </div>

                        <footer className="relative z-10 w-full border-t border-slate-50 bg-transparent py-2 text-center text-[10px] font-semibold text-slate-400">
                            <div className="flex justify-center gap-3">
                                <Link to="/disclaimer-privacy" className="transition-colors hover:text-[#2B76F4]">Disclaimer</Link>
                                <span className="text-slate-200">|</span>
                                <Link to="/disclaimer-privacy" className="transition-colors hover:text-[#2B76F4]">Privacy policy</Link>
                            </div>
                            <p className="mt-1 font-mono text-[8px] uppercase tracking-wider text-slate-400">
                                Kyro AI Secure - 2026 All Rights Reserved
                            </p>
                        </footer>
                    </section>
                </section>
            </div>
        </main>
    );
};

export default LoginPage;
