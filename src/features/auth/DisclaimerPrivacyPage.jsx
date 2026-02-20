import React from 'react';
import { Link } from 'react-router-dom';
import icon from "../../assets/python.png";

const DisclaimerPrivacyPage = () => {
    return (
        <div className='min-h-screen bg-secondary'>
            <section className='w-full border-b border-gray-300'>
                <div className='max-w-5xl mx-auto px-6 py-6 flex items-center gap-3'>
                    <img src={icon} alt="AI Desk" className='h-12 w-12' />
                    <p className='text-4xl font-bold text-primary'>AI.Desk</p>
                </div>
            </section>

            <section className='max-w-5xl mx-auto px-6 py-8 text-gray-700'>
                <p className='text-2xl leading-relaxed'>
                    This platform utilizes artificial intelligence technology powered by OpenAI to generate responses and provide information.
                    While the AI is designed to deliver accurate, relevant, and helpful insights based on the data and instructions it has been
                    trained on, the information provided should be considered for general informational purposes only. AI-generated content may
                    occasionally contain inaccuracies, omissions, or interpretations that do not fully reflect the most current standards,
                    regulations, or professional practices. Therefore, users are strongly advised to independently verify any critical
                    information before making decisions based on it.
                </p>

                <p className='text-2xl leading-relaxed mt-10'>
                    The content generated through this system does not constitute professional advice, including but not limited to medical,
                    legal, financial, technical, or other specialized guidance. For matters requiring expert evaluation, diagnosis, compliance,
                    or strategic decision-making, consultation with a qualified human professional is essential. By using this AI-powered service,
                    you acknowledge and agree that any reliance on the information provided is at your own discretion and risk. Always seek
                    appropriate expert advice to ensure accuracy, suitability, and compliance with applicable laws or professional standards.
                </p>

                <div className='mt-14 flex justify-center'>
                    <Link
                        to="/login"
                        className='bg-primary text-white px-20 py-3 rounded-md text-xl font-medium'
                    >
                        Back to Log In
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default DisclaimerPrivacyPage;
