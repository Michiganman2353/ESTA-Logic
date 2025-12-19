import { useNavigate } from 'react-router-dom';
import { useRegistrationStatus } from '@/hooks/useEdgeConfig';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { User } from '@/types';

interface RegisterManagerProps {
  onRegister?: (user: User) => void;
}

export default function RegisterManager({ onRegister }: RegisterManagerProps) {
  const navigate = useNavigate();
  const {
    isOpen: registrationOpen,
    message: closedMessage,
    loading: checkingStatus,
  } = useRegistrationStatus('employer');

  const handleRegisterSuccess = (user: {
    id: string;
    email: string;
    name: string;
    role: string;
    [key: string]: unknown;
  }) => {
    if (onRegister) {
      // Call the parent callback to update App state and navigate to dashboard
      // Double assertion is needed because backend response includes additional fields
      // that aren't in the strict User type definition, but are compatible
      onRegister(user as unknown as User);
    } else {
      // Fallback: navigate to login
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      {checkingStatus ? (
        <div className="text-center">
          <div className="border-primary-600 mx-auto h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      ) : !registrationOpen ? (
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Registration Closed
            </h2>
            <div className="mt-6 rounded-md bg-yellow-50 p-6 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {closedMessage ||
                  'Employer registration is currently closed. Please check back later or contact support for more information.'}
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      ) : (
        <OnboardingWizard onRegisterSuccess={handleRegisterSuccess} />
      )}
    </div>
  );
}
