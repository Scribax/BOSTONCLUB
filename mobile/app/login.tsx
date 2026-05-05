import React, { useState, useEffect } from 'react';
import { Alert, LogBox } from 'react-native';
import { useRouter } from 'expo-router';
import api, { setAuthToken } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import LoginDefault from '../components/auth/LoginDefault';
import LoginHalloween from '../components/auth/LoginHalloween';
import LoginArgentina from '../components/auth/LoginArgentina';

LogBox.ignoreLogs([
  '[Reanimated] Reading from `value` during component render',
  '[Reanimated] Writing to `value` during component render'
]);

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dni, setDni] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  const resolveVideoUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = api.defaults.baseURL || 'https://mybostonclub.com/api';
    const rootUrl = baseUrl.replace(/\/api$/, '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${rootUrl}${cleanUrl}`;
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data.loginVideoUrl) {
        setVideoUrl(response.data.loginVideoUrl);
      } else {
        setVideoUrl(null);
      }
    } catch (error) {
      console.error('Error fetching settings for video', error);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa todos los campos obligatorios');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { email: email.toLowerCase().trim(), password });
        const { token } = response.data;
        await setAuthToken(token);
        router.replace('/(tabs)');
      } else {
        if (!firstName || !lastName || !dni || !whatsapp || !birthDateInput) {
          Alert.alert('Error', 'Debes completar todo tu perfil, incluyendo tu fecha de nacimiento.');
          setLoading(false);
          return;
        }

        let birthDateIso = '';
        if (birthDateInput.length === 10) {
            const [dd, mm, yyyy] = birthDateInput.split('/');
            const year = parseInt(yyyy, 10);
            const month = parseInt(mm, 10);
            const day = parseInt(dd, 10);
            
            if (year < 1900 || year > new Date().getFullYear() || month < 1 || month > 12 || day < 1 || day > 31) {
               Alert.alert('Error', 'Ingresa una fecha de nacimiento válida.');
               setLoading(false);
               return;
            }
            birthDateIso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}T12:00:00.000Z`;
        } else {
            Alert.alert('Error', 'Formato de fecha de nacimiento incorrecto (Usa DD/MM/YYYY).');
            setLoading(false);
            return;
        }

        const response = await api.post('/auth/register', { 
          firstName, 
          lastName, 
          dni, 
          whatsapp, 
          email: email.toLowerCase().trim(), 
          password,
          birthDate: birthDateIso,
          referralCode: referralCode.trim()
        });
        const { token } = response.data;
        router.replace({ pathname: '/verify-email', params: { email: email.toLowerCase().trim(), pendingToken: token } });
      }
    } catch (error: any) {
      if (error.response?.status === 401 && error.response?.data?.isEmailVerified === false) {
          const { token } = error.response.data;
          router.replace({ pathname: '/verify-email', params: { email: email.toLowerCase().trim(), pendingToken: token || '' } });
          return;
      }
      const msg = error.response?.data?.message || 'Credenciales inválidas o error en el registro';
      Alert.alert('Acceso Denegado', msg);
    } finally {
      setLoading(false);
    }
  };

  const props = {
    isLogin, setIsLogin, email, setEmail, password, setPassword,
    firstName, setFirstName, lastName, setLastName, dni, setDni,
    whatsapp, setWhatsapp, birthDateInput, setBirthDateInput,
    referralCode, setReferralCode, loading, showPassword, setShowPassword,
    videoUrl, theme, handleAuth, resolveVideoUrl
  };

  if (theme.name === 'halloween') {
    return <LoginHalloween {...props} />;
  }
  
  if (theme.name === 'argentina') {
    return <LoginArgentina {...props} />;
  }

  return <LoginDefault {...props} />;
}
