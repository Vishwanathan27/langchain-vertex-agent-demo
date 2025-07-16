import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

const LandingPage: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  return (
    <>
      {isLoginMode ? (
        <LoginForm onSwitchToSignup={() => setIsLoginMode(false)} />
      ) : (
        <SignupForm onSwitchToLogin={() => setIsLoginMode(true)} />
      )}
    </>
  );
};

export default LandingPage;