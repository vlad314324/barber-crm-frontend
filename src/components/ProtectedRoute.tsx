import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { defaultRouteForRole } from '../utils/roleRoutes';

interface Props {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'barber' | 'client')[];
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, loading } = useAuth();
  const { t } = useLocale();

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-500">{t('common.loading')}</div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={defaultRouteForRole(user.role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;