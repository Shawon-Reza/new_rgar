import React, { useState } from 'react';
import img from "../../assets/authimg.png";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import icon from "../../assets/python.png";
// import axiosApi from "../../service/axiosInstance";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { base_URL } from '../../config/Config';
import { useNavigate } from 'react-router-dom';


const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            console.log()
            const response = await axios.post(`${base_URL}/api/v1/login/`, {
                email,
                password,
            });
            console.log(response)
            toast.success('Login successful');
            navigate('/admin', { replace: true });
            // Saved auth tokens if returned
            if (response?.data) {
                const { access, refresh } = response.data;
                if (access || refresh) {
                    localStorage.setItem('auth', JSON.stringify({ access, refresh }));
                }
            }

            // navigate or update global state here if needed
        } catch (error) {
            const message = error?.response?.data?.detail || error.message || 'Login failed';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='min-h-screen md:flex bg-secondary'>
            {/* Left Section - Login Form */}
            <section className='relative w-full h-screen md:w-1/2 flex items-center justify-center  p-8'>
                <div>
                    <div className='text-center mb-8'>
                        <h1 className='text-4xl font-bold primarycolor mb-2 text-primary'>
                            Sign in to your account
                        </h1>
                    </div>

                    <div className='w-full max-w-xl bg-white p-4 px-6 md:px-12 py-8 rounded-xl shadow-lg z-10'>


                        <form onSubmit={handleSubmit} className='space-y-6'>
                            {/* Email Section */}
                            <div className='space-y-4'>
                                <h2 className='text-lg font-semibold text-gray-700'>
                                    Email address
                                </h2>
                                <div className='w-full'>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className='w-full p-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Section */}
                            <div className='space-y-4'>
                                <h2 className='text-lg font-semibold text-gray-700'>
                                    Password
                                </h2>
                                <div className='relative w-full'>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className='w-full p-3 pr-10 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                        required
                                    />
                                    <span
                                        className='absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500'
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </span>
                                </div>
                            </div>


                            {/* Sign In Section */}
                            <div className='space-y-4'>
                                {/* 
                                <CommonButton
                                    className="w-full "
                                    type="submit"
                                    text="Login"
                                /> */}

                                <button className='bg-primary w-full py-2 font-semibold text-white rounded-lg cursor-pointer'>
                                    Login
                                </button>

                            </div>


                        </form>

                    </div>

                    {/* Disclaimer */}
                    <div className='mt-8 text-center'>
                        <p className='text-sm text-gray-500'>
                            <strong className='text-primary'>Disclaimer:</strong><br />
                            All Rights Reserved
                        </p>
                    </div>
                </div>
                {/* Absolute title display */}
                <div className='absolute top-8 left-7 flex items-center gap-2 primarycolor'>
                    <img src={icon} alt=""
                        className='h-12 w-12'
                    />
                    <p className='text-3xl font-bold'>AI.Desk</p>
                </div>

            </section>

            {/* Right Section - Image */}
            <section className='w-full md:w-1/2 h-screen hidden md:block'>
                <figure className='h-full'>
                    <img
                        src={img}
                        alt="Authentication visual"
                        className='w-full h-full object-cover'
                    />
                </figure>
            </section>

        </div>
    );
};

export default LoginPage;