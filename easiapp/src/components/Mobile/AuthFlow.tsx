import React, { useEffect } from 'react';
import AuthFlowComponent from '../Auth/AuthFlowComponent';
import { useNavigationControl } from '../../hooks/useNavigationControl';

interface AuthFlowProps {
  onBack: () => void;
  onSuccess: () => void;
}

const AuthFlow: React.FC<AuthFlowProps> = (props) => {
  // Hide navigation for this full-screen modal
  useNavigationControl();

  return (
    <div className="max-w-sm mx-auto w-full">
      <AuthFlowComponent {...props} />
    </div>
  );
};

export default AuthFlow;