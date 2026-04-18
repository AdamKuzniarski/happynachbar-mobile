import { router , useLocalSearchParams} from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { ApiError } from '@/lib/api';
import { resendVerification} from '@/lib/auth';
import { EMAIL_REGEX } from '@/lib/format';

export