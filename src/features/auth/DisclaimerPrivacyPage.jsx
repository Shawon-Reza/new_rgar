import React from 'react';
import { Link } from 'react-router-dom';
import icon from "../../assets/python.png";
import { FiArrowLeft } from 'react-icons/fi';

const DisclaimerPrivacyPage = () => {
    return (
        <main className='relative min-h-[100dvh] overflow-hidden bg-gradient-to-tr from-[#2B76F4] via-[#3b82f6] to-[#7cb2ff] px-4 py-6 text-[#1e293b] sm:px-6 lg:px-8'>
            <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,0.025)_1.5px,transparent_1.5px)] bg-[size:50px_50px]' />

            <section className='relative z-10 mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-5xl flex-col justify-center'>
                <div className='overflow-hidden rounded-[2rem] bg-white shadow-[0_35px_100px_-15px_rgba(43,118,244,0.42)]'>
                    <header className='relative overflow-hidden border-b border-slate-100 bg-slate-50/80 px-6 py-6 sm:px-10'>
                        <div className='pointer-events-none absolute bottom-0 right-0 h-24 w-64 translate-y-10 text-[#2B76F4] opacity-[0.08]'>
                            <svg className='h-full w-full' viewBox='0 0 400 120' preserveAspectRatio='none' fill='currentColor'>
                                <path d='M0,120 L25,120 L25,70 L45,70 L45,120 L70,120 L70,45 L95,45 L95,62 L110,62 L110,25 L130,25 L130,120 L160,120 L160,78 L185,78 L185,92 L215,92 L230,60 L245,82 L260,30 L278,112 L295,95 L312,120 L340,120 L340,62 L355,62 L355,48 L372,48 L372,120 L400,120 Z' />
                            </svg>
                        </div>

                        <div className='relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
                            <div className='flex items-center gap-4'>
                                <div className='grid h-14 w-14 place-items-center rounded-2xl bg-[#2B76F4] shadow-lg shadow-[#2B76F4]/20'>
                                    <img src={icon} alt="AI Desk" className='h-8 w-8 object-contain' />
                                </div>
                                <p className='text-4xl font-bold tracking-tight text-[#2B76F4]'>AI.Desk</p>
                            </div>

                            <Link
                                to="/login"
                                className='inline-flex h-10 w-fit items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-4 text-sm font-semibold text-[#2B76F4] shadow-sm transition-all hover:border-[#2B76F4]/30 hover:bg-blue-50 hover:shadow-md active:scale-[0.98]'
                            >
                                <FiArrowLeft size={16} />
                                Back to Log In
                            </Link>
                        </div>
                    </header>

                    <section className='px-6 py-8 text-slate-700 sm:px-10 sm:py-10 lg:px-12'>
                        <div className='mx-auto max-w-4xl'>
                            <div className='space-y-8 border-l-4 border-[#2B76F4] pl-5 sm:pl-7'>
                                <p className='text-base font-medium leading-8 sm:text-lg'>
                                    This platform utilizes artificial intelligence technology powered by OpenAI to generate responses and provide information.
                                    While the AI is designed to deliver accurate, relevant, and helpful insights based on the data and instructions it has been
                                    trained on, the information provided should be considered for general informational purposes only. AI-generated content may
                                    occasionally contain inaccuracies, omissions, or interpretations that do not fully reflect the most current standards,
                                    regulations, or professional practices. Therefore, users are strongly advised to independently verify any critical
                                    information before making decisions based on it.
                                </p>

                                <p className='text-base font-medium leading-8 sm:text-lg'>
                                    The content generated through this system does not constitute professional advice, including but not limited to medical,
                                    legal, financial, technical, or other specialized guidance. For matters requiring expert evaluation, diagnosis, compliance,
                                    or strategic decision-making, consultation with a qualified human professional is essential. By using this AI-powered service,
                                    you acknowledge and agree that any reliance on the information provided is at your own discretion and risk. Always seek
                                    appropriate expert advice to ensure accuracy, suitability, and compliance with applicable laws or professional standards.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </section>
        </main>
    );
};

export default DisclaimerPrivacyPage;
